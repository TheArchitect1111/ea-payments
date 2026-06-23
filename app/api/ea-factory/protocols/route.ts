import { NextRequest, NextResponse } from 'next/server';
import { getProtocolLibraryFromGitHub } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const library = await getProtocolLibraryFromGitHub();

  if (query) {
    const needle = query.toLowerCase().trim();
    return NextResponse.json({
      query,
      protocols: library.protocols.filter((protocol) =>
        [
          protocol.id,
          protocol.name,
          protocol.category,
          protocol.status,
          protocol.purpose,
          protocol.owner ?? '',
          ...protocol.tags,
          ...protocol.governs,
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle),
      ),
    });
  }

  return NextResponse.json(library);
}
