import { bridgeChatAttachments } from '../lib/assembly-line/chat-attachment-bridge.mjs';

const result = await bridgeChatAttachments({
  attachments: [
    { sourceRef: 'chat://tb3-website-master', filename: 'tb3-website-master.png', surface: 'website', viewport: 'laptop' },
    { sourceRef: 'chat://tb3-portal-master', filename: 'tb3-portal-master.png', surface: 'portal', viewport: 'laptop' }
  ],
  persistAsset: async ({ sourceRef, filename }) => ({ assetRef: `factory-assets://run12/${filename}`, sourceRef })
});

const failures = [];
const check = (condition, label) => { if (!condition) failures.push(label); };
check(result.assets.length === 2, 'two assets persisted');
check(result.visualReferenceSpec.kind === 'EAVisualReferenceSpec', 'visual spec created');
check(result.visualReferenceSpec.references[0].surface === 'website', 'website classified');
check(result.visualReferenceSpec.references[1].surface === 'portal', 'portal classified');
check(result.visualReferenceSpec.references.every((r) => r.immutable === true), 'references immutable');
check(result.visualReferenceSpec.verification.correctionLoop === true, 'correction loop enabled');
if (failures.length) { console.error('FAIL', failures); process.exit(1); }
console.log('PASS chat attachment bridge');
