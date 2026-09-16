import assert from "node:assert/strict";
import {
  IntelligenceGateway,
  IntelligencePolicyError,
  IntelligenceProviderError,
  type IntelligenceAdapter,
  type IntelligenceCapability,
  type IntelligenceObservation,
  type IntelligenceRequest,
} from "../lib/intelligence/gateway";

class RecordingAdapter implements IntelligenceAdapter {
  readonly id = "recording-test-adapter";
  calls: IntelligenceRequest[] = [];

  supports(capability: IntelligenceCapability): boolean {
    return capability === "INTEL.WEBSITE";
  }

  async collect(request: IntelligenceRequest): Promise<IntelligenceObservation[]> {
    this.calls.push(request);
    return [{
      subjectId: "adapter-supplied-subject",
      consumer: "monitoring",
      capability: "INTEL.WEBSITE",
      sourceUrl: request.target,
      provider: "",
      collectedAt: "",
      payload: { ok: true },
      provenance: { source: "public", adapter: "wrong-adapter" },
      retentionClass: "standard",
    }];
  }
}

const baseRequest: IntelligenceRequest = {
  subjectId: "ea-test-subject",
  consumer: "eva",
  capability: "INTEL.WEBSITE",
  target: "https://example.com/research",
  purpose: "Contract-test approved public research",
};

async function expectPolicyFailure(target: string) {
  const adapter = new RecordingAdapter();
  const gateway = new IntelligenceGateway([adapter]);
  await assert.rejects(
    () => gateway.collect({ ...baseRequest, target }),
    (error: unknown) => error instanceof IntelligencePolicyError,
    `Expected policy rejection for ${target}`,
  );
  assert.equal(adapter.calls.length, 0, "Rejected targets must never reach an adapter");
}

async function main() {
  await expectPolicyFailure("not-a-url");
  await expectPolicyFailure("file:///etc/passwd");
  await expectPolicyFailure("http://localhost/admin");
  await expectPolicyFailure("http://127.0.0.1/admin");
  await expectPolicyFailure("http://10.0.0.1/admin");
  await expectPolicyFailure("http://172.16.0.1/admin");
  await expectPolicyFailure("http://192.168.1.1/admin");
  await expectPolicyFailure("http://169.254.169.254/latest/meta-data/");

  {
    const adapter = new RecordingAdapter();
    const gateway = new IntelligenceGateway([adapter]);
    const observations = await gateway.collect(baseRequest);
    assert.equal(adapter.calls.length, 1);
    assert.equal(adapter.calls[0].target, "https://example.com/research");
    assert.equal(observations.length, 1);
    assert.equal(observations[0].subjectId, baseRequest.subjectId);
    assert.equal(observations[0].consumer, baseRequest.consumer);
    assert.equal(observations[0].capability, baseRequest.capability);
    assert.equal(observations[0].provider, adapter.id);
    assert.deepEqual(observations[0].provenance, { source: "public", adapter: adapter.id });
  }

  {
    const gateway = new IntelligenceGateway([]);
    await assert.rejects(
      () => gateway.collect(baseRequest),
      (error: unknown) => error instanceof IntelligenceProviderError,
    );
  }

  {
    const adapter = new RecordingAdapter();
    const gateway = new IntelligenceGateway([adapter]);
    await assert.rejects(
      () => gateway.collect({ ...baseRequest, subjectId: " " }),
      (error: unknown) => error instanceof IntelligencePolicyError,
    );
    await assert.rejects(
      () => gateway.collect({ ...baseRequest, purpose: " " }),
      (error: unknown) => error instanceof IntelligencePolicyError,
    );
  }

  console.log("PASS intelligence gateway contract");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
