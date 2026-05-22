export type PlanType = "basic" | "pro" | "pro_max";

export const FEATURE_KEYS = [
  "lead_management",
  "project_handling",
  "quotation_invoicing_gst",
  "digital_albums",
  "photo_storage",
  "inventory_management",
  "crew_handling",
  "inhouse_crew_handling",
  "financial_dashboard",
  "storage_backup",
  "role_based_access",
  "secure_gallery_pin_download",
  "ai_features",
  "hr_app",
  "mobile_app",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

const BASIC_FEATURES: FeatureKey[] = [
  "lead_management",
  "project_handling",
  "quotation_invoicing_gst",
  "digital_albums",
  "photo_storage",
  "inventory_management",
  "crew_handling",
  "inhouse_crew_handling",
  "financial_dashboard",
];

const PRO_FEATURES: FeatureKey[] = [...FEATURE_KEYS];

const PRO_MAX_FEATURES: FeatureKey[] = [...FEATURE_KEYS];

export const PLAN_FEATURES: Record<PlanType, FeatureKey[]> = {
  basic: BASIC_FEATURES,
  pro: PRO_FEATURES,
  pro_max: PRO_MAX_FEATURES,
};

export const PLAN_DISPLAY_NAME: Record<PlanType, string> = {
  basic: "Basic",
  pro: "Pro",
  pro_max: "Pro Max",
};

export const PLAN_STORAGE_GB: Record<PlanType, number> = {
  basic: 500,
  pro: 1000,
  pro_max: 2000,
};

export const PLAN_ORDER: PlanType[] = ["basic", "pro", "pro_max"];

export const normalizePlanType = (value: unknown): PlanType => {
  if (typeof value !== "string") {
    return "basic";
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized === "pro_max" || normalized === "promax") {
    return "pro_max";
  }

  if (normalized === "pro") {
    return "pro";
  }

  return "basic";
};

export const bytesFromGb = (gb: number): number => gb * 1024 * 1024 * 1024;
