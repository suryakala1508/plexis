import mongoose from 'mongoose';
import { PlanType, FEATURE_KEYS } from '../config/subscription';

interface SubscriptionPlan {
  planType: PlanType;
  planName: string;
  description?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  features: Record<string, boolean>;
  storageGb: number;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionPlanSchema = new mongoose.Schema<SubscriptionPlan>({
  planType: {
    type: String,
    enum: ['basic', 'pro', 'pro_max'],
    required: true,
    unique: true,
  },
  planName: { type: String, required: true },
  description: { type: String, default: '' },
  monthlyPrice: { type: Number, default: 0 },
  yearlyPrice: { type: Number, default: 0 },
  features: {
    type: Map,
    of: Boolean,
    default: () => {
      // Initialize with all features as false
      const features: Record<string, boolean> = {};
      for (const key of FEATURE_KEYS) {
        features[key] = false;
      }
      return features;
    },
  },
  storageGb: { type: Number, default: 500 },
}, { timestamps: true });

export const SubscriptionPlanModel = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

/**
 * Get or create subscription plans with proper feature mapping
 * This should be called during database initialization/migration
 */
export async function initializeSubscriptionPlans() {
  try {
    const basicPlan = await SubscriptionPlanModel.findOneAndUpdate(
      { planType: 'basic' },
      {
        planType: 'basic',
        planName: 'Basic',
        description: 'Essential features for photographers and videographers',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: {
          lead_management: true,
          project_handling: true,
          quotation_invoicing_gst: true,
          digital_albums: true,
          photo_storage: true,
          inventory_management: true,
          crew_handling: true,
          inhouse_crew_handling: true,
          financial_dashboard: true,
          storage_backup: false,
          role_based_access: false,
          secure_gallery_pin_download: false,
          ai_features: false,
          hr_app: false,
          mobile_app: false,
        },
        storageGb: 500,
      },
      { upsert: true, new: true }
    );

    const proPlan = await SubscriptionPlanModel.findOneAndUpdate(
      { planType: 'pro' },
      {
        planType: 'pro',
        planName: 'Pro',
        description: 'Advanced features for growing studios',
        monthlyPrice: 499,
        yearlyPrice: 4990,
        features: {
          lead_management: true,
          project_handling: true,
          quotation_invoicing_gst: true,
          digital_albums: true,
          photo_storage: true,
          inventory_management: true,
          crew_handling: true,
          inhouse_crew_handling: true,
          financial_dashboard: true,
          storage_backup: true,
          role_based_access: true,
          secure_gallery_pin_download: true,
          ai_features: true,
          hr_app: true,
          mobile_app: false,
        },
        storageGb: 1000,
      },
      { upsert: true, new: true }
    );

    const proMaxPlan = await SubscriptionPlanModel.findOneAndUpdate(
      { planType: 'pro_max' },
      {
        planType: 'pro_max',
        planName: 'Pro Max',
        description: 'Enterprise features for large studios',
        monthlyPrice: 999,
        yearlyPrice: 9990,
        features: {
          lead_management: true,
          project_handling: true,
          quotation_invoicing_gst: true,
          digital_albums: true,
          photo_storage: true,
          inventory_management: true,
          crew_handling: true,
          inhouse_crew_handling: true,
          financial_dashboard: true,
          storage_backup: true,
          role_based_access: true,
          secure_gallery_pin_download: true,
          ai_features: true,
          hr_app: true,
          mobile_app: true,
        },
        storageGb: 2000,
      },
      { upsert: true, new: true }
    );

    console.log('[SubscriptionPlan] Plans initialized:', {
      basic: basicPlan?.planName,
      pro: proPlan?.planName,
      pro_max: proMaxPlan?.planName,
    });

    return { basicPlan, proPlan, proMaxPlan };
  } catch (error) {
    console.error('[SubscriptionPlan] Error initializing plans:', error);
    throw error;
  }
}
