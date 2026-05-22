import { Request, Response } from "express";
import { AuthRequest } from "../../core/middleware";
import Images from "../../models/imagesModel";
import mongoose from "mongoose";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Project } from "../../models/projectModel";
import { sendMail } from "../../core/services/mailer";
import { buildFrontendUrl } from "../../core/services/urlHelper";
import { StudioModel } from "../../models/studioModel";
import { User } from "../../models/userModel";
import axios, { AxiosResponse } from "axios";
import { deleteFromDO } from "../../core/services/upload";
import sharp from "sharp";
import { encode } from "blurhash";
import { getCookieOptions } from "../auth/authController";
import { resolveSubscriptionForRequest } from "../../core/services/subscriptionService";

// Types
export interface SingleImageRequest {
  imageUrl: string;
  filename?: string;
}


interface BatchImageItem {
  url?: string;
  image_url?: string;
  filename?: string;
}

interface BatchImagesRequest {
  images: BatchImageItem[];
}

// ==================== DTOs ====================
interface FolderSettings {
  allowDownload?: boolean;
  allowShare?: boolean;
  watermarkEnabled?: boolean;
}

interface CreateFolderBody {
  name: string;
  description?: string;
  accessType?: "public" | "password" | "private";
  password?: string;
  settings?: FolderSettings;
  coverImage?: string;
}

interface UpdateFolderBody {
  name?: string;
  description?: string | null;
  accessType?: "public" | "password" | "private";
  password?: string | null;
  settings?: FolderSettings;
  coverImage?: string | null;
}

interface ShareableLinkBody {
  expiresInDays?: number;
  maxAccessCount?: number | null;
  folderId?: string | string[]; // Support single folder or array of folders
  folderIds?: string[]; // Alternative: explicit array
}

interface VerifyGalleryAccessBody {
  pin: string;
}

interface ToggleFavoriteBody {
  itemId: string; // folderId or imageId
  type: "image" | "folder";
}

interface SendShareEmailBody {
  email: string;
  name?: string;
  message?: string;
  folderId?: string; // Single folder (backward compatibility)
  folderIds?: string[]; // Array of folders
  expiresInDays?: number;
  includePin?: boolean; // Whether to include PIN in email
}

interface RenameImageBody {
  newFilename: string;
}

// ==================== GET ALL IMAGES ====================
export const getAllImages = async (req: Request, res: Response) => {
  try {
    const event_id = req.params.event_id as string;
    const folderFilter = req.query.folder as string | undefined;
    const sortBy = (req.query.sortBy as string) || "createdAt"; // date, name
    const sortOrder = (req.query.sortOrder as string) || "desc"; // asc, desc
    const favoritesOnly = req.query.favoritesOnly === "true";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 0; // 0 = all

    // Build query - support both primary folder and additionalFolders
    const query: any = { event_name: event_id };

    if (folderFilter && folderFilter !== "AllPhotos") {
      query.$or = [
        { folderName: folderFilter },
        { additionalFolders: folderFilter },
      ];
    }

    if (favoritesOnly) {
      query.likedByOwner = true;
    }

    let skip = 0;
    if (limit > 0) {
      skip = (page - 1) * limit;
    }

    const sortObj: any = {};
    const msSortOrd = sortOrder === "asc" ? 1 : -1;
    if (sortBy === "name") {
        sortObj.filename = msSortOrd;
    } else {
        sortObj.createdAt = msSortOrd;
    }

    const total = await Images.countDocuments(query);
    
    let queryBuilder = Images.find(query).select("-embeddings -__v -content_type").sort(sortObj);
    if (limit > 0) {
       queryBuilder = queryBuilder.skip(skip).limit(limit);
    }
    
    let images = (await queryBuilder.lean())
      .map((img: any) => ({ ...img, image_url: img.low_res_url || img.image_url }));

    const hasMore = limit > 0 ? (skip + images.length < total) : false;

    res.status(200).json({ success: true, data: images, hasMore, total, page });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

// ==================== CREATE FOLDER ====================
export const createFolder = async (
  req: Request<{ projectId: string }, any, CreateFolderBody>,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const { name, description, accessType, password, settings, coverImage } =
      req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const project = (await Project.findById(projectId)) as any;
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if folder already exists
    const existingFolder = project.folders.find(
      (f: any) => f.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existingFolder) {
      return res
        .status(400)
        .json({ message: "Folder with this name already exists" });
    }

    const newFolder = {
      name: name.trim(),
      description: description || "",
      accessType: accessType || "private",
      password: accessType === "password" ? password : undefined,
      settings: settings || {
        allowDownload: true,
        allowShare: true,
        watermarkEnabled: false,
      },
      coverImage: coverImage || null,
      likedByOwner: false,
    };

    project.folders.push(newFolder);
    const savedFolder = project.folders[project.folders.length - 1];

    // Auto-share: If share link has specific folders selected, add this new one too
    if (
      project.gallerySettings?.shareLink?.accessibleFolders &&
      project.gallerySettings.shareLink.accessibleFolders.length > 0
    ) {
      project.gallerySettings.shareLink.accessibleFolders.push(savedFolder._id);
    }

    await project.save();

    res.status(201).json({
      success: true,
      message: "Folder created successfully",
      folder: savedFolder,
    });
  } catch (error: any) {
    console.error("Error creating folder:", error);
    res.status(500).json({
      message: "Failed to create folder",
      error: error?.message ?? error,
    });
  }
};

// ==================== GET ALL FOLDERS ====================
export const getFolders = async (
  req: Request<{ projectId: string }>,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const sortBy = (req.query.sortBy as string) || "createdAt"; // createdAt, name, imageCount
    const sortOrder = (req.query.sortOrder as string) || "desc";
    const favoritesOnly = req.query.favoritesOnly === "true";

    const project = (await Project.findById(projectId).select("folders")) as any;

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    let folders = project.folders;

    // Filter favorites if requested (uses likedByOwner on folder schema)
    if (favoritesOnly) {
      folders = folders.filter((f: any) => f.likedByOwner === true);
    }

    let foldersArray = JSON.parse(JSON.stringify(folders));

    // Aggregate image counts and get one sample image per folder for cover if missing
    const statsResult = await Images.aggregate([
      { $match: { event_name: projectId } },
      { $group: { 
          _id: "$folderName", 
          count: { $sum: 1 }, 
          sampleLowRes: { $first: "$low_res_url" },
          sampleImage: { $first: "$image_url" }
        } 
      }
    ]);

    const statsMap = new Map();
    statsResult.forEach((stat: any) => {
      statsMap.set(stat._id, stat);
    });

    const addStatsResult = await Images.aggregate([
      { $match: { event_name: projectId, additionalFolders: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$additionalFolders" },
      { $group: { _id: "$additionalFolders", count: { $sum: 1 } } }
    ]);

    addStatsResult.forEach((stat: any) => {
      if (statsMap.has(stat._id)) {
        statsMap.get(stat._id).count += stat.count;
      } else {
         statsMap.set(stat._id, stat);
      }
    });

    foldersArray = foldersArray.map((f: any) => {
      const stat = statsMap.get(f.name) || statsMap.get(f.name.split("/").pop()); 
      const count = stat ? stat.count : 0;
      const cover = f.coverImage || (stat ? (stat.sampleLowRes || stat.sampleImage) : null);
      return {
        ...f,
        imageCount: count,
        coverImage: cover
      };
    });

    // Sort folders
    const sortOrderMultiplier = sortOrder === "asc" ? 1 : -1;
    foldersArray.sort((a: any, b: any) => {
      if (sortBy === "name") {
        return sortOrderMultiplier * a.name.localeCompare(b.name);
      } else if (sortBy === "imageCount") {
        return (
          sortOrderMultiplier * ((b.imageCount || 0) - (a.imageCount || 0))
        );
      } else if (sortBy === "createdAt") {
        return (
          sortOrderMultiplier *
          (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      }
      return 0;
    });

    res.json({
      success: true,
      folders: foldersArray,
    });
  } catch (error: any) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Failed to fetch folders" });
  }
};

// ==================== UPDATE FOLDER ====================
export const updateFolder = async (
  req: Request<{ projectId: string; folderId: string }, any, UpdateFolderBody>,
  res: Response
) => {
  try {
    const { projectId, folderId } = req.params;
    const updates = req.body;

    const project = (await Project.findById(projectId)) as any;
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const folder = project.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Update fields
    if (updates.name) folder.name = updates.name;
    if (updates.description !== undefined)
      folder.description = updates.description;
    if (updates.accessType) folder.accessType = updates.accessType;
    if (updates.password) folder.password = updates.password;
    if (updates.settings) {
      folder.settings = { ...folder.settings, ...updates.settings };
    }
    if (updates.coverImage !== undefined)
      folder.coverImage = updates.coverImage;

    await project.save();

    res.json({
      success: true,
      message: "Folder updated successfully",
      folder,
    });
  } catch (error: any) {
    console.error("Error updating folder:", error);
    res.status(500).json({ message: "Failed to update folder" });
  }
};

// ==================== DELETE FOLDER ====================
// When folder is deleted: for each image referencing this folder,
// remove the folder ref. If image is not in any other folder → delete doc + DO.
export const deleteFolder = async (
  req: Request<{ projectId: string; folderId: string }>,
  res: Response
) => {
  try {
    const { projectId, folderId } = req.params;

    const project = (await Project.findById(projectId)) as any;
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    let folder;
    if (mongoose.Types.ObjectId.isValid(folderId)) {
      folder = project.folders.id(folderId);
    } else {
      folder = project.folders.find((f: any) => f.name === folderId);
    }

    let folderPath: string | null = null;
    if (folder) {
      folderPath = folder.name;
    } else if (folderId.includes("/")) {
      folderPath = folderId;
    }

    if (folderPath) {
      // Find all images referencing this folder (folderName or additionalFolders)
      const images = await Images.find({
        event_name: projectId,
        $or: [
          { folderName: folderPath },
          { additionalFolders: folderPath },
        ],
      });

      for (const image of images) {
        const additionalFolders = (image as any).additionalFolders || [];
        const allRefs = [image.folderName, ...additionalFolders].filter(Boolean);
        const otherFolders = allRefs.filter((f) => f !== folderPath);

        if (otherFolders.length > 0) {
          // Image is in other folders → just remove this folder ref
          if (image.folderName === folderPath) {
            image.folderName = otherFolders[0];
            (image as any).additionalFolders = otherFolders.slice(1);
          } else {
            (image as any).additionalFolders = additionalFolders.filter(
              (f: string) => f !== folderPath
            );
          }
          await image.save();
        } else {
          await Images.findByIdAndDelete(image._id);
          if (image.image_url) {
            const otherDocsWithSameUrl = await Images.countDocuments({
              _id: { $ne: image._id },
              event_name: projectId,
              image_url: image.image_url,
          });

          if (otherDocsWithSameUrl === 0) {
            let doUrl = image.image_url;
            const match = doUrl.match(/^https?:\/\/([^.]+)\.digitaloceanspaces\.com\/([^/]+)\/(.+)$/);
            if (match) {
              const region = match[1];
              const bucket = match[2];
              const key = match[3];
              doUrl = `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
            }
            await deleteFromDO(doUrl);
          }
        }
        }
      }
    }

    if (folder) {
      const deletedFolderId = folder._id?.toString();

      // Remove folder from project
      project.folders.pull(folder._id);

      // Remove deleted folder ID from share link accessibleFolders (clean stale refs)
      if (
        project.gallerySettings?.shareLink?.accessibleFolders?.length > 0 &&
        deletedFolderId
      ) {
        project.gallerySettings.shareLink.accessibleFolders =
          project.gallerySettings.shareLink.accessibleFolders.filter(
            (id: any) => id?.toString() !== deletedFolderId
          );
      }

      // If no folders remain: deactivate share link and clear its URL/slug
      if (project.folders.length === 0 && project.gallerySettings?.shareLink) {
        project.gallerySettings.shareLink.isActive = false;
        project.gallerySettings.shareLink.accessibleFolders = [];
        project.gallerySettings.shareLink.slug = null;
        project.gallerySettings.shareLink.updatedAt = new Date();
      }

      await project.save();
    }

    res.json({
      success: true,
      message: "Folder deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ message: "Failed to delete folder" });
  }
};

// ==================== GENERATE SHAREABLE LINK ====================
// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a short, unique slug for the project
 * Combines first 5 characters of project title (no spaces) + first 5 characters of project ID
 */
const generateUniqueSlug = async (projectId: string, projectTitle: string): Promise<string> => {
  const formattedTitle = (projectTitle || "").replace(/\s+/g, "").toLowerCase().substring(0, 5);
  const formattedId = (projectId || "").toString().toLowerCase().substring(0, 5);
  let baseSlug = `${formattedTitle}${formattedId}`;
  
  if (!baseSlug) {
    baseSlug = "gallery";
  }

  let slug = baseSlug;
  let counter = 0;
  let isUnique = false;

  while (!isUnique) {
    // Check if slug already exists
    const existing = await Project.findOne({
      "gallerySettings.shareLink.slug": slug,
    });

    if (!existing) {
      isUnique = true;
    } else {
      counter++;
      slug = `${baseSlug}${counter}`;
    }
  }

  return slug;
};

/**
 * Get or create the permanent share link for a project
 */
const getOrCreateShareLink = async (projectId: string): Promise<any> => {
  const project = (await Project.findById(projectId)) as any;

  if (!project) {
    throw new Error("Project not found");
  }

  // Initialize gallerySettings if not exists
  if (!project.gallerySettings) {
    project.gallerySettings = {};
  }

  // Generate gallery PIN if not exists
  if (!project.gallerySettings.galleryPin) {
    project.gallerySettings.galleryPin = Math.floor(
      1000 + Math.random() * 9000
    ).toString();
  }

  // Create share link if not exists
  if (
    !project.gallerySettings.shareLink ||
    !project.gallerySettings.shareLink.slug
  ) {
    const slug = await generateUniqueSlug(projectId, project.projectTitle || "");

    project.gallerySettings.shareLink = {
      slug,
      isActive: false,
      expiresAt: null,
      accessibleFolders: [],
      accessCount: 0,
      lastAccessedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  await project.save();
  return project;
};

const isPinDownloadEnabledForStudio = async (createdBy: any): Promise<boolean> => {
  if (!createdBy) {
    return false;
  }

  const studio = await StudioModel.findOne({ createdBy });
  if (!studio) {
    return false;
  }

  const user = await User.findById(createdBy).lean();
  const resolved = resolveSubscriptionForRequest({ user, studio });
  return Boolean(resolved.features.secure_gallery_pin_download);
};

// ==================== CONTROLLER FUNCTIONS ====================

/**
 * GET /api/projects/:projectId/share-link
 * Get the current share link configuration
 */
export const getShareLink = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };

    const project = await getOrCreateShareLink(projectId);
    const pinDownloadEnabled = await isPinDownloadEnabledForStudio(project.createdBy);

    const shareUrl = project.gallerySettings.shareLink.isActive
      ? `${buildFrontendUrl(req)}/gallery/${project.gallerySettings.shareLink.slug}`
      : null;

    res.json({
      success: true,
      shareLink: {
        url: shareUrl,
        slug: project.gallerySettings.shareLink.slug,
        isActive: project.gallerySettings.shareLink.isActive,
        expiresAt: project.gallerySettings.shareLink.expiresAt,
        accessibleFolders: project.gallerySettings.shareLink.accessibleFolders,
        accessCount: project.gallerySettings.shareLink.accessCount,
        lastAccessedAt: project.gallerySettings.shareLink.lastAccessedAt,
        mediaLinks: project.gallerySettings.mediaLinks || [],
      },
      pinDownloadEnabled,
      galleryPin: pinDownloadEnabled ? project.gallerySettings.galleryPin : null,
      publicFolders: project.folders.filter(
        (f: any) => f.visibility !== "hidden"
      ),
    });
  } catch (error: any) {
    console.error("Error getting share link:", error);
    res.status(500).json({ message: "Failed to get share link" });
  }
};

/**
 * PUT /api/projects/:projectId/share-link
 * Update share link configuration
 */
export const updateShareLink = async (
  req: Request<
    { projectId: string },
    any,
    {
      isActive?: boolean;
      expiresInDays?: number | null;
      accessibleFolderIds?: string[];
    }
  >,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const { isActive, expiresInDays, accessibleFolderIds } = req.body;

    const project = await getOrCreateShareLink(projectId);

    // Update activation status
    if (typeof isActive === "boolean") {
      project.gallerySettings.shareLink.isActive = isActive;
    }

    // Update expiry
    if (expiresInDays !== undefined) {
      if (expiresInDays === null) {
        // Never expires
        project.gallerySettings.shareLink.expiresAt = null;
      } else {
        // Set expiry date
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiresInDays);
        project.gallerySettings.shareLink.expiresAt = expiryDate;
      }
    }

    // Update accessible folders
    if (accessibleFolderIds !== undefined) {
      if (accessibleFolderIds.length === 0) {
        // Empty array means all public folders are accessible
        project.gallerySettings.shareLink.accessibleFolders = [];
      } else {
        // Validate folder IDs
        const validFolderIds = accessibleFolderIds.filter((fid) =>
          project.folders.some((f: any) => f._id.toString() === fid)
        );
        project.gallerySettings.shareLink.accessibleFolders = validFolderIds;
      }
    }

    project.gallerySettings.shareLink.updatedAt = new Date();
    await project.save();

    const shareUrl = project.gallerySettings.shareLink.isActive
      ? `${buildFrontendUrl(req)}/gallery/${project.gallerySettings.shareLink.slug}`
      : null;

    res.json({
      success: true,
      message: "Share link updated successfully",
      shareLink: {
        url: shareUrl,
        slug: project.gallerySettings.shareLink.slug,
        isActive: project.gallerySettings.shareLink.isActive,
        expiresAt: project.gallerySettings.shareLink.expiresAt,
        accessibleFolders: project.gallerySettings.shareLink.accessibleFolders,
      },
    });
  } catch (error: any) {
    console.error("Error updating share link:", error);
    res.status(500).json({ message: "Failed to update share link" });
  }
};

/**
 * PUT /api/projects/:projectId/folders/:folderId/visibility
 * Update folder visibility (public/hidden)
 */
export const updateFolderVisibility = async (
  req: Request<
    { projectId: string; folderId: string },
    any,
    { visibility: "public" | "hidden" }
  >,
  res: Response
) => {
  try {
    const { projectId, folderId } = req.params;
    const { visibility } = req.body;

    if (!["public", "hidden"].includes(visibility)) {
      return res.status(400).json({ message: "Invalid visibility value" });
    }

    const project = (await Project.findById(projectId)) as any;
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const folder = project.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    folder.visibility = visibility;

    // If folder is set to hidden, remove it from accessibleFolders
    if (
      visibility === "hidden" &&
      project.gallerySettings?.shareLink?.accessibleFolders
    ) {
      project.gallerySettings.shareLink.accessibleFolders =
        project.gallerySettings.shareLink.accessibleFolders.filter(
          (id: any) => id.toString() !== folderId
        );
    }

    await project.save();

    res.json({
      success: true,
      message: "Folder visibility updated",
      folder: {
        id: folder._id,
        name: folder.name,
        visibility: folder.visibility,
      },
    });
  } catch (error: any) {
    console.error("Error updating folder visibility:", error);
    res.status(500).json({ message: "Failed to update folder visibility" });
  }
};

/**
 * POST /api/projects/:projectId/share-email
 * Send share link via email
 */
export const sendShareEmail = async (
  req: Request<
    { projectId: string },
    any,
    {
      email: string;
      message?: string;
      includePin?: boolean;
      name:string;
    }
  >,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const { email, includePin = true, name } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const project = await getOrCreateShareLink(projectId);
    const pinDownloadEnabled = await isPinDownloadEnabledForStudio(project.createdBy);
    const includePinInEmail = pinDownloadEnabled && includePin;

    if (!project.gallerySettings.shareLink.isActive) {
      return res.status(400).json({
        message: "Share link must be activated before sending email",
      });
    }

    // Fetch studio information from the Studio model
    const studio = await StudioModel.findOne({ createdBy: project.createdBy });

    if (!studio) {
      return res.status(400).json({
        message: "Studio information not found",
      });
    }

    // Count folders and images
    const folderCount = project.folders?.length || 0;
    const images = await Images.find({ event_name: projectId });
    const imageCount = images.length;

    const shareUrl = `${buildFrontendUrl(req)}/gallery/${project.gallerySettings.shareLink.slug}`;

    // Import the gallery email template
    const {
      galleryEmailTemplate,
    } = require("./templates/galleryEmailTemplate");

    const emailData = galleryEmailTemplate(
      {
        projectTitle: project.projectTitle,
        projectDate: project.startDate || new Date(),
        folderCount,
        imageCount,
      },
      {
        name: studio.name,
        tagline: studio.tagline,
        logo: studio.logo,
        mainAddress: studio.mainAddress,
        accentColor: studio.accentColor,
      },
      {
        name: name || (project.clientEmail && project.clientEmail.toLowerCase() === email.toLowerCase() ? project.clientName : email.split("@")[0]),
        email: email,
      },
      shareUrl,
      includePinInEmail ? project.gallerySettings.galleryPin : undefined
    );

    // Send email using the template
    await sendMail(email, emailData.subject, "", emailData.html);

    res.json({
      success: true,
      message: "Share email sent successfully",
      shareUrl,
    });
  } catch (error: any) {
    console.error("Error sending share email:", error);
    res.status(500).json({ message: "Failed to send share email" });
  }
};/**
 * GET /api/gallery/:slug
 * Public route - verify and access shared gallery
 * Folder-aware pagination.
 *
 * - Default `limit` is 15 images per request.
 * - Fetches images for a single folder at a time (no mixing folders in one response).
 * - Never returns original `image_url` in public gallery responses.
 *
 * Initial load (no `folderName` query, page=1) returns full metadata + first folder images.
 * Subsequent requests return images + folder pagination metadata.
 */
export const accessSharedGallery = async (
  req: Request<{ slug: string }, any, any, { page?: string; limit?: string; folderName?: string; fetchAll?: string }>,
  res: Response
) => {
  try {
    const { slug } = req.params;

    const project = (await Project.findOne({
      "gallerySettings.shareLink.slug": slug,
    })
      .select("gallerySettings folders projectTitle createdBy startDate createdBy")
      .lean()) as any;
    
    if (!project) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    // Select mediaLinks separately since it's nested in gallerySettings
    const projectWithLinks = await Project.findById(project?._id).select("gallerySettings.mediaLinks").lean();
    if (projectWithLinks) {
      if (!project.gallerySettings) project.gallerySettings = {};
      project.gallerySettings.mediaLinks = (projectWithLinks as any).gallerySettings?.mediaLinks || [];
    }

    const studio = await StudioModel.findOne({ createdBy: project.createdBy });
    const user = await User.findById(project.createdBy).lean();
    const resolvedSubscription = studio
      ? resolveSubscriptionForRequest({ user, studio })
      : null;
    const pinDownloadEnabled = resolvedSubscription
      ? Boolean(resolvedSubscription.features.secure_gallery_pin_download)
      : false;

    const shareLink = project.gallerySettings?.shareLink;

    if (!shareLink || !shareLink.isActive) {
      return res.status(403).json({ message: "This gallery is not available" });
    }

    // Check expiry
    if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
      return res.status(410).json({ message: "This gallery link has expired" });
    }

    // Block when project has no folders at all
    if (!project.folders || project.folders.length === 0) {
      return res.status(404).json({ message: "This gallery has no folders" });
    }

    // Filter folders based on visibility and accessible folders
    let accessibleFolders = project.folders.filter(
      (f: any) => f.visibility !== "hidden"
    );

    if (shareLink.accessibleFolders && shareLink.accessibleFolders.length > 0) {
      accessibleFolders = accessibleFolders.filter((f: any) =>
        shareLink.accessibleFolders.some(
          (id: any) => id.toString() === f._id.toString()
        )
      );
    }

    // ── Folder-aware pagination ────────────────────────────────
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const folderNameParam = (req.query.folderName as string | undefined) || null;
    const fetchAll = ["true", "1"].includes(String(req.query.fetchAll || "")) || false;

    const isFirstLoad = !folderNameParam && page === 1;

    const currentFolderName =
      folderNameParam || (accessibleFolders.length > 0 ? accessibleFolders[0].name : null);

    if (!currentFolderName) {
      return res.status(404).json({ message: "This gallery has no folders" });
    }

    const currentFolderIndex = accessibleFolders.findIndex(
      (f: any) => f.name === currentFolderName
    );

    // If an unknown folder is requested, fall back to the first folder.
    const safeCurrentFolderIndex = currentFolderIndex >= 0 ? currentFolderIndex : 0;
    const safeCurrentFolderName = accessibleFolders[safeCurrentFolderIndex].name;
    const safeNextFolderName =
      safeCurrentFolderIndex + 1 < accessibleFolders.length
        ? accessibleFolders[safeCurrentFolderIndex + 1].name
        : null;

    const folderQuery: any = {
      event_name: project._id.toString(),
      $or: [
        { folderName: safeCurrentFolderName },
        { additionalFolders: safeCurrentFolderName },
      ],
    };

    const totalInFolder = await Images.countDocuments(folderQuery);
    const limit = fetchAll ? Math.min(totalInFolder, 10000) : 15; // safety cap for public endpoint
    const safePage = fetchAll ? 1 : page;
    const skip = (safePage - 1) * limit;

    const images = await Images.find(folderQuery)
      // IMPORTANT: fetching original `image_url` only as a fallback for old images without lower resolutions.
      .select("_id thumb_res_url low_res_url image_url filename blurhash likedByClients tags width height")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Always report the folder name the client queried.
    const normalizedImages = images.map((img: any) => ({
      _id: img._id,
      thumb_res_url: img.thumb_res_url || null,
      low_res_url: img.low_res_url || img.image_url || null,
      dimensions: { width: img.width || null, height: img.height || null },
      blurhash: img.blurhash || null,
      folderName: safeCurrentFolderName,
      filename: img.filename,
      likedByClients: img.likedByClients || [],
      tags: img.tags || [],
      width: img.width || null,
      height: img.height || null,
    }));

    const hasMoreInFolder = fetchAll ? false : skip + normalizedImages.length < totalInFolder;

    // Page 1 (no folderName provided) returns full metadata + first folder images.
    // Other requests return images + folder pagination metadata.
    res.json({
      success: true,
      pinDownloadEnabled,
      images: normalizedImages,
      currentFolder: safeCurrentFolderName,
      hasMoreInFolder,
      // Frontend should switch folders when `hasMoreInFolder` is false.
      nextFolder: !hasMoreInFolder ? safeNextFolderName : null,
      folderPage: safePage,
      folderLimit: limit,
      ...(isFirstLoad
        ? {
            projectId: project._id,
            projectTitle: project.projectTitle,
            eventDate: project.startDate || null,
            studioName: (studio as any)?.name || "",
            studioLogo: (studio as any)?.logo || null,
            studioAddress: (studio as any)?.mainAddress || null,
            studioInfo: studio
              ? {
                  name: (studio as any).name,
                  logo: (studio as any).logo,
                  tagline: (studio as any).tagline,
                  mainAddress: (studio as any).mainAddress,
                  email: (studio as any).email,
                  phone: (studio as any).phone,
                  website: (studio as any).website,
                }
              : null,
            subscription: resolvedSubscription,
            folders: accessibleFolders,
            galleryPin: pinDownloadEnabled ? project.gallerySettings?.galleryPin || null : null,
            mediaLinks: project.gallerySettings?.mediaLinks || [],
            // Public gallery renders hero from the project cover image or falls back to first photo.
            coverImage: project.gallerySettings?.coverImage || null,
          }
        : {}),
    });
  } catch (error: any) {
    console.error("Error accessing shared gallery:", error);
    res.status(500).json({ message: "Failed to access gallery" });
  }
};

// ==================== TOGGLE FAVORITE ====================
// Uses likedByOwner on Images model (per image) and folderSchema (per folder)
export const toggleFavorite = async (
  req: Request<{ projectId: string }, any, ToggleFavoriteBody>,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const { itemId, type } = req.body;

    if (type === "folder") {
      const project = (await Project.findById(projectId)) as any;
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const folder = project.folders.id(itemId);
      if (!folder) {
        return res.status(404).json({ message: "Folder not found" });
      }

      const newLiked = !folder.likedByOwner;
      folder.likedByOwner = newLiked;
      await project.save();

      res.json({
        success: true,
        isFavorite: newLiked,
      });
    } else if (type === "image") {
      const image = await Images.findOne({
        _id: itemId,
        event_name: projectId,
      });
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const newLiked = !(image as any).likedByOwner;
      (image as any).likedByOwner = newLiked;
      await image.save();

      res.json({
        success: true,
        isFavorite: newLiked,
      });
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ message: "Failed to toggle favorite" });
  }
};

// ==================== MOVE IMAGE ====================
export const moveImage = async (
  req: Request<{ eventId: string; imageId: string }, any, { targetFolder: string }>,
  res: Response
) => {
  try {
    const { eventId, imageId } = req.params;
    const { targetFolder } = req.body;

    if (!targetFolder) {
      return res.status(400).json({ message: "Target folder is required" });
    }

    const image = await Images.findOne({ _id: imageId, event_name: eventId });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // If primary folder is already targetFolder, skip (no-op)
    if (image.folderName === targetFolder) {
      return res.json({
        success: true,
        message: "Image is already in this folder",
        image: {
          id: image._id,
          folderName: image.folderName,
          additionalFolders: (image as any).additionalFolders || [],
        },
      });
    }

    // Remove targetFolder from additionalFolders if present (will become new folderName)
    if ((image as any).additionalFolders?.includes(targetFolder)) {
      (image as any).additionalFolders = (image as any).additionalFolders.filter(
        (f: string) => f !== targetFolder
      );
    }

    // Update the primary folder
    image.folderName = targetFolder;
    await image.save();

    res.json({
      success: true,
      message: "Image moved successfully",
      image: {
        id: image._id,
        folderName: image.folderName,
        additionalFolders: (image as any).additionalFolders || [],
      },
    });
  } catch (error: any) {
    console.error("Error moving image:", error);
    res.status(500).json({ message: "Failed to move image" });
  }
};

// ==================== COPY IMAGE TO ADDITIONAL FOLDER ====================
export const copyImageToFolder = async (
  req: Request<
    { eventId: string; imageId: string },
    any,
    { targetFolder: string }
  >,
  res: Response
) => {
  try {
    const { eventId, imageId } = req.params;
    const { targetFolder } = req.body;

    if (!targetFolder) {
      return res.status(400).json({ message: "Target folder is required" });
    }

    const image = await Images.findOne({ _id: imageId, event_name: eventId });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    // Already in target folder (folderName or additionalFolders)
    if (
      image.folderName === targetFolder ||
      (image as any).additionalFolders?.includes(targetFolder)
    ) {
      return res.json({
        success: true,
        message: "Image is already in this folder",
        image: {
          id: image._id,
          folderName: image.folderName,
          additionalFolders: (image as any).additionalFolders || [],
        },
      });
    }

    // Add to additionalFolders if not already there
    if (!(image as any).additionalFolders) {
      (image as any).additionalFolders = [];
    }

    (image as any).additionalFolders.push(targetFolder);
    await image.save();

    res.json({
      success: true,
      message: "Image copied to folder successfully",
      image: {
        id: image._id,
        folderName: image.folderName,
        additionalFolders: (image as any).additionalFolders,
      },
    });
  } catch (error: any) {
    console.error("Error copying image:", error);
    res.status(500).json({ message: "Failed to copy image" });
  }
};

// ==================== RENAME IMAGE ====================
export const renameImage = async (
  req: Request<{ eventId: string; imageId: string }, any, RenameImageBody>,
  res: Response
) => {
  try {
    const { eventId, imageId } = req.params;
    const { newFilename } = req.body;

    if (!newFilename || !newFilename.trim()) {
      return res.status(400).json({ message: "New filename is required" });
    }

    const image = await Images.findOne({ _id: imageId, event_name: eventId });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    image.filename = newFilename.trim();
    await image.save();

    res.json({
      success: true,
      message: "Image renamed successfully",
      image: {
        id: image._id,
        filename: image.filename,
      },
    });
  } catch (error: any) {
    console.error("Error renaming image:", error);
    res.status(500).json({ message: "Failed to rename image" });
  }
};

// ==================== UPDATE IMAGE TAGS ====================
export const updateImageTags = async (
  req: Request<{ eventId: string; imageId: string }, any, { tags?: string[] }>,
  res: Response
) => {
  try {
    const { eventId, imageId } = req.params;
    let { tags } = req.body;

    if (!Array.isArray(tags)) {
      tags = [];
    }

    const cleanedTags = tags
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter((t) => t.length > 0);

    const image = await Images.findOne({ _id: imageId, event_name: eventId });
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    (image as any).tags = cleanedTags;
    await image.save();

    res.json({
      success: true,
      message: "Tags updated successfully",
      image: {
        id: image._id,
        tags: (image as any).tags,
      },
    });
  } catch (error: any) {
    console.error("Error updating image tags:", error);
    res.status(500).json({ message: "Failed to update image tags" });
  }
};

// ==================== DELETE IMAGE ====================
// Optional fromFolder (query): when provided, remove image from that folder only.
// If image is in other folders too → just remove fromFolder ref (keep doc + DO).
// If image is ONLY in fromFolder → delete doc + DO.
export const deleteImage = async (
  req: Request<{ eventId: string; imageId: string }>,
  res: Response
) => {
  try {
    const { eventId, imageId } = req.params;
    const fromFolder = req.query.fromFolder as string | undefined;

    const image = await Images.findOne({ _id: imageId, event_name: eventId });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const additionalFolders = (image as any).additionalFolders || [];
    const allFolderRefs = [image.folderName, ...additionalFolders].filter(Boolean);

    if (fromFolder && fromFolder.trim()) {
      // Remove-from-folder mode: only delete doc+DO if image is in no other folder
      const isInFromFolder =
        image.folderName === fromFolder || additionalFolders.includes(fromFolder);

      if (!isInFromFolder) {
        return res.json({
          success: true,
          message: "Image not in specified folder",
          action: "none",
        });
      }

      const otherFolders = allFolderRefs.filter((f) => f !== fromFolder);

      if (otherFolders.length > 0) {
        // Image is in other folders → just remove fromFolder ref
        if (image.folderName === fromFolder) {
          image.folderName = otherFolders[0];
          (image as any).additionalFolders = otherFolders.slice(1);
        } else {
          (image as any).additionalFolders = additionalFolders.filter(
            (f: string) => f !== fromFolder
          );
        }
        await image.save();

        return res.json({
          success: true,
          message: "Image removed from folder",
          action: "removed_from_folder",
          image: {
            id: image._id,
            folderName: image.folderName,
            additionalFolders: (image as any).additionalFolders,
          },
        });
      }

      // Image only in fromFolder → delete doc + DO
    }

    // Permanent delete: remove document and DO file
    await Images.findByIdAndDelete(image._id);
    const otherDocsWithSameUrl = await Images.countDocuments({
    _id: { $ne: image._id },
    event_name: eventId,
    image_url: image.image_url,
  });

    if (image.image_url && otherDocsWithSameUrl === 0) {
      let doUrl = image.image_url;

      const match = doUrl.match(/^https?:\/\/([^.]+)\.digitaloceanspaces\.com\/([^/]+)\/(.+)$/);
      if (match) {
        const region = match[1];
        const bucket = match[2];
        const key = match[3];
        doUrl = `https://${bucket}.${region}.digitaloceanspaces.com/${key}`;
      }
      await deleteFromDO(doUrl);
    }

    res.json({
      success: true,
      message: "Image deleted successfully",
      action: "deleted",
    });
  } catch (error: any) {
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Failed to delete image" });
  }
};

// ==================== MOVE FOLDER IMAGES ====================
export const moveFolderImages = async (
  req: Request<{ projectId: string; folderId: string }>,
  res: Response
) => {
  try {
    const { projectId, folderId } = req.params;

    const project = (await Project.findById(projectId)) as any;
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    let folder;
    if (mongoose.Types.ObjectId.isValid(folderId)) {
      folder = project.folders.id(folderId);
    } else {
      folder = project.folders.find((f: any) => f.name === folderId);
    }

    let folderPath;
    if (folder) {
      folderPath = folder.name;
    } else if (folderId.includes("/")) {
      folderPath = folderId;
    } else {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Move all images from this folder to AllPhotos
    const result = await Images.updateMany(
      { event_name: projectId, folderName: folderPath },
      { $set: { folderName: "AllPhotos" } }
    );

    res.json({
      success: true,
      message: `Moved ${result.modifiedCount} images to AllPhotos`,
      movedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error("Error moving folder images:", error);
    res.status(500).json({ message: "Failed to move folder images" });
  }
};

// ==================== DUPLICATE IMAGES ====================
export const duplicateImages = async (
  req: Request<
    { projectId: string },
    any,
    { imageIds: string[]; targetFolder: string }
  >,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const { imageIds, targetFolder } = req.body;

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({ message: "Image IDs are required" });
    }

    if (!targetFolder) {
      return res.status(400).json({ message: "Target folder is required" });
    }

    const images = await Images.find({
      _id: { $in: imageIds },
      event_name: projectId,
    });

    if (images.length === 0) {
      return res.status(404).json({ message: "No images found" });
    }

    const duplicatedImages = images.map((image) => ({
      event_name: image.event_name,
      filename: image.filename,
      image_url: image.image_url,
      folderName: targetFolder,
      content_type: image.content_type,
      height: image.height,
      width: image.width,
      low_res_url: image.low_res_url,
      thumb_res_url: image.thumb_res_url,
      refNo: image.refNo,
      embeddings: (image as any).embeddings,
      blurhash: image.blurhash,
    }));

    const insertedImages = await Images.insertMany(duplicatedImages);

    res.json({
      success: true,
      message: `Duplicated ${insertedImages.length} images to ${targetFolder}`,
      duplicatedCount: insertedImages.length,
      images: insertedImages,
    });
  } catch (error: any) {
    console.error("Error duplicating images:", error);
    res.status(500).json({ message: "Failed to duplicate images" });
  }
};

// ==================== UPDATE FOLDER COVER IMAGE ====================
export const updateFolderCoverImage = async (
  req: Request<
    { projectId: string; folderId: string },
    any,
    { coverImage: string }
  >,
  res: Response
) => {
  try {
    const { projectId, folderId } = req.params;
    const { coverImage } = req.body;

    const project = (await Project.findById(projectId)) as any;
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const folder = project.folders.id(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    folder.coverImage = coverImage;
    await project.save();

    res.json({
      success: true,
      message: "Folder cover image updated successfully",
      folder,
    });
  } catch (error: any) {
    console.error("Error updating folder cover image:", error);
    res.status(500).json({ message: "Failed to update folder cover image" });
  }
};

// ==================== UPDATE PROJECT COVER IMAGE ====================
export const updateProjectCoverImage = async (
  req: Request<{ projectId: string }, any, { coverImage: string; deviceType?: 'mobile' | 'desktop' }>,
  res: Response
) => {
  try {
    const { projectId } = req.params;
    const { coverImage, deviceType } = req.body;

    const project = (await Project.findById(projectId)) as any;
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!project.gallerySettings) {
      project.gallerySettings = {};
    }
    
    if (!project.gallerySettings.coverImage || typeof project.gallerySettings.coverImage === 'string') {
      project.gallerySettings.coverImage = {
        mobile: typeof project.gallerySettings.coverImage === 'string' ? project.gallerySettings.coverImage : null,
        desktop: typeof project.gallerySettings.coverImage === 'string' ? project.gallerySettings.coverImage : null
      };
    }

    if (deviceType === 'mobile' || deviceType === 'desktop') {
      project.gallerySettings.coverImage[deviceType] = coverImage;
    } else {
      project.gallerySettings.coverImage = { mobile: coverImage, desktop: coverImage };
    }

    await project.save();

    res.json({
      success: true,
      message: `Project cover image updated successfully ${deviceType ? `for ${deviceType}` : ''}`,
      coverImage: project.gallerySettings.coverImage,
    });
  } catch (error: any) {
    console.error("Error updating project cover image:", error);
    res.status(500).json({ message: "Failed to update project cover image" });
  }
};

// ==================== VERIFY CLIENT PASSWORD ====================
export const verifyClientPassword = async (
  req: Request<{ slug: string }, any, { password: string }>,
  res: Response
) => {
  try {
    const { slug } = req.params;
    const { password } = req.body;

    const project = (await Project.findOne({
      "gallerySettings.shareLink.slug": slug,
    }).select("gallerySettings createdBy")) as any;

    if (!project) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    const studio = await StudioModel.findOne({ createdBy: project.createdBy });
    const user = await User.findById(project.createdBy).lean();
    const pinDownloadEnabled = studio
      ? Boolean(resolveSubscriptionForRequest({ user, studio }).features.secure_gallery_pin_download)
      : false;

    if (!pinDownloadEnabled) {
      return res.status(400).json({ message: "Download PIN is not enabled for this gallery" });
    }

    const galleryPin = project.gallerySettings?.galleryPin;

    if (!galleryPin) {
      return res.status(400).json({ message: "No password set for this gallery" });
    }

    if (password !== galleryPin) {
      return res.status(401).json({ message: "Invalid password" });
    }


    const searchToken = jwt.sign(
      { id: project.studioId,refNo:studio?.refNo ||  "", role: "client_search", slug: slug },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "15m" }
    );

    const cookieOptions = getCookieOptions(15 * 60 * 1000);
    res.cookie("guest_search_token", searchToken, cookieOptions);
    res.json({
      success: true,
      message: "Password verified",
      searchToken: searchToken,
    });
  } catch (error: any) {
    console.error("Error verifying client password:", error);
    res.status(500).json({ message: "Failed to verify password" });
  }
};

// ==================== TOGGLE CLIENT FAVORITE ====================
export const toggleClientFavorite = async (
  req: Request<{ slug: string }, any, { imageId: string; email: string }>,
  res: Response
) => {
  try {
    const { slug } = req.params;
    const { imageId, email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find project by slug
    const project = (await Project.findOne({
      "gallerySettings.shareLink.slug": slug,
    }).select("_id")) as any;

    if (!project) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      return res.status(400).json({ message: "Invalid image ID" });
    }

    // Find image
    const image = await Images.findOne({
      _id: imageId,
      event_name: project._id.toString(),
    });

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const likedByClients = (image as any).likedByClients || [];

    // Toggle favorite
    const isLiked = likedByClients.includes(normalizedEmail);

    if (isLiked) {
      // Remove from favorites
      (image as any).likedByClients = likedByClients.filter(
        (e: string) => e !== normalizedEmail
      );
    } else {
      // Add to favorites
      if (!likedByClients.includes(normalizedEmail)) {
        (image as any).likedByClients = [...likedByClients, normalizedEmail];
      }
    }

    await image.save();

    res.json({
      success: true,
      isFavorite: !isLiked,
      message: isLiked ? "Removed from favorites" : "Added to favorites",
    });
  } catch (error: any) {
    console.error("Error toggling client favorite:", error);
    res.status(500).json({ message: "Failed to toggle favorite" });
  }
};

// ==================== GET CLIENT FAVORITES ====================
// ==================== GET CLIENT FAVORITES ====================
export const getClientFavorites = async (
  req: Request<{ slug: string }, any, any, { email?: string }>,
  res: Response
) => {
  try {
    const { slug } = req.params;
    const { email } = req.query;

    // Find project by slug
    const project = (await Project.findOne({
      "gallerySettings.shareLink.slug": slug,
    }).select("_id")) as any;

    if (!project) {
      return res.status(404).json({ message: "Gallery not found" });
    }

    if (email) {
      // Get favorites for specific client
      const normalizedEmail = email.trim().toLowerCase();
      const images = await Images.find({
        event_name: project._id.toString(),
        likedByClients: normalizedEmail,
      }).select("-embeddings -__v -content_type");
      const formattedImages = images.map((img: any) => ({
        ...img.toObject(),
        image_url: img.low_res_url || img.image_url, 
      }));

      res.json({
        success: true,
        email: normalizedEmail,
        images: formattedImages,
        count: formattedImages.length,
      });
    } else {
      // Get all clients with their favorites
      const allImages = await Images.find({
        event_name: project._id.toString(),
        likedByClients: { $exists: true, $ne: [] },
      }).select("_id image_url low_res_url filename likedByClients");

      // Group by client email
      const clientMap: { [key: string]: any[] } = {};

      allImages.forEach((img: any) => {
        const likedBy = img.likedByClients || [];
        likedBy.forEach((email: string) => {
          if (!clientMap[email]) {
            clientMap[email] = [];
          }
          clientMap[email].push({
            _id: img._id,
             image_url: img.low_res_url || img.image_url,
            filename: img.filename,
          });
        });
      });

      const clients = Object.keys(clientMap).map((email) => ({
        email,
        imageCount: clientMap[email].length,
        previewImages: clientMap[email].slice(0, 4), // First 4 images as preview
      }));

      res.json({
        success: true,
        clients: clients,
      });
    }
  } catch (error: any) {
    console.error("Error getting client favorites:", error);
    res.status(500).json({ message: "Failed to get client favorites" });
  }
};

export const recalculateStudioStorage = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const studio = await StudioModel.findOne({ createdBy: req.user!._id });
    if (!studio) {
      return res.status(404).json({ success: false, message: "Studio not found" });
    }

    // Find projects to process
    let projectIds: string[] = [];
    if (projectId && projectId !== 'all' && projectId !== 'studio') {
      // Single project requested
      projectIds = [projectId];
    } else {
      // All user projects
      const projects = await Project.find({ createdBy: req.user!._id }).select("_id");
      projectIds = projects.map(p => p._id.toString());
    }

    // Find all images for these projects
    const images = await Images.find({ event_name: { $in: projectIds } });

    // Collect all unique URLs from studio (portfolio, lead form images)
    const studioImagesUrls = [
      ...(studio.portfolioImages || []),
      ...(studio.headerImages || []),
      ...(studio.backgroundImages || [])
    ].filter(url => typeof url === 'string' && url.startsWith('http'));

    // Sum the file sizes.
    let totalSize = 0;
    const projectStorageMap: Record<string, number> = {};

    // Initialize map with 0 for all user projects
    for (const pid of projectIds) {
      projectStorageMap[pid] = 0;
    }

    const itemsToProcess = [
      ...images.map(img => ({ id: (img as any)._id, url: (img as any).image_url, currentSize: (img as any).fileSize || 0, isModel: true, model: img, projectId: (img as any).event_name })),
      ...studioImagesUrls.map(url => ({ id: url, url, currentSize: 0, isModel: false, projectId: 'studio' }))
    ];

    // Process items
    const updates = [];
    for (const item of itemsToProcess) {
      let size = item.currentSize;
      if (size === 0 && item.url) {
        try {
          const response = await axios.head(item.url, { timeout: 2000 });
          size = parseInt((response.headers["content-length"] as string) || "0");

          if (size > 0 && item.isModel) {
            (item as any).model.fileSize = size;
            updates.push((item as any).model.save());
          }
        } catch (err: any) {
          console.error(`Could not get size for ${item.url}:`, err.message);
        }
      }

      totalSize += size;
      if (item.projectId && item.projectId !== 'studio') {
        projectStorageMap[item.projectId] = (projectStorageMap[item.projectId] || 0) + size;
      }
    }

    // Wait for any image DB updates to finish
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Update each project's storage record
    const projectUpdates = Object.entries(projectStorageMap).map(([pid, size]) =>
      Project.updateOne({ _id: pid }, { $set: { storageUsed: size } })
    );
    if (projectUpdates.length > 0) {
      await Promise.all(projectUpdates);
    }

    // Update studio record
    studio.storageUsed = totalSize;
    // Preserve existing capacity (storage_data). 
    // Only set default if it's missing or 0.
    if (!studio.storage_data || studio.storage_data === 0) {
      studio.storage_data = 5368709120; // 5GB default
    }
    // Initialize remaining_data if missing (migration support)
    if (!(studio as any).remaining_data || (studio as any).remaining_data === undefined) {
      (studio as any).remaining_data = (studio.storage_data || 5368709120) - (studio.storageUsed || 0);
    }

    await (studio as any).save();

    res.json({
      success: true,
      message: "Storage recalculated successfully for studio and all projects",
      storageUsed: totalSize,
      storageTotal: studio.storage_data,
      storageRemaining: (studio as any).remaining_data,
      projectCount: projectIds.length,
      imageCount: images.length,
      projectBreakdown: projectStorageMap
    });
  } catch (error: any) {
    console.error("Error recalculating storage:", error);
    res.status(500).json({ success: false, message: "Failed to recalculate storage" });
  }
};

// ==================== UPDATE IMAGE SIZE ====================
export const updateImageSize = async (req: AuthRequest, res: Response) => {
  try {
    const { filename, event_name, fileSize } = req.body;

    if (!filename || !event_name || fileSize === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find the image document
    const image = await Images.findOne({ filename, event_name });
    if (!image) {
      // It might not be created yet if FastAPI is slow, but we'll try to update it anyway
      return res.status(404).json({ success: false, message: "Image record not found in DB yet" });
    }

    (image as any).fileSize = fileSize;
    await image.save();

    res.json({ success: true, message: "Image size updated" });
  } catch (error: any) {
    console.error("Error updating image size:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ==================== INCREMENT STORAGE ====================
export const incrementProjectStorage = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { bytes } = req.body;

    if (!projectId || typeof bytes !== 'number') {
      return res.status(400).json({ success: false, message: 'Invalid project ID or bytes' });
    }

    // Increment project storage
    const project = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { storageUsed: bytes } },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Increment studio storage (find studio by project owner)
    // We update storageUsed and DECREASE remaining_data
    const studio = await StudioModel.findOneAndUpdate(
      { createdBy: project.createdBy },
      {
        $inc: {
          storageUsed: bytes,
          remaining_data: -bytes
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      storageUsed: project.storageUsed,
      studioStorageUsed: studio?.storageUsed
    });

  } catch (error: any) {
    console.error('Error incrementing storage:', error);
    res.status(500).json({ success: false, message: 'Failed to increment storage' });
  }
};

// ==================== GENERATE BLURHASHES ====================
export const generateBlurhashes = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    
    // Find all images for this project that don't have a blurhash
    const images = await Images.find({ 
      event_name: projectId,
      $or: [{ blurhash: null }, { blurhash: { $exists: false } }, { blurhash: "" }]
    });

    if (images.length === 0) {
      return res.json({ success: true, message: "No missing blurhashes found." });
    }

    // We don't want to block the request, so we will generate them asynchronously
    res.json({ 
      success: true, 
      message: `Started generating blurhashes for ${images.length} images. Check back later.` 
    });

    // Process asynchronously
    for (const image of images) {
      try {
        const imageUrl = image.image_url;
        if (!imageUrl) continue;

        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');

        // Extract pixels from the image using sharp
        const { data, info } = await sharp(buffer)
          .ensureAlpha()
          .resize(32, 32, { fit: 'inside' })
          .raw()
          .toBuffer({ resolveWithObject: true });

        // Generate the blurhash
        const blurhashStr = encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
        
        // Save to document
        (image as any).blurhash = blurhashStr;
        await image.save();
        
      } catch (err) {
        console.error(`Failed to generate blurhash for image ${image._id}:`, err);
      }
    }

  } catch (error: any) {
    console.error("Error generating blurhashes:", error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Failed to initiate blurhash generation" });
    }
  }
};

// ==================== MEDIA LINKS ====================

export const addMediaLink = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, title, description, links, layout, isHero } = req.body;

    if (!type || !title || !links || !Array.isArray(links)) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!project.gallerySettings) (project as any).gallerySettings = {};
    if (!(project.gallerySettings as any).mediaLinks) (project.gallerySettings as any).mediaLinks = [];

    const newLink = {
      type,
      isHero: !!isHero,
      title,
      description: description || "",
      links,
      layout: layout && typeof layout === "object" ? layout : undefined,
      createdAt: new Date(),
    };

    (project.gallerySettings as any).mediaLinks.push(newLink);
    await project.save();

    res.status(201).json({ success: true, link: (project.gallerySettings as any).mediaLinks.slice(-1)[0] });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to add media link", error: error.message });
  }
};

export const updateMediaLink = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, linkId } = req.params;
    const { type, title, description, links, layout, isHero } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const linkIndex = (project.gallerySettings as any)?.mediaLinks?.findIndex(
      (l: any) => l._id.toString() === linkId
    );

    if (linkIndex === undefined || linkIndex === -1) {
      return res.status(404).json({ message: "Link not found" });
    }

    const link = (project.gallerySettings as any).mediaLinks[linkIndex];
    if (type) link.type = type;
    if (isHero !== undefined) link.isHero = !!isHero;
    if (title) link.title = title;
    if (description !== undefined) link.description = description;
    if (links) link.links = links;
    if (layout !== undefined) link.layout = layout;

    await project.save();
    res.json({ success: true, link });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update media link", error: error.message });
  }
};

export const deleteMediaLink = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, linkId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!(project.gallerySettings as any)?.mediaLinks) {
       return res.status(404).json({ message: "Link not found" });
    }

    (project.gallerySettings as any).mediaLinks = (project.gallerySettings as any).mediaLinks.filter(
      (l: any) => l._id.toString() !== linkId
    );

    await project.save();
    res.json({ success: true, message: "Media link deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete media link", error: error.message });
  }
};

export const getMediaLinks = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId).select("gallerySettings.mediaLinks");
    if (!project) return res.status(404).json({ message: "Project not found" });

    res.json({
      success: true,
      mediaLinks: (project.gallerySettings as any)?.mediaLinks || []
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch media links", error: error.message });
  }
};

// ==================== EXPORT FILENAMES FOR LIGHTROOM ====================
export const exportFilenames = async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    const { imageIds, clientEmail, ownerFavorites } = req.body;

    let query: any = { event_name: projectId };

    if (imageIds && Array.isArray(imageIds) && imageIds.length > 0) {
      query._id = { $in: imageIds };
    } else if (clientEmail) {
      query.likedByClients = clientEmail.trim().toLowerCase();
    } else if (ownerFavorites) {
      query.likedByOwner = true;
    } else {
      return res.status(400).json({ success: false, message: "Please provide imageIds, clientEmail, or ownerFavorites" });
    }

    const images = await Images.find(query).select("filename");
    
    if (!images || images.length === 0) {
      return res.status(404).json({ success: false, message: "No images found for the given criteria" });
    }

    const filenames = images
      .map((img: any) => img.filename)
      .filter(Boolean)
      .map((name: string) => name.split('/').pop());
    
    const resultString = filenames.join(", ");

    res.json({
      success: true,
      count: filenames.length,
      data: resultString,
      filenames: filenames
    });

  } catch (error: any) {
    console.error("Error exporting filenames:", error);
    res.status(500).json({ success: false, message: "Failed to export filenames", error: error.message });
  }
};
