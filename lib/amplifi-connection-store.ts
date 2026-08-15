import { decryptAccounts, encryptAccounts, type NativeAccount, type NativeProvider } from '@/lib/amplifi-native-social';
import { supabaseRest } from '@/lib/simplifi-os/supabase';

type StoredConnection = {
  encrypted_accounts: string;
};

export async function loadAmplifiConnections(
  portalSlug: string,
  provider?: NativeProvider,
): Promise<NativeAccount[]> {
  const providerFilter = provider ? `&provider=eq.${encodeURIComponent(provider)}` : '';
  const result = await supabaseRest<StoredConnection[]>(
    `amplifi_social_connections?select=encrypted_accounts&portal_slug=eq.${encodeURIComponent(portalSlug)}${providerFilter}`,
    { cache: 'no-store' },
  );
  if (!result.ok) throw new Error(`Unable to load Amplifi connections: ${result.error}`);
  return result.data.flatMap((row) => decryptAccounts(row.encrypted_accounts));
}

export async function saveAmplifiConnections(
  portalSlug: string,
  provider: NativeProvider,
  accounts: NativeAccount[],
): Promise<void> {
  const result = await supabaseRest(
    'amplifi_social_connections?on_conflict=portal_slug,provider',
    {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=minimal',
      body: JSON.stringify({
        portal_slug: portalSlug,
        provider,
        encrypted_accounts: encryptAccounts(accounts),
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!result.ok) throw new Error(`Unable to save Amplifi connections: ${result.error}`);
}

export async function deleteAmplifiConnections(
  portalSlug: string,
  provider: NativeProvider,
): Promise<void> {
  const result = await supabaseRest(
    `amplifi_social_connections?portal_slug=eq.${encodeURIComponent(portalSlug)}&provider=eq.${encodeURIComponent(provider)}`,
    { method: 'DELETE' },
  );
  if (!result.ok) throw new Error(`Unable to delete Amplifi connections: ${result.error}`);
}
