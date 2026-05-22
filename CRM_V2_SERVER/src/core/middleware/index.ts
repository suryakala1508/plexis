import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { Token } from "../../types/token";
import { User } from "../../models/userModel";
import { AdminModel } from "../../models/adminModel";
import { StudioModel } from "../../models/studioModel";
import { UserData } from "../../types/authTypes";
import { createSubscriptionState, hasSubscriptionMatrix, resolveSubscriptionForRequest } from "../services/subscriptionService";

export interface AuthRequest extends Request {
  user?: UserData;
  data?: Token;
  isNonGet?: boolean; // true when the request method is not GET
  subscription?: any;
}

const isDatabaseConnectivityError = (error: any) => {
  const message = String(error?.message || "");
  return (
    error?.name === "MongoServerSelectionError" ||
    error?.name === "MongoNetworkError" ||
    error?.code === "ENOTFOUND" ||
    message.includes("getaddrinfo ENOTFOUND") ||
    message.includes("server selection") ||
    message.includes("ReplicaSetNoPrimary")
  );
};

export const Verify = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {


    const token = req.cookies.auth_token;

    /* ---------------- TOKEN PRESENCE ---------------- */
    if (!token) {
      console.warn("❌ No auth_token cookie found");
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }



    /* ---------------- JWT VERIFY ---------------- */
    let userdata: Token;

    try {
      userdata = jwt.verify(token, ENV.JWT_SECRET) as Token;
    } catch (jwtError) {
      console.error("❌ JWT verification failed");
      console.error(jwtError);
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }



    /* ---------------- PAYLOAD VALIDATION ---------------- */
    if (!userdata || !userdata.id) {
      console.warn("⚠️ JWT payload missing user id", userdata);
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    req.isNonGet = req.method.toUpperCase() !== "GET";

    /* ---------------- FETCH USER FROM DB ---------------- */
    let userData: any;

    try {
      // Run user + admin lookup in parallel to avoid sequential DB round-trips
      const [regularUser, adminUser] = await Promise.all([
        User.findById(userdata.id),
        AdminModel.findById(userdata.id),
      ]);
      userData = regularUser || adminUser;
    } catch (dbError) {
      if (isDatabaseConnectivityError(dbError)) {
        console.error("🔥 Verify middleware database connectivity failure");
        console.error(dbError);
        return res.status(503).json({
          success: false,
          message: "Service temporarily unavailable. Database connection failed.",
        });
      }

      throw dbError;
    }

    if (!userData) {
      console.warn("❌ User/Admin not found for ID:", userdata.id);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    /* ---------------- CHECK EXPIRY (FROM DB) ---------------- */
    if (req.isNonGet) {
      if (userData.validUntil) {
        const validUntilDate = new Date(userData.validUntil);
        const now = new Date();
        
        if (validUntilDate < now) {
          console.warn("❌ Subscription expired for user ID:", userdata.id);
          console.warn("   Valid Until:", validUntilDate.toISOString());
          console.warn("   Current Time:", now.toISOString());
          return res.status(403).json({
            success: false,
            message: "Subscription expired. Please renew to continue accessing this service.",
          });
        }
      }
    }

    /* ---------------- ATTACH USER ---------------- */
    req.user = userData;
    req.data = userdata;

    /* --------ATTACH STUDIO & RESOLVED SUBSCRIPTION -------- */
    try {
      const studio = await StudioModel.findOne({ createdBy: userData._id }).lean();

      if (!userData.subscription || !hasSubscriptionMatrix(userData.subscription)) {
        const existingPlanType = userData.subscription?.planType || (studio as any)?.subscription?.planType || "basic";
        const existingStatus = userData.subscription?.status || (studio as any)?.subscription?.status || "Active";
        const existingFeatures = (userData as any)?.subscription?.features || (userData as any)?.subscription?.featureOverrides || (studio as any)?.subscription?.features || (studio as any)?.subscription?.featureOverrides || {};

        userData.subscription = createSubscriptionState(existingPlanType, existingStatus, existingFeatures) as any;
        // Only persist when subscription was missing — not on every request
        await User.findByIdAndUpdate(userData._id, { subscription: userData.subscription });
      }

      if (studio) {
        req.subscription = resolveSubscriptionForRequest({ user: userData, studio });
      }
    } catch (studioError) {
      console.warn("⚠️ Could not fetch studio or resolve subscription", studioError);
      // Non-critical, continue without subscription info
    }

    next();
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.error("🔥 Verify middleware crashed due to database connectivity");
      console.error(error);

      return res.status(503).json({
        success: false,
        message: "Service temporarily unavailable. Database connection failed.",
      });
    }

    console.error("🔥 Verify middleware crashed");
    console.error(error);

    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
export const AdminVerify = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      console.warn("AdminVerify: No token found");
      return res.status(401).json({ success: false, message: "Unauthorized: No token" });
    }

    let userdata: Token;
    try {
      userdata = jwt.verify(token, ENV.JWT_SECRET) as Token;
    } catch (jwtErr: any) {
      console.error("AdminVerify: JWT Verification failed:", jwtErr.message);
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    if (!userdata || !userdata.id) {
      console.warn("AdminVerify: Malformed token payload");
      return res.status(401).json({ success: false, message: "Unauthorized: Invalid payload" });
    }

    let adminData;
    try {
      adminData = await AdminModel.findById(userdata.id);
    } catch (dbError) {
      if (isDatabaseConnectivityError(dbError)) {
        console.error("AdminVerify: database connectivity failure", dbError);
        return res.status(503).json({ success: false, message: "Service temporarily unavailable. Database connection failed." });
      }
      throw dbError;
    }

    if (!adminData) {
      console.warn("AdminVerify: Admin not found in DB for ID:", userdata.id);
      return res.status(401).json({ success: false, message: "Admin not found" });
    }

    req.user = adminData as any;
    next();
  } catch (error: any) {
    if (isDatabaseConnectivityError(error)) {
      console.error("AdminVerify: database connectivity failure", error);
      return res.status(503).json({ success: false, message: "Service temporarily unavailable. Database connection failed." });
    }

    console.error("AdminVerify: Unexpected error:", error);
    return res.status(500).json({ success: false, message: "Internal server error in AdminVerify" });
  }
};

