import { NextRequest, NextResponse } from 'next/server';
import { EA_FACTORY_REPO_CATEGORIES, searchRepositories } from '@/lib/ea-factory';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? '';
  const category = request.nextUrl.searchParams.get('category') ?? '';
  const favoritesOnly = request.nextUrl.searchParams.get('favorites') === 'true';
  const recommendedOnly = request.nextUrl.searchParams.get('recommended') === 'true';

  return NextResponse.json({
    repositories: searchRepositories(query, category, favoritesOnly, recommendedOnly),
    categories: EA_FACTORY_REPO_CATEGORIES,
  });
}
