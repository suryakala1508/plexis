import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SiAdobelightroom } from "react-icons/si";
import {
  Image as ImageIcon,
  FolderPlus,
  Upload,
  Share2,
  Folder,
  Loader2,
  X,
  MoreVertical,
  Eye,
  ExternalLink,
  Mail,
  Link,
  Download,
  Copy,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  Star,
  Heart,
  Check,
  Camera,
} from "lucide-react";
import { Success } from '../../../../Components/Success'
import { Error } from '../../../../Components/Error'
import { DeviceCoverImageModal } from "../../../../Components/DeviceCoverImageModal";
import { Skeleton } from '../../../../Components/Skeleton'
import GalleryShareModal from "./GalleryShareModal";

// Adjust these import paths based on your actual file structure
import PhotoUploadModal from "./PhotoUploadModal";

import ImageViewerModal from "./ImageViewerModal";
import ContextMenu from "@/Components/ContextMenu";
import { ProgressiveImage } from "./ProgressiveImage";
import {
  getFullFolderPath,
  getFolderPathWithProjectId,
  createFolder as createFolderAPI,
  getEventImages,
  getFolders,
  uploadImages,
  moveImageToFolder,
  deleteImagePermanently,
  moveFolderImagesToAllPhotos,
  deleteFolder,
  updateFolder,
  generateShareableLink,
  sendShareEmail,
  duplicateImagesToFolder,
  downloadImagesAsZip,
  downloadSingleImage,
  toggleFavorite,
  getCleanFolderName,
  updateProjectCoverImage,
  exportFilenamesToLightroom,
} from "../../../../services/galleryService";
import { getProjectById } from "../../../../services/projectService";
import { PermissionGate } from "@/Pages/utils/permissions";

export const ProjectGallery = ({ projectId, projectTitle }) => {
  // --- STATE MANAGEMENT ---
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const allImagesRef = useRef([]);

  const [loadingImages, setLoadingImages] = useState(false);
  const [hasMoreImages, setHasMoreImages] = useState(false);
  const [imagePage, setImagePage] = useState(1);
  const observerTarget = useRef(null);

  // Modal States
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderSelectModal, setShowFolderSelectModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFolderDeleteConfirm, setShowFolderDeleteConfirm] = useState(false);

  // Data / Processing States
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [draggedImage, setDraggedImage] = useState(null);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);
  const [showGalleryShareModal, setShowGalleryShareModal] = useState(false);

  // New states for select mode and folder operations
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const navigate = useNavigate();
  const [showFullScreenGallery, setShowFullScreenGallery] = useState(false);
  const [showEditFolder, setShowEditFolder] = useState(false);
  const [showEmptyFolderPrompt, setShowEmptyFolderPrompt] = useState(false);
  const [emptyFolderToDelete, setEmptyFolderToDelete] = useState(null);
  const [shareOptions, setShareOptions] = useState({
    allowView: true,
    allowEdit: false,
    expiresInDays: 30,
    email: "",
    message: "",
  });
  const [isCopyOperation, setIsCopyOperation] = useState(false);
  const [showDeviceCoverModal, setShowDeviceCoverModal] = useState(false);
  const [imageForCover, setImageForCover] = useState(null);

  // Favorites: derived from likedByOwner on folders/images (no separate state)

  const handleImageClick = (image, index) => {
    if (!isSelectMode) {
      setImageViewerIndex(index);
      setShowImageViewer(true);
    }
  };

  // Folder Creation Form State
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [folderAccessType, setFolderAccessType] = useState("private");
  const [folderPassword, setFolderPassword] = useState("");
  const [folderSettings, setFolderSettings] = useState({
    allowDownload: true,
    allowShare: true,
    watermarkEnabled: false,
  });

  // --- EFFECTS ---

  useEffect(() => {
    if (projectId) {
      fetchImages();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedFolder) {
      setImages([]);
      setImagePage(1);
      setHasMoreImages(false);
      loadFolderImages(selectedFolder, 1, true);
    } else {
      setImages([]);
    }
  }, [selectedFolder]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreImages && !loadingImages) {
          const nextPage = imagePage + 1;
          setImagePage(nextPage);
          loadFolderImages(selectedFolder, nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMoreImages, loadingImages, imagePage, selectedFolder]);

  // --- API FUNCTIONS ---

  const loadFolderImages = async (folder, page, replace = false) => {
    if (!folder) return;
    setLoadingImages(true);
    try {
      const response = await getEventImages(projectId, folder.fullPath, page, 50);
      if (page === 1 || replace) {
        setImages(response.images || []);
      } else {
        setImages(prev => {
          const existingIds = new Set(prev.map(img => img._id || img.id));
          const newImages = (response.images || []).filter(img => !existingIds.has(img._id || img.id));
          return [...prev, ...newImages];
        });
      }
      setHasMoreImages(response.hasMore);
    } catch (error) {
      console.error("Error loading folder images:", error);
      toast.error("Failed to load images");
    } finally {
      setLoadingImages(false);
    }
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // Get stored folders
      const folderData = await getFolders(projectId);

      // Helper to normalize folder path for comparison
      const normalizeFolderPath = (path) => {
        if (!path || path === "AllPhotos") return "AllPhotos";
        // If path already has projectId, use as is; otherwise add it
        if (path.includes("/")) {
          return path;
        }
        return `${projectId}/${path}`;
      };

      // Create allFolders object FIRST
      const allFolders = {};

      // Add stored folders - normalize their paths to match image folderNames
      folderData.forEach((f) => {
        const cleanName = getCleanFolderName(f.name);
        const normalizedPath = normalizeFolderPath(f.name);

        allFolders[normalizedPath] = {
          id: f._id,
          name: cleanName,
          fullPath: normalizedPath,
          imageCount: f.imageCount || 0, // Got from folder API!
          coverImage: f.coverImage || null, // Got from folder API!
          description: f.description || "",
          accessType: f.accessType,
          settings: f.settings,
          likedByOwner: f.likedByOwner ?? false,
        };
      });

      setFolders(Object.values(allFolders));

      // Reload current folder images if any
      if (selectedFolder) {
        setImagePage(1);
        await loadFolderImages(selectedFolder, 1, true);
      }
    } catch (error) {
      console.error("Error in fetchImages:", error);

      // *** AUTH CHECK ADDED HERE ***
      if (error.response && error.response.status === 401) {
        setErrorMessage("Session expired. Please login again.");
        // Clear local storage to prevent loops

        // Redirect to login
        window.location.href = "/login";
        return;
      }

      setErrorMessage(`Failed to load gallery: ${error.message}`);
      setErrorMessage("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setErrorMessage("Folder name is required");
      return;
    }

    if (folderAccessType === "password" && !folderPassword.trim()) {
      setErrorMessage("Password is required for password-protected folders");
      return;
    }

    try {
      setErrorMessage(null);

      // Create full path for storage - use projectId/folderName format to match FastAPI server
      const folderNameForUpload = getFullFolderPath(
        projectTitle,
        newFolderName.trim()
      );
      const fullPathForStorage = getFolderPathWithProjectId(
        projectId,
        folderNameForUpload
      );

      // Send to backend API - store with projectId prefix to match image folderNames
      const response = await createFolderAPI(projectId, {
        name: fullPathForStorage,
        description: newFolderDescription.trim(),
        accessType: folderAccessType,
        password: folderAccessType === "password" ? folderPassword : undefined,
        settings: folderSettings,
      });


      // Add the new folder to local state (optimistic update or re-fetch)
      const newFolder = {
        id: response.folder?._id || fullPathForStorage,
        name: newFolderName.trim(),
        fullPath: fullPathForStorage,
        description: newFolderDescription.trim(),
        accessType: folderAccessType,
        settings: folderSettings,
        imageCount: 0,
      };

      setFolders([...folders, newFolder]);
      console.log("just checking", folders);

      // Reset form
      setNewFolderName("");
      setNewFolderDescription("");
      setFolderAccessType("private");
      setFolderPassword("");
      setFolderSettings({
        allowDownload: true,
        allowShare: true,
        watermarkEnabled: false,
      });
      setShowCreateFolder(false);

      setSuccessMessage(`Folder "${newFolder.name}" created successfully!`);
    } catch (error) {
      console.error("Error creating folder:", error);

      // *** AUTH CHECK ADDED HERE ***
      if (error.response && error.response.status === 401) {
        setErrorMessage("Session expired. Please login again.");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      setErrorMessage(`Failed to create folder: ${error.message}`);
    }
  };

  // --- DRAG AND DROP HANDLERS ---

  const handleImageDragStart = (e, image) => {
    setDraggedImage(image);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleImageDragEnd = (e) => {
    if (draggedImage && e.dataTransfer.dropEffect === "none") {
      setShowFolderSelectModal(true);
    }
    // Ensure copy is false for drag operations unless we add Ctrl key support later
    setIsCopyOperation(false);
  };

  const handleFolderDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFolderDrop = async (e, targetFolder) => {
    e.preventDefault();

    if (!draggedImage) return;

    try {
      setErrorMessage(null);
      const targetFolderPath = targetFolder?.fullPath || "AllPhotos";

      if (draggedImage.folderName === targetFolderPath) {
        setErrorMessage("Image is already in this folder");
        setDraggedImage(null);
        return;
      }

      await moveImageToFolder(projectId, draggedImage._id, targetFolderPath);

      setSuccessMessage(`Image moved to ${targetFolder?.name || "All Photos"}`);
      await fetchImages();
    } catch (error) {
      if (error.response && error.response.status === 401) return; // fetchImages will handle redirect
      setErrorMessage(`Failed to move image: ${error.message}`);
    } finally {
      setDraggedImage(null);
    }
  };

  const handleMoveSelectedToFolder = async (targetFolder) => {
    if (selectedImages.length === 0 && !draggedImage) return;

    try {
      setErrorMessage(null);
      const targetFolderPath = targetFolder?.fullPath || "AllPhotos";
      const imagesToMove =
        selectedImages.length > 0 ? selectedImages : [draggedImage._id];

      // Track source folders for empty check
      const sourceFolders = new Set();
      imagesToMove.forEach((imageId) => {
        const image = images.find((img) => img._id === imageId);
        if (
          image &&
          image.folderName !== "AllPhotos" &&
          image.folderName !== targetFolderPath
        ) {
          sourceFolders.add(image.folderName);
        }
      });

      for (const imageId of imagesToMove) {
        if (isCopyOperation) {
          await duplicateImagesToFolder(projectId, [imageId], targetFolderPath);
        } else {
          await moveImageToFolder(projectId, imageId, targetFolderPath);
        }
      }

      setSuccessMessage(
        `${isCopyOperation ? "Copied" : "Moved"} ${imagesToMove.length} image${imagesToMove.length > 1 ? "s" : ""
        } to ${targetFolder?.name || "All Photos"}`
      );
      setShowFolderSelectModal(false);
      setDraggedImage(null);
      setSelectedImages([]);
      setIsCopyOperation(false); // Reset
      await fetchImages();

      // Check if any source folders are now empty
      for (const folderPath of sourceFolders) {
        if (checkEmptyFolder(folderPath)) {
          const emptyFolder = folders.find((f) => f.fullPath === folderPath);
          if (emptyFolder) {
            promptDeleteEmptyFolder(emptyFolder);
            break; // Only prompt for one at a time
          }
        }
      }
    } catch (error) {
      if (error.response && error.response.status === 401) return;
      setErrorMessage(
        `Failed to move image${selectedImages.length > 1 ? "s" : ""}: ${error.message
        }`
      );
    }
  };

  // --- DELETE HANDLERS ---

  const handleDeleteImageClick = (image) => {
    setImageToDelete(image);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      setErrorMessage(null);
      const fromFolder = selectedFolder?.fullPath;
      await deleteImagePermanently(projectId, imageToDelete._id, fromFolder);

      setSuccessMessage(
        fromFolder ? "Image removed from folder" : "Image deleted permanently"
      );
      setShowDeleteConfirm(false);
      setImageToDelete(null);
      await fetchImages();
    } catch (error) {
      if (error.response && error.response.status === 401) return;
      setErrorMessage(`Failed to delete image: ${error.message}`);
    }
  };

  const handleDeleteFolderClick = (folder) => {
    setFolderToDelete(folder);
    setShowFolderDeleteConfirm(true);
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      setErrorMessage(null);

      await deleteFolder(projectId, folderToDelete.id);

      setSuccessMessage(`Folder "${folderToDelete.name}" deleted successfully`);
      setShowFolderDeleteConfirm(false);
      setFolderToDelete(null);
      await fetchImages();
    } catch (error) {
      if (error.response && error.response.status === 401) return;
      setErrorMessage(`Failed to delete folder: ${error.message}`);
    }
  };

  const handleShare = async () => {
    // Top-level "Share Gallery" should let the user pick which folders to share,
    // so we clear any folder-specific context and always start in gallery (multi-folder) mode.
    setShowGalleryShareModal(true);
  };

  const handlePreviewAlbum = () => {
    window.open(`/project/${projectId}/gallery`, '_blank');
  };

  const handleDownloadAlbum = async (folder) => {
    try {
      setSuccessMessage("Fetching folder images for download...");
      const folderImages = await getEventImages(projectId, folder.fullPath);

      if (!folderImages || folderImages.length === 0) {
        setErrorMessage("No images in this folder");
        return;
      }

      // Use batch download API
      const imageIds = folderImages.map((img) => img._id || img.id);
      await downloadImagesAsZip(imageIds, folderImages);
      setSuccessMessage(`Downloading ${folderImages.length} images...`);
    } catch (error) {
      console.error("Error downloading album:", error);
      setErrorMessage("Failed to download images");
    }
  };

  const handleDownloadLightroomFolder = async (folder) => {
    try {
      setSuccessMessage("Exporting Lightroom .txt file...");
      const folderImages = await getEventImages(projectId, folder.fullPath);

      if (!folderImages || folderImages.length === 0) {
        setErrorMessage("No images in this folder");
        return;
      }
      const imageIdsArray = folderImages.map((img) => img._id || img.id);

      const res = await exportFilenamesToLightroom(projectId, imageIdsArray);

      if (res && res.success && res.data) {
        const blob = new Blob([res.data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${folder.name}-lightroom.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccessMessage("Lightroom .txt downloaded successfully");
      } else {
        setErrorMessage("Failed to export Lightroom filenames");
      }
    } catch (error) {
      console.error("Error downloading Lightroom .txt:", error);
      setErrorMessage("Failed to download Lightroom .txt");
    }
  };

  const handleToggleFavoriteFolder = async (folder, e) => {
    e.stopPropagation();
    try {
      const folderId = folder.id || folder._id;
      const response = await toggleFavorite(projectId, folderId, "folder");
      setFolders((prev) =>
        prev.map((f) =>
          (f.id || f._id)?.toString() === folderId?.toString()
            ? { ...f, likedByOwner: response.isFavorite }
            : f
        )
      );
      // if (response.isFavorite) setSuccessMessage("Folder added to favorites");
      // else setSuccessMessage("Folder removed from favorites");
    } catch (error) {
      console.error("Error toggling favorite folder:", error);
      setErrorMessage("Failed to update favorite");
    }
  };

  const handleToggleFavoriteImage = async (image, e) => {
    e.stopPropagation();
    try {
      const imageId = image._id;
      const response = await toggleFavorite(projectId, imageId, "image");
      setImages((prev) =>
        prev.map((img) =>
          (img._id || img.id)?.toString() === (imageId || image.id)?.toString()
            ? { ...img, likedByOwner: response.isFavorite }
            : img
        )
      );
      // if (response.isFavorite) setSuccessMessage("Image added to favorites");
      // else setSuccessMessage("Image removed from favorites");
    } catch (error) {
      console.error("Error toggling favorite image:", error);
      setErrorMessage("Failed to update favorite");
    }
  };

  const handleDownloadSingleImage = async (image, e) => {
    if (e) e.stopPropagation(); // Check if event exists
    try {
      await downloadSingleImage(
        projectId,
        image.image_url || image.url,
        image.filename
      );
      setSuccessMessage("Download started");
    } catch (error) {
      console.error("Error downloading image:", error);
      setErrorMessage("Failed to download image");
    }
  };

  const handleDuplicateAlbum = async (folder) => {
    try {
      // Generate duplicate name with (1), (2) etc.
      const baseName = folder.name;
      let duplicateName = baseName;
      let counter = 1;

      // Find existing folder names to avoid conflicts
      const existingNames = folders.map((f) => f.name);
      while (existingNames.includes(duplicateName)) {
        duplicateName = `${baseName}(${counter})`;
        counter++;
      }

      const folderNameForUpload = getFullFolderPath(
        projectTitle,
        duplicateName
      );
      const fullPath = getFolderPathWithProjectId(
        projectId,
        folderNameForUpload
      );

      // Create new folder
      const response = await createFolderAPI(projectId, {
        name: fullPath,
        description: folder.description,
        accessType: folder.accessType,
        settings: folder.settings,
      });

      // Duplicate images to new folder
      const folderImages = await getEventImages(projectId, folder.fullPath);
      if (folderImages && folderImages.length > 0) {
        await duplicateImagesToFolder(
          projectId,
          folderImages.map((img) => img._id || img.id),
          fullPath
        );
      }

      setSuccessMessage(
        `Folder "${duplicateName}" created with ${folderImages.length} images`
      );
      await fetchImages();
    } catch (error) {
      setErrorMessage("Failed to duplicate folder");
    }
  };





  const checkEmptyFolder = (folderPath) => {
    const remainingImages = images.filter(
      (img) => img.folderName === folderPath
    );
    return remainingImages.length === 0;
  };

  const promptDeleteEmptyFolder = (folder) => {
    setEmptyFolderToDelete(folder);
    setShowEmptyFolderPrompt(true);
  };

  const handleConfirmDeleteEmptyFolder = async () => {
    if (!emptyFolderToDelete) return;

    try {
      await deleteFolder(projectId, emptyFolderToDelete.id);
      setSuccessMessage(`Empty folder "${emptyFolderToDelete.name}" deleted`);
      setShowEmptyFolderPrompt(false);
      setEmptyFolderToDelete(null);
      await fetchImages();
    } catch (error) {
      setErrorMessage("Failed to delete empty folder");
    }
  };
  const handleSetAsHero = async (image) => {
    // Show device selection modal instead of immediately validating
    setImageForCover(image);
    setShowDeviceCoverModal(true);
  };

  const handleDeviceCoverSelected = async (deviceType) => {
    if (!imageForCover) return;
    
    try {
      const imageUrl = imageForCover.image_url || imageForCover.url;
      if (!imageUrl) {
        setErrorMessage("Invalid image URL");
        return;
      }

      // Call API to update cover image for specific device
      await updateProjectCoverImage(projectId, imageUrl, deviceType);
      setSuccessMessage(`Set as ${deviceType === 'mobile' ? 'Mobile' : 'Desktop'} hero image successfully!`);
      setShowDeviceCoverModal(false);
      setImageForCover(null);
      
      // Refresh data if needed
      await fetchImages();
    } catch (error) {
      console.error("Error setting hero image:", error);
      setErrorMessage("Failed to set hero image");
    }
  };

  // --- RENDER HELPERS ---

  const folderImages = selectedFolder
    ? images.filter((img) => img.folderName === selectedFolder.fullPath)
    : images;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Folders Grid Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-20" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-2.5">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gallery</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePreviewAlbum}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <ExternalLink size={16} />
            Edit Gallery
          </button>
          <PermissionGate page="4" component="4_2" action="edit">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <Share2 size={16} />
              Share Gallery
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <FolderPlus size={16} />
              Create Folder
            </button>
            {folders.length > 0 && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors text-sm"
              >
                <Upload size={16} />
                Upload Photos
              </button>
            )}
          </PermissionGate>
        </div>
      </div>

      {!loading && folders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
            <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-full">
              <Folder size={64} className="text-primary-dark" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            No Folders Yet
          </h3>
          <p className="text-gray-600 text-center max-w-md mb-6">
            Create your first folder to organize your photos and start building
            your gallery collection.
          </p>

          <PermissionGate page="4" component="4_2" action="edit">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <FolderPlus size={20} />
              Create Your First Folder
            </button>
          </PermissionGate>

          <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Easy to organize</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Share with clients</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span>Secure storage</span>
            </div>
          </div>
        </div>
      )}
      {/* Folders Grid - Compact Design */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900">Folders</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="relative group bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-300 hover:border-primary-dark cursor-pointer"
                onClick={() => setSelectedFolder(folder)}
              >
                {/* Cover Image - Reduced Height */}
                <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 relative rounded-t-lg overflow-hidden">

                  {folder.imageCount > 0 ? (
                    (() => {
                      const folderImgs = images.filter((img) => {
                        const imgFolder = img.folderName || "AllPhotos";
                        const normalizedImgFolder = imgFolder.includes("/")
                          ? imgFolder
                          : `${projectId}/${imgFolder}`;
                        return normalizedImgFolder === folder.fullPath;
                      });
                      const coverImageUrl =
                        folder.coverImage ||
                        (folderImgs[0]
                          ? folderImgs[0].image_url || folderImgs[0].url
                          : null);
                      return coverImageUrl ? (
                        <img
                          src={coverImageUrl}
                          alt={folder.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Folder size={32} className="text-gray-300" />
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Folder size={32} className="text-gray-300" />
                    </div>
                  )}

                  {/* Overlay with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <PermissionGate page="4" component="4_2" action="edit">
                    {/* Three Dots Menu - Top Right */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === folder.id ? null : folder.id);
                        }}
                        className="p-1 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                      >
                        <MoreVertical size={18} className="text-gray-700" />
                      </button>
                    </div>

                    {/* Favorite Icon - Top Left */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => handleToggleFavoriteFolder(folder, e)}
                        className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                      >
                        <Heart
                          size={16}
                          className={`transition-colors ${folder.likedByOwner
                            ? "text-red-500 fill-red-500"
                            : "text-gray-600 hover:text-red-500 hover:fill-red-500"
                            }`}
                        />
                      </button>
                    </div>
                  </PermissionGate>
                </div>

                <PermissionGate page="4" component="4_2" action="edit">
                  {/* Context Menu - Outside image div to avoid clipping */}
                  <ContextMenu
                    open={openMenu === folder.id}
                    onClose={() => setOpenMenu(null)}
                    position="top-right"
                    items={[
                      {
                        icon: <Download size={16} />,
                        label: "Download album",
                        onClick: () => handleDownloadAlbum(folder),
                      },
                      { divider: true },
                      {
                        icon: <Copy size={16} />,
                        label: "Duplicate album",
                        onClick: () => handleDuplicateAlbum(folder),
                      },
                      { divider: true },
                      {
                        icon: <SiAdobelightroom size={16} />,
                        label: "Download LR .txt",
                        onClick: () => handleDownloadLightroomFolder(folder),
                      },
                    ]}
                  />
                </PermissionGate>

                {/* Folder Info - Reduced Padding */}
                <div className="p-2.5 bg-white rounded-b-lg">
                  <h4 className="font-semibold text-gray-900 truncate text-sm leading-tight">
                    {folder.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {folder.imageCount} photo
                    {folder.imageCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Images Grid - With Select Mode */}
      {selectedFolder && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-semibold text-gray-900">
              Photos in {selectedFolder.name}
            </h4>
            <div className="flex gap-2">
              <PermissionGate page="4" component="4_2" action="edit">
                {isSelectMode && selectedImages.length > 0 && (
                  <>
                    <button
                      onClick={async () => {
                        try {
                          // Ensure selectedImages is an array
                          const imageIdsArray = Array.isArray(selectedImages)
                            ? selectedImages
                            : [selectedImages];
                          await downloadImagesAsZip(imageIdsArray, folderImages);
                          toast.success(
                            `Downloading ${imageIdsArray.length} images...`
                          );
                        } catch (error) {
                          console.error("Error downloading images:", error);
                          toast.error("Failed to download images");
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary-dark text-white rounded-lg  text-sm"
                    >
                      <Download size={14} />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setIsCopyOperation(false);
                        setShowFolderSelectModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500 text-white rounded-lg  text-sm"
                    >
                      Move
                    </button>
                    <button
                      onClick={() => {
                        setIsCopyOperation(true);
                        setShowFolderSelectModal(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg  text-sm"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const imageIdsArray = Array.isArray(selectedImages)
                            ? selectedImages
                            : [selectedImages];
                          const res = await exportFilenamesToLightroom(projectId, imageIdsArray);
                          if (res && res.success && res.data) {
                            await navigator.clipboard.writeText(res.data);
                            toast.success("Filenames copied to clipboard for Lightroom!");
                          } else {
                            toast.error("Failed to copy filenames");
                          }
                        } catch (error) {
                          console.error("Error exporting to Lightroom:", error);
                          toast.error("Failed to export to Lightroom");
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm transition-colors hover:bg-indigo-700"
                    >
                      <SiAdobelightroom size={14} />
                      Download LR .txt
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    if (isSelectMode) setSelectedImages([]);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${isSelectMode
                    ? "bg-primary-dark text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {isSelectMode ? (
                    <CheckSquare size={14} />
                  ) : (
                    <Square size={14} />
                  )}
                  {isSelectMode ? "Cancel" : "Select"}
                </button>
              </PermissionGate>
              <button
                onClick={() => setSelectedFolder(null)}
                className="text-sm text-primary-dark hover:text-primary font-medium"
              >
                Back to Folders
              </button>
            </div>
          </div>

          {images.length === 0 && !loadingImages ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No photos in this folder yet.</p>
              {folders.length > 0 && (
                <PermissionGate page="4" component="4_2" action="edit">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-4 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors text-sm"
                  >
                    Upload Photos
                  </button>
                </PermissionGate>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {images.map((image, index) => (
                <div
                  key={image._id}
                  className="relative group aspect-square cursor-pointer bg-gray-100 rounded-lg overflow-hidden"
                  onClick={() => {
                    if (isSelectMode) {
                      if (selectedImages.includes(image._id)) {
                        setSelectedImages(
                          selectedImages.filter((id) => id !== image._id)
                        );
                      } else {
                        setSelectedImages([...selectedImages, image._id]);
                      }
                    } else {
                      handleImageClick(image, index);
                    }
                  }}
                >
                  <ProgressiveImage
                    thumbSrc={image.thumb_res_url}
                    lowResSrc={image.low_res_url}
                    originalSrc={image.image_url || image.url}
                    alt={image.filename || image.name}
                    blurhash={image.blurhash}
                  />

                  {/* Select Mode Checkbox */}
                  {isSelectMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedImages.includes(image._id)
                          ? "bg-primary-dark border-blue-600"
                          : "bg-white/90 border-white"
                          }`}
                      >
                        {selectedImages.includes(image._id) && (
                          <Check size={14} className="text-white" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Three Dots Menu - Top Right */}
                  <PermissionGate page="4" component="4_2" action="edit">
                    {!isSelectMode && (
                      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(
                              openMenu === image._id ? null : image._id
                            );
                          }}
                          className="p-1 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                        >
                          <MoreVertical size={18} className="text-gray-700" />
                        </button>
                      </div>
                    )}

                    {/* Favorite Icon - Bottom Right */}
                    {!isSelectMode && (
                      <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => handleToggleFavoriteImage(image, e)}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-lg"
                        >
                          <Heart
                            size={14}
                            className={`transition-colors ${image.likedByOwner
                              ? "text-red-500 fill-red-500"
                              : "text-gray-600 hover:text-red-500 hover:fill-red-500"
                              }`}
                          />
                        </button>
                      </div>
                    )}

                    {/* Context Menu for Images */}
                    <ContextMenu
                      open={openMenu === image._id}
                      onClose={() => setOpenMenu(null)}
                      position="top-right"
                      items={[
                        {
                          icon: <ImageIcon size={16} />,
                          label: "Set as Hero",
                          onClick: () => handleSetAsHero(image),
                        },
                        {
                          icon: <Download size={16} />,
                          label: "Download",
                          onClick: (e) => handleDownloadSingleImage(image),
                        },
                        {
                          icon: <Copy size={16} />,
                          label: "Copy to folder",
                          onClick: () => {
                            setDraggedImage(image);
                            setIsCopyOperation(true);
                            setShowFolderSelectModal(true);
                          },
                        },
                        { divider: true },
                        {
                          icon: <Trash2 size={16} />,
                          label: "Delete",
                          onClick: () => handleDeleteImageClick(image),
                          danger: true,
                        },
                      ]}
                    />
                  </PermissionGate>
                </div>
              ))}

              {/* Infinite scroll sentinel */}
              <div ref={observerTarget} className="h-4 w-full" />
              {loadingImages && (
                <div className="col-span-full py-4 flex justify-center">
                  <Loader2 className="animate-spin text-primary-dark" size={32} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowCreateFolder(false)}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-primary-dark mb-4">
                Create Folder
              </h2>
              <div className="space-y-4">
                {/* Folder Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                    placeholder="e.g., Pre-wedding, Reception"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleCreateFolder();
                    }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                    placeholder="Brief description of this folder"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      setShowCreateFolder(false);
                      setNewFolderName("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Folder Selection Modal (for drag & drop) */}
      {showFolderSelectModal && (draggedImage || selectedImages.length > 0) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowFolderSelectModal(false);
              setDraggedImage(null);
              setSelectedImages([]);
            }}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedImages.length > 0
                  ? `${isCopyOperation ? "Copy" : "Move"} Selected Images (${selectedImages.length}) to Folder`
                  : `${isCopyOperation ? "Copy" : "Move"} Image to Folder`}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select a folder to {isCopyOperation ? "copy" : "move"} this image to:
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">

                {folders
                  .filter(
                    (folder) =>
                      !selectedFolder ||
                      folder.fullPath !== selectedFolder.fullPath ||
                      isCopyOperation
                  )
                  .map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleMoveSelectedToFolder(folder)}
                      className="w-full flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <Folder size={20} className="text-gray-600" />
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        {folder.description && (
                          <p className="text-xs text-gray-500">
                            {folder.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                {selectedFolder &&
                  !isCopyOperation &&
                  folders.some(
                    (f) => f.fullPath === selectedFolder.fullPath
                  ) && (
                    <p className="text-xs text-gray-500 py-2">
                      Current folder hidden (move to same folder is a no-op)
                    </p>
                  )}
              </div>
              <button
                onClick={() => {
                  setShowFolderSelectModal(false);
                  setDraggedImage(null);
                  setSelectedImages([]);
                  setIsCopyOperation(false);
                }}
                className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Image Confirmation Modal */}
      {showDeleteConfirm && imageToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false);
              setImageToDelete(null);
            }}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <X size={24} className="text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Delete Image Permanently?
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this image permanently? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setImageToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteImage}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Confirmation Modal */}
      {showFolderDeleteConfirm && folderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowFolderDeleteConfirm(false);
              setFolderToDelete(null);
            }}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Folder size={24} className="text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {folderToDelete.imageCount > 0
                    ? "Cannot Delete Folder"
                    : "Delete Folder"}
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                {folderToDelete.imageCount > 0
                  ? "Please remove all images from this folder before deleting it."
                  : `Are you sure you want to delete "${folderToDelete.name}"?`}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFolderDeleteConfirm(false);
                    setFolderToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {folderToDelete.imageCount > 0 ? "OK" : "Cancel"}
                </button>
                {folderToDelete.imageCount === 0 && (
                  <button
                    onClick={handleConfirmDeleteFolder}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <PhotoUploadModal
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
          selectedFolder={
            selectedFolder || (folders.length > 0 ? folders[0] : null)
          }
           folders={folders}     
          projectId={projectId}
          onUploadComplete={fetchImages}
        />
      )}



      {/* Empty Folder Delete Prompt */}
      {showEmptyFolderPrompt && emptyFolderToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => {
              setShowEmptyFolderPrompt(false);
              setEmptyFolderToDelete(null);
            }}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Folder size={24} className="text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Empty Folder Detected
                </h2>
              </div>
              <p className="text-gray-600 mb-6">
                The folder "{emptyFolderToDelete.name}" is now empty. Would you
                like to delete it?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEmptyFolderPrompt(false);
                    setEmptyFolderToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep Folder
                </button>
                <button
                  onClick={handleConfirmDeleteEmptyFolder}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Share Modal - NEW */}
      {showGalleryShareModal && (
        <GalleryShareModal
          open={showGalleryShareModal}
          onClose={() => setShowGalleryShareModal(false)}
          projectId={projectId}
          folders={folders}
        />
      )}

      {/* Device Cover Image Modal */}
      <DeviceCoverImageModal
        isOpen={showDeviceCoverModal}
        onClose={() => {
          setShowDeviceCoverModal(false);
          setImageForCover(null);
        }}
        onSelect={handleDeviceCoverSelected}
        image={imageForCover}
      />

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <ImageViewerModal
          images={images}
          initialIndex={imageViewerIndex}
          isOpen={showImageViewer}
          onClose={() => setShowImageViewer(false)}
          onLike={(image, e) => handleToggleFavoriteImage(image, e)}
          onDownload={(image, e) => handleDownloadSingleImage(image, e)}
          likedImages={new Set(
            images.filter((img) => img.likedByOwner).map((img) => (img._id || img.id)?.toString())
          )}
          allowDownload={true}
        />
      )}

      {/* Toast Notifications */}
      {successMessage && (
        <Success onClose={() => setSuccessMessage(null)} autoClose={true}>
          {successMessage}
        </Success>
      )}
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)} autoClose={true}>
          {errorMessage}
        </Error>
      )}
    </div>
  );
};
