export type SocialStats = { innerCircleCount: number; topProduct: string; pageViews: number };
export const SOCIAL_TEMPLATES = [
  { id: "more-than-a-game", label: "More Than A Game", caption: (s: SocialStats) => `More than a game. Built for a bigger purpose. ${s.innerCircleCount} are already in the TB3 Inner Circle. #TB3 #MoreThanAGame` },
  { id: "drop-01", label: "Drop 01 Signal", caption: (s: SocialStats) => `Drop 01 is taking shape. ${s.innerCircleCount} fans are in the Inner Circle. The current favorite: ${s.topProduct}. #TB3 #Drop01` },
  { id: "family-owned", label: "Family Owned", caption: (s: SocialStats) => `The TB3 community belongs to the family and the fans. ${s.innerCircleCount} in the Inner Circle and counting. #TB3 #FamilyOwned` },
  { id: "purpose-first", label: "Purpose First", caption: (_s: SocialStats) => `Discipline. Determination. Development. Destiny. The mission is bigger than basketball. #TB3 #MoreThanAGame` },
  { id: "community-thanks", label: "Community Thanks", caption: (s: SocialStats) => `Thank you for building with TB3. ${s.pageViews.toLocaleString()} page views and ${s.innerCircleCount} Inner Circle signups show the community is showing up. #TB3` },
] as const;
