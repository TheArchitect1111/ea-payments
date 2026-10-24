import { NextResponse } from "next/server";
import { AmplifiBrick, createGrowthCampaign } from "@/lib/bricks/amplifi";
export async function POST(req: Request) {
  const { goal } = await req.json();
  const campaign = createGrowthCampaign(goal);
  return NextResponse.json({ brick: AmplifiBrick, campaign });
}
