import { Request, Response } from "express";
import axios, { AxiosResponse } from 'axios';
import archiver from 'archiver';
import stream from 'stream';
import { promisify } from 'util';
import jwt from "jsonwebtoken";
import { ENV } from "../../config/env";
import Images from "../../models/imagesModel";
import { Project } from "../../models/projectModel";
import { StudioModel } from "../../models/studioModel";
import { User } from "../../models/userModel";
import { resolveSubscriptionForRequest } from "../../core/services/subscriptionService";
const pipeline = promisify(stream.pipeline);

export interface SingleImageRequest {
  // For internal/logged-in flows you can still pass `imageUrl`.
  // For public/PIN-protected flows, prefer passing `imageId`.
  imageUrl?: string;
  imageId?: string;
  slug?: string;
  filename?: string;
  quality?: 'high' | 'web';
}

interface BatchImageItem {
  url?: string;
  image_url?: string;
  imageId?: string;
  filename?: string;
}

interface BatchImagesRequest {
  images: BatchImageItem[];
  slug?: string;
  quality?: 'high' | 'web';
}

const isPinDownloadEnabledForProjectOwner = async (createdBy: any): Promise<boolean> => {
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
/**
 * Download single image controller
 * POST /api/download/single
 * Body: { imageUrl: string, filename?: string }
 */
export const downloadSingleImage = async (
  req: Request<{}, {}, SingleImageRequest>,
  res: Response
): Promise<Response | void> => {
  try {
    const { imageUrl, imageId, filename, quality, slug } = req.body;

    if (!imageUrl && !imageId) {
      return res.status(400).json({ error: "Either `imageUrl` or `imageId` is required" });
    }

    const cookies = (req as any).cookies || {};
    const authToken = cookies.auth_token as string | undefined;
    const guestToken = cookies.guest_search_token as string | undefined;
    const hasPublicSlug = typeof slug === "string" && slug.trim().length > 0;

    if (!authToken && !guestToken && !hasPublicSlug) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let isPublicNoPinFlow = false;
    let publicProjectId: string | null = null;

    if (!authToken && !guestToken && hasPublicSlug) {
      const publicProject = await Project.findOne({
        "gallerySettings.shareLink.slug": slug?.trim(),
      })
        .select("_id createdBy gallerySettings.shareLink")
        .lean();

      if (!publicProject?._id) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      const shareLink = (publicProject as any).gallerySettings?.shareLink;
      if (!shareLink?.isActive) {
        return res.status(403).json({ error: "This gallery is not available" });
      }

      if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
        return res.status(410).json({ error: "This gallery link has expired" });
      }

      const pinDownloadEnabled = await isPinDownloadEnabledForProjectOwner(
        (publicProject as any).createdBy
      );

      if (pinDownloadEnabled) {
        return res.status(401).json({ error: "PIN verification required" });
      }

      isPublicNoPinFlow = true;
      publicProjectId = (publicProject as any)._id.toString();
    }

    // If a guest/PIN token is present, only allow PIN-protected downloads.
    // In that case, we require `imageId` so we can securely resolve the original server-side.
    let guestSlug: string | null = null;
    let guestProjectId: string | null = null;
    let isGuest = false;

    if (guestToken) {
      isGuest = true;
      try {
        const payload: any = jwt.verify(guestToken, ENV.JWT_SECRET);
        if (!payload || payload.role !== "client_search" || !payload.slug) {
          return res.status(403).json({ error: "Invalid PIN token" });
        }
        guestSlug = payload.slug;
        const project = await Project.findOne({
          "gallerySettings.shareLink.slug": guestSlug,
        })
          .select("_id createdBy")
          .lean();

        if (!project?._id) {
          return res.status(404).json({ error: "Gallery not found" });
        }

        guestProjectId = project._id.toString();

        const pinDownloadEnabled = await isPinDownloadEnabledForProjectOwner(
          (project as any).createdBy
        );

        if (!pinDownloadEnabled) {
          isGuest = false;
          isPublicNoPinFlow = true;
          publicProjectId = guestProjectId;
        }
      } catch (e: any) {
        return res.status(401).json({ error: "Invalid/expired PIN token" });
      }
    }

    if ((isGuest || isPublicNoPinFlow) && !imageId && imageUrl) {
      // Prevent public gallery from forcing arbitrary URL downloads.
      return res.status(403).json({ error: "PIN-protected downloads require `imageId`" });
    }

    let imageUrlToDownload: string;
    let finalFilename: string;

    if (imageId) {
      if (isGuest && !guestProjectId) {
        return res.status(403).json({ error: "Invalid PIN session" });
      }

      const imageDoc = await Images.findOne(
        isGuest && guestProjectId
          ? { _id: imageId, event_name: guestProjectId }
          : isPublicNoPinFlow && publicProjectId
            ? { _id: imageId, event_name: publicProjectId }
            : { _id: imageId }
      )
        .select("image_url filename")
        .lean();

      if (!imageDoc?.image_url) {
        return res.status(404).json({ error: "Image not found" });
      }

      imageUrlToDownload = imageDoc.image_url;
      finalFilename = filename || imageDoc.filename || "image";
    } else {
      // Logged-in flows can still provide `imageUrl`.
      imageUrlToDownload = imageUrl as string;
      finalFilename = filename || "image";
    }

    // Fetch the image from the URL
    const response: AxiosResponse<stream.Readable> = await axios({
      method: "GET",
      url: imageUrlToDownload,
      responseType: "stream",
      timeout: 30000, // 30 seconds timeout
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    // Get content type from response
    const contentType: string = (response.headers['content-type'] as string) || 'image/jpeg';

    // Determine file extension from content type
    const extension: string = contentType.split('/')[1] || 'jpg';
    const resolvedFilename: string = finalFilename.includes(".")
      ? finalFilename
      : `${finalFilename}.${extension}`;

    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${resolvedFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Pipe the image stream to response, applying sharp compression if Web-Size requested
    if (quality === 'web' && contentType.startsWith('image/')) {
        const sharp = require('sharp');
        const transformer = sharp().resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 });
        await pipeline(response.data, transformer, res);
    } else {
        await pipeline(response.data, res);
    }

  } catch (error: any) {
    console.error('Error downloading single image:', error);

    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({ error: 'Download timeout' });
    }

    return res.status(500).json({
      error: 'Failed to download image',
      message: error.message
    });
  }
};

/**
 * Batch download images as ZIP controller
 * POST /api/download/batch
 * Body: { images: Array<{ url: string, filename?: string }> }
 */
export const batchDownloadImages = async (
  req: Request<{}, {}, BatchImagesRequest>,
  res: Response
): Promise<Response | void> => {
  try {
    const { images, quality, slug } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    // Limit batch size to prevent abuse
    if (images.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 images allowed per batch' });
    }

    const cookies = (req as any).cookies || {};
    const authToken = cookies.auth_token as string | undefined;
    const guestToken = cookies.guest_search_token as string | undefined;
    const hasPublicSlug = typeof slug === "string" && slug.trim().length > 0;

    if (!authToken && !guestToken && !hasPublicSlug) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let isPublicNoPinFlow = false;
    let publicProjectId: string | null = null;

    if (!authToken && !guestToken && hasPublicSlug) {
      const publicProject = await Project.findOne({
        "gallerySettings.shareLink.slug": slug?.trim(),
      })
        .select("_id createdBy gallerySettings.shareLink")
        .lean();

      if (!publicProject?._id) {
        return res.status(404).json({ error: "Gallery not found" });
      }

      const shareLink = (publicProject as any).gallerySettings?.shareLink;
      if (!shareLink?.isActive) {
        return res.status(403).json({ error: "This gallery is not available" });
      }

      if (shareLink.expiresAt && new Date() > new Date(shareLink.expiresAt)) {
        return res.status(410).json({ error: "This gallery link has expired" });
      }

      const pinDownloadEnabled = await isPinDownloadEnabledForProjectOwner(
        (publicProject as any).createdBy
      );

      if (pinDownloadEnabled) {
        return res.status(401).json({ error: "PIN verification required" });
      }

      isPublicNoPinFlow = true;
      publicProjectId = (publicProject as any)._id.toString();
    }

    let isGuest = false;
    let guestProjectId: string | null = null;
    if (guestToken) {
      isGuest = true;
      try {
        const payload: any = jwt.verify(guestToken, ENV.JWT_SECRET);
        if (!payload || payload.role !== "client_search" || !payload.slug) {
          return res.status(403).json({ error: "Invalid PIN token" });
        }

        const project = await Project.findOne({
          "gallerySettings.shareLink.slug": payload.slug,
        })
          .select("_id createdBy")
          .lean();

        if (!project?._id) {
          return res.status(404).json({ error: "Gallery not found" });
        }
        guestProjectId = project._id.toString();

        const pinDownloadEnabled = await isPinDownloadEnabledForProjectOwner(
          (project as any).createdBy
        );

        if (!pinDownloadEnabled) {
          isGuest = false;
          isPublicNoPinFlow = true;
          publicProjectId = guestProjectId;
        }
      } catch (e: any) {
        return res.status(401).json({ error: "Invalid/expired PIN token" });
      }
    }

    // For guest downloads, disallow arbitrary URL downloads. We only allow `imageId`.
    if (isGuest || isPublicNoPinFlow) {
      const hasUrlWithoutId = images.some(
        (img: BatchImageItem) =>
          (img.url || img.image_url) && !img.imageId
      );
      if (hasUrlWithoutId) {
        return res.status(403).json({ error: "PIN-protected downloads require `imageId`" });
      }
    }

    // Pre-resolve imageIds -> original URLs (server-side, PIN-protected).
    const requestedImageIds = images
      .map((img: BatchImageItem) => img.imageId)
      .filter(Boolean) as string[];

    const uniqueImageIds = Array.from(new Set(requestedImageIds.map((id) => id.toString())));

    let resolvedById = new Map<string, { image_url: string; filename?: string }>();
    if (uniqueImageIds.length > 0) {
      const query: any = { _id: { $in: uniqueImageIds } };
      if (isGuest && guestProjectId) {
        query.event_name = guestProjectId;
      } else if (isPublicNoPinFlow && publicProjectId) {
        query.event_name = publicProjectId;
      }

      const docs = await Images.find(query)
        .select("_id image_url filename")
        .lean();

      resolvedById = new Map(
        (docs || []).map((d: any) => [
          d._id.toString(),
          { image_url: d.image_url, filename: d.filename },
        ])
      );
    }

    // Set response headers for ZIP download
    const zipFilename: string = `images-${Date.now()}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 6 } // Compression level (0-9)
    });

    // Handle archive errors
    archive.on('error', (err: Error) => {
      console.error('Archive error:', err);
      throw err;
    });

    // Pipe archive to response
    archive.pipe(res);

    // Track successful and failed downloads
    let successCount: number = 0;
    let failCount: number = 0;

    // Download and add each image to the archive
    for (let i = 0; i < images.length; i++) {
      const image: BatchImageItem = images[i];
      const resolved = image.imageId ? resolvedById.get(image.imageId.toString()) : undefined;
      const imageUrl: string | undefined = (isGuest || isPublicNoPinFlow)
        ? resolved?.image_url
        : image.url || image.image_url || resolved?.image_url;
      const resolvedFilename: string | undefined =
        image.filename || resolved?.filename;

      if (!imageUrl) {
        console.warn(`Skipping image ${i}: No URL provided`);
        failCount++;
        continue;
      }

      try {
        // Fetch image
        const response: AxiosResponse<stream.Readable> = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'stream',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
        });

        // Determine filename
        const contentType: string = (response.headers['content-type'] as string) || 'image/jpeg';
        const extension: string = contentType.split('/')[1] || 'jpg';
        const baseName = resolvedFilename || `image-${i + 1}`;
        const filename: string = baseName.includes(".")
          ? baseName
          : `${baseName}.${extension}`;

        // Add image stream to archive
        if (quality === 'web' && contentType.startsWith('image/')) {
            const sharp = require('sharp');
            const transformer = sharp().resize(1920, 1080, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 });
            archive.append(response.data.pipe(transformer), { name: filename });
        } else {
            archive.append(response.data, { name: filename });
        }
        successCount++;

      } catch (error: any) {
        console.error(`Error downloading image ${i} (${imageUrl}):`, error.message);
        failCount++;

        // Add error info file to ZIP
        archive.append(
          `Failed to download: ${error.message}`,
          { name: `error-image-${i + 1}.txt` }
        );
      }
    }

    // Add summary file to ZIP
    const summary: string =
      `Download Summary\n` +
      `Total Images: ${images.length}\n` +
      `Successful: ${successCount}\n` +
      `Failed: ${failCount}\n` +
      `Timestamp: ${new Date().toISOString()}`;

    archive.append(summary, { name: 'download-summary.txt' });

    // Finalize the archive
    await archive.finalize();

  } catch (error: any) {
    console.error('Error batch downloading images:', error);

    // If headers not sent yet, send error response
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Failed to download images',
        message: error.message
      });
    } else {
      // If streaming already started, just end the response
      res.end();
    }
  }
};