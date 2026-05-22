import express from "express";
import {
  getCurrentSubscription,
  getPlans,
  updateMyFeatureOverrides,
  updateStudioPlan,
} from "./subscriptionController";

const subscriptionRouter = express.Router();

subscriptionRouter.get("/plans", getPlans);
subscriptionRouter.get("/current", getCurrentSubscription);
subscriptionRouter.patch("/plan", updateStudioPlan);
subscriptionRouter.patch("/my-override", updateMyFeatureOverrides);

export default subscriptionRouter;
