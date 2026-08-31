export const dynamic = 'force-dynamic';

const PARTS = [
  'payload-01.txt',
  'payload-02.txt',
  'payload-03a.txt',
  'payload-03b.txt',
  'payload-04.txt',
  'payload-05.txt',
  'payload-06.txt',
];

export async function GET() {
  try {
    const base = 'https://raw.githubusercontent.com/TheArchitect1111/efficiency-architects/main/public/contracts/tarris-final';
    const responses = await Promise.all(PARTS.map((name) => fetch(`${base}/${name}`, { cache: 'no-store' })));

    if (responses.some((response) => !response.ok)) {
      return new Response('Unable to load approved agreement', { status: 502 });
    }

    const encoded = (await Promise.all(responses.map((response) => response.text())))
      .join('')
      .replace(/\s+/g, '');
    const pdf = Buffer.from(encoded, 'base64');

    if (pdf.length < 10000 || pdf.subarray(0, 5).toString('ascii') !== '%PDF-') {
      return new Response('Approved agreement validation failed', { status: 500 });
    }

    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="Tarris_Bouie_Client_Services_Agreement_OFFICIAL.pdf"',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Tarris public agreement error', error);
    return new Response('Unable to load approved agreement', { status: 500 });
  }
}
