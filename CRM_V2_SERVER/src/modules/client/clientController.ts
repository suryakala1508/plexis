import { Request, Response } from "express";
import mongoose from "mongoose";
import Client from "../../models/clientModel";
import { Project } from "../../models/projectModel";
import { StudioModel } from "../../models/studioModel";
import { User } from "../../models/userModel";
import { sendMail } from "../../core/services/mailer";
import { clientNotificationEmailTemplate } from "./templates/clientEmailTemplate";
import { ENV } from "../../config/env";
import { CLIENT_CONSTANTS, DATE_CONSTANTS, TIME_CONSTANTS } from "./constants";

// Define AuthRequest interface to access authenticated user
interface AuthRequest extends Request {
  user?: {
    _id: string;
    [key: string]: any;
  };
}

/**
 * @desc Create new client
 * @route POST /api/clients
 */
export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const { clientName, relation, email, phone, status, notes, projectId } = req.body;
    // Validate required fields
    if (!clientName || !relation) {
      return res.status(400).json({
        success: false,
        message: "Client name and relation are required",
      });
    }

    // Check if user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if client with same email already exists for this user (only if email is provided)
    if (email) {
      const existingClient = await Client.findOne({
        email,
        userRef: req.user._id,
      });

      if (existingClient) {
        return res.status(409).json({
          success: false,
          message: "Client with this email already exists",
        });
      }
    }

    // Create client with userRef
    const client = await Client.create({
      clientName,
      relation,
      email: email || undefined,
      phone: phone || undefined,
      status: status || CLIENT_CONSTANTS.DEFAULT_STATUS,
      notes: notes || undefined,
      projectId: projectId || undefined,
      userRef: req.user._id,
    });

    // ===============================
    // Send Welcome Email
    // ===============================

    if (req.user?._id) {
      try {
        // Use userRef from the saved client for consistency
        const studio = await StudioModel.findOne({ createdBy: client.userRef }).lean();
        const user = await User.findById(client.userRef).lean();

        if (studio && user?.email) {
          const dashboardUrl = `${ENV.FRONTEND_URL}${CLIENT_CONSTANTS.DASHBOARD_PATH}`;
          const emailData = clientNotificationEmailTemplate(
            {
              name: client.clientName,
              email: client.email,
              phone: client.phone,
              relation: client.relation,
              status: client.status,
              createdAt: client.createdAt
            },
            {
              name: studio.name || CLIENT_CONSTANTS.DEFAULT_STUDIO_NAME,
              logo: studio.logo,
              accentColor: studio.accentColor,
              mainAddress: studio.mainAddress || undefined,
            },
            dashboardUrl
          );

          await sendMail(
            req.user?.email,          
            emailData.subject,
            CLIENT_CONSTANTS.WELCOME_EMAIL_SUBJECT,
            emailData.html
          );
        }
      } catch (emailError) {
        console.error("Failed to send client welcome email:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: "Client added successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create client",
      error,
    });
  }
};

/**
 * @desc Get all clients for authenticated user
 * @route GET /api/clients
 */
export const getAllClients = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;

    // Check if user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Build query with userRef filter
    let query: any = { userRef: req.user._id };

    // Add status filter if provided and not 'All'
    if (status && status !== "All") {
      query.status = status;
    }

    const clients = await Client.find(query)
      .populate("projectId", "projectTitle projectType")
      .sort({ createdAt: -1 });

    // --- DIAGNOSTICS: Project Discovery ---
    const rawUserId = req.user!._id;
    // Robustly ensure userId is an ObjectId
    const userId = mongoose.Types.ObjectId.isValid(rawUserId.toString())
      ? new mongoose.Types.ObjectId(rawUserId.toString())
      : rawUserId;

    const allUserProjects = await Project.find({ createdBy: userId }).select("projectTitle clientEmail clientName").lean();

    // Enhanced Enrichment: Ensure every client has their latest project details
    const enrichedClients = await Promise.all(clients.map(async (client: any) => {
      const clientObj = client.toObject();

      const projectData = clientObj.projectId as any;
      const isPopulated = projectData && typeof projectData === 'object' &&
        (projectData.projectTitle || projectData.projectType);

      if (!isPopulated) {
        const email = clientObj.email?.trim();
        const phone = clientObj.phone?.trim();
        const name = clientObj.clientName?.trim();

        const fuzzyCriteria: any[] = [];
        if (email) fuzzyCriteria.push({ clientEmail: { $regex: new RegExp(email, 'i') } });
        if (phone) fuzzyCriteria.push({ clientPhone: { $regex: new RegExp(phone, 'i') } });
        if (name && name.length > CLIENT_CONSTANTS.MIN_FUZZY_NAME_LENGTH) fuzzyCriteria.push({ clientName: { $regex: new RegExp(name, 'i') } });


        if (fuzzyCriteria.length > 0) {
          // Search within user's projects first
          const foundProject = await Project.findOne({
            $or: fuzzyCriteria,
            createdBy: userId
          })
            .sort({ createdAt: -1 })
            .lean();

          if (foundProject) {
            clientObj.projectId = foundProject;
          } else {
            // Debug: check if it exists at all
            const globalMatch = await Project.findOne({ $or: fuzzyCriteria }).lean();
          }
        }
      }

      // Final safety check: Handle raw ID if it's still just a string/ObjectId
      const rawPid = client.projectId; // Use raw Mongoose field to avoid toObject() effects
      if (!clientObj.projectId && rawPid) {
        try {
          const directProject = await Project.findById(rawPid).lean() as any;
          if (directProject) {
            clientObj.projectId = directProject;
          }
        } catch (e: any) {
          console.error(`[DEBUG] ID-ERR for client ${clientObj.clientName}: ${e.message}`);
        }
      }

      return clientObj;
    }));

    res.status(200).json({
      success: true,
      count: enrichedClients.length,
      data: enrichedClients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
      error,
    });
  }
};

/**
 * @desc Get single client by ID
 * @route GET /api/clients/:id
 */
export const getClientById = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const clientId = req.params.id as string;

    // Reject known route names to prevent route matching issues
    const reservedRoutes = CLIENT_CONSTANTS.RESERVED_IDS;
    if (reservedRoutes.includes(clientId)) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Find client that belongs to this user
    const client = await Client.findOne({
      _id: clientId,
      userRef: req.user._id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch client",
      error,
    });
  }
};

/**
 * @desc Update client
 * @route PUT /api/clients/:id
 */
export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find and update client that belongs to this user
    const client = await Client.findOneAndUpdate(
      {
        _id: req.params.id as string,
        userRef: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update client",
      error,
    });
  }
};

/**
 * @desc Delete client
 * @route DELETE /api/clients/:id
 */
export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find and delete client that belongs to this user
    const client = await Client.findOneAndDelete({
      _id: req.params.id as string,
      userRef: req.user._id,
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete client",
      error,
    });
  }
};

/**
 * @desc Get client statistics by time range
 * @route GET /api/clients/stats
 */
export const getClientStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const { range } = req.query;
    const userId = req.user._id;
    let startDate = new Date();
    let endDate = new Date();
    let groupBy: any;
    let format = "month";

    const dayNames = DATE_CONSTANTS.DAY_NAMES;
    const monthNames = DATE_CONSTANTS.MONTH_NAMES;

    if (range === 'week') {
      // Current week: Sunday to Saturday
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + TIME_CONSTANTS.DAYS_IN_WEEK - 1); // Saturday
      endOfWeek.setHours(
        TIME_CONSTANTS.HOURS_IN_DAY,
        TIME_CONSTANTS.MINUTES_IN_HOUR,
        TIME_CONSTANTS.SECONDS_IN_MINUTE,
        TIME_CONSTANTS.MILLISECONDS_IN_SECOND
      );

      startDate = startOfWeek;
      endDate = endOfWeek;
      groupBy = { $dayOfWeek: "$createdAt" };
      format = "day";
    } else if (range === 'month') {
      // Last 4 weeks from today
      startDate = new Date();
      startDate.setDate(startDate.getDate() - TIME_CONSTANTS.DAYS_IN_MONTH_VIEW); // 4 weeks back
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(
        TIME_CONSTANTS.HOURS_IN_DAY,
        TIME_CONSTANTS.MINUTES_IN_HOUR,
        TIME_CONSTANTS.SECONDS_IN_MINUTE,
        TIME_CONSTANTS.MILLISECONDS_IN_SECOND
      );
      groupBy = { $week: "$createdAt" };
      format = "week";
    } else if (range === 'year') {
      // Current year only: Jan 1 to Dec 31
      const currentYear = new Date().getFullYear();
      startDate = new Date(currentYear, 0, 1); // Jan 1st
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(currentYear, 11, 31); // Dec 31st
      endDate.setHours(
        TIME_CONSTANTS.HOURS_IN_DAY,
        TIME_CONSTANTS.MINUTES_IN_HOUR,
        TIME_CONSTANTS.SECONDS_IN_MINUTE,
        TIME_CONSTANTS.MILLISECONDS_IN_SECOND
      );
      groupBy = { $month: "$createdAt" };
      format = "month";
    } else {
      startDate = new Date(0);
      groupBy = { $month: "$createdAt" };
      format = "month";
    }

    const matchQuery: any = {
      userRef: userId,
      createdAt: { $gte: startDate }
    };

    // Add end date filter for week, month, and year
    if (range === 'week' || range === 'month' || range === 'year') {
      matchQuery.createdAt = { $gte: startDate, $lte: endDate };
    }

    const stats = await Client.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Create a map of existing data
    const dataMap = new Map(stats.map(s => [s._id, s.count]));

    let formattedData: { label: string; count: number }[] = [];

    if (format === 'day') {
      // Week view: Show all 7 days Sun-Sat with 0 for missing days
      formattedData = dayNames.map((day, index) => ({
        label: day,
        count: dataMap.get(index + 1) || 0
      }));
    } else if (format === 'month' && range === 'year') {
      // Year view: Show all 12 months Jan-Dec with 0 for missing months
      formattedData = monthNames.map((month, index) => ({
        label: month,
        count: dataMap.get(index + 1) || 0
      }));
    } else if (format === 'week') {
      // Month view: Show weeks with relative numbering (Week 1, 2, 3, 4)
      const sortedStats = stats.sort((a: any, b: any) => a._id - b._id);
      formattedData = sortedStats.map((s: any, index: number) => ({
        label: `Week ${index + 1}`,
        count: s.count
      }));
    } else {
      // Default formatting for other ranges
      formattedData = stats.map((s: any) => ({
        label: monthNames[s._id - 1] || `Month ${s._id}`,
        count: s.count
      }));
    }

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Client Stats Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client statistics",
      error,
    });
  }
};
