import { createStructuredBuilder } from './structured-builder.mjs';

export const knowledgeBuilder = createStructuredBuilder({
  id: 'knowledge',
  workOrderType: 'content',
  artifactKind: 'knowledge_base',
  deliverableType: 'content',
  planningKinds: ['content_strategy', 'information_architecture', 'learning_architecture'],
  gateId: 'knowledge-structure',
  title: 'KnowledgeBuilder',
});
