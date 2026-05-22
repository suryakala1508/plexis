import express from 'express';
import multer from 'multer';
import { studioOnboard, AddRole, addCrew, getStudioInfo, tourComplete, updateStudioAndPersonalInfo, getCrewList, getAllRoles, deleteCrew, uploadStudioImage, getCrewListWithProjects, updateLeadForm, updateCrew, uploadMultipleStudioImages, selectStudioImage, deleteStudioImage, getStudioImages } from './studioController';
import { verifyInvite } from './studioController';
import { setInvitePassword } from './studioController';
import { requireFeature } from '../../core/middleware/featureGate';

const studioRouter = express.Router();

const STUDIO_MAX_UPLOAD_FILE_SIZE = 25 * 1024 * 1024;
const STUDIO_MAX_UPLOAD_FILES = 10;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const imageUploadFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageUploadFilter,
  limits: {
    fileSize: STUDIO_MAX_UPLOAD_FILE_SIZE,
    files: STUDIO_MAX_UPLOAD_FILES
  }
});

const handleStudioUploadErrors = (err: unknown, res: express.Response) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `You have uploaded more than ${Math.floor(STUDIO_MAX_UPLOAD_FILE_SIZE / (1024 * 1024))} MB. Background image must be less than ${Math.floor(STUDIO_MAX_UPLOAD_FILE_SIZE / (1024 * 1024))} MB.`,
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `You can upload up to ${STUDIO_MAX_UPLOAD_FILES} images at a time.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || 'Upload failed due to invalid file input.',
    });
  }

  if (err instanceof Error) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Failed to process upload request.',
  });
};

/**
 * @swagger
 * /studio:
 *   get:
 *     summary: Get studio information
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Studio information
 */
studioRouter.get('/', getStudioInfo);

/**
 * @swagger
 * /studio/tour-complete:
 *   put:
 *     summary: Mark tour as completed
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tour marked as completed
 */
studioRouter.put('/tour-complete', tourComplete);

/**
 * @swagger
 * /studio/onboard:
 *   post:
 *     summary: Studio onboarding
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *               portfolioImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Studio onboarded successfully
 */
studioRouter.post('/onboard', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'portfolioImages', maxCount: 10 }
]), studioOnboard);

/**
 * @swagger
 * /studio/addRole:
 *   post:
 *     summary: Add new role
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Role added successfully
 */
studioRouter.post('/addRole', requireFeature('role_based_access'), AddRole);

/**
 * @swagger
 * /studio/addCrew:
 *   post:
 *     summary: Add new crew member
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Crew member added successfully
 */
studioRouter.post('/addCrew', upload.single('photo'), addCrew);

/**
 * @swagger
 * /studio/update:
 *   post:
 *     summary: Update studio and personal information
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Studio information updated successfully
 */
studioRouter.post('/update', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'portfolioImages', maxCount: 10 },
  { name: 'brochureFiles', maxCount: 10 }
]), updateStudioAndPersonalInfo);
studioRouter.post('/updateleadform', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'portfolioImages', maxCount: 10 },
  { name: 'brochureFiles', maxCount: 10 }
]), updateLeadForm);


/**
 * @swagger
 * /studio/crew:
 *   get:
 *     summary: Get crew list
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of crew members
 */
studioRouter.get("/crew", getCrewList);
studioRouter.get("/crewWithProjects", getCrewListWithProjects);
studioRouter.get("/roles", requireFeature('role_based_access'), getAllRoles);

/**
 * @swagger
 * /studio/delete/{id}:
 *   post:
 *     summary: Delete crew member
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Crew member deleted successfully
 */
studioRouter.post("/delete/:id", deleteCrew);
// routes/studio.ts
studioRouter.put("/crew/:id", upload.single('photo'), updateCrew);
studioRouter.delete("/crew/:id", deleteCrew);

/**
 * @swagger
 * /studio/upload:
 *   post:
 *     summary: Upload studio image
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
studioRouter.post("/upload", upload.single('image'), uploadStudioImage)

// ==================== LEAD FORM IMAGE MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /studio/upload-multiple:
 *   post:
 *     summary: Upload multiple images for lead form (header or background)
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 */
studioRouter.post("/upload-multiple", (req, res, next) => {
  upload.array('images', STUDIO_MAX_UPLOAD_FILES)(req, res, (err) => {
    if (err) {
      return handleStudioUploadErrors(err, res);
    }

    next();
  });
}, uploadMultipleStudioImages);

/**
 * @swagger
 * /studio/select-image:
 *   post:
 *     summary: Select active image for header or background
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 */
studioRouter.post("/select-image", selectStudioImage);

/**
 * @swagger
 * /studio/delete-image:
 *   delete:
 *     summary: Delete image from header or background collection
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 */
studioRouter.delete("/delete-image", deleteStudioImage);

/**
 * @swagger
 * /studio/images:
 *   get:
 *     summary: Get all studio images
 *     tags: [Studio]
 *     security:
 *       - bearerAuth: []
 */
studioRouter.get("/images", getStudioImages);

/**
 * @swagger
 * /studio/verify:
 *   get:
 *     summary: Verify studio invite
 *     tags: [Studio]
 *     responses:
 *       200:
 *         description: Invite verified
 */
studioRouter.get("/verify", verifyInvite);

/**
 * @swagger
 * /studio/set-password:
 *   post:
 *     summary: Set password for invited user
 *     tags: [Studio]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password set successfully
 */
studioRouter.post("/set-password", setInvitePassword);

export default studioRouter;