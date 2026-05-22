export const SUBSCRIPTION_FEATURE_KEYS = [
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
];

export const SUBSCRIPTION_FEATURE_LABELS = {
  lead_management: "Lead Management",
  project_handling: "Project Handling",
  quotation_invoicing_gst: "Quotation & Invoicing (GST)",
  digital_albums: "Digital Albums",
  photo_storage: "Photo Storage",
  inventory_management: "Inventory Management",
  crew_handling: "Crew Handling",
  inhouse_crew_handling: "In-House Crew Handling",
  financial_dashboard: "Financial Dashboard",
  storage_backup: "Storage Backup",
  role_based_access: "Role-Based Access",
  secure_gallery_pin_download: "Secure Gallery PIN Download",
  ai_features: "AI Features",
  hr_app: "HR App",
  mobile_app: "Mobile App",
};

export const getSubscriptionFeatureLabel = (featureKey) =>
  SUBSCRIPTION_FEATURE_LABELS[featureKey] || featureKey.replace(/_/g, " ");
