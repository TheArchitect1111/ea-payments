export const metadata = {
  title: 'Tarris Bouie | Client Services Agreement',
};

export default function TarrisAgreementPage() {
  return (
    <main style={{ margin: 0, minHeight: '100vh', background: '#eef0f3' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,.96)', borderBottom: '1px solid #ddd', padding: '12px 16px', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif' }}>
        <strong style={{ display: 'block', fontSize: 16 }}>Tarris Bouie Client Services Agreement</strong>
        <span style={{ fontSize: 12, color: '#666' }}>Official approved agreement · 6 pages</span>
      </header>
      <iframe
        title="Tarris Bouie Client Services Agreement"
        src="/contracts/Tarris_Bouie_Client_Services_Agreement_OFFICIAL.pdf"
        style={{ display: 'block', width: '100%', height: 'calc(100vh - 58px)', border: 0, background: '#fff' }}
      />
    </main>
  );
}
