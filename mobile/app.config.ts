import type { ExpoConfig, ConfigContext } from 'expo/config';
import { CANONICAL_API_BASE_URL } from './src/constants/realm-login-copy';

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
