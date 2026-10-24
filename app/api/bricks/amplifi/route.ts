import { AmplifiBrick } from '@/lib/bricks/amplifi';

export async function POST(req: Request) {
  const { goal, businessType, businessName } = await req.json();
  const campaign = AmplifiBrick.createCampaign({ goal, businessType, businessName });
  return Response.json({
    brick: "Amplifi",
    status: "1 of 1 standalone",
    campaign,
    proof: {
      selfMarketingPosts: "11 posts -> $145 revenue (from standalone)",
      backgroundRunner: "24h production",
      pricing: "49/99/199 profitable vs old 29 losing"
    }
  });
}
