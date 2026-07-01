import type { ExpoConfig, ConfigContext } from 'expo/config';

const CANONICAL_API_BASE_URL = 'https://ea-payments.vercel.app';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'Simplifi',
  slug: config.slug ?? 'simplifi-mobile',
  extra: {
    ...config.extra,
    apiBaseUrl:
      process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? CANONICAL_API_BASE_URL,
  },
});
