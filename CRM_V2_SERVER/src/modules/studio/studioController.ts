import { Request, Response } from "express";
import crypto from "crypto";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { User } from "../../models/userModel";
import { StudioModel } from "../../models/studioModel";

function generateStudioSlug(name: string): string {
    return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
import { uploadtoDO, deleteFromDO } from "../../core/services/upload";
import { AuthRequest } from "../../core/middleware";
import { RolesModel } from "../../models/rolesModel";
import { Crew } from "../../models/crewModel";
import { sendStudioInvite } from "./templates/crewEmailTemplate";
import { resolveSubscriptionForRequest } from "../../core/services/subscriptionService";

import { sendMail } from "@/core/services/mailer";
import { studioOnboardedEmailTemplate } from "./templates/onboardEmailTemplate";
import { ENV } from "../../config/env";

const buildHalfResolutionVariant = async (file: any) => {
  try {
    const sharp = require('sharp');

    const image = sharp(file.buffer, { failOnError: false }).rotate();
    const metadata = await image.metadata();
    const width = Number(metadata?.width || 0);
    const height = Number(metadata?.height || 0);

    if (!width || !height) {
      return null;
    }

    const targetWidth = Math.max(1, Math.floor(width / 2));
    const targetHeight = Math.max(1, Math.floor(height / 2));

    let pipeline = image.resize(targetWidth, targetHeight, {
      fit: 'fill',
      withoutEnlargement: true,
    });

    const mimeType = String(file.mimetype || '').toLowerCase();
    let outputMimeType = file.mimetype || 'image/jpeg';
    let ext = '.jpg';

    if (mimeType.includes('png')) {
      pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
      outputMimeType = 'image/png';
      ext = '.png';
    } else if (mimeType.includes('webp')) {
      pipeline = pipeline.webp({ quality: 95, effort: 6 });
      outputMimeType = 'image/webp';
      ext = '.webp';
    } else {
      pipeline = pipeline.jpeg({ quality: 95, mozjpeg: true });
      outputMimeType = 'image/jpeg';
      ext = '.jpg';
    }

    const variantBuffer = await pipeline.toBuffer();
    const baseName = String(file.originalname || 'portfolio').replace(/\.[^.]+$/, '');

    return {
      file: {
        ...file,
        buffer: variantBuffer,
        size: variantBuffer.length,
        mimetype: outputMimeType,
        originalname: `${baseName}-portfolio-half${ext}`,
      },
      size: variantBuffer.length,
    };
  } catch (error) {
    console.warn('Skipping portfolio half-resolution variant generation:', error);
    return null;
  }
};


function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hashed = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hashed.toString("hex")}`;
}

export const studioOnboard = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.body.data) {
      return res
        .status(400)
        .json({ success: false, message: "Missing data field in request" });
    }

    const parsedData = JSON.parse(req.body.data);
    const { personalInfo, studioInfo, preferences } = parsedData;

    const files = (req as any).files;
    const logoFile = files?.logo ? files.logo[0] : null;
    const portfolioFiles = files?.portfolioImages || [];

    if (!personalInfo || !studioInfo || !preferences) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const authUserId = req.data?.id || req.user?._id;
    if (!authUserId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(authUserId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ===============================
    // USER UPDATE
    // ===============================
    user.firstName = personalInfo.firstName;
    user.lastName = personalInfo.lastName;
    user.phone = personalInfo.phone;
    user.countryCode = personalInfo.countryCode;
    await user.save();

    // ===============================
    // STORAGE LOGIC
    // ===============================
    const defaultStorage = 5368709120; // 5GB
    const currentStorage = defaultStorage;

    if (portfolioFiles.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 portfolio images allowed",
      });
    }

    let totalSize = 0;
    if (logoFile) totalSize += logoFile.size;
    if (portfolioFiles.length > 0) {
      totalSize += portfolioFiles.reduce(
        (sum: number, file: any) => sum + file.size,
        0
      );
    }

    if (currentStorage < totalSize) {
      return res.status(400).json({
        success: false,
        message: "Insufficient storage space",
        available: currentStorage,
        required: totalSize,
      });
    }

    // ===============================
    // FILE UPLOADS
    // ===============================
    let logoUrl = null;
    if (logoFile) {
      const uploadResult: any = await uploadtoDO(logoFile);
      logoUrl = uploadResult.Location;
    }

    const portfolioUrls: string[] = [];
    if (portfolioFiles.length > 0) {
      for (const file of portfolioFiles) {
        const uploadResult: any = await uploadtoDO(file);
        portfolioUrls.push(uploadResult.Location);
      }
    }

    // ===============================
    // CREATE STUDIO
    // ===============================
    const newStudio = new StudioModel({
      name: studioInfo.name.trim(),
      slug: generateStudioSlug(studioInfo.name),
      mainAddress: studioInfo.mainAddress,
      branches: studioInfo.branches || [],
      preferences: preferences,
      logo: logoUrl,
      portfolioImages: portfolioUrls,
      createdBy: user._id,
      refNo: user.refNo,
      gstNumber: studioInfo.gstNumber || "",
      storage_data: currentStorage, // Set initial capacity (e.g. 5GB)
      remaining_data: currentStorage - totalSize, // Available storage after initial uploads
      storageUsed: totalSize, // Track initial usage
    });

    await newStudio.save();

    // Mark onboarding complete only after studio has been created successfully.
    user.isOnboared = true;
    await user.save();

    // ===============================
    // EMAIL FLOW (STUDIO ONBOARDING MAIL)
    // ===============================
    let emailStatus = "not_sent";

    try {

      const dashboardUrl = `${ENV.FRONTEND_URL}/dashboard`;

      const emailData = studioOnboardedEmailTemplate(
        {
          name: newStudio.name,
          tagline: "",
          logo: logoUrl || undefined,
          accentColor: "#6366F1",
          address: {
            addressLine1: studioInfo.mainAddress.addressLine1,
            addressLine2: studioInfo.mainAddress.addressLine2,
            city: studioInfo.mainAddress.city,
            state: studioInfo.mainAddress.state,
            country: studioInfo.mainAddress.country,
          },
          email: user.email,
          phone: user.phone || undefined,
        },
        dashboardUrl
      );

      // SEND MAIL TO STUDIO OWNER
      await sendMail(
        user.email,
        emailData.subject,
        `Your studio "${newStudio.name}" is now live on Plexis.`,
        emailData.html
      );

      emailStatus = "sent";

    } catch (mailErr) {
      console.error("❌ Studio onboarding email failed:", mailErr);
      emailStatus = "failed";
    }

    // ===============================
    // RESPONSE
    // ===============================
    return res.status(201).json({
      success: true,
      message: "Studio onboarded successfully",
      studio: {
        id: newStudio._id,
        name: newStudio.name,
        logo: logoUrl,
        portfolioCount: portfolioUrls.length,
      },
      emailStatus, // 👈 email tracking
    });

  } catch (error: any) {
    console.error("Onboarding error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};


export const getAllRoles = async (req: AuthRequest, res: Response) => {
  try {
    const roles = await RolesModel.find({
      $or: [{ createdBy: req.user?._id }, { createdBy: { $exists: false } }],
      roleId: { $nin: [0, 1] },
    }).select("roleId roleName");
    return res.status(200).json({ success: true, roles });
  } catch (error) {
    console.error("Get roles error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const AddRole = async (req: AuthRequest, res: Response) => {
  const { roleName, permissions } = req.body;

  if (!roleName || !permissions) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  const maxRoleId = await RolesModel.findOne({ createdBy: req.user?._id })
    .sort({ roleId: -1 })
    .select("roleId");
  const newRoleId = maxRoleId ? maxRoleId.roleId + 1 : 6;

  try {
    const existingRole = await RolesModel.findOne({
      roleId: newRoleId,
      roleName: roleName,
      createdBy: req.user!._id,
    });

    if (existingRole) {
      return res
        .status(400)
        .json({ success: false, message: "Role already exists" });
    }

    const newRole = new RolesModel({
      roleName: roleName,
      permissions: permissions,
      createdBy: req.user!._id,
    });

    await newRole.save();
    return res
      .status(201)
      .json({ success: true, message: "Role added successfully" });
  } catch (error) {
    console.error("Add role error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getCrewList = async (req: AuthRequest, res: Response) => {
  try {
    const crewList = await Crew.find({ crewToStudio: req.user!._id })
      .populate({
        path: "assignedTo",
        select: "projectTitle startDate endDate projectType",
        model: "Project",
      })
      .lean();

    return res.status(200).json({ success: true, crew: crewList });
  } catch (error) {
    console.error("Get crew error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getCrewListWithProjects = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    // Fetch crew with populated project assignments including dates
    const crewList = await Crew.find({ crewToStudio: req.user!._id })
      .populate({
        path: "assignedTo",
        select: "projectTitle startDate endDate projectType projectStatus",
        model: "Project",
      })
      .lean();

    // Transform the data to include project date info
    const crewWithAvailability = crewList.map((crew) => ({
      ...crew,
      id: crew._id.toString(),
      assignedProjects:
        crew.assignedTo?.map((project: any) => ({
          projectId: project._id.toString(),
          projectTitle: project.projectTitle,
          startDate: project.startDate,
          endDate: project.endDate,
          projectType: project.projectType,
        })) || [],
    }));

    return res.status(200).json({
      success: true,
      crew: crewWithAvailability,
    });
  } catch (error) {
    console.error("Get crew error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const addCrew = async (req: AuthRequest, res: Response) => {
  const isFormData = req.headers['content-type']?.includes('multipart/form-data');

  let name, position, email, phone, role, hasaccess, pages = {}, components = {}, photo;

  if (isFormData) {
    name = req.body.name;
    position = req.body.position;
    email = req.body.email;
    phone = req.body.phone || '';
    role = req.body.role;
    hasaccess = req.body.hasaccess === 'true' || req.body.hasaccess === true;

    try {
      pages = req.body.pages ? JSON.parse(req.body.pages) : {};
      components = req.body.components ? JSON.parse(req.body.components) : {};
    } catch {
      pages = {};
      components = {};
    }

    photo = req.body.photo || null;
  } else {
    ({
      name,
      position,
      email,
      phone,
      role,
      hasaccess,
      pages = {},
      components = {},
      photo,
    } = req.body);
  }

  const hasAccessRequested = hasaccess === true || hasaccess === "true";

  const photoFile = (req as any).file;

  try {
    if (!name || !position || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* ---------------- NORMALIZE KEYS ---------------- */
    const normalizeKeys = (obj: Record<string, any> = {}) =>
      Object.fromEntries(Object.entries(obj).map(([k, v]) => [String(k), v]));

    const normalizedPages = normalizeKeys(pages);

    const normalizedComponents: Record<string, any> = {};
    Object.entries(components || {}).forEach(([pageKey, comps]) => {
      normalizedComponents[String(pageKey)] = normalizeKeys(comps as any);
    });

    /* ⭐⭐⭐ CRITICAL RBAC FIX ⭐⭐⭐
       If all components of a page are deny:true → page must be false
    */
    Object.keys(normalizedComponents).forEach((pageKey) => {
      const comps = normalizedComponents[pageKey];

      const allDenied =
        comps &&
        Object.values(comps).length > 0 &&
        Object.values(comps).every(
          (perm: any) => perm.deny === true
        );

      if (allDenied) {
        normalizedPages[pageKey] = false;
      }
    });

    if (hasAccessRequested) {
      const studio = await StudioModel.findOne({ createdBy: req.user!._id });
      const resolved = resolveSubscriptionForRequest({
        user: req.user,
        studio,
      });

      if (!resolved.features.role_based_access) {
        return res.status(402).json({
          success: false,
          message: "Upgrade to get more premium options.",
          feature: "role_based_access",
          planType: resolved.planType,
          requiredPlan: "pro",
        });
      }
    }

    /* ---------------- PHOTO UPLOAD ---------------- */
    let photoUrl = photo || null;
    if (photoFile) {
      const uploadResult: any = await uploadtoDO(photoFile);
      photoUrl = uploadResult.Location;
    }

    let newCrew;
    let linkedUser = null;

    /* ================= CREW (NO ACCESS) ================= */
    if (!hasAccessRequested) {
      newCrew = new Crew({
        name,
        position,
        contactInfo: { email, phone },
        crewToStudio: req.user!._id,
        hasAccess: false,
        role: null,
        pages: {},
        components: {},
        linkedUser: null,
        photo: photoUrl,
      });

      await newCrew.save();
    }

    /* ================= STAFF (HAS ACCESS) ================= */
    else {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "A staff member with this email already exists",
        });
      }

      // 🔹 Create user WITHOUT password
      const userData = new User({
        email: email.toLowerCase(),
        password: "",
        role,
        refNo: email.split("@")[0] + Date.now(),
        isOnboared: true,
      });

      await userData.save();
      linkedUser = userData._id;

      const studioData = await StudioModel.findOne({ createdBy: req.user!._id });

      if (!studioData) {
        return res.status(404).json({
          success: false,
          message: "Studio not found or incomplete studio data",
        });
      }

      if (!studioData.mainAddress) {
        return res.status(400).json({
          success: false,
          message: "Please complete your studio profile (address) before inviting staff. This is required for professional email branding.",
        });
      }

      newCrew = new Crew({
        name,
        position,
        contactInfo: { email, phone },
        crewToStudio: req.user!._id,
        hasAccess: true,
        role,
        linkedUser,
        pages: normalizedPages,          // ✅ corrected pages
        components: normalizedComponents,
        photo: photoUrl,
        invite: {
          tokenHash,
          expiresAt: new Date(Date.now() + 86400000),
          used: false,
        },
      });

      await newCrew.save();

      const ROLE_NAME_MAP: Record<string, string> = {
        "2": "Editor",
        "3": "Sales",
        "4": "Operations",
        "5": "Photographer",
      };

      const roleName = ROLE_NAME_MAP[String(role)] || "Staff";
      const studioName = studioData.name || "Studio";

      const baseUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, '');
      const inviteLink = `${baseUrl}/invite?token=${rawToken}&ref=${email}`;

      await sendStudioInvite(
        email,
        name,
        [roleName],
        studioName,
        inviteLink,
        {
          name: studioData.name,
          address: studioData.mainAddress,
          accentColor: studioData.accentColor,
          logo: studioData.logo,
        },
        Object.keys(normalizedPages).filter((k) => normalizedPages[k])
      );
    }

    return res.status(201).json({
      success: true,
      message: hasAccessRequested
        ? "Staff invited successfully"
        : "Crew added successfully",
      crew: newCrew,
    });
  } catch (error: any) {
    console.error("Add crew error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
      stack: error.stack
    });
  }
};


export const getStudioInfo = async (req: AuthRequest, res: Response) => {
  try {
    const studio = await StudioModel.findOne({
      createdBy: req.user!._id,
    }).populate("createdBy");
    if (!studio) {
      return res
        .status(404)
        .json({ success: false, message: "Studio not found" });
    }
    return res.status(200).json({ success: true, studio });
  } catch (error) {
    console.error("Get studio error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const tourComplete = async (req: AuthRequest, res: Response) => {
  try {
    const studio = await StudioModel.findOneAndUpdate(
      { createdBy: req.user!._id },
      { $set: { tourDone: true } },
      { new: true }
    );
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }
    return res.status(200).json({ success: true, tourDone: true });
  } catch (error) {
    console.error("Tour complete error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateStudioAndPersonalInfo = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { personalInfo, studioInfo } = req.body;

    const parsedPersonalInfo = JSON.parse(personalInfo);
    const parsedStudioInfo = JSON.parse(studioInfo);

    if (!personalInfo || !studioInfo) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const updateId = req.data?.actualUserId || req.user!._id;

    const userUpdateResult = await User.updateOne(
      { _id: updateId },
      parsedPersonalInfo
    );
    if (userUpdateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get studio to check storage
    const studio = await StudioModel.findOne({ createdBy: req.user!._id });
    if (!studio) {
      return res
        .status(404)
        .json({ success: false, message: "Studio not found" });
    }

    const files = (req as any).files;
    const logoFile = files?.logo?.[0] ?? null;
    const portfolioFiles = files?.portfolioImages ?? [];
    const brochureFiles = files?.brochureFiles ?? [];

    // Calculate storage changes
    let storageToIncrement = 0;

    // Validate portfolio images count (max 10 total)
    const currentPortfolioCount = studio.portfolioImages?.length || 0;
    const imagesToRemoveCount = parsedStudioInfo.imagesToRemove?.length || 0;
    const newPortfolioCount = Array.isArray(portfolioFiles) ? portfolioFiles.length : 0;
    const finalPortfolioCount = currentPortfolioCount - imagesToRemoveCount + newPortfolioCount;
    if (finalPortfolioCount > 10) {
      return res.status(400).json({
        success: false,
        message: `Maximum 10 portfolio images allowed. After changes, you would have ${finalPortfolioCount} images.`,
      });
    }

    // Calculate size of new files to upload
    if (logoFile) {
      storageToIncrement += logoFile.size;
    }
    if (Array.isArray(portfolioFiles) && portfolioFiles.length > 0) {
      storageToIncrement += portfolioFiles.reduce((sum: number, file: any) => sum + file.size, 0);
    }
    if (Array.isArray(brochureFiles) && brochureFiles.length > 0) {
      storageToIncrement += brochureFiles.reduce((sum: number, file: any) => sum + file.size, 0);
    }

    // Check if enough storage available for new uploads
    const availableStorage = studio.remaining_data || 0;
    if (availableStorage < storageToIncrement) {
      return res.status(400).json({
        success: false,
        message: "Insufficient storage space",
        available: availableStorage,
        required: storageToIncrement,
      });
    }

    // If logo or portfolio files were uploaded, upload them and include in update
    let logoUrl: string | null = null;
    if (logoFile) {
      const uploadResult: any = await uploadtoDO(logoFile);
      logoUrl = uploadResult.Location;
    }

    const portfolioUrls: string[] = [];
    if (Array.isArray(portfolioFiles) && portfolioFiles.length > 0) {
      for (const file of portfolioFiles) {
        const uploadResult: any = await uploadtoDO(file);
        portfolioUrls.push(uploadResult.Location);
      }
    }

    const brochureUploads: any[] = [];
    if (Array.isArray(brochureFiles) && brochureFiles.length > 0) {
      for (const file of brochureFiles) {
        const uploadResult: any = await uploadtoDO(file);
        brochureUploads.push({
          name: file.originalname,
          url: uploadResult.Location,
          key: uploadResult.Key,
          size: file.size,
          uploadedAt: new Date()
        });
      }
    }

    // Build update operation: always set studioInfo fields, but only set logo if uploaded
    // DO NOT include portfolioImages in setFields as it will overwrite the array
    const setFields: any = {
      ...parsedStudioInfo,
      tagline: parsedStudioInfo.tagline || "",
    };

    if (setFields.studioName !== undefined) {
      setFields.name = setFields.studioName.trim();
      setFields.slug = generateStudioSlug(setFields.studioName);
      delete setFields.studioName;
    }

    // Remove special fields from setFields to prevent overwriting correctly
    delete setFields.portfolioImages;
    delete setFields.imagesToRemove;
    delete setFields.brochureFiles;
    delete setFields.brochuresToRemove;

    // metaPixelId is a sub-field of form — move it to the correct nested path
    if ('metaPixelId' in setFields) {
      setFields['form.metaPixelId'] = setFields.metaPixelId || "";
      delete setFields.metaPixelId;
    }

    // Handle Brochures renaming and deletions
    let finalBrochures = parsedStudioInfo.brochures || studio.brochures || [];

    if (parsedStudioInfo.brochuresToRemove && parsedStudioInfo.brochuresToRemove.length > 0) {
      for (const id of parsedStudioInfo.brochuresToRemove) {
        const brochure = studio.brochures.find((b: any) => b._id.toString() === id);
        if (brochure && brochure.url) {
          await deleteFromDO(brochure.url);
        }
      }
      finalBrochures = finalBrochures.filter((b: any) =>
        !parsedStudioInfo.brochuresToRemove.includes(b._id?.toString() || b.id?.toString())
      );
    }

    if (brochureUploads.length > 0) {
      finalBrochures = [...finalBrochures, ...brochureUploads];
    }

    setFields.brochures = finalBrochures;

    if (logoUrl) setFields.logo = logoUrl;

    // Build update operations
    const updateOps: any = {};

    // 1. Remove images first (if any)
    if (
      parsedStudioInfo.imagesToRemove &&
      parsedStudioInfo.imagesToRemove.length > 0
    ) {
      // Actually delete the files from DigitalOcean storage
      for (const imageUrl of parsedStudioInfo.imagesToRemove) {
        try {
          // Verify it's not a generic placeholder and belongs to this studio
          if (studio.portfolioImages.includes(imageUrl)) {
            await deleteFromDO(imageUrl);
          }
        } catch (delErr) {
          console.error(`Failed to delete image from DO: ${imageUrl}`, delErr);
          // Continue with others even if one fails
        }
      }
      updateOps.$pullAll = { portfolioImages: parsedStudioInfo.imagesToRemove };
    }

    // 2. Add new portfolio images (if any)
    if (portfolioUrls.length > 0) {
      if (updateOps.$push) {
        updateOps.$push.portfolioImages = { $each: portfolioUrls };
      } else {
        updateOps.$push = { portfolioImages: { $each: portfolioUrls } };
      }
    }

    // 3. Increment storage usage for new uploads
    if (storageToIncrement > 0) {
      if (updateOps.$inc) {
        updateOps.$inc.storageUsed = storageToIncrement;
        updateOps.$inc.remaining_data = -storageToIncrement;
      } else {
        updateOps.$inc = {
          storageUsed: storageToIncrement,
          remaining_data: -storageToIncrement
        };
      }
    }

    // 4. Update other fields (without portfolioImages)
    if (Object.keys(setFields).length > 0) {
      updateOps.$set = { ...updateOps.$set, ...setFields };
    }

    // Perform all updates in a single operation
    if (Object.keys(updateOps).length > 0) {
      await StudioModel.updateOne(
        { createdBy: req.user!._id },
        updateOps
      );
    }

    return res
      .status(200)
      .json({ success: true, message: "Information updated successfully" });
  } catch (error) {
    console.error("Update info error:", error);
    return res
      .status(500)
      .json({ success: false, message: (error as Error).message });
  }
};
export const updateLeadForm = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { personalInfo, studioInfo } = req.body;

    if (!personalInfo || !studioInfo) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const updateId = req.data?.actualUserId || req.user!._id;

    const userUpdateResult = await User.updateOne(
      { _id: updateId },
      personalInfo
    );
    if (userUpdateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const files = (req as any).files;
    const logoFile = files?.logo?.[0] ?? null;
    const portfolioFiles = files?.portfolioImages ?? [];
    const brochureFiles = files?.brochureFiles ?? [];

    // If logo or portfolio files were uploaded, upload them and include in update
    let logoUrl: string | null = null;
    if (logoFile) {
      const uploadResult: any = await uploadtoDO(logoFile);
      logoUrl = uploadResult.Location;
    }

    const portfolioUrls: string[] = [];
    if (Array.isArray(portfolioFiles) && portfolioFiles.length > 0) {
      for (const file of portfolioFiles) {
        const uploadResult: any = await uploadtoDO(file);
        portfolioUrls.push(uploadResult.Location);
      }
    }

    const brochureUploads: any[] = [];
    if (Array.isArray(brochureFiles) && brochureFiles.length > 0) {
      for (const file of brochureFiles) {
        const uploadResult: any = await uploadtoDO(file);
        brochureUploads.push({
          name: file.originalname,
          url: uploadResult.Location,
          key: uploadResult.Key,
          size: file.size,
          uploadedAt: new Date()
        });
      }
    }

    // Build update operation: always set studioInfo fields, but only set logo if uploaded and only push portfolio images if uploaded
    const setFields: any = {
      ...studioInfo,
      tagline: studioInfo.tagline || "",
    };

    if (setFields.studioName !== undefined) {
      setFields.name = setFields.studioName.trim();
      setFields.slug = generateStudioSlug(setFields.studioName);
      delete setFields.studioName;
    }

    // Only update portfolioImages if explicitly provided in studioInfo.portfolio
    if (studioInfo.portfolio && Array.isArray(studioInfo.portfolio)) {
      setFields.portfolioImages = studioInfo.portfolio;
    }

    if (logoUrl) setFields.logo = logoUrl;

    const updateOps: any = {};
    if (Object.keys(setFields).length > 0) updateOps.$set = setFields;
    if (portfolioUrls.length > 0)
      updateOps.$push = { portfolioImages: { $each: portfolioUrls } };

    if (Object.keys(updateOps).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No updates provided" });
    }
    const studioUpdateResult = await StudioModel.updateOne(
      { createdBy: req.user!._id },
      updateOps
    );

    if (studioUpdateResult.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Studio not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Information updated successfully" });
  } catch (error) {
    console.error("Update info error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const deleteCrew = async (req: AuthRequest, res: Response) => {
  const crewId = req.params.id;

  try {
    const crew = await Crew.findOne({
      _id: crewId,
      crewToStudio: req.user!._id,
    });

    if (!crew) {
      return res
        .status(404)
        .json({ success: false, message: "Crew member not found" });
    }

    // If staff → delete linked user
    if (crew.hasAccess && crew.linkedUser) {
      await User.deleteOne({ _id: crew.linkedUser });
    }

    await Crew.deleteOne({ _id: crewId });
    await User.deleteOne({ _id: crew.linkedUser });


    return res.status(200).json({
      success: true,
      message: "Crew member deleted successfully",
    });
  } catch (error) {
    console.error("🔥 Delete crew error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const uploadStudioImage = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const uploadResult: any = await uploadtoDO(file);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: uploadResult.Location,
      },
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image", // Fixed this line
    });
  }
};

export const updateCrew = async (req: AuthRequest, res: Response) => {
  const crewId = req.params.id;

  // Handle both JSON and FormData
  const isFormData = req.headers['content-type']?.includes('multipart/form-data');

  let name, position, email, phone, role, pages, components, photo, notes;

  if (isFormData) {
    name = req.body.name;
    position = req.body.position;
    email = req.body.email;
    phone = req.body.phone;
    role = req.body.role;
    notes = req.body.notes;
    if (req.body.pages) {
      try {
        pages = typeof req.body.pages === 'string' ? JSON.parse(req.body.pages) : req.body.pages;
      } catch (e) {
        pages = undefined;
      }
    }
    if (req.body.components) {
      try {
        components = typeof req.body.components === 'string' ? JSON.parse(req.body.components) : req.body.components;
      } catch (e) {
        components = undefined;
      }
    }
    photo = req.body.photo;
  } else {
    ({
      name,
      position,
      email,
      phone,
      role,
      pages,
      components,
      photo,
      notes,
    } = req.body);
  }

  const photoFile = (req as any).file;

  try {
    const crew = await Crew.findOne({
      _id: crewId,
      crewToStudio: req.user!._id,
    });

    if (!crew) {
      return res.status(404).json({
        success: false,
        message: "Crew not found",
      });
    }

    // 🔹 Normalize keys helper
    const normalizeKeys = (obj: Record<string, any> = {}) =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [String(k), v])
      );

    // Handle photo upload if provided
    if (photoFile) {
      const uploadResult: any = await uploadtoDO(photoFile);
      crew.photo = uploadResult.Location;
    } else if (photo !== undefined) {
      crew.photo = photo || null;
    }

    // 🔹 Update base fields
    if (name !== undefined) crew.name = name;
    if (position !== undefined) crew.position = position;
    if (notes !== undefined) (crew as any).notes = notes ?? "";

    // Ensure contactInfo exists
    crew.contactInfo = crew.contactInfo || { email: "", phone: "" };

    if (email !== undefined) crew.contactInfo.email = email;
    if (phone !== undefined) crew.contactInfo.phone = phone;

    // 🔹 Update staff-only fields
    if (crew.hasAccess) {
      if (role !== undefined) {
        crew.role = role;
      }

      if (pages) {
        crew.pages = new Map(Object.entries(normalizeKeys(pages)));
      }

      if (components) {
        const normalizedComponents: Record<string, any> = {};
        Object.entries(components).forEach(([pageKey, comps]) => {
          normalizedComponents[String(pageKey)] = normalizeKeys(comps as any);
        });

        crew.components = new Map(Object.entries(normalizedComponents));
      }
    }

    await crew.save();

    return res.status(200).json({
      success: true,
      message: "Crew updated successfully",
      crew,
    });
  } catch (error) {
    console.error("Update crew error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const verifyInvite = async (req: Request, res: Response) => {
  try {

    const { token, ref } = req.query as { token?: string; ref?: string };

    /* ---------------- BASIC VALIDATION ---------------- */
    if (!token || !ref) {
      console.warn("⚠️ Missing token or ref", { token, ref });
      return res.status(400).json({ message: "Invalid invite link" });
    }

    const normalizedEmail = ref.toLowerCase().trim();


    /* ---------------- TOKEN HASH ---------------- */
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");


    /* ---------------- DB QUERY ---------------- */
    const now = new Date();

    const crew = await Crew.findOne({
      "contactInfo.email": normalizedEmail,
      "invite.tokenHash": tokenHash,
      "invite.used": false,
      "invite.expiresAt": { $gt: now },
    });


    if (!crew) {
      console.warn("❌ Invite invalid / expired / already used");

      // 🔎 extra debug info
      const debugCrew = await Crew.findOne({
        "contactInfo.email": normalizedEmail,
      }).select("invite role position crewToStudio");


      return res
        .status(400)
        .json({ message: "Invite expired or already used" });
    }



    /* ---------------- ROLE MAPPING ---------------- */
    let Role: string;

    if (crew.role === "1") Role = "Admin";
    else if (crew.role === "2") Role = "Editor";
    else if (crew.role === "3") Role = "Sales";
    else if (crew.role === "4") Role = "Operations";
    else Role = "Photographers";

    /* ---------------- FETCH STUDIO ---------------- */

    const studio = await StudioModel.findOne({
      createdBy: crew.crewToStudio,
    }).select("name accentColor logo");


    if (!studio) {
      console.error("❌ Studio not found for crewToStudio:", crew.crewToStudio);
      return res.status(404).json({
        message: "Associated studio not found",
      });
    }

    /* ---------------- RESPONSE ---------------- */
    const responsePayload = {
      name: crew.name,
      role: Role,
      studioName: studio.name,
      department: crew.position,
      branding: {
        logo: studio.logo,
      },
    };

    return res.json(responsePayload);
  } catch (error) {
    console.error("🔥 Verify invite error occurred");
    console.error(error);

    return res.status(500).json({ message: "Server error" });
  }
};

interface SetPasswordBody {
  token: string;
  ref: string;
  password: string;
}

export const setInvitePassword = async (
  req: Request<{}, {}, SetPasswordBody>,
  res: Response
) => {
  try {
    const { token, ref, password } = req.body;

    if (!token || !ref || !password) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const crew = await Crew.findOne({
      "contactInfo.email": ref,
      "invite.tokenHash": tokenHash,
      "invite.used": false,
    });

    if (!crew) {
      return res
        .status(400)
        .json({ message: "Invite invalid or already used" });
    }

    if (!crew.linkedUser) {
      return res.status(400).json({ message: "Linked user not found" });
    }

    // 🔐 Update EXISTING user
    const user = await User.findById(crew.linkedUser);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let hashedPassword: string = hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    // ✅ Mark invite as used
    crew.invite = {
      ...crew.invite,
      used: true,
    };
    await crew.save();

    return res.json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Set password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// ==================== LEAD FORM IMAGE MANAGEMENT ====================

/**
 * Upload multiple images for lead form (header or background)
 * Deducts file sizes from storage quota
 */
export const uploadMultipleStudioImages = async (req: AuthRequest, res: Response) => {
  try {
    const { imageType } = req.body; // 'header' or 'background' or 'quotationBackground'
    const files = (req as any).files;
    const uploadPurpose = String(req.body?.uploadPurpose || '').trim().toLowerCase();

    if (!imageType || !['header', 'background', 'quotationBackground'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type. Must be 'header', 'background' or 'quotationBackground'",
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      });
    }

    // Get studio to check storage
    const studio = await StudioModel.findOne({ createdBy: req.user!._id });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    // Calculate total size of files
    const totalOriginalSize = files.reduce((sum: number, file: any) => sum + file.size, 0);
    const shouldGeneratePortfolioHalf = imageType === 'quotationBackground' && uploadPurpose === 'portfolio';

    const variantByOriginal: Record<string, string> = {};
    const variantUploads: Array<{ sourceIndex: number; file: any; size: number }> = [];

    if (shouldGeneratePortfolioHalf) {
      for (let index = 0; index < files.length; index += 1) {
        const variant = await buildHalfResolutionVariant(files[index]);
        if (variant) {
          variantUploads.push({ sourceIndex: index, file: variant.file, size: variant.size });
        }
      }
    }

    const totalVariantSize = variantUploads.reduce((sum, item) => sum + item.size, 0);
    const totalSize = totalOriginalSize + totalVariantSize;

    // Check if enough storage available
    const availableStorage = studio.remaining_data || 0;
    if (availableStorage < totalSize) {
      return res.status(400).json({
        success: false,
        message: "Insufficient storage space",
        available: availableStorage,
        required: totalSize,
      });
    }

    // Upload all files
    const uploadedUrls: string[] = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const uploadResult: any = await uploadtoDO(file);
      uploadedUrls.push(uploadResult.Location);

      if (shouldGeneratePortfolioHalf) {
        const variant = variantUploads.find((item) => item.sourceIndex === index);
        if (variant) {
          const variantUploadResult: any = await uploadtoDO(variant.file);
          variantByOriginal[uploadResult.Location] = variantUploadResult.Location;
        }
      }
    }

    // Determine which array to update
    let arrayField = 'headerImages';
    let selectedField = 'selectedHeaderImage';
    if (imageType === 'background') {
      arrayField = 'backgroundImages';
      selectedField = 'selectedBackgroundImage';
    } else if (imageType === 'quotationBackground') {
      arrayField = 'quotationBackgroundImages';
      selectedField = 'selectedQuotationBackgroundImage';
    }

    // Update studio with new images and increment storage usage
    const updateOps: any = {
      $push: { [arrayField]: { $each: uploadedUrls } },
      $inc: {
        storageUsed: totalSize,
        remaining_data: -totalSize
      },
    };

    // If no image is currently selected, set the first uploaded image as selected
    let currentSelected;
    if (imageType === 'header') currentSelected = studio.selectedHeaderImage;
    else if (imageType === 'background') currentSelected = studio.selectedBackgroundImage;
    else if (imageType === 'quotationBackground') currentSelected = studio.selectedQuotationBackgroundImage;

    if (!currentSelected && uploadedUrls.length > 0) {
      updateOps.$set = { [selectedField]: uploadedUrls[0] };
    }

    if (shouldGeneratePortfolioHalf && Object.keys(variantByOriginal).length > 0) {
      updateOps.$set = {
        ...(updateOps.$set || {}),
        quotationBackgroundPortfolioVariants: {
          ...(studio.quotationBackgroundPortfolioVariants || {}),
          ...variantByOriginal,
        },
      };
    }

    await StudioModel.updateOne(
      { createdBy: req.user!._id },
      updateOps
    );

    return res.status(200).json({
      success: true,
      message: `${uploadedUrls.length} ${imageType} image(s) uploaded successfully`,
      data: {
        uploadedUrls,
        portfolioVariants: variantByOriginal,
        storageUsed: studio.storageUsed + totalSize,
        storageRemaining: (studio.remaining_data || 0) - totalSize,
      },
    });
  } catch (error) {
    console.error("❌ Upload multiple images error:", error);
    return res.status(500).json({
      success: false,
      message: (error as any)?.message || "Failed to upload images",
    });
  }
};

/**
 * Select which image to use as active for header or background
 */
export const selectStudioImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageType, imageUrl, deviceType = 'desktop' } = req.body;

    if (!imageType || !['header', 'background', 'quotationBackground'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type",
      });
    }

    // Determine the DB field for the selected image
    let selectedField = 'selectedHeaderImage';
    if (imageType === 'header' && deviceType === 'mobile') selectedField = 'selectedHeaderImageMobile';
    else if (imageType === 'background') selectedField = 'selectedBackgroundImage';
    else if (imageType === 'quotationBackground') selectedField = 'selectedQuotationBackgroundImage';

    const studio = await StudioModel.findOne({ createdBy: req.user!._id });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    // ── Clear selection (None tile) ──────────────────────────────────
    if (!imageUrl) {
      await StudioModel.updateOne(
        { createdBy: req.user!._id },
        { $set: { [selectedField]: '' } }
      );
      return res.status(200).json({
        success: true,
        message: `${imageType} image cleared successfully`,
        data: { selectedImage: '' },
      });
    }

    // ── Select a specific image ─────────────────────────────────────
    let imageArray: string[] = [];
    if (imageType === 'header') imageArray = studio.headerImages || [];
    else if (imageType === 'background') imageArray = studio.backgroundImages || [];
    else if (imageType === 'quotationBackground') imageArray = studio.quotationBackgroundImages || [];

    if (!imageArray.includes(imageUrl)) {
      return res.status(400).json({
        success: false,
        message: "Image not found in studio images",
      });
    }

    await StudioModel.updateOne(
      { createdBy: req.user!._id },
      { $set: { [selectedField]: imageUrl } }
    );

    return res.status(200).json({
      success: true,
      message: `${imageType} image selected successfully`,
      data: { selectedImage: imageUrl },
    });
  } catch (error) {
    console.error("❌ Select image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to select image",
    });
  }
};

/**
 * Delete an image from header or background collection
 * Note: This deletes from storage and removes from array
 */
export const deleteStudioImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageType, imageUrl } = req.body;

    if (!imageType || !['header', 'background', 'quotationBackground'].includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type",
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const studio = await StudioModel.findOne({ createdBy: req.user!._id });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    let arrayField = 'headerImages';
    let selectedField = 'selectedHeaderImage';
    let selectedMobileField = 'selectedHeaderImageMobile';
    let imageArray = studio.headerImages || [];
    let currentSelected = studio.selectedHeaderImage;
    let currentSelectedMobile = studio.selectedHeaderImageMobile;

    if (imageType === 'background') {
      arrayField = 'backgroundImages';
      selectedField = 'selectedBackgroundImage';
      imageArray = studio.backgroundImages || [];
      currentSelected = studio.selectedBackgroundImage;
    } else if (imageType === 'quotationBackground') {
      arrayField = 'quotationBackgroundImages';
      selectedField = 'selectedQuotationBackgroundImage';
      imageArray = studio.quotationBackgroundImages || [];
      currentSelected = studio.selectedQuotationBackgroundImage;
    }

    // Check if image exists
    if (!imageArray.includes(imageUrl)) {
      return res.status(400).json({
        success: false,
        message: "Image not found",
      });
    }

    // Remove image from array
    const updateOps: any = {
      $pull: { [arrayField]: imageUrl },
    };

    let portfolioVariantToDelete = '';
    if (imageType === 'quotationBackground') {
      const variants = { ...(studio.quotationBackgroundPortfolioVariants || {}) };
      portfolioVariantToDelete = variants[imageUrl] || '';
      if (variants[imageUrl]) {
        delete variants[imageUrl];
        updateOps.$set = {
          ...(updateOps.$set || {}),
          quotationBackgroundPortfolioVariants: variants,
        };
      }
    }

    // If deleted image was selected, update selection
    const remainingImages = imageArray.filter((url: string) => url !== imageUrl);
    if (currentSelected === imageUrl) {
      updateOps.$set = {
        ...(updateOps.$set || {}),
        [selectedField]: remainingImages.length > 0 ? remainingImages[0] : "",
      };
    }
    if (imageType === 'header' && currentSelectedMobile === imageUrl) {
      updateOps.$set = {
        ...(updateOps.$set || {}),
        [selectedMobileField]: remainingImages.length > 0 ? remainingImages[0] : "",
      };
    }

    // Delete from DigitalOcean Storage
    await deleteFromDO(imageUrl);
    if (portfolioVariantToDelete) {
      await deleteFromDO(portfolioVariantToDelete);
    }

    await StudioModel.updateOne(
      { createdBy: req.user!._id },
      updateOps
    );

    return res.status(200).json({
      success: true,
      message: `${imageType} image deleted successfully`,
    });
  } catch (error) {
    console.error("❌ Delete image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
};

/**
 * Get all studio images (header, background, or both)
 */
export const getStudioImages = async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query; // 'header', 'background', or 'all'

    const studio = await StudioModel.findOne({ createdBy: req.user!._id });
    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    let responseData: any = {};

    if (type === 'header' || type === 'all' || !type) {
      responseData.header = {
        images: studio.headerImages,
        selected: studio.selectedHeaderImage,
        selectedMobile: studio.selectedHeaderImageMobile,
      };
    }

    if (type === 'background' || type === 'all' || !type) {
      responseData.background = {
        images: studio.backgroundImages,
        selected: studio.selectedBackgroundImage,
      };
    }

    if (type === 'quotationBackground' || type === 'all' || !type) {
      responseData.quotationBackground = {
        images: studio.quotationBackgroundImages || [],
        selected: studio.selectedQuotationBackgroundImage || '',
        portfolioVariants: studio.quotationBackgroundPortfolioVariants || {},
      };
    }

    return res.status(200).json({
      success: true,
      data: responseData,
      storageUsed: studio.storageUsed || 0,
      storageTotal: studio.storage_data || 5368709120,
      storageRemaining: studio.remaining_data || 5368709120
    });
  } catch (error) {
    console.error("❌ Get images error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve images",
    });
  }
};