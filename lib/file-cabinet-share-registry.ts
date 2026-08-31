export type FileCabinetShareRecord = {
  shareId: string;
  pathname: string;
  contentType: string;
  filename: string;
  enabled: boolean;
};

const shares: Record<string, FileCabinetShareRecord> = {
  'tarris-bouie-MuPLKEmqQeJ': {
    shareId: 'tarris-bouie-MuPLKEmqQeJ',
    pathname: 'ea-file-cabinet/tarris-bouie/Tarris_Bouie_Client_Services_Agreement_OFFICIAL.pdf',
    contentType: 'application/pdf',
    filename: 'Tarris_Bouie_Client_Services_Agreement.pdf',
    enabled: true,
  },
};

export function getFileCabinetShare(shareId: string) {
  const record = shares[shareId];
  return record?.enabled ? record : null;
}
