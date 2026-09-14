import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

export type PolicyDecision = {
  allowed: boolean;
  deny: string[];
};

const policyDir = resolve(process.cwd(), 'policy');

export async function evaluatePolicy(input: unknown, decision = 'data.ea.execution.allow_advance'): Promise<PolicyDecision> {
  const allow = await opaEval(input, decision);
  const deny = await opaEval(input, 'data.ea.execution.deny');
  return {
    allowed: allow === true,
    deny: Array.isArray(deny) ? deny.map(String) : [],
  };
}

async function opaEval(input: unknown, decision: string): Promise<unknown> {
  return await new Promise((resolvePromise, reject) => {
    const child = spawn('opa', ['eval', '--format=json', '--stdin-input', '--data', policyDir, decision], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`OPA evaluation failed: ${stderr || code}`));
      const parsed = JSON.parse(stdout);
      const value = parsed?.result?.[0]?.expressions?.[0]?.value;
      resolvePromise(value);
    });
    child.stdin.end(JSON.stringify(input));
  });
}
