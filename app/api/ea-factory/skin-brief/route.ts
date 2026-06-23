import { NextRequest, NextResponse } from 'next/server';
import {
  generateSkinBrief,
  type SkinBriefInput,
  type SkinProjectType,
  SKIN_PROJECT_TYPES,
} from '@/lib/skin-factory';

export const dynamic = 'force-dynamic';

type SkinBriefRequest = Partial<SkinBriefInput>;

export async function POST(request: NextRequest) {
  let body: SkinBriefRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const missing = requiredFields(body);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        error: 'Missing required EA Skin Factory fields.',
        missing,
      },
      { status: 400 },
    );
  }

  const skinBrief = generateSkinBrief({
    client_name: body.client_name!,
    organization_type: body.organization_type!,
    website_social_url: body.website_social_url,
    mission: body.mission!,
    audience: body.audience!,
    primary_goal: body.primary_goal!,
    desired_emotion: body.desired_emotion!,
    transformation_promise: body.transformation_promise!,
    project_type: normalizeProjectType(body.project_type),
    selected_protocol: body.selected_protocol!,
    selected_repos: body.selected_repos ?? [],
    chassis_modules: body.chassis_modules ?? [],
    brand_colors: body.brand_colors ?? [],
    assets: body.assets ?? [],
    notes: body.notes,
  });

  return NextResponse.json({ skinBrief });
}

function requiredFields(body: SkinBriefRequest) {
  const missing: string[] = [];

  if (!body.client_name?.trim()) missing.push('client_name');
  if (!body.organization_type?.trim()) missing.push('organization_type');
  if (!body.mission?.trim()) missing.push('mission');
  if (!body.audience?.trim()) missing.push('audience');
  if (!body.primary_goal?.trim()) missing.push('primary_goal');
  if (!body.desired_emotion?.trim()) missing.push('desired_emotion');
  if (!body.transformation_promise?.trim()) missing.push('transformation_promise');
  if (!Array.isArray(body.selected_protocol) || body.selected_protocol.length === 0) {
    missing.push('selected_protocol');
  }
  if (!body.selected_protocol?.includes('ea-skin')) missing.push('ea-skin protocol');

  return missing;
}

function normalizeProjectType(value?: SkinProjectType | string): SkinProjectType {
  if (!value) return 'website';
  const slug = String(value).toLowerCase().replace(/\s+/g, '-');
  return SKIN_PROJECT_TYPES.find((type) => type.id === slug)?.id ?? 'website';
}
