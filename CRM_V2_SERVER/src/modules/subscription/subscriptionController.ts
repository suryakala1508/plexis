import { Response } from "express";
import {
  bytesFromGb,
  FEATURE_KEYS,
  FeatureKey,
  normalizePlanType,
  PLAN_DISPLAY_NAME,
  PLAN_FEATURES,
  PLAN_ORDER,
  PLAN_STORAGE_GB,
} from "../../config/subscription";
import { AuthRequest } from "../../core/middleware";
import { createSubscriptionState, resolveSubscriptionForRequest, serializeFeatureOverrides } from "../../core/services/subscriptionService";
import { StudioModel } from "../../models/studioModel";
import { User } from "../../models/userModel";

const OWNER_ROLE = "1";
const FEATURE_KEY_SET = new Set<string>(FEATURE_KEYS);

export const getPlans = async (_req: AuthRequest, res: Response) => {
  const plans = PLAN_ORDER.map((planType) => ({
    planType,
    planName: PLAN_DISPLAY_NAME[planType],
    storageLimitGb: PLAN_STORAGE_GB[planType],
    features: PLAN_FEATURES[planType],
  }));

  return res.status(200).json({ success: true, data: plans });
};

export const getCurrentSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.data?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const studio = await StudioModel.findOne({ createdBy: ownerId }).lean();
    const resolved = resolveSubscriptionForRequest({ user: req.user, studio });

    return res.status(200).json({
      success: true,
      data: {
        ...resolved,
        storage: {
          usedBytes: Number(studio?.storageUsed || 0),
          totalBytes: Number(studio?.storage_data || bytesFromGb(resolved.storageLimitGb)),
          remainingBytes: Number(studio?.remaining_data || 0),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch current subscription:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch current subscription.",
    });
  }
};

export const updateStudioPlan = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.data?.id;
    const actorRole = String(req.data?.role || "");

    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (actorRole !== OWNER_ROLE) {
      return res.status(403).json({
        success: false,
        message: "Only studio owner can change the subscription plan.",
      });
    }

    const requestedPlan = normalizePlanType(req.body?.planType);
    const storageBytes = bytesFromGb(PLAN_STORAGE_GB[requestedPlan]);

    const studio = await StudioModel.findOne({ createdBy: ownerId });
    const user = await User.findById(ownerId);

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found.",
      });
    }

    const currentUsed = Number(studio.storageUsed || 0);
    const nextRemaining = Math.max(storageBytes - currentUsed, 0);

    const nextUserSubscription = createSubscriptionState(
      requestedPlan,
      "Active",
      (user as any)?.subscription?.features || (user as any)?.subscription?.featureOverrides || {}
    );

    if (user) {
      (user as any).subscription = nextUserSubscription;
      await user.save();
    }

    if (studio) {
      (studio as any).subscription = {
        ...(studio as any).subscription,
        ...nextUserSubscription,
      };
    }

    // Remove legacy top-level `plan` field so subscription is the single source of truth.
    if ((studio as any).set) {
      (studio as any).set("plan", undefined);
    }

    studio.storage_data = storageBytes;
    studio.remaining_data = nextRemaining;

    await studio.save();

    await StudioModel.updateOne({ _id: studio._id }, { $unset: { plan: "" } });

    const resolved = resolveSubscriptionForRequest({ user: user || req.user, studio });

    return res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully.",
      data: resolved,
    });
  } catch (error) {
    console.error("Failed to update studio plan:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update studio plan.",
    });
  }
};

export const updateMyFeatureOverrides = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.data?.actualUserId || req.data?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const hasPlanTypeInRequest = Object.prototype.hasOwnProperty.call(req.body || {}, "planType");
    const incomingPlanType = req.body?.planType;
    const planType = incomingPlanType ? normalizePlanType(incomingPlanType) : null;
    const incomingOverrides = req.body?.featureOverrides;
    const normalizedOverrides: Partial<Record<FeatureKey, boolean>> = {};
    const errors: string[] = [];

    if (incomingOverrides && typeof incomingOverrides === "object") {
      for (const [key, value] of Object.entries(incomingOverrides)) {
        if (!FEATURE_KEY_SET.has(key)) {
          errors.push(`Unknown feature key: ${key}`);
          continue;
        }

        if (typeof value !== "boolean") {
          errors.push(`Feature key '${key}' must be a boolean (true/false)`);
          continue;
        }

        normalizedOverrides[key as FeatureKey] = value;
      }
    } else if (incomingOverrides !== undefined) {
      errors.push("featureOverrides must be an object with boolean values");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid featureOverrides payload",
        errors,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const existingSubscription = (user as any).subscription || {};
    const existingPlanType = existingSubscription?.planType ? normalizePlanType(existingSubscription.planType) : undefined;

    const ownerId = req.data?.id;
    const studio = ownerId ? await StudioModel.findOne({ createdBy: ownerId }).lean() : null;
    const studioPlanType = normalizePlanType(studio?.subscription?.planType);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid featureOverrides payload",
        errors,
      });
    }

    const nextPlanType = hasPlanTypeInRequest ? (planType || existingPlanType || studioPlanType) : (existingPlanType || studioPlanType);
    const nextSubscription = createSubscriptionState(
      nextPlanType,
      existingSubscription?.status || "Active",
      {
        ...serializeFeatureOverrides(existingSubscription.features || existingSubscription.featureOverrides, nextPlanType),
        ...normalizedOverrides,
      }
    );

    (user as any).subscription = nextSubscription;

    await user.save();

    const resolved = resolveSubscriptionForRequest({ user, studio });

    return res.status(200).json({
      success: true,
      message: "Subscription overrides updated.",
      data: resolved,
    });
  } catch (error) {
    console.error("Failed to update subscription overrides:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update subscription overrides.",
    });
  }
};
