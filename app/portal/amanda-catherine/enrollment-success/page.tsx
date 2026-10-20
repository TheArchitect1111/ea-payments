import Link from 'next/link';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listStudioRecords } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

type SquareEnrollment = {
  id?: string; email: string; class_name?: string; class_id: string;
  payment_status: string; payment_reference?: string;
  paid_amount_cad?: number; expected_amount: number;
  receipt_url?: string; is_test?: boolean; created_at: string;
};

export const dynamic = 'force-dynamic';
export default async function AmandaEnrollmentSuccess({
  searchParams,
}: { searchParams: Promise<{ provider?: string; ref?: string }> }) {
  const { client, session } = await requirePortalModule('amanda-catherine', 'dashboard');
  const email = String(session.email || client.email || '').trim().toLowerCase();
  const params = await searchParams;
  const reference = String(params.ref || '').trim();
  let square: SquareEnrollment | undefined;
  if (params.provider === 'square' && /^[A-Za-z0-9_-]{8,120}$/.test(reference)) {
    const rows = await listStudioRecords<SquareEnrollment>('experience', syntheticOrgId('amanda-catherine'));
    square = rows.find(row => row?.id?.startsWith('amanda-square-order-') &&
      row.email?.toLowerCase() === email &&
      row.payment_status === 'paid' && row.payment_reference === reference && row.is_test === false);
  }
  return <PortalSubpage slug="amanda-catherine" active="learning" kicker="AesthetiKine Academy"
    title={square ? "Welcome — You're In! ✨" : 'Enrollment confirmation'} lede={square ? 'Your payment is verified and your next steps are ready.' : 'Secure course access'}>
    {square ? <section className="ep-module-card" aria-label="Verified Square enrollment">
      <p><strong>Step 1 of 3 Complete — Access Granted</strong></p>
      <h2>{square.class_name || square.class_id}</h2>
      <h3>Your receipt</h3>
      <p>Amount paid: CAD {(square.paid_amount_cad ?? square.expected_amount/100).toFixed(2)}</p>
      <p>Square payment reference: {reference}</p>
      <p>Full enrollment, no 3-day trial expiry.</p>
      <h3>Your 60-min transformation starts now - 3 instant wins</h3>
      <ol>
        <li><strong>Micro-win (2 mins):</strong> Watch Welcome Video - what to expect at AesthetiKine Studio</li>
        <li><strong>Logistics:</strong> Download What to Bring / Where to Park / What to Wear PDF + Add Calendar Invite (.ics)</li>
        <li><strong>Deep work:</strong> Open Learning - Clinical Fat Loss - Module 1: Scope, Safety and Who This Is NOT For</li>
      </ol>
      <div style={{marginTop:16, padding:16, background:'#f7f1e8', borderRadius:12}}>
        <p style={{fontWeight:800, fontSize:14, textTransform:'uppercase', color:'#b18b49'}}>You instantly get:</p>
        <ul style={{marginTop:8}}>
          <li>Welcome Video (2-min) - in confirmation email</li>
          <li>What to Bring / Parking Map / Dress Code PDF</li>
          <li>Calendar Invite for AesthetiKine Studio</li>
          <li>Practitioner Kit in Learning Portal</li>
        </ul>
      </div>
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
        <Link data-cta-name="Access My Class Now" data-cta-key="access-my-class-now" className="ep-btn" href="/portal/amanda-catherine/learning">Access My Class Now</Link>
        <Link data-cta-name="View Materials" data-cta-key="view-materials" className="ep-btn ep-btn-secondary" href="/portal/amanda-catherine/learning">View Materials</Link>
        <Link data-cta-name="Download Receipt PDF" data-cta-key="download-receipt-pdf" className="ep-btn ep-btn-secondary" href={'/api/portal/amanda/receipt?provider=square&ref='+encodeURIComponent(reference)}>Download Receipt PDF</Link>
        <Link data-cta-name="Get Support" data-cta-key="get-support" className="ep-btn ep-btn-secondary" href="/portal/amanda-catherine/support">Get Support</Link>
      </div>
    </section> : <section className="ep-module-card">
      <h2>Enrollment information is not ready yet</h2>
      <p>For privacy, enrollment details appear here only after payment verification and sign-in with the purchaser's email.</p>
      <Link data-cta-name="Open My Learning" data-cta-key="open-my-learning" href="/portal/amanda-catherine/learning">Open My Learning</Link>
    </section>}
  </PortalSubpage>;
}
