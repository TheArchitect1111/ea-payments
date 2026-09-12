import { createStructuredBuilder } from './structured-builder.mjs';

export const learningBuilder = createStructuredBuilder({
  id: 'learning',
  workOrderType: 'learning',
  artifactKind: 'learning_system',
  deliverableType: 'learning',
  planningKinds: ['learning_architecture', 'portal_blueprint', 'content_strategy'],
  gateId: 'learning-structure',
  title: 'LearningBuilder',
});
