import { getFactoryProject } from '../lib/factory-project-store';
import { generateAndPersistConceptPreviews } from '../lib/factory-concept-previews';
import { CARE_CONTINUUM_SIGNATURE } from '../lib/layout-composer/grammars/care-continuum-editorial';

async function main() {
  const projectId = process.argv[2] || 'proj-ms68dh4m-3daac7';
  const p = await getFactoryProject(projectId);
  if (!p) {
    console.log(JSON.stringify({ ok: false, projectId, reason: 'not_found' }));
    process.exit(1);
  }
  console.log(
    JSON.stringify({
      ok: true,
      projectId,
      client: p.client,
      notes: (p.notes || '').slice(0, 160),
      arts: (p.context?.artifacts || []).map((a) => a.kind).slice(-12),
      conceptPreviewOutputs: (p.context?.outputs || []).filter((o) => o.worker === 'concept-previews')
        .length,
    }),
  );

  if (process.argv.includes('--recompose')) {
    const result = await generateAndPersistConceptPreviews(projectId);
    if (!result.ok) {
      console.error(result.error);
      process.exit(1);
    }
    const a = result.payload.previews.find((x) => x.conceptId.includes('concept-a'));
    console.log(
      JSON.stringify({
        recomposed: true,
        signature: a?.compositionSignature,
        expected: CARE_CONTINUUM_SIGNATURE,
        match: a?.compositionSignature === CARE_CONTINUUM_SIGNATURE,
        path: a?.websitePreviewPath,
        name: a?.name,
      }),
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
