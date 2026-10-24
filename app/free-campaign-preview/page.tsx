import fs from 'fs';
import path from 'path';
export default function Page() {
  const htmlPath = path.join(process.cwd(), 'app/free-campaign-preview/page.html');
  const html = fs.existsSync(htmlPath) ? fs.readFileSync(htmlPath, 'utf8') : '<h1>Loading Amplifi...</h1>';
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
