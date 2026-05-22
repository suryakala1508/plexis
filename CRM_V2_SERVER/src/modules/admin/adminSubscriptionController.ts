import { Response } from "express";
import { AuthRequest } from "../../core/middleware";
import { StudioModel } from "../../models/studioModel";
import { User } from "../../models/userModel";
import { resolveSubscriptionForRequest, serializeFeatureOverrides, countFeatureOverrides } from "../../core/services/subscriptionService";
import { FEATURE_KEYS, FeatureKey, normalizePlanType } from "../../config/subscription";

const ADMIN_ROLE = "0";
const FEATURE_KEY_SET = new Set<string>(FEATURE_KEYS);

/**
 * GET /admin/studios/:studioId/subscription
 * Get subscription and feature status for a specific studio (admin only)
 */
export const getStudioSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const adminRole = String(req.data?.role || "");


    const { studioId } = req.params;
    const studio = await StudioModel.findById(studioId);
    const user = studio ? await User.findById((studio as any).createdBy) : null;

    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const resolved = resolveSubscriptionForRequest({ user, studio });

    return res.status(200).json({
      success: true,
      data: {
        studioId: studio._id,
        studioName: studio.name,
        planType: resolved.planType,
        planName: resolved.planName,
        status: resolved.status,
        features: resolved.features,
        featureOverrides: serializeFeatureOverrides((user as any)?.subscription?.features || (studio as any).subscription?.features || studio.subscription?.featureOverrides, resolved.planType),
        updatedAt: studio.subscription?.updatedAt || new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to get studio subscription:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /admin/studios/:studioId/subscription/features
 * Update feature overrides for a studio (admin only)
 */
export const updateStudioFeatureOverrides = async (req: AuthRequest, res: Response) => {
  try {
    const adminRole = String(req.data?.role || "");
  

    const { studioId } = req.params;
    const { featureOverrides } = req.body;

    if (typeof featureOverrides !== "object" || featureOverrides === null) {
      return res.status(400).json({
        success: false,
        message: "featureOverrides must be an object with boolean values",
      });
    }

    const studio = await StudioModel.findById(studioId);
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const user = await User.findById((studio as any).createdBy);

    const validOverrides: Partial<Record<FeatureKey, boolean>> = {};
    const errors: string[] = [];

    for (const [key, value] of Object.entries(featureOverrides)) {
      if (!FEATURE_KEY_SET.has(key)) {
        errors.push(`Unknown feature key: ${key}`);
        continue;
      }

      if (typeof value !== "boolean") {
        errors.push(`Feature key '${key}' must be a boolean (true/false)`);
        continue;
      }

      validOverrides[key as FeatureKey] = value;
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid featureOverrides payload",
        errors,
      });
    }

    // Ensure subscription exists
    if (!studio.subscription) {
      studio.subscription = {
        planType: "basic",
        status: "Active",
      } as any;
    }

    // Update the studio - convert validated record to Map for storage
    const resolvedPlanType = normalizePlanType((studio as any).subscription?.planType);
    const nextFeatureMatrix = serializeFeatureOverrides(validOverrides, resolvedPlanType);
    const nextStudioSubscription = {
      ...(studio as any).subscription,
      ...nextFeatureMatrix,
      featureOverrides: new Map(Object.entries(nextFeatureMatrix)),
      updatedAt: new Date(),
    };

    (studio as any).subscription = nextStudioSubscription;

    if (user) {
      (user as any).subscription = {
        ...(user as any).subscription,
        ...nextStudioSubscription,
      };
      await user.save();
    }

    // Remove legacy top-level `plan` field so subscription is the single source of truth.
    if ((studio as any).set) {
      (studio as any).set("plan", undefined);
    }

    await studio.save();
    await StudioModel.updateOne({ _id: studio._id }, { $unset: { plan: "" } });

    const resolved = resolveSubscriptionForRequest({ studio } as any);

    return res.status(200).json({
      success: true,
      message: "Feature overrides updated successfully",
      data: {
        studioId: studio._id,
        planType: resolved.planType,
        features: resolved.features,
        featureOverrides: serializeFeatureOverrides((studio as any).subscription?.featureOverrides, resolved.planType),
      },
    });
  } catch (error) {
    console.error("Failed to update feature overrides:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /admin/studios/:studioId/subscription/features/reset
 * Reset feature overrides to plan defaults (admin only)
 */
export const resetFeatureOverrides = async (req: AuthRequest, res: Response) => {
  try {
    const adminRole = String(req.data?.role || "");


    const { studioId } = req.params;
    const studio = await StudioModel.findById(studioId);

    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    // Ensure subscription exists
    if (!studio.subscription) {
      studio.subscription = {
        planType: "basic",
        status: "Active",
      } as any;
    }

    const user = await User.findById((studio as any).createdBy);

    // Clear feature overrides
    const resolvedPlanType = normalizePlanType((studio as any).subscription?.planType);
    const nextFeatureMatrix = serializeFeatureOverrides({}, resolvedPlanType);
    const nextStudioSubscription = {
      ...(studio as any).subscription,
      ...nextFeatureMatrix,
      featureOverrides: new Map(),
      updatedAt: new Date(),
    };

    (studio as any).subscription = nextStudioSubscription;

    if (user) {
      (user as any).subscription = {
        ...(user as any).subscription,
        ...nextStudioSubscription,
      };
      await user.save();
    }

    // Remove legacy top-level `plan` field so subscription is the single source of truth.
    if ((studio as any).set) {
      (studio as any).set("plan", undefined);
    }

    await studio.save();
    await StudioModel.updateOne({ _id: studio._id }, { $unset: { plan: "" } });

    const resolved = resolveSubscriptionForRequest({ studio } as any);

    return res.status(200).json({
      success: true,
      message: "Feature overrides reset to plan defaults",
      data: {
        studioId: studio._id,
        planType: resolved.planType,
        features: resolved.features,
        featureOverrides: serializeFeatureOverrides((studio as any).subscription?.featureOverrides, resolved.planType),
      },
    });
  } catch (error) {
    console.error("Failed to reset feature overrides:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /admin/studios
 * List all studios with their subscription status (admin only)
 */
export const listStudiosWithSubscriptions = async (req: AuthRequest, res: Response) => {
  try {
    const adminRole = String(req.data?.role || "");
    if (adminRole !== ADMIN_ROLE) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    const studios = await StudioModel.find({})
      .select("name createdBy subscription storageUsed storage_data")
      .lean();

    const userIds = studios.map((studio) => studio.createdBy).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select("subscription").lean();
    const userMap = new Map(users.map((user) => [String(user._id), user]));

    const data = studios.map((studio) => {
      const resolved = resolveSubscriptionForRequest({ user: userMap.get(String(studio.createdBy)), studio } as any);
      return {
        studioId: studio._id,
        studioName: studio.name,
        planType: resolved.planType,
        status: resolved.status,
        storageUsed: studio.storageUsed || 0,
        storageLimitBytes: studio.storage_data || 0,
        featureOverridesCount: countFeatureOverrides((studio as any).subscription?.features || studio.subscription?.featureOverrides),
      };
    });

    return res.status(200).json({
      success: true,
      total: data.length,
      data,
    });
  } catch (error) {
    console.error("Failed to list studios:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
