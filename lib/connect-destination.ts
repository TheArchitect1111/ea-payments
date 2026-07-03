import type { ConnectionClassification, ConnectProfile, NewConnectionInput } from './connect-types';

export function resolveConnectDestination(
  profile: ConnectProfile,
  classification: ConnectionClassification,
  connection: NewConnectionInput,
): string | undefined {
  if (classification.recommendedDestination) return classification.recommendedDestination;

  const matchingRule = profile.destinations.find((rule) => {
    if (!rule.url) return false;
    if (rule.priority && rule.priority !== classification.priority) return false;
    if (rule.connectionType && rule.connectionType !== classification.connectionType) return false;
    if (rule.opportunityType && rule.opportunityType !== classification.opportunityType) return false;
    if (rule.industry && rule.industry !== classification.industry) return false;
    if (rule.campaign && rule.campaign !== connection.campaign) return false;
    return Boolean(rule.priority || rule.connectionType || rule.opportunityType || rule.industry || rule.campaign);
  });

  return matchingRule?.url || profile.defaultDestinationUrl || undefined;
}
