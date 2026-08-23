import { z } from "zod";

export const RegionSchema = z.enum(["global", "china", "international"]);
export const AudienceSchema = z.enum(["individual", "team", "enterprise", "api"]);
export const SurfaceSchema = z.enum(["IDE", "CLI", "Web", "Cloud Agent", "API"]);
export const DisclosureSchema = z.enum(["exact", "approximate", "undisclosed"]);
export const ProductRoleSchema = z.enum(["native_agent", "agent_shell", "model_router", "chat_api"]);
export const ModelAccessModeSchema = z.enum(["fixed", "same_family", "curated_multi", "open_byok", "marketplace"]);
export const ModelRoutingSchema = z.enum(["fixed", "manual", "automatic", "both"]);
export const ModelBillingSchema = z.enum(["included", "metered", "mixed"]);

export const ProviderLayerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  badge: z.string().min(1),
  count: z.string().min(1),
  summary: z.string().min(1),
  billing: z.string().min(1),
  url: z.string().url(),
});

export const ModelAccessSchema = z.object({
  role: ProductRoleSchema,
  mode: ModelAccessModeSchema,
  userSelectable: z.boolean(),
  routing: ModelRoutingSchema,
  billing: ModelBillingSchema,
  countLabel: z.string().min(1),
  note: z.string().min(1),
  sourceIds: z.array(z.string()).min(1),
  providerLayers: z.array(ProviderLayerSchema).optional(),
});

export const VendorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  country: z.string(),
  officialDomains: z.array(z.string()).min(1),
  note: z.string().optional(),
});

export const QuotaRuleSchema = z.object({
  label: z.string(),
  unit: z.string(),
  amount: z.union([z.number(), z.string()]).nullable(),
  window: z.string(),
  refresh: z.string(),
  shared: z.string().optional(),
  disclosure: DisclosureSchema,
  note: z.string().optional(),
});

export const ConsumptionRuleSchema = z.object({
  label: z.string(),
  rule: z.string(),
});

export const OverageRuleSchema = z.object({
  behavior: z.enum(["stop", "degrade", "wait", "payg", "topup", "unknown"]),
  detail: z.string(),
});

export const PriceSchema = z.object({
  currency: z.string(),
  monthly: z.number().nullable(),
  annualMonthly: z.number().nullable().optional(),
  billingNote: z.string(),
  tax: z.string(),
});

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  audience: AudienceSchema,
  regions: z.array(RegionSchema),
  status: z.enum(["current", "legacy", "waitlist", "custom"]),
  price: PriceSchema,
  quotas: z.array(QuotaRuleSchema),
  consumption: z.array(ConsumptionRuleSchema).default([]),
  overage: OverageRuleSchema,
  features: z.array(z.string()).default([]),
  governance: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).min(1),
});

export const ProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  vendorId: z.string(),
  name: z.string(),
  family: z.string(),
  summary: z.string(),
  regions: z.array(RegionSchema),
  surfaces: z.array(SurfaceSchema),
  byok: z.boolean(),
  modelAccess: ModelAccessSchema,
  models: z.array(z.string()),
  accent: z.string(),
  plans: z.array(PlanSchema).min(1),
  sourceIds: z.array(z.string()).min(1),
  verifiedAt: z.string().date(),
});

export const ApiModelPriceSchema = z.object({
  model: z.string(),
  context: z.string().optional(),
  currency: z.string(),
  per: z.string(),
  input: z.number().nullable(),
  inputLabel: z.string().optional(),
  cachedInput: z.number().nullable().optional(),
  cachedInputLabel: z.string().optional(),
  cacheWrite: z.number().nullable().optional(),
  cacheWriteLabel: z.string().optional(),
  output: z.number().nullable(),
  outputLabel: z.string().optional(),
  batchNote: z.string().optional(),
  longContextNote: z.string().optional(),
  sourceIds: z.array(z.string()).min(1),
});

export const ApiVendorSchema = z.object({
  slug: z.string(),
  vendorId: z.string(),
  name: z.string(),
  note: z.string(),
  models: z.array(ApiModelPriceSchema),
  verifiedAt: z.string().date(),
});

export const SourceEvidenceSchema = z.object({
  id: z.string(),
  vendorId: z.string().optional(),
  title: z.string(),
  url: z.string().url(),
  kind: z.enum(["pricing", "quota", "api", "policy", "promotion", "benchmark"]),
  supports: z.array(z.string()),
  effectiveAt: z.string().optional(),
  verifiedAt: z.string().date(),
  status: z.enum(["verified", "partial", "historical"]),
});

export const FreePlatformSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  vendor: z.string().min(1),
  regions: z.array(RegionSchema).min(1),
  category: z.enum(["renewable", "model_zero", "one_time", "trial", "dev_access", "micro_credit"]),
  categoryLabel: z.string().min(1),
  mechanism: z.string().min(1),
  allowance: z.string().min(1),
  refresh: z.string().min(1),
  requirements: z.string().min(1),
  codingFit: z.string().min(1),
  privacy: z.string().min(1),
  officialUrl: z.string().url(),
  rulesUrl: z.string().url(),
  sourceIds: z.array(z.string()).min(1),
  verifiedAt: z.string().date(),
});

export const OfferSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  vendorId: z.string(),
  productSlug: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().min(1),
  benefit: z.string().min(1),
  kind: z.enum(["token_gift", "usage_boost", "discount", "reset", "trial"]),
  scope: z.enum(["coding", "api", "video", "multi"]),
  regions: z.array(RegionSchema).min(1),
  audiences: z.array(AudienceSchema).min(1),
  eligibility: z.string().min(1),
  claimMethod: z.string().min(1),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  endLabel: z.string().min(1),
  verification: z.enum(["verified", "conditional"]),
  subscriberNotice: z.enum(["none", "early"]).default("none"),
  featured: z.boolean().default(false),
  note: z.string().optional(),
  sourceIds: z.array(z.string()).min(1),
  verifiedAt: z.string().date(),
});

export const SocialWatchSourceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  vendorId: z.string(),
  platform: z.literal("x"),
  handle: z.string().regex(/^@[A-Za-z0-9_]+$/),
  displayName: z.string(),
  url: z.string().url(),
  authority: z.enum(["official_account", "product_lead", "employee"]),
  topics: z.array(z.string()).min(1),
  keywords: z.array(z.string()).min(1),
  productSlugs: z.array(z.string()).default([]),
  identityEvidenceUrl: z.string().url().optional(),
  verifiedAt: z.string().date(),
});

export const ChangeNoticeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  vendorId: z.string(),
  productSlug: z.string().optional(),
  title: z.string().min(1),
  eventLabel: z.string().optional(),
  summary: z.string().min(1),
  impact: z.string().min(1),
  kind: z.enum(["pricing", "quota", "model", "policy", "service"]),
  previous: z.string().optional(),
  current: z.string().min(1),
  effectiveAt: z.string().nullable(),
  effectiveLabel: z.string().min(1),
  publishedAt: z.string().date(),
  featured: z.boolean().default(false),
  sourceIds: z.array(z.string()).min(1),
  verifiedAt: z.string().date(),
});

export const BenchmarkReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  methodologyUrl: z.string().url(),
  scope: z.string(),
  redistribution: z.string(),
  limitations: z.array(z.string()),
  verifiedAt: z.string().date(),
});

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export const EstimateBasisSchema = z.enum(["official", "independent", "community", "mixed"]);

export const IntelligenceEstimateSchema = z.object({
  level: z.number().int().min(1).max(5),
  rank: z.number().int().positive(),
  label: z.string(),
  confidence: ConfidenceSchema,
  basis: EstimateBasisSchema,
  note: z.string(),
  sourceIds: z.array(z.string()).min(1),
});

export const UsageEstimateSchema = z.object({
  planId: z.string(),
  level: z.number().int().min(1).max(5),
  confidence: ConfidenceSchema,
  basis: EstimateBasisSchema,
  note: z.string(),
  sourceIds: z.array(z.string()).min(1),
});

export const DecisionEstimateSchema = z.object({
  productSlug: z.string(),
  intelligence: IntelligenceEstimateSchema,
  usage: z.array(UsageEstimateSchema),
  reviewedAt: z.string().date(),
});

export const VideoPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["current", "legacy", "custom", "discontinued"]),
  regions: z.array(RegionSchema),
  price: PriceSchema,
  credits: z.object({
    amount: z.union([z.number(), z.string()]).nullable(),
    unit: z.string(),
    window: z.string(),
    rollover: z.string(),
  }),
  videoAllowance: z.string(),
  overage: z.string(),
  features: z.array(z.string()).default([]),
  sourceIds: z.array(z.string()).min(1),
});

export const VideoRateSchema = z.object({
  id: z.string(),
  model: z.string(),
  mode: z.string(),
  resolution: z.string(),
  durationSeconds: z.number().nullable(),
  billingUnit: z.enum(["credits_per_second", "credits_per_clip", "usd_per_second", "cny_per_second", "units_per_clip", "undisclosed"]),
  amount: z.number().nullable(),
  audio: z.boolean().nullable(),
  note: z.string(),
  sourceIds: z.array(z.string()).min(1),
  fiveSecondCost: z.object({
    currency: z.string(),
    amount: z.number(),
    basis: z.string(),
    sourceIds: z.array(z.string()).min(1),
  }).optional(),
});

export const VideoProductSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  vendor: z.string(),
  name: z.string(),
  kind: z.enum(["first-party", "studio", "aggregator", "api"]),
  status: z.enum(["current", "legacy", "discontinued"]),
  regions: z.array(RegionSchema),
  summary: z.string(),
  models: z.array(z.string()),
  capabilities: z.array(z.string()),
  apiAvailable: z.boolean(),
  maxResolution: z.string(),
  nativeAudio: z.boolean().nullable(),
  failedRefund: z.string(),
  accent: z.string(),
  plans: z.array(VideoPlanSchema),
  rates: z.array(VideoRateSchema),
  sourceIds: z.array(z.string()).min(1),
  verifiedAt: z.string().date(),
});

export const ProductsFileSchema = z.object({
  vendors: z.array(VendorSchema),
  products: z.array(ProductSchema),
});
export const ApisFileSchema = z.object({ apiVendors: z.array(ApiVendorSchema) });
export const SourcesFileSchema = z.object({ sources: z.array(SourceEvidenceSchema) });
export const FreePlatformsFileSchema = z.object({ freePlatforms: z.array(FreePlatformSchema) });
export const FreeModelAccessSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  status: z.enum(["verified", "not_confirmed"]),
  mode: z.enum(["model_zero", "platform_free", "client_only"]),
  modelId: z.string().optional(),
  summary: z.string().min(1),
  allowance: z.string().min(1),
  privacy: z.string().min(1),
  officialUrl: z.string().url(),
  sourceIds: z.array(z.string()).min(1),
});
export const FreeModelSpotlightSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  context: z.string().min(1),
  capabilities: z.array(z.string()).min(1),
  price: z.string().min(1),
  status: z.enum(["preview", "current", "ended"]),
  statusLabel: z.string().min(1),
  caution: z.string().min(1),
  verifiedAt: z.string().date(),
  access: z.array(FreeModelAccessSchema).min(1),
});
export const FreeModelsFileSchema = z.object({ freeModels: z.array(FreeModelSpotlightSchema) });
export const BenchmarksFileSchema = z.object({ benchmarks: z.array(BenchmarkReferenceSchema) });
export const DecisionEstimatesFileSchema = z.object({ decisionEstimates: z.array(DecisionEstimateSchema) });
export const VideoProductsFileSchema = z.object({ videoProducts: z.array(VideoProductSchema) });
export const OffersFileSchema = z.object({ offers: z.array(OfferSchema) });
export const SocialWatchFileSchema = z.object({ socialWatchSources: z.array(SocialWatchSourceSchema) });
export const ChangesFileSchema = z.object({ changes: z.array(ChangeNoticeSchema) });

export type Vendor = z.infer<typeof VendorSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ModelAccess = z.infer<typeof ModelAccessSchema>;
export type ProviderLayer = z.infer<typeof ProviderLayerSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type ApiVendor = z.infer<typeof ApiVendorSchema>;
export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;
export type FreePlatform = z.infer<typeof FreePlatformSchema>;
export type FreeModelAccess = z.infer<typeof FreeModelAccessSchema>;
export type FreeModelSpotlight = z.infer<typeof FreeModelSpotlightSchema>;
export type BenchmarkReference = z.infer<typeof BenchmarkReferenceSchema>;
export type DecisionEstimate = z.infer<typeof DecisionEstimateSchema>;
export type VideoProduct = z.infer<typeof VideoProductSchema>;
export type VideoPlan = z.infer<typeof VideoPlanSchema>;
export type VideoRate = z.infer<typeof VideoRateSchema>;
export type Offer = z.infer<typeof OfferSchema>;
export type SocialWatchSource = z.infer<typeof SocialWatchSourceSchema>;
export type ChangeNotice = z.infer<typeof ChangeNoticeSchema>;
