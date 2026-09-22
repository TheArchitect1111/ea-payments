import { createVisualReferenceSpec } from './visual-reference-spec.mjs';

function assert(value, message) { if (!value) throw new Error(message); }

/**
 * Converts attachment descriptors supplied by the chat execution layer into
 * stable Factory asset descriptors and the Run 11 visual reference contract.
 * Binary persistence is delegated to the execution adapter via persistAsset.
 */
export async function bridgeChatAttachments({ attachments = [], persistAsset } = {}) {
  assert(Array.isArray(attachments) && attachments.length, 'attachments required');
  assert(typeof persistAsset === 'function', 'persistAsset adapter required');

  const persisted = [];
  for (let index = 0; index < attachments.length; index += 1) {
    const attachment = attachments[index];
    assert(attachment?.sourceRef, `attachments[${index}].sourceRef required`);
    assert(attachment?.surface === 'website' || attachment?.surface === 'portal', `attachments[${index}].surface required`);
    const asset = await persistAsset({
      sourceRef: attachment.sourceRef,
      filename: attachment.filename || `${attachment.surface}-reference-${index + 1}.png`,
      purpose: 'ea-visual-reference',
      immutable: true
    });
    assert(asset?.assetRef, `persistAsset did not return assetRef for attachment ${index}`);
    persisted.push({
      id: attachment.id || `chat-reference-${index + 1}`,
      assetRef: asset.assetRef,
      surface: attachment.surface,
      page: attachment.page || 'home',
      viewport: attachment.viewport || 'laptop',
      role: 'visual-specification'
    });
  }

  return {
    assets: persisted,
    visualReferenceSpec: createVisualReferenceSpec({ references: persisted, fidelity: 'strict' })
  };
}
