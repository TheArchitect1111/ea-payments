export default function FreeCampaignPreview() {
  return (
    <div dangerouslySetInnerHTML={{ __html: require('fs').readFileSync('app/free-campaign-preview/page.html','utf8') }} />
  );
}
