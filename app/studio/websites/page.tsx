import WebsiteBuilderClient from './WebsiteBuilderClient';

export const metadata = {
  title: 'Website Builder · EA Design Studio',
  robots: { index: false, follow: false },
};

export default function StudioWebsitesPage() {
  return <WebsiteBuilderClient />;
}
