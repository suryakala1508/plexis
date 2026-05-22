import { NextFunction, Response } from "express";
import { FeatureKey, PLAN_ORDER } from "../../config/subscription";
import { StudioModel } from "../../models/studioModel";
import { AuthRequest } from "./index";
import { resolveSubscriptionForRequest } from "../services/subscriptionService";

const getRequiredPlan = (featureKey: FeatureKey): string => {
  for (const planType of PLAN_ORDER) {
    const featuresForPlan = resolveSubscriptionForRequest({
      studio: { subscription: { planType } },
      user: {},
    }).features;

    if (featuresForPlan[featureKey]) {
      return planType;
    }
  }

  return "pro";
};

export const requireFeature = (featureKey: FeatureKey) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const ownerId = req.data?.id;
      const studio = ownerId
        ? await StudioModel.findOne({ createdBy: ownerId }).lean()
        : null;

      const subscription = resolveSubscriptionForRequest({
        user: req.user,
        studio,
      });

      req.subscription = subscription;

      if (!subscription.features[featureKey]) {
        return res.status(402).json({
          success: false,
          message: "Upgrade to get more premium options.",
          code: "FEATURE_LOCKED",
          featureKey,
          currentPlan: subscription.planType,
          requiredPlan: getRequiredPlan(featureKey),
        });
      }

      return next();
    } catch (error) {
      console.error("Feature gate middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to evaluate subscription feature access.",
      });
    }
  };
};
