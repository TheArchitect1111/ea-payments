/** Canonical production API for store builds — public apex. */
const CANONICAL_API_BASE_URL = 'https://efficiencyarchitects.online';

const easProjectId =
  (process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '').trim() ||
  (process.env.EAS_PROJECT_ID || '').trim() ||
  '';

module.exports = ({ config }) => {
  const prevExtra = config.extra && typeof config.extra === 'object' ? config.extra : {};
  const prevEas =
    prevExtra.eas && typeof prevExtra.eas === 'object' ? prevExtra.eas : {};

  return {
    ...config,
    name: config.name || 'Simplifi Orb',
    slug: config.slug || 'simplifi-mobile',
    version: config.version || '0.1.0',
    extra: {
      ...prevExtra,
      apiBaseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL || CANONICAL_API_BASE_URL).replace(
        /\/$/,
        '',
      ),
      eas: {
        ...prevEas,
        ...(easProjectId ? { projectId: easProjectId } : {}),
      },
    },
    updates: config.updates,
    runtimeVersion: config.runtimeVersion || { policy: 'appVersion' },
  };
};
