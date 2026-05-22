import {
  FEATURE_KEYS,
  FeatureKey,
  normalizePlanType,
  PLAN_DISPLAY_NAME,
  PLAN_FEATURES,
  PLAN_STORAGE_GB,
  PlanType,
} from "../../config/subscription";

type OverrideFeatures = Record<string, unknown> | Map<string, unknown> | null | undefined;

type ResolveInput = {
  user?: any;
  studio?: any;
};

export type SubscriptionState = {
  planType: PlanType;
  status: string;
  features: Record<FeatureKey, boolean>;
  featureOverrides: Record<FeatureKey, boolean>;
  updatedAt: Date;
};

export type ResolvedSubscription = {
  planType: PlanType;
  planName: string;
  status: string;
  storageLimitGb: number;
  features: Record<FeatureKey, boolean>;
  featureOverrides: Record<FeatureKey, boolean>;
  blockedFeatures: FeatureKey[];
};

export const BASIC_LOCKED_FEATURES: FeatureKey[] = [];

const isStrictBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const normalizeFeatureOverrides = (
  overrideFeatures: OverrideFeatures
): Partial<Record<FeatureKey, boolean>> => {
  if (!overrideFeatures) {
    return {};
  }

  const source = overrideFeatures instanceof Map
    ? Object.fromEntries(overrideFeatures.entries())
    : overrideFeatures;

  const normalized: Partial<Record<FeatureKey, boolean>> = {};

  for (const key of FEATURE_KEYS) {
    const rawValue = (source as Record<string, unknown>)[key];
    if (Object.prototype.hasOwnProperty.call(source, key) && isStrictBoolean(rawValue)) {
      normalized[key] = rawValue;
    }
  }

  return normalized;
};

export const serializeFeatureOverrides = (
  overrideFeatures: OverrideFeatures,
  planType: PlanType = "basic"
): Record<FeatureKey, boolean> => {
  const normalized = normalizeFeatureOverrides(overrideFeatures);
  const fullMatrix = getDefaultFeatureAccess(planType);

  for (const key of FEATURE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(normalized, key)) {
      fullMatrix[key] = Boolean(normalized[key]);
    }
  }

  return fullMatrix;
};

export const countFeatureOverrides = (overrideFeatures: OverrideFeatures): number =>
  Object.keys(normalizeFeatureOverrides(overrideFeatures)).length;

export const createSubscriptionState = (
  planType: PlanType = "basic",
  status = "Active",
  featureOverrides: OverrideFeatures = {}
): SubscriptionState => {
  const normalizedPlan = normalizePlanType(planType);
  const normalizedOverrides = normalizeFeatureOverrides(featureOverrides);
  const baseFeatureAccess = getDefaultFeatureAccess(normalizedPlan);
  const features = { ...baseFeatureAccess };

  for (const key of FEATURE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(normalizedOverrides, key)) {
      features[key] = Boolean(normalizedOverrides[key]);
    }
  }

  return {
    planType: normalizedPlan,
    status,
    features,
    featureOverrides: { ...features },
    updatedAt: new Date(),
  };
};

export const hasSubscriptionMatrix = (subscription: any): boolean => {
  if (!subscription) return false;
  if (subscription.features && typeof subscription.features === "object") return true;
  if (subscription.featureOverrides && typeof subscription.featureOverrides === "object") return true;
  // Check for flat fields in Studio schema
  return FEATURE_KEYS.some((key) => typeof subscription[key] === "boolean");
};

const getDefaultFeatureAccess = (planType: PlanType): Record<FeatureKey, boolean> => {
  const enabledFeatures = new Set(PLAN_FEATURES[planType]);
  const featureAccess = {} as Record<FeatureKey, boolean>;

  for (const key of FEATURE_KEYS) {
    featureAccess[key] = enabledFeatures.has(key);
  }

  return featureAccess;
};

export const resolveSubscriptionForRequest = ({
  user,
  studio,
}: ResolveInput): ResolvedSubscription => {
  const userSubscription = user?.subscription;
  const studioSubscription = studio?.subscription;
  const sourceSubscription = studioSubscription || userSubscription || null;

  const planType = sourceSubscription?.planType
    ? normalizePlanType(sourceSubscription.planType)
    : normalizePlanType(studioSubscription?.planType);

  const baseFeatureAccess = getDefaultFeatureAccess(planType);
  
  // Fallback chain: Map 'features' -> Map 'featureOverrides' -> Flat Schema (sourceSubscription itself)
  const sourceData = sourceSubscription?.features || sourceSubscription?.featureOverrides || sourceSubscription || {};
  
  const storedFeatureMatrix = hasSubscriptionMatrix(sourceSubscription)
    ? normalizeFeatureOverrides(sourceData)
    : {};

  const features: Record<FeatureKey, boolean> = {
    ...baseFeatureAccess,
  };

  for (const key of FEATURE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(storedFeatureMatrix, key)) {
      features[key] = Boolean(storedFeatureMatrix[key]);
    }
  }

  const featureOverrides: Record<FeatureKey, boolean> = { ...features };

  const blockedFeatures = FEATURE_KEYS.filter((key) => !features[key]);

  const status =
    sourceSubscription?.status || studio?.subscription?.status || "Active";

  const storageLimitGb = (studio?.storage_data ?? 0) / (1024 * 1024 * 1024);

  return {
    planType,
    planName: PLAN_DISPLAY_NAME[planType],
    status,
    storageLimitGb,
    features,
    featureOverrides,
    blockedFeatures,
  };
};

/**
 * Check if a specific feature is available for a studio
 * @param studio - Studio document
 * @param featureName - Name of the feature to check
 * @returns true if feature is available, false otherwise
 */
export const isFeatureAvailable = (
  studio: any,
  featureName: FeatureKey
): boolean => {
  const resolved = resolveSubscriptionForRequest({ studio });
  return resolved.features[featureName] === true;
};

/**
 * Get subscription details for a studio including resolved features
 */
export const getSubscriptionDetails = (studioId: string, studio: any) => {
  const resolved = resolveSubscriptionForRequest({ studio });
  const sourceFeatures = studio?.subscription?.features || studio?.subscription?.featureOverrides || studio?.subscription || {};

  return {
    planType: resolved.planType,
    planName: resolved.planName,
    status: resolved.status,
    features: resolved.features,
    featureOverrides: serializeFeatureOverrides(sourceFeatures, resolved.planType),
    storageGb: resolved.storageLimitGb,
    storageUsed: studio?.storageUsed || 0,
    updatedAt: studio?.subscription?.updatedAt || new Date(),
  };
};

/**
 * Update subscription feature overrides (admin only)
 * @param studio - Studio document
 * @param overrides - Record of feature overrides
 */
export const updateFeatureOverrides = (
  studio: any,
  overrides: Record<string, boolean>
) => {
  const validOverrides: Partial<Record<FeatureKey, boolean>> = {};
  for (const key of FEATURE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(overrides, key) && typeof overrides[key] === "boolean") {
      validOverrides[key] = overrides[key];
    }
  }

  const planType = normalizePlanType(studio?.subscription?.planType);
  const nextFeatures = serializeFeatureOverrides(validOverrides, planType);
  
  for (const [key, value] of Object.entries(nextFeatures)) {
    studio.subscription[key] = value;
  }
  studio.subscription.featureOverrides = new Map(Object.entries(nextFeatures));
  studio.subscription.updatedAt = new Date();

  return getSubscriptionDetails(studio._id, studio);
};
