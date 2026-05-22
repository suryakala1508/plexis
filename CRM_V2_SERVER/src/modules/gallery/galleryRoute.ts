import express from 'express';
import { Verify } from '../../core/middleware';
import {
  getAllImages,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  sendShareEmail,
  toggleFavorite,
  moveImage,
  deleteImage,
  moveFolderImages,
  duplicateImages,
  updateFolderCoverImage,
  updateProjectCoverImage,
  copyImageToFolder,
  renameImage,
  getShareLink,
  updateShareLink,
  updateFolderVisibility,
  accessSharedGallery,
  verifyClientPassword,
  toggleClientFavorite,
  getClientFavorites,
  recalculateStudioStorage,
  updateImageSize,
  incrementProjectStorage,
  generateBlurhashes,
  updateImageTags,
  addMediaLink,
  updateMediaLink,
  deleteMediaLink,
  getMediaLinks,
  exportFilenames,
} from './galleryController';


const galleryRouter = express.Router();

// Storage management - MUST BE ABOVE PARAMETERIZED ROUTES
galleryRouter.post('/:projectId/storage/recalculate', Verify, recalculateStudioStorage);
galleryRouter.post('/:projectId/storage/increment', Verify, incrementProjectStorage);
galleryRouter.post('/images/update-size', Verify, updateImageSize);
galleryRouter.post('/:projectId/generate-blurhashes', Verify, generateBlurhashes);

/**
 * @swagger
 * /gallery/{event_id}:
 *   get:
 *     summary: Get all images for an event
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: folder
 *         schema:
 *           type: string
 *         description: Filter by folder name
 *     responses:
 *       200:
 *         description: List of event images
 */
galleryRouter.get('/:event_id', getAllImages);

/**
 * @swagger
 * /gallery/{projectId}/folders:
 *   get:
 *     summary: Get all folders for a project
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of folders
 */
galleryRouter.get('/:projectId/folders', getFolders);

/**
 * @swagger
 * /gallery/{projectId}/folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               accessType:
 *                 type: string
 *                 enum: [private, public, password]
 *               password:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Folder created successfully
 */
galleryRouter.post('/:projectId/folders', createFolder);

/**
 * @swagger
 * /gallery/{projectId}/folders/{folderId}:
 *   put:
 *     summary: Update folder settings
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Folder updated successfully
 */
galleryRouter.put('/:projectId/folders/:folderId', updateFolder);

/**
 * @swagger
 * /gallery/{projectId}/folders/{folderId}:
 *   delete:
 *     summary: Delete a folder
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder deleted successfully
 */
galleryRouter.delete('/:projectId/folders/:folderId', deleteFolder);

/**
 * @swagger
 * /gallery/{projectId}/share:
 *   post:
 *     summary: Generate shareable link for gallery
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresInDays:
 *                 type: number
 *               maxAccessCount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Shareable link generated
 */
// galleryRouter.post('/:projectId/share', generateShareableLink);

/**
 * @swagger
 * /gallery/{projectId}/share-email:
 *   post:
 *     summary: Send share email to recipient
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *               folderId:
 *                 type: string
 *               expiresInDays:
 *                 type: number
 *               permissions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Share email sent successfully
 */
galleryRouter.post('/:projectId/share-email', sendShareEmail);

/**
 * @swagger
 * /gallery/{projectId}/verify:
 *   post:
 *     summary: Verify PIN for gallery access
 *     tags: [Gallery]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pin:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access granted
 */
// galleryRouter.post('/:projectId/verify', verifyGalleryAccess);

/**
 * @swagger
 * /gallery/{projectId}/favorite:
 *   post:
 *     summary: Toggle favorite image
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Favorite toggled
 */
galleryRouter.post('/:projectId/favorite', toggleFavorite);

/**
 * @swagger
 * /gallery/{eventId}/images/{imageId}/move:
 *   post:
 *     summary: Move image to different folder
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetFolder:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image moved successfully
 */
galleryRouter.post('/:eventId/images/:imageId/move', moveImage);

/**
 * @swagger
 * /gallery/{eventId}/images/{imageId}:
 *   delete:
 *     summary: Delete image permanently
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 */
galleryRouter.delete('/:eventId/images/:imageId', deleteImage);

/**
 * @swagger
 * /gallery/{projectId}/folders/{folderId}/move-images:
 *   post:
 *     summary: Move all images from folder to AllPhotos
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Images moved successfully
 */
galleryRouter.post('/:projectId/folders/:folderId/move-images', moveFolderImages);

/**
 * @swagger
 * /gallery/{projectId}/images/duplicate:
 *   post:
 *     summary: Duplicate images to a different folder
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               targetFolder:
 *                 type: string
 *     responses:
 *       200:
 *         description: Images duplicated successfully
 */
galleryRouter.post('/:projectId/images/duplicate', duplicateImages);

galleryRouter.post("/:projectId/folders/:folderId/cover", updateFolderCoverImage);
galleryRouter.post("/:eventId/images/:imageId/copy", copyImageToFolder);
galleryRouter.put("/:eventId/images/:imageId/rename", renameImage);
galleryRouter.put("/:eventId/images/:imageId/tags", updateImageTags);

galleryRouter.get('/:projectId/share-link', getShareLink);

galleryRouter.put('/:projectId/share-link', updateShareLink);
galleryRouter.put('/:projectId/folders/:folderId/visibility', updateFolderVisibility);
galleryRouter.post('/:projectId/share-email', sendShareEmail);
galleryRouter.put('/:projectId/cover-image', Verify, updateProjectCoverImage);
galleryRouter.get('/public/:slug', accessSharedGallery);

// Media Links
galleryRouter.post('/:projectId/links', Verify, addMediaLink);
galleryRouter.put('/:projectId/links/:linkId', Verify, updateMediaLink);
galleryRouter.delete('/:projectId/links/:linkId', Verify, deleteMediaLink);
galleryRouter.get('/:projectId/links', Verify, getMediaLinks);

// Lightroom Export
galleryRouter.post('/:projectId/export-filenames', Verify, exportFilenames);

// Client routes (public, no auth required)
galleryRouter.post('/public/:slug/verify-password', verifyClientPassword);
galleryRouter.post('/public/:slug/client-favorite', toggleClientFavorite);
galleryRouter.get('/public/:slug/client-favorites', getClientFavorites);

// End of routes

export default galleryRouter;
