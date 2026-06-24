import PremiumLandingV2 from '@/app/components/landing/PremiumLandingV2';
import './home-experience.css';

export const metadata = {
  title: 'Preview — Efficiency Architects',
  robots: { index: false, follow: false },
};

export default function HomePreviewPage() {
  return <PremiumLandingV2 />;
}
