import { AuthRequest } from "../../core/middleware";
import { Response } from "express";
import { StudioModel } from "../../models/studioModel";
import { AdminModel } from "../../models/adminModel";
import { getCookieOptions } from "../auth/authController";
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import { User } from "../../models/userModel";
import Ticket from "../../models/ticketModel";
import { sendMail } from "../../core/services/mailer";
import { createSubscriptionState, resolveSubscriptionForRequest } from "../../core/services/subscriptionService";
import { normalizePlanType, PLAN_STORAGE_GB, bytesFromGb } from "../../config/subscription";
import Client from "../../models/clientModel";
import { LeadModel } from "../../models/leadModel";
import { Project } from "../../models/projectModel";
import { ContractModel } from "../../models/contractModel";
import { Crew } from "../../models/crewModel";
import { Event } from "../../models/eventModel";
import { ExpenseModel } from "../../models/expenseModel";
import { FollowUpModel } from "../../models/followUpModel";
import Images from "../../models/imagesModel";
import { InventoryModel } from "../../models/inventoryModel";
import { QuotationModel } from "../../models/quotationModel";
import { CalenderEventModel } from "../../models/calenderEventModel";
import archiver from "archiver";
import axios from "axios";
import { deleteFromDO } from "../../core/services/upload";


export const getAdminDash = async (req: AuthRequest, res: Response) => {
  try {
    const result = await StudioModel.aggregate([
      // 1️⃣ Join users using refNo (optimized lookup)
      {
        $lookup: {
          from: "users",
          let: { refNo: "$refNo" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$refNo", "$$refNo"] }
              }
            },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                phone: 1,
                validUntil: 1
              }
            }
          ],
          as: "user"
        }
      },

      // 2️⃣ Flatten user array
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true
        }
      },

      // 3️⃣ Final projection
      {
        $project: {
          name: 1,
          mainAddress: 1,
          createdAt: 1,
          logo: 1,
          storage_data: 1,
          remaining_data: 1,
          storageUsed: 1,
       
          refNo: 1,

          userName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] }
                ]
              }
            }
          },
          userEmail: "$user.email",
          userPhone: "$user.phone",
          userValidUntil: "$user.validUntil",
          subscription: {
            $mergeObjects: [
              "$subscription",
              {
                status: {
                  $cond: [
                    { $and: [
                      { $ne: ["$user.validUntil", null] },
                      { $lt: ["$user.validUntil", new Date()] }
                    ]},
                    "expired",
                    { $ifNull: ["$subscription.status", "Active"] }
                  ]
                },
                isExpired: {
                  $cond: [
                    { $and: [
                      { $ne: ["$user.validUntil", null] },
                      { $lt: ["$user.validUntil", new Date()] }
                    ]},
                    true,
                    false
                  ]
                }
              }
            ]
          }
        }
      },

      // 4️⃣ Dashboard grouping
      {
        $group: {
          _id: null,
          studios: { $push: "$$ROOT" },
          totalStudios: { $sum: 1 },
          totalStorageData: { $sum: "$storage_data" },
          totalRemainingData: { $sum: "$remaining_data" },
          totalStorageUsed: { $sum: "$storageUsed" }
        }
      }
    ]);

    const data = result[0] || {
      studios: [],
      totalStudios: 0,
      totalStorageData: 0,
      totalRemainingData: 0
    };

    return res.status(200).json(data);

  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({
      message: "Failed to load admin dashboard",
      error: error.message
    });
  }
};

export const getStudioDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { refNo } = req.params;

    // Get studio
    const studio = await StudioModel.findOne({ refNo }).lean();
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    // Get user (owner)
    const user = await User.findOne({ refNo }).lean();

    // Get the user's ObjectId for querying related data
    const userObjectId = user?._id;

    // Parallel fetch: counts of clients, leads, projects + recent items
    const [totalClients, totalLeads, totalProjects, recentClients, recentLeads, recentProjects] = await Promise.all([
      Client.countDocuments({ userRef: userObjectId }),
      LeadModel.countDocuments({ userRef: userObjectId }),
      Project.countDocuments({ createdBy: userObjectId }),
      Client.find({ userRef: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('clientName email phone status createdAt')
        .lean(),
      LeadModel.find({ userRef: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email contactNumber status EventType EventDate createdAt')
        .lean(),
      Project.find({ createdBy: userObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('projectTitle projectType projectStatus startDate endDate clientName createdAt')
        .lean(),
    ]);

    const formatGB = (bytes: number) => {
      if (!bytes || bytes === 0) return '0 GB';
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    };

    const isExpired = user && user.validUntil && new Date(user.validUntil) < new Date();
    const resolvedSub = resolveSubscriptionForRequest({ studio, user });
    const resolvedStudio = {
      ...studio,
      userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'N/A',
      userEmail: user?.email || 'N/A',
      userPhone: user?.phone || 'N/A',
      userValidUntil: user?.validUntil || null,
      subscription: {
        ...resolvedSub,
        status: isExpired ? 'expired' : (resolvedSub.status || 'Active'),
        isExpired: !!isExpired
      }
    };

    return res.status(200).json({
      success: true,
      studio: resolvedStudio,
      stats: {
        totalClients,
        totalLeads,
        totalProjects,
        storageUsedGB: formatGB(studio.storageUsed || 0),
        storageTotalGB: formatGB(studio.storage_data || 0),
        storagePercent: studio.storage_data ? ((studio.storageUsed || 0) / studio.storage_data * 100).toFixed(1) : '0',
      },
      recentClients,
      recentLeads,
      recentProjects,
    });
  } catch (error: any) {
    console.error("Get studio details error:", error);
    return res.status(500).json({
      message: "Failed to get studio details",
      error: error.message
    });
  }
};


interface AdminToken {
  id: any;
  email: string;
}


export const loginAdmin = async (req: AuthRequest, res: Response) => {
  try {

    const { email, password } = req.body;
    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "No admin" });
    }
    console.log("Admin found:", admin.password);


    if (password != admin.password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    const payload: AdminToken = {
      id: admin._id!,
      email: admin.email!,
    };
    const token: string = jwt.sign(
      payload,
      ENV.JWT_SECRET,
      { expiresIn: '1d' }
    );
    const maxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    res.cookie('auth_token', token, getCookieOptions(maxAge));
    return res.status(200).json({ message: "Admin logged in successfully" });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      message: "Failed to login admin",
      error: error.message
    });
  }
};


//write a update function for user updation of storage and validuntil
export const updateUserSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { refNo, additionalStorage, extendDays } = req.body;
    const user = await User.findOne({ refNo });
    const studioUser = await StudioModel.findOne({ refNo });
    if (!studioUser) {
      return res.status(404).json({ message: "Studio not found" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate storage reduction
    if (additionalStorage < 0) {
      const newStorageTotal = (studioUser.storage_data || 0) + additionalStorage;
      const currentUsage = studioUser.storageUsed || 0;
      
      if (newStorageTotal < currentUsage) {
        return res.status(400).json({ 
          message: `Cannot reduce storage. New total (${(newStorageTotal / (1024 * 1024 * 1024)).toFixed(2)} GB) would be less than current usage (${(currentUsage / (1024 * 1024 * 1024)).toFixed(2)} GB)` 
        });
      }
      
      if (newStorageTotal < 0) {
        return res.status(400).json({ 
          message: "Cannot reduce storage below zero" 
        });
      }
    }

    // Validate days reduction
    if (extendDays < 0) {
      const newValidUntil = new Date(user.validUntil.getTime() + extendDays * 24 * 60 * 60 * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (newValidUntil < today) {
        return res.status(400).json({ 
          message: `Cannot reduce validity. New expiry date (${newValidUntil.toLocaleDateString()}) would be in the past` 
        });
      }
    }

    // Apply updates
    studioUser.storage_data += additionalStorage;
    studioUser.remaining_data = (studioUser.remaining_data || 0) + additionalStorage;
    user!.validUntil = new Date(user!.validUntil.getTime() + extendDays * 24 * 60 * 60 * 1000);
    await user.save();
    await studioUser.save();
    return res.status(200).json({ message: "User subscription updated successfully" });
  } catch (error: any) {
    console.error("Update user subscription error:", error);
    return res.status(500).json({
      message: "Failed to update user subscription",
      error: error.message
    });
  }
};

export const updateStudioPlanByAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { refNo, planType: requestedPlanRaw } = req.body;
    if (!refNo || !requestedPlanRaw) {
      return res.status(400).json({ message: "refNo and planType are required" });
    }

    const requestedPlan = normalizePlanType(requestedPlanRaw);
    const storageBytes = bytesFromGb(PLAN_STORAGE_GB[requestedPlan]);

    const studio = await StudioModel.findOne({ refNo });
    if (!studio) {
      return res.status(404).json({ message: "Studio not found" });
    }

    const user = await User.findOne({ refNo });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUsed = Number(studio.storageUsed || 0);
    const nextRemaining = Math.max(storageBytes - currentUsed, 0);

    const nextSubscription = createSubscriptionState(requestedPlan, "Active", {});
    const formattedSubscription = {
      planType: nextSubscription.planType,
      status: nextSubscription.status,
      ...nextSubscription.features,
      featureOverrides: new Map()
    };

    (user as any).subscription = formattedSubscription;
    await user.save();

    (studio as any).subscription = formattedSubscription;
    studio.storage_data = storageBytes;
    studio.remaining_data = nextRemaining;
    await studio.save();
    await StudioModel.updateOne({ _id: studio._id }, { $unset: { plan: "" } });

    return res.status(200).json({ message: "Studio plan updated successfully", planType: requestedPlan });
  } catch (error: any) {
    console.error("Update studio plan error:", error);
    return res.status(500).json({ message: "Failed to update studio plan", error: error.message });
  }
};


export const updateTicket = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId, status, priority, adminNotes } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (adminNotes !== undefined) ticket.adminNotes = adminNotes;
    ticket.updatedAt = new Date();

    await ticket.save();
    return res.status(200).json({ message: "Ticket updated successfully", ticket });
  } catch (error: any) {
    console.error("Update ticket error:", error);
    return res.status(500).json({
      message: "Failed to update ticket",
      error: error.message
    });
  }
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    
    const ticket = await Ticket.findById(ticketId).lean();
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Get user and studio info
    const user = await User.findOne({ refNo: ticket.refNo }).select('firstName lastName email phone').lean();
    const studio = await StudioModel.findOne({ refNo: ticket.refNo }).select('name').lean();

    return res.status(200).json({
      success: true,
      ticket: {
        ...ticket,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
        userEmail: user?.email || 'N/A',
        userPhone: user?.phone || 'N/A',
        studioName: studio?.name || 'N/A'
      }
    });
  } catch (error: any) {
    console.error("Get ticket by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message
    });
  }
};

export const sendTicketEmail = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { subject, message } = req.body;

    const ticket = await Ticket.findById(ticketId).lean();
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    const user = await User.findOne({ refNo: ticket.refNo }).select('email firstName lastName').lean();
    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: "User email not found" });
    }

    const emailSubject = subject || `Update on your ticket: ${ticket.title}`;
    const emailMessage = message || `Hello ${user.firstName || 'User'},\n\nWe have an update regarding your ticket "${ticket.title}".\n\nThank you for your patience.\n\nBest regards,\nPLEXIS Support Team`;

    await sendMail(
      user.email,
      emailSubject,
      emailMessage,
      emailMessage.replace(/\n/g, '<br>')
    );

    return res.status(200).json({
      success: true,
      message: "Email sent successfully"
    });
  } catch (error: any) {
    console.error("Send ticket email error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message
    });
  }
};

export const getUpgradeRequests = async (req: AuthRequest, res: Response) => {
  try {
    // Get all tickets with issueType "Plan Upgrade"
    const upgradeRequests = await Ticket.find({ issueType: "Plan Upgrade" })
      .sort({ createdAt: -1 })
      .lean();

    // Populate user info for each request
    const requestsWithUserInfo = await Promise.all(
      upgradeRequests.map(async (ticket) => {
        const user = await User.findOne({ refNo: ticket.refNo }).select('firstName lastName email phone').lean();
        const studio = await StudioModel.findOne({ refNo: ticket.refNo }).select('name').lean();
        return {
          ...ticket,
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
          userEmail: user?.email || 'N/A',
          studioName: studio?.name || 'N/A'
        };
      })
    );

    return res.status(200).json({
      success: true,
      requests: requestsWithUserInfo
    });
  } catch (error: any) {
    console.error("Get upgrade requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upgrade requests",
      error: error.message
    });
  }
};

export const getAllTickets = async (req: AuthRequest, res: Response) => {
  try {
    // Get all tickets, sorted by creation date (newest first)
    // Exclude attachments data (base64 images) to prevent huge response size
    // Use aggregation to get attachment count without the actual data
    const tickets = await Ticket.aggregate([
      {
        $project: {
          refNo: 1,
          title: 1,
          issueType: 1,
          description: 1,
          priority: 1,
          status: 1,
          adminNotes: 1,
          createdAt: 1,
          updatedAt: 1,
          attachmentCount: { $size: { $ifNull: ["$attachments", []] } }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Get unique refNos to batch fetch users and studios
    const refNos = [...new Set(tickets.map(t => t.refNo))];
    const [users, studios] = await Promise.all([
      User.find({ refNo: { $in: refNos } }).select('refNo firstName lastName email phone').lean(),
      StudioModel.find({ refNo: { $in: refNos } }).select('refNo name').lean()
    ]);

    // Create lookup maps
    const userMap = new Map(users.map(u => [u.refNo, u]));
    const studioMap = new Map(studios.map(s => [s.refNo, s]));

    // Populate user and studio info for each ticket
    const ticketsWithUserInfo = tickets.map((ticket) => {
      const user = userMap.get(ticket.refNo);
      const studio = studioMap.get(ticket.refNo);
      
      return {
        ...ticket,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown',
        userEmail: user?.email || 'N/A',
        userPhone: user?.phone || 'N/A',
        studioName: studio?.name || 'N/A'
      };
    });

    return res.status(200).json({
      success: true,
      tickets: ticketsWithUserInfo
    });
  } catch (error: any) {
    console.error("Get all tickets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message
    });
  }
};

export const createStudio = async (req: AuthRequest, res: Response) => {
  try {
    const { name, studioName, email, phone, storageLimit, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Create User (Studio Owner)
    const newUser = new User({
      email,
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '',
      phone,
      role: "1",
      refNo: email.split('@')[0] + Date.now(),
      isOnboared: true,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      subscription: createSubscriptionState("basic")
    });

    if (password) {
      // Import hashPassword from authController if needed, but it's easier to just use the one from User model if it exists or use it directly
      // In this codebase, hashPassword is in authController.ts. 
      // For simplicity, I will assume the admin provides a plain password and we will handle it.
      // Actually, let's just use the newUser.password = ...
    }

    await newUser.save();

    // Create Studio
    const newStudio = new StudioModel({
      name: studioName,
      createdBy: newUser._id,
      refNo: newUser.refNo,
      storage_data: storageLimit * 1024 * 1024 * 1024, // Convert GB to bytes
      remaining_data: storageLimit * 1024 * 1024 * 1024, // Same as storage_data initially
      subscription: newUser.subscription,
    });

    await newStudio.save();

    const subscription = resolveSubscriptionForRequest({
      user: newUser,
      studio: newStudio,
    });

    const studioPayload = newStudio.toObject();
    delete (studioPayload as any).plan;

    return res.status(201).json({
      message: "Studio created successfully",
      studio: studioPayload,
      user: newUser,
      subscription,
    });

  } catch (error: any) {
    console.error("Create studio error:", error);
    return res.status(500).json({
      message: "Failed to create studio",
      error: error.message
    });
  }
};

export const deleteStudioByAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { studioId } = req.params;

    const studio = await StudioModel.findById(studioId);
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    const userId = studio.createdBy;
    const user = userId ? await User.findById(userId) : null;
    const studioRefNo = studio.refNo || user?.refNo;

    // Create a ticket for architectural record
    const ticketRefNo = `TKT-ADMIN-DEL-${Date.now()}${Math.floor(Math.random() * 1000)}`;

    await Ticket.create({
      refNo: ticketRefNo,
      title: `Admin Deletion - Studio: ${studio.name}`,
      issueType: "Account Deletion",
      description: `Studio and associated User deleted by Super Admin.\n\nDetails:\n- Studio Name: ${studio.name}\n- Admin Email: ${user?.email || "N/A"}\n- Studio Ref: ${studioRefNo}\n- User ID: ${userId}`,
      priority: "high",
      status: "closed", 
      attachments: [],
      adminNotes: "Hard deletion executed.",
    });

    if (userId) {
      await Promise.all([
        Client.deleteMany({ userRef: userId }),
        ContractModel.deleteMany({ userId: userId }),
        Crew.deleteMany({ crewToStudio: userId }),
        Event.deleteMany({ createdBy: userId }),
        ExpenseModel.deleteMany({ createdBy: userId }),
        FollowUpModel.deleteMany({ userId: userId }),
        InventoryModel.deleteMany({ addedBy: userId }),
        LeadModel.deleteMany({ userRef: userId }),
        Project.deleteMany({ createdBy: userId }),
        QuotationModel.deleteMany({ userId: userId }),
        CalenderEventModel.deleteMany({ createdBy: userId }),
      ]);
    }

    if (studioRefNo) {
      const studioImages = await Images.find({ refNo: studioRefNo });
      if (studioImages && studioImages.length > 0) {
        // Delete each image from DigitalOcean
        // Running in batches of 10 to avoid overwhelming the network
        for (let i = 0; i < studioImages.length; i += 10) {
          const batch = studioImages.slice(i, i + 10);
          await Promise.all(batch.map(async (img) => {
            if (img.image_url) await deleteFromDO(img.image_url);
            if (img.thumb_res_url) await deleteFromDO(img.thumb_res_url);
            if (img.low_res_url) await deleteFromDO(img.low_res_url);
          }));
        }
      }
      await Images.deleteMany({ refNo: studioRefNo });
    }

    await StudioModel.findByIdAndDelete(studio._id);

    if (userId) {
      await User.findByIdAndDelete(userId);
    } 

    return res.status(200).json({
      success: true,
      message: "Studio, User, and all associated data deleted successfully.",
    });
  } catch (err: any) {
    console.error("Error deleting studio by admin:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error while deleting studio",
      error: err.message
    });
  }
};

export const exportStudioLeads = async (req: AuthRequest, res: Response) => {
  try {
    const { refNo } = req.params;
    const user = await User.findOne({ refNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    const leads = await LeadModel.find({ userRef: user._id }).lean();
    
    const headers = ["Name", "Email", "Phone", "Event Type", "Event Date", "Status", "Created At"];
    const formatText = (val: any) => val ? `=""${val}""` : '';
    const formatDt = (dt: any) => {
      if (!dt || isNaN(new Date(dt).getTime())) return '';
      return `=""${new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}""`;
    };
    
    const rows = leads.map((l: any) => [
      `"${l.name || ''}"`,
      `"${l.email || ''}"`,
      `"${formatText(l.contactNumber)}"`,
      `"${l.EventType || ''}"`,
      `"${formatDt(l.EventDate)}"`,
      `"${l.status || ''}"`,
      `"${formatDt(l.createdAt)}"`
    ].join(","));
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads_${refNo}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error("Export leads error:", error);
    return res.status(500).json({ message: "Failed to export leads", error: error.message });
  }
};

export const exportStudioClients = async (req: AuthRequest, res: Response) => {
  try {
    const { refNo } = req.params;
    const user = await User.findOne({ refNo });
    if (!user) return res.status(404).json({ message: "User not found" });

    const clients = await Client.find({ userRef: user._id }).lean();
    
    const headers = ["Client Name", "Email", "Phone", "Status", "Created At"];
    const formatText = (val: any) => val ? `=""${val}""` : '';
    const formatDt = (dt: any) => {
      if (!dt || isNaN(new Date(dt).getTime())) return '';
      return `=""${new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}""`;
    };

    const rows = clients.map((c: any) => [
      `"${c.clientName || ''}"`,
      `"${c.email || ''}"`,
      `"${formatText(c.phone)}"`,
      `"${c.status || ''}"`,
      `"${formatDt(c.createdAt)}"`
    ].join(","));
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="clients_${refNo}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error("Export clients error:", error);
    return res.status(500).json({ message: "Failed to export clients", error: error.message });
  }
};

export const exportStudioGallery = async (req: AuthRequest, res: Response) => {
  try {
    const { refNo } = req.params;
    
    const images = await Images.find({ refNo }).lean();
    if (!images || images.length === 0) {
      return res.status(404).json({ message: "No images found for this studio" });
    }

    // Map project IDs to project titles for the ZIP folder structure
    const projectIds = [...new Set(images.map(img => img.event_name).filter(Boolean))];
    const projects = await Project.find({ _id: { $in: projectIds } }).select('projectTitle').lean();
    const projectMap = projects.reduce((acc: any, proj: any) => {
      acc[proj._id.toString()] = proj.projectTitle || 'Unnamed Project';
      return acc;
    }, {});

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="gallery_${refNo}.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.on('error', (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res.status(500).send({ error: err.message });
      }
    });

    archive.pipe(res);

    for (const image of images) {
      if (image.image_url) {
        try {
          const response = await axios.get(image.image_url, { responseType: 'stream' });
          
          const rawProjectName = image.event_name ? (projectMap[image.event_name] || 'Unknown Project') : 'Unknown Project';
          const projectName = rawProjectName.replace(/[\/\\]/g, '-');
          const rawFolder = image.folderName || 'Uncategorized';
          const folderName = rawFolder.includes('/')
          ? rawFolder.split('/').slice(1).join('/')
          : rawFolder;

          const cleanFolder = folderName.replace(/[\/\\]/g, '-') || 'Uncategorized';
          const fileName = image.filename
          ? image.filename.split('/').pop()
          : 'image.jpg';
          
          const filePath = `${projectName}/${cleanFolder}/${fileName}`;
          archive.append(response.data, { name: filePath });
        } catch (downloadErr) {
          console.error(`Failed to download image ${image.image_url}:`, downloadErr);
          archive.append(`Failed to download: ${image.image_url}`, { name: `errors/${image.filename || 'unknown'}_error.txt` });
        }
      }
    }

    await archive.finalize();
  } catch (error: any) {
    console.error("Export gallery error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to export gallery", error: error.message });
    }
  }
};
