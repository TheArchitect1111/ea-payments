import type { PortalWorkspaceChrome } from '@/lib/platform/portal-workspace';

/** Replace {brand}, {members}, {home}, {workspace}, {focus}, {start} in portal copy. */
export function applyPortalCopy(
  template: string,
  chrome: Pick<
    PortalWorkspaceChrome,
    | 'brandName'
    | 'memberLabel'
    | 'homeLabel'
    | 'workspaceName'
    | 'focusLabel'
    | 'startLabel'
    | 'personalityName'
  >,
): string {
  return template
    .replaceAll('{brand}', chrome.brandName)
    .replaceAll('{members}', chrome.memberLabel)
    .replaceAll('{home}', chrome.homeLabel)
    .replaceAll('{workspace}', chrome.workspaceName)
    .replaceAll('{focus}', chrome.focusLabel)
    .replaceAll('{start}', chrome.startLabel)
    .replaceAll('{personality}', chrome.personalityName);
}
