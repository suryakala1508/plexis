import { Response } from "express";
import { AuthRequest } from "../../core/middleware";
import { StudioModel } from "../../models/studioModel";
import { User } from "../../models/userModel";
import Client from "../../models/clientModel";
import { ContractModel } from "../../models/contractModel";
import { Crew } from "../../models/crewModel";
import { Event } from "../../models/eventModel";
import { ExpenseModel } from "../../models/expenseModel";
import { FollowUpModel } from "../../models/followUpModel";
import Images from "../../models/imagesModel";
import { InventoryModel } from "../../models/inventoryModel";
import { LeadModel } from "../../models/leadModel";
import { Project } from "../../models/projectModel";
import { QuotationModel } from "../../models/quotationModel";
import { CalenderEventModel } from "../../models/calenderEventModel";
import Ticket from "../../models/ticketModel";
import { ENV } from "../../config/env";
import { resolveSubscriptionForRequest } from "../../core/services/subscriptionService";

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const ownerId = req.data?.id;
    const actualUserId = req.data?.actualUserId;

    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const studioData = await StudioModel.findOne({ createdBy: ownerId });
    
    // Default to owner (from middleware)
    let userToReturn: any = (req.user as any)?.toObject?.() || req.user;

    // If it's a staff member, swap in their personal info
    if (actualUserId && String(actualUserId) !== String(ownerId)) {
      const staffUser = await User.findById(actualUserId).lean();
      if (staffUser) {
        // Keep owner's refNo and validUntil for studio context, 
        // but use staff member's personal details for profile display.
        userToReturn = {
          ...userToReturn,
          firstName: staffUser.firstName,
          lastName: staffUser.lastName,
          phone: staffUser.phone,
          email: staffUser.email,
          countryCode: staffUser.countryCode,
          actualUserId: staffUser._id,
          role: req.data?.role || staffUser.role // Keep the role from token which is more specific
        };
      }
    }

    const data: any = {
      user: userToReturn,
      session: req.data || null
    };

    if (studioData) {
      data["studio"] = studioData;
    }

    data["subscription"] = resolveSubscriptionForRequest({
      user: userToReturn,
      studio: studioData,
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Error in getUser:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
try {
    const userId = req.user?._id;
    const reason = req.body?.reason || "No reason provided";

    if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get user and studio data
    const user = await User.findById(userId);
    if (!user) {
    return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const studio = await StudioModel.findOne({ createdBy: userId });
    const studioRefNo = studio?.refNo || user.refNo;

    // Create a ticket for account deletion
    const ticketRefNo = `TKT${Date.now()}${Math.floor(Math.random() * 1000)}`;

    await Ticket.create({
    refNo: ticketRefNo,
    title: `Account Deletion - ${user.email  || "User"}`,
    issueType: "Account Deletion",
    description: `User has requested account deletion.\n\nUser Details:\n Email: ${user.email || "N/A"}\n- Phone: ${user.phone || "N/A"}\n- User Ref: ${user.refNo}\n- Studio Ref: ${studioRefNo}\n\nReason for deletion:\n${reason}`,
    priority: "medium",
    status: "closed", // Since account is already deleted
    attachments: [],
    adminNotes:
        "Account deletion completed automatically. Review reason for future improvements.",
    });

    // Delete all data linked to user (userRef, userId, createdBy)
    await Promise.all([
    // Clients - filtered by userRef
    Client.deleteMany({ userRef: userId }),

    // Contracts - filtered by userId
    ContractModel.deleteMany({ userId: userId }),

    // Crews - filtered by crewToStudio (user reference)
    Crew.deleteMany({ crewToStudio: userId }),

    // Events - filtered by createdBy
    Event.deleteMany({ createdBy: userId }),

    // Expenses - filtered by createdBy
    ExpenseModel.deleteMany({ createdBy: userId }),    // Followups - filtered by userId
    FollowUpModel.deleteMany({ userId: userId }),

    // Inventories - filtered by addedBy
    InventoryModel.deleteMany({ addedBy: userId }),

    // Leads - filtered by userRef
    LeadModel.deleteMany({ userRef: userId }),

    // Projects - filtered by createdBy
    Project.deleteMany({ createdBy: userId }),    // Quotations - filtered by userId
    QuotationModel.deleteMany({ userId: userId }),

    // Calendar Events - filtered by createdBy
    CalenderEventModel.deleteMany({ createdBy: userId }),
    ]);

    // Delete images by refNo (studio reference)
    if (studioRefNo) {
    await Images.deleteMany({ refNo: studioRefNo });
    }

    // Delete studio document
    if (studio) {
    await StudioModel.findByIdAndDelete(studio._id);
    }

    // Delete user document
    await User.findByIdAndDelete(userId);

    // Clear session cookie (logout) - matching logout function pattern
    const isProduction = ENV.ENVIRONMENT === "production";
    res.clearCookie("auth_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none" as const,
    path: "/",
    domain: isProduction ? undefined : "localhost",
    });    return res.json({
    success: true,
    message:
        "Account and all associated data deleted successfully. A ticket has been created for admin review.",
    });
} catch (err) {
    console.error("Error deleting account:", err);
    return res.status(500).json({
    success: false,
    message: "Server Error while deleting account",
    });
}
};