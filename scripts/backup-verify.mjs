/**
 * Verify BACKUP_DESTINATION_URI is set and reachable.
 * Usage: npm run backup:verify
 */
const uri = process.env.BACKUP_DESTINATION_URI?.trim();

if (!uri) {
  console.error('FAIL — BACKUP_DESTINATION_URI is not set.');
  console.error('Set on Vercel Production and document in ea-operating-system/docs/backup-destination-registry.md');
  process.exit(1);
}

console.log('Backup destination configured:', uri.replace(/\/\/[^@]+@/, '//***@'));

if (!/^https?:\/\//i.test(uri)) {
  console.log('OK — non-HTTP URI (manual verification required).');
  process.exit(0);
}

try {
  const res = await fetch(uri, { method: 'HEAD', signal: AbortSignal.timeout(15_000) });
  if (res.ok || res.status === 405 || res.status === 403) {
    console.log(`OK — destination responded HTTP ${res.status}`);
    process.exit(0);
  }
  console.error(`FAIL — destination returned HTTP ${res.status}`);
  process.exit(1);
} catch (err) {
  console.error('FAIL —', err instanceof Error ? err.message : err);
  process.exit(1);
}
