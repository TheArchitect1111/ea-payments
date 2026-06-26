export type ConnectDestinationRule = {
  label: string;
  url: string;
  priority?: 'High' | 'Normal' | 'Low';
  connectionType?: string;
  opportunityType?: string;
  industry?: string;
  campaign?: string;
};

export type ConnectResource = {
  label: string;
  url: string;
  tags?: string[];
};

export type ConnectProfile = {
  id: string;
  ownerUserId: string;
  slug: string;
  brandName: string;
  logoUrl?: string;
  primaryColor: string;
  headline: string;
  subheadline?: string;
  ctaText: string;
  defaultDestinationUrl?: string;
  destinations: ConnectDestinationRule[];
  resources: ConnectResource[];
  welcomeEmailSubject?: string;
  welcomeEmailBody?: string;
  ownerNotificationEmail?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ConnectionMethod = 'google' | 'email' | 'apple' | 'microsoft' | 'linkedin';

export type ConnectionPriority = 'High' | 'Normal' | 'Low';

export type ConnectionClassification = {
  industry: string;
  connectionType: string;
  opportunityType: string;
  priority: ConnectionPriority;
  recommendedFollowUp: string;
  recommendedDestination?: string;
  suggestedResource?: string;
  watchListMatch: string;
  relationshipScore: number;
};

export type ConnectionRecord = {
  id: string;
  connectProfileId: string;
  ownerUserId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  location?: string;
  notes?: string;
  campaign?: string;
  referralSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  connectionMethod: ConnectionMethod;
  device?: string;
  browser?: string;
  aiIndustry?: string;
  aiConnectionType?: string;
  aiOpportunityType?: string;
  aiPriority?: ConnectionPriority;
  aiRecommendedFollowUp?: string;
  aiRecommendedDestination?: string;
  aiSuggestedResource?: string;
  aiWatchListMatch?: string;
  aiRelationshipScore?: number;
  destinationUrl?: string;
  automationStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type NewConnectProfileInput = Omit<ConnectProfile, 'id' | 'createdAt' | 'updatedAt'>;

export type NewConnectionInput = Omit<
  ConnectionRecord,
  | 'id'
  | 'aiIndustry'
  | 'aiConnectionType'
  | 'aiOpportunityType'
  | 'aiPriority'
  | 'aiRecommendedFollowUp'
  | 'aiRecommendedDestination'
  | 'aiSuggestedResource'
  | 'aiWatchListMatch'
  | 'aiRelationshipScore'
  | 'destinationUrl'
  | 'automationStatus'
  | 'createdAt'
  | 'updatedAt'
>;
