import { createStructuredBuilder } from './structured-builder.mjs';

export const reportBuilder = createStructuredBuilder({
  id: 'report',
  workOrderType: 'report',
  artifactKind: 'report_pack',
  deliverableType: 'report',
  planningKinds: ['executive_summary', 'deliverables_matrix', 'production_plan'],
  gateId: 'report-structure',
  title: 'ReportBuilder',
});
