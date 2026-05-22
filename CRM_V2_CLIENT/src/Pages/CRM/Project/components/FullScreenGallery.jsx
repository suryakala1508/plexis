import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  X,
  Folder,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
  Share2,
  Upload,
  Star,
  Heart,
  Download,
  Copy,
  Edit,
  Eye,
  ChevronLeft,
  Grid3x3,
  List,
  Check,
  Mail,
  MessageCircle,
  FolderPlus,
  Monitor,
  Smartphone,
  RefreshCw,
  Tag,
  Play,
  ChevronDown,
  Video,
  Link as LinkIcon,
  Film  ,
  PlayCircle,
  Plus,
  Tablet
} from "lucide-react";
import {
  getEventImages,
  getFolders,
  getCleanFolderName,
  moveImageToFolder,
  deleteImagePermanently,
  deleteFolder,
  updateFolder,
  toggleFavorite,
  downloadImagesAsZip,
  downloadSingleImage,
  duplicateImagesToFolder,
  createFolder as createFolderAPI,
  getFolderPathWithProjectId,
  getFullFolderPath,
  getShareLink,
  getClientFavorites,
  updateProjectCoverImage,
  addMediaLink as addMediaLinkAPI,
  updateMediaLink as updateMediaLinkAPI,
  deleteMediaLink as deleteMediaLinkAPI,
  getMediaLinks as getMediaLinksAPI,
} from "../../../../services/galleryService";
import { searchImages, renameImage } from "../../../../services/galleryService"; // Add this to your galleryService
import { Success } from '../../../../Components/Success'
import { Error } from '../../../../Components/Error'
import { DeviceCoverImageModal } from "../../../../Components/DeviceCoverImageModal";
import ImageViewerModal from "./ImageViewerModal";
import PhotoUploadModal from "./PhotoUploadModal";
import MediaLinksModal from "./MediaLinksModal";
import MediaLinkPreviewModal from "./MediaLinkPreviewModal";
import ContextMenu from "@/Components/ContextMenu";
import { PermissionGate } from "@/Pages/utils/permissions";
import { ProgressiveImage } from "./ProgressiveImage";
import { useFeatures } from '../../../../hooks/useFeatures';

export const FullScreenGallery = ({
  projectId,
  projectTitle,
  onClose,
  onOpenCreateFolder,
  onFolderChange,
}) => {
  const { isFeatureAvailable } = useFeatures();
  // State
  const [activeTab, setActiveTab] = useState("collections"); // 'collections' | 'filmsReels' | 'starred' | 'clients'
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedTag, setSelectedTag] = useState("all");

  // Clients state
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [projectSlug, setProjectSlug] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [clientToExport, setClientToExport] = useState(null);
  const [tempImagesPerRow, setTempImagesPerRow] = useState(5);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Export Modal State
  const [showCreateFolderInput, setShowCreateFolderInput] = useState(false);
  const [newExportFolderName, setNewExportFolderName] = useState("");

  // Search functionality (moved from chatbot)
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Favorites: now derived from likedByOwner on folders/images (no separate state)

  // Modals
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showCoverImageModal, setShowCoverImageModal] = useState(false);
  const [folderForCoverUpdate, setFolderForCoverUpdate] = useState(null);
  const [showDeviceCoverModal, setShowDeviceCoverModal] = useState(false);
  const [imageForCover, setImageForCover] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [imageToMove, setImageToMove] = useState(null);
  const [isCopyOperation, setIsCopyOperation] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMediaLinksModal, setShowMediaLinksModal] = useState(false);
  const [editingMediaLink, setEditingMediaLink] = useState(null);
  const [mediaLinks, setMediaLinks] = useState([]);
  const [showMediaLinkPreview, setShowMediaLinkPreview] = useState(false);
  const [activeMediaLink, setActiveMediaLink] = useState(null);
  const [mediaModalContext, setMediaModalContext] = useState("collections");
  const [mediaHeroMode, setMediaHeroMode] = useState(false);
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState("desktop"); // 'desktop' | 'mobile' | 'custom'
  const [previewKey, setPreviewKey] = useState(0); // For refreshing iframe
  const [customWidth, setCustomWidth] = useState(1200);
  const [customHeight, setCustomHeight] = useState(620);
  // ... existing state
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("dateDesc");

  // NEW STATE FOR GRID SETTINGS
  const [showGridMenu, setShowGridMenu] = useState(false);
  const [imagesPerRow, setImagesPerRow] = useState(5); // Default 5 images per row
  const [showFilename, setShowFilename] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Sidebar toggle state
  const [allTags, setAllTags] = useState([]);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const gridMenuRef = React.useRef(null);
  const sortMenuRef = React.useRef(null);
  const tagMenuRef = React.useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(event.target)) {
        setShowGridMenu(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target)) {
        setShowTagMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId]);

  useEffect(() => {
    setSelectedTag("all");
  }, [selectedFolder]);


  useEffect(() => {
    const timer = setTimeout(() => {
      setImagesPerRow(tempImagesPerRow);
    }, 100); // 100ms debounce - smooth but responsive

    return () => clearTimeout(timer);
  }, [tempImagesPerRow]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [imagesData, foldersData, shareLinkData, mediaLinksData] = await Promise.all([
        getEventImages(projectId),
        getFolders(projectId),
        getShareLink(projectId).catch(() => null), // Get share link to get slug
        getMediaLinksAPI(projectId).catch(() => []), 
      ]);

      setImages(imagesData || []);

      // Store project slug and media links
      if (shareLinkData?.shareLink?.slug) {
        setProjectSlug(shareLinkData.shareLink.slug);
      }
      
      if (mediaLinksData) {
        setMediaLinks(mediaLinksData);
      } else if (shareLinkData?.shareLink?.mediaLinks) {
        setMediaLinks(shareLinkData.shareLink.mediaLinks);
      }

      // Collect all unique tags from images for suggestions
      const tagSet = new Set();
      (imagesData || []).forEach((img) => {
        if (Array.isArray(img.tags)) {
          img.tags.forEach((t) => {
            if (typeof t === "string" && t.trim()) {
              tagSet.add(t.trim());
            }
          });
        }
      });
      setAllTags(Array.from(tagSet).sort((a, b) => a.localeCompare(b)));

      // Process folders
      const folderMap = {};

      // Add stored folders (likedByOwner comes from folder schema)
      foldersData.forEach((f) => {
        const cleanName = getCleanFolderName(f.name);
        folderMap[f._id] = {
          id: f._id,
          name: cleanName,
          fullPath: f.name,
          description: f.description || "",
          coverImage: f.coverImage || null,
          imageCount: 0,
          createdAt: f.createdAt,
          likedByOwner: f.likedByOwner ?? false,
        };
      });

      // Count images per folder
      // Count images per folder
      if (imagesData && imagesData.length > 0) {
        imagesData.forEach((img) => {
          if (img.folderName && img.folderName !== "AllPhotos") {
            // Find folder by fullPath
            const folder = Object.values(folderMap).find(
              (f) => f.fullPath === img.folderName
            );
            if (folder) {
              folder.imageCount++;
              // Set cover image ONLY if not already set in DB
              if (!folder.coverImage && img.image_url) {
                folder.coverImage = img.image_url;
              }
            }
          }
        });
      }
      setFolders(Object.values(folderMap));
      // Favorites: images/folders now have likedByOwner from API
    } catch (error) {
      console.error("Error fetching data:", error);
      setErrorMessage("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  };

const handleChatSubmit = async () => {
  if (!chatMessage.trim()) return;

  if (!isFeatureAvailable('ai_features')) {
    setErrorMessage('Semantic search is available on Pro and Pro Max plans.');
    return;
  }

  const userMessage = {
    type: "user",
    text: chatMessage,
    time: new Date(),
  };

  setChatMessages((prev) => [...prev, userMessage]);
  const currentQuery = chatMessage;
  setChatMessage("");
  setIsTyping(true);

  try {
    const results = await searchImages(projectId, currentQuery);

    const botMessage = {
      type: "bot",
      text:
        results.length === 0
          ? "No matching images found for your search. Try different keywords."
          : `Found ${results.length} matching image${
              results.length > 1 ? "s" : ""
            }. Check the gallery above!`,
      time: new Date(),
    };

    setChatMessages((prev) => [...prev, botMessage]);

    if (results.length > 0) {
      setSearchResults(results);
      setShowSearchResults(true);
      setSuccessMessage({ text: `Found ${results.length} matching images`, makeDarker: true });
    } else {
      setErrorMessage("No matching images found");
      setSearchResults([]);
      setShowSearchResults(false);
    }
  } catch (error) {
    console.error("Search error:", error);

    const errorBotMessage = {
      type: "bot",
      text: "Sorry, I encountered an error while searching. Please try again.",
      time: new Date(),
    };

    setChatMessages((prev) => [...prev, errorBotMessage]);
    setErrorMessage(error.message || "Failed to search images");
  } finally {
    setIsTyping(false);
  }
};
  const resetFew = () => {
    setImagesPerRow(5);
  }

  const handleCloseSearchResults = () => {
    setShowSearchResults(false);
    setSearchResults([]);
    setSearchQuery("");
  };
  // Sort functions
  const sortItems = (items, type = "folder") => {
    const sorted = [...items];

    if (type === "folder") {
      switch (sortBy) {
        case "dateDesc":
          return sorted.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        case "dateAsc":
          return sorted.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        case "nameAsc":
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "nameDesc":
          return sorted.sort((a, b) => b.name.localeCompare(a.name));
        default:
          return sorted;
      }
    } else {
      switch (sortBy) {
        case "dateDesc":
          return sorted.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        case "dateAsc":
          return sorted.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        case "nameAsc":
          return sorted.sort((a, b) => a.filename.localeCompare(b.filename));
        case "nameDesc":
          return sorted.sort((a, b) => b.filename.localeCompare(a.filename));
        default:
          return sorted;
      }
    }
  };

  const getCurrentItems = () => {
    // Show search results if active
    if (showSearchResults && searchResults.length > 0) {
      // Match by image_url since that's reliable
      const resultUrls = searchResults.map((r) => r.image_url);
      let resultImages = images.filter((img) =>
        resultUrls.includes(img.image_url)
      );

      // Filter by tag if selected
      if (selectedTag !== "all") {
        resultImages = resultImages.filter(
          (img) => Array.isArray(img.tags) && img.tags.includes(selectedTag)
        );
      }

      // Sort by similarity score from search results (highest first)
      const sortedByRelevance = resultImages.sort((a, b) => {
        const scoreA =
          searchResults.find((r) => r.image_url === a.image_url)?.similarity ||
          0;
        const scoreB =
          searchResults.find((r) => r.image_url === b.image_url)?.similarity ||
          0;
        return scoreB - scoreA; // Descending order
      });

      return sortedByRelevance;
    }

    if (selectedFolder) {
      const folderImages = images.filter(
        (img) => {
          const isInFolder = img.folderName === selectedFolder.fullPath ||
                             img.additionalFolders?.includes(selectedFolder.fullPath);
          if (!isInFolder) return false;
          if (selectedTag === "all") return true;
          return Array.isArray(img.tags) && img.tags.includes(selectedTag);
        }
      );
      return sortItems(folderImages, "image");
    }

    if (activeTab === "starred") {
      return {
        folders: sortItems(
          folders.filter((f) => f.likedByOwner),
          "folder"
        ),
        images: sortItems(
          images.filter((img) => img.likedByOwner),
          "image"
        ),
      };
    }

    return sortItems(folders, "folder");
  };

  // Handlers
  const handleToggleFavoriteFolder = async (folder, e) => {
    e.stopPropagation();
    try {
      const response = await toggleFavorite(projectId, folder.id, "folder");
      setFolders((prev) =>
        prev.map((f) =>
          (f.id || f._id)?.toString() === (folder.id || folder._id)?.toString()
            ? { ...f, likedByOwner: response.isFavorite }
            : f
        )
      );
      // if (response.isFavorite) toast.success("Folder added to favorites");
      // else setSuccessMessage("Folder removed from favorites");
    } catch (error) {
      setErrorMessage("Failed to update favorite");
    }
  };
  const fetchImages = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const data = await getEventImages(projectId);
      setImages(data || []);

      // Get stored folders (likedByOwner comes from folder schema)
      const folderData = await getFolders(projectId);

      // Extract unique folders from images
      const uniqueFolders = {};
      if (data && data.length > 0) {
        data.forEach((img) => {
          if (img.folderName && img.folderName !== "AllPhotos") {
            const cleanName = getCleanFolderName(img.folderName);

            if (!uniqueFolders[img.folderName]) {
              uniqueFolders[img.folderName] = {
                id: img.folderName, // Store FULL PATH as ID
                name: cleanName, // Store CLEAN NAME for display
                fullPath: img.folderName, // Store full path for upload
                imageCount: 0,
                description: "",
              };
            }
            uniqueFolders[img.folderName].imageCount++;
          }
        });
      }

      // Merge stored and derived folders
      const allFolders = {};

      // Helper to normalize folder path for comparison
      const normalizeFolderPath = (path) => {
        if (!path || path === "AllPhotos") return "AllPhotos";
        // If path already has projectId, use as is; otherwise add it
        if (path.includes("/")) {
          return path;
        }
        return `${projectId}/${path}`;
      };

      // Add stored folders - normalize their paths to match image folderNames
      folderData.forEach((f) => {
        const cleanName = getCleanFolderName(f.name);
        const normalizedPath = normalizeFolderPath(f.name);

        allFolders[normalizedPath] = {
          id: f._id,
          name: cleanName,
          fullPath: normalizedPath,
          imageCount: 0, // Will be updated from derived
          description: f.description || "",
          accessType: f.accessType,
          settings: f.settings,
          likedByOwner: f.likedByOwner ?? false,
        };
      });

      // Add or update with derived folders from images
      Object.values(uniqueFolders).forEach((f) => {
        const normalizedPath = normalizeFolderPath(f.fullPath);

        if (!allFolders[normalizedPath]) {
          // Folder exists in images but not in DB - add it
          allFolders[normalizedPath] = {
            ...f,
            fullPath: normalizedPath,
          };
        } else {
          // Folder exists in both - update image count and merge metadata
          allFolders[normalizedPath].imageCount = f.imageCount;
          // Keep DB metadata (description, accessType, settings) but update image count
        }
      });

      setFolders(Object.values(allFolders));
    } catch (error) {
      console.error("Error in fetchImages:", error);

      // *** AUTH CHECK ADDED HERE ***
      if (error.response && error.response.status === 401) {
        setErrorMessage("Session expired. Please login again.");
        // Clear local storage to prevent loops
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
  const handleToggleFavoriteImage = async (image, e) => {
    e.stopPropagation();
    try {
      const response = await toggleFavorite(projectId, image._id, "image");
      setImages((prev) =>
        prev.map((img) =>
          (img._id || img.id)?.toString() === (image._id || image.id)?.toString()
            ? { ...img, likedByOwner: response.isFavorite }
            : img
        )
      );
    } catch (error) {
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
    } catch (error) {
      console.error("Error downloading image:", error);
      setErrorMessage("Failed to download image");
    }
  };
  const handleDeleteFolder = async (folder) => {
    setItemToDelete({ type: "folder", item: folder });
    setShowDeleteConfirm(true);
  };

  const handleDeleteImage = async (image) => {
    setItemToDelete({ type: "image", item: image });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "folder") {
        await deleteFolder(projectId, itemToDelete.item.id);
        setSuccessMessage("Folder deleted successfully");
        if (selectedFolder?.id === itemToDelete.item.id) {
          setSelectedFolder(null);
        }
      } else if (itemToDelete.type === "mediaLink") {
        const response = await deleteMediaLinkAPI(projectId, itemToDelete.item._id);
        if (response.success) {
          setMediaLinks(prev => prev.filter(l => l._id !== itemToDelete.item._id));
          setSuccessMessage("Media link deleted successfully");
        }
      } else {
        const fromFolder = selectedFolder?.fullPath;
        await deleteImagePermanently(projectId, itemToDelete.item._id, fromFolder);
        setSuccessMessage(
          fromFolder ? "Image removed from folder" : "Image deleted successfully"
        );
      }
      await fetchData();
      if (onFolderChange) onFolderChange();
    } catch (error) {
      setErrorMessage(`Failed to delete ${itemToDelete.type}`);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const handleUpdateCoverImage = (folder) => {
    setFolderForCoverUpdate(folder);
    setShowCoverImageModal(true);
  };

  const handleSelectCoverImage = async (image) => {
    if (!folderForCoverUpdate) return;

    try {
      await updateFolder(projectId, folderForCoverUpdate.id, {
        coverImage: image.low_res_url || image.image_url,
      });
      setSuccessMessage("Cover image updated");
      setShowCoverImageModal(false);
      setFolderForCoverUpdate(null);
      await fetchData();
      if (onFolderChange) onFolderChange();
    } catch (error) {
      setErrorMessage("Failed to update cover image");
    }
  };

  const handleDownloadFolder = async (folder) => {
    try {
      const folderImages = images.filter(
        (img) => img.folderName === folder.fullPath
      );
      if (folderImages.length === 0) {
        setErrorMessage("No images in this folder");
        return;
      }
      const imageIds = folderImages.map((img) => img._id);
      await downloadImagesAsZip(imageIds, images);
      setSuccessMessage(`Downloading ${folderImages.length} images...`);
    } catch (error) {
      setErrorMessage("Failed to download folder");
    }
  };
  const getGridStyles = () => {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${imagesPerRow}, minmax(0, 1fr))`,
      gap: '1rem',
    };
  };
  const handleDuplicateFolder = async (folder) => {
    try {
      let duplicateName = folder.name;
      let counter = 1;
      const existingNames = folders.map((f) => f.name);

      while (existingNames.includes(duplicateName)) {
        duplicateName = `${folder.name}(${counter})`;
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

      await createFolderAPI(projectId, {
        name: fullPath,
        description: folder.description,
      });

      const folderImages = images.filter(
        (img) => img.folderName === folder.fullPath
      );

      if (folderImages.length > 0) {
        await duplicateImagesToFolder(
          projectId,
          folderImages.map((img) => img._id),
          fullPath
        );
      }

      setSuccessMessage(
        `Folder "${duplicateName}" created with ${folderImages.length} images`
      );
      await fetchData();
      if (onFolderChange) onFolderChange();
    } catch (error) {
      setErrorMessage("Failed to duplicate folder");
    }
  };

  const handleMoveImage = async (targetFolder) => {
    if (!imageToMove) return;

    try {
      const targetPath = targetFolder?.fullPath || "AllPhotos";
      if (isCopyOperation) {
        await duplicateImagesToFolder(projectId, [imageToMove._id], targetPath);
        setSuccessMessage(`Image copied to ${targetFolder?.name || "All Photos"}`);
      } else {
        await moveImageToFolder(projectId, imageToMove._id, targetPath);
        setSuccessMessage(`Image moved to ${targetFolder?.name || "All Photos"}`);
      }
      setShowMoveModal(false);
      setImageToMove(null);
      setIsCopyOperation(false);
      await fetchData();
      if (onFolderChange) onFolderChange();
    } catch (error) {
      setErrorMessage(`Failed to ${isCopyOperation ? "copy" : "move"} image`);
    }
  };

  // Fetch clients data
  const fetchClients = async () => {
    if (!projectSlug) {
      setErrorMessage("Share link not found. Please enable sharing for this project.");
      return;
    }

    try {
      setLoadingClients(true);
      const response = await getClientFavorites(projectSlug);
      if (response.success && response.clients) {
        setClients(response.clients);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setErrorMessage("Failed to load client favorites");
    } finally {
      setLoadingClients(false);
    }
  };

  // Load clients when Clients tab is selected
  useEffect(() => {
    if (activeTab === "clients" && projectSlug) {
      fetchClients();
    }
  }, [activeTab, projectSlug]);

  // Handle export client favorites to folder
  const handleExportClientFavorites = async (targetFolder) => {
    if (!clientToExport) return;

    try {
      setLoadingClients(true);
      // Get all favorites for this client
      const response = await getClientFavorites(projectSlug, clientToExport.email);

      if (response.success && response.images) {
        const imageIds = response.images.map((img) => img._id || img.id);
        const targetPath = targetFolder?.fullPath || "AllPhotos";

        // Copy all images to the target folder
        await duplicateImagesToFolder(projectId, imageIds, targetPath);

        setSuccessMessage(
          `Exported ${imageIds.length} images to ${targetFolder?.name || "All Photos"}`
        );
        setShowExportModal(false);
        setClientToExport(null);
        await fetchData();
        if (onFolderChange) onFolderChange();
      }
    } catch (error) {
      console.error("Error exporting client favorites:", error);
      setErrorMessage("Failed to export client favorites");
    } finally {
      setLoadingClients(false);
    }
  };

  // Handle create folder and export functionality
  const handleCreateFolderAndExport = async () => {
    if (!newExportFolderName.trim() || !clientToExport) return;

    try {
      setLoadingClients(true);
      
      // 1. Create the new folder
      const folderNameForUpload = getFullFolderPath(
        projectTitle,
        newExportFolderName.trim()
      );
      const fullPath = getFolderPathWithProjectId(
        projectId,
        folderNameForUpload
      );

      await createFolderAPI(projectId, {
        name: fullPath,
        description: `Exported favorites for ${clientToExport.email}`,
      });

      // 2. Get client favorites
      const response = await getClientFavorites(projectSlug, clientToExport.email);

      if (response.success && response.images) {
        const imageIds = response.images.map((img) => img._id || img.id);

        // 3. Copy images to the new folder
        await duplicateImagesToFolder(projectId, imageIds, fullPath);

        setSuccessMessage(
          `Created folder "${newExportFolderName}" and exported ${imageIds.length} images`
        );
        setShowExportModal(false);
        setClientToExport(null);
        setShowCreateFolderInput(false);
        setNewExportFolderName("");
        await fetchData(); // Refresh to show new folder
        if (onFolderChange) onFolderChange();
      }
    } catch (error) {
      console.error("Error creating folder and exporting:", error);
      setErrorMessage("Failed to create folder and export images");
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSaveMediaLink = async (linkData) => {
    try {
      if (editingMediaLink) {
        const response = await updateMediaLinkAPI(projectId, editingMediaLink._id, linkData);
        if (response.success) {
          setMediaLinks(prev => prev.map(l => l._id === editingMediaLink._id ? response.link : l));
          setSuccessMessage("Media link updated successfully");
        }
      } else {
        const response = await addMediaLinkAPI(projectId, linkData);
        if (response.success) {
          setMediaLinks(prev => [...prev, response.link]);
          setSuccessMessage("Media link added successfully");
        }
      }
      setEditingMediaLink(null);
    } catch (error) {
      console.error("Error saving media link:", error);
      setErrorMessage("Failed to save media link");
    }
  };

  const handleDeleteMediaLink = (link) => {
    setItemToDelete({ type: "mediaLink", item: link });
    setShowDeleteConfirm(true);
  };

  const handlePreviewMediaLink = (link) => {
    setActiveMediaLink(link);
    setShowMediaLinkPreview(true);
  };

  const heroVideoLink = (mediaLinks || []).find((l) => l?.isHero);
  const otherMediaLinks = (mediaLinks || []).filter((l) => !l?.isHero);

  // Render functions
  const renderFolderCard = (folder) => {
    const isFavorite = folder.likedByOwner === true;
    const folderImages = images.filter(
      (img) => img.folderName === folder.fullPath
    );
    
    // Handle both legacy (string) and new (object with mobile/desktop) cover image formats
    let coverImageUrl;
    if (typeof folder.coverImage === 'object' && folder.coverImage !== null) {
      // New format: prefer desktop, fall back to mobile
      coverImageUrl = folder.coverImage.desktop || folder.coverImage.mobile;
    } else {
      // Legacy format: folder.coverImage is a string
      coverImageUrl = folder.coverImage;
    }
    
    coverImageUrl = coverImageUrl || folderImages[0]?.image_url;

    return (
      <div
        key={folder.id}
        className="relative group bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => setSelectedFolder(folder)}
      >
        {/* Cover Image */}
        <div className="aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 relative rounded-t-lg overflow-hidden">
          {coverImageUrl ? (
            <ProgressiveImage
              thumbSrc={folderImages[0]?.thumb_res_url}
              lowResSrc={coverImageUrl}
              originalSrc={coverImageUrl}
              blurhash={folderImages[0]?.blurhash}
              alt={folder.name}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Folder size={48} className="text-gray-300" />
            </div>
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-opacity duration-200" />

            <PermissionGate page="4" component="4_2" action="edit">
            {/* Favorite Icon */}
            <button
              onClick={(e) => handleToggleFavoriteFolder(folder, e)}
              className="absolute top-2 left-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
            >
              <Heart
                size={16}
                className={
                  isFavorite ? "text-red-500 fill-red-500" : "text-gray-600"
                }
              />
            </button>

            {/* Three Dots Menu */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === folder.id ? null : folder.id);
              }}
              className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
            >
              <MoreVertical size={16} className="text-gray-700" />
            </button>
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
                icon: <Eye size={16} />,
                label: "Preview folder",
                onClick: () => setSelectedFolder(folder),
              },

              {
                icon: <Download size={16} />,
                label: "Download folder",
                onClick: () => handleDownloadFolder(folder),
              },
              { divider: true },

              {
                icon: <ImageIcon size={16} />,
                label: "Update cover image",
                onClick: () => handleUpdateCoverImage(folder),
              },
              {
                icon: <Copy size={16} />,
                label: "Duplicate folder",
                onClick: () => handleDuplicateFolder(folder),
              },
              { divider: true },
              {
                icon: <Trash2 size={16} />,
                label: "Delete folder",
                onClick: () => handleDeleteFolder(folder),
                danger: true,
              },
            ]}
          />
        </PermissionGate>

        {/* Folder Info */}
        <div className="p-3 bg-white rounded-b-lg">
          <h4 className="font-semibold text-gray-900 truncate text-sm">
            {folder.name}
          </h4>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {folder.imageCount} photo{folder.imageCount !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(folder.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
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
      await fetchData();
    } catch (error) {
      console.error("Error setting hero image:", error);
      setErrorMessage("Failed to set hero image");
    }
  };

  const renderImageCard = (image, index) => {
    const isFavorite = image.likedByOwner === true;
    const imageId = image._id || image.id;

    return (
      <div key={image._id} className="flex flex-col gap-1">
        {" "}
        {/* Wrap in flex col */}
        <div
          className="relative group aspect-square cursor-pointer bg-gray-100 rounded-lg overflow-hidden"
          onClick={() => {
            setImageViewerIndex(index);
            setShowImageViewer(true);
          }}
        >
          {/* ... existing image and overlay code ... */}
          <ProgressiveImage
            thumbSrc={image.thumb_res_url}
            lowResSrc={image.low_res_url}
            originalSrc={image.image_url}
            blurhash={image.blurhash}
            alt={image.filename}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-opacity duration-200" />

          {/* ... keep your existing buttons (heart, menu) here ... */}
          {/* Copy your existing buttons code back here */}
           <PermissionGate page="4" component="4_2" action="edit">
            <button
              onClick={(e) => handleToggleFavoriteImage(image, e)}
              className="absolute bottom-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
            >
              <Heart
                size={14}
                className={
                  isFavorite ? "text-red-500 fill-red-500" : "text-gray-600"
                }
              />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenu(openMenu === image._id ? null : image._id);
              }}
              className="absolute top-2 right-2 z-20 p-1.5 bg-white/90 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110"
            >
              <MoreVertical size={16} className="text-gray-700" />
            </button>

            {/* ... Context Menu code ... */}
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
                    setImageToMove(image);
                    setIsCopyOperation(true);
                    setShowMoveModal(true);
                  },
                },
              ]}
            />
          </PermissionGate>
        </div>
        {/* NEW: FILENAME DISPLAY */}
        {/* NEW: FILENAME DISPLAY */}
        {showFilename && (
          <p
            className="text-xs text-gray-600 truncate px-1"
            title={image.filename}
          >
            {image.filename?.split('/').pop() || image.filename}
          </p>
        )}
      </div>
    );
  };
  const currentItems = getCurrentItems();

  // Pure full-screen preview mode: no sidebar, full-width iframe and a simple back icon
if (showPreview) {
  return (
    <div
      className="fixed inset-0 z-40 bg-white flex flex-col"
      style={{ animation: "fadeIn 0.18s ease" }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      {/* Thin top bar — floats over the iframe */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shadow-sm z-10 flex-shrink-0">
        <button
          onClick={() => setShowPreview(false)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded-md hover:bg-gray-100"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </button>

        {/* Pill label */}
        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live Preview
        </div>

        {/* Device switcher + dimensions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setPreviewMode("desktop")}
              title="Desktop"
              className={`p-1.5 rounded-md transition-colors ${
                previewMode === "desktop"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Monitor size={15} />
            </button>
            <button
              onClick={() => setPreviewMode("tablet")}
              title="Tablet"
              className={`p-1.5 rounded-md transition-colors ${
                previewMode === "tablet"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Tablet size={15} />
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              title="Mobile"
              className={`p-1.5 rounded-md transition-colors ${
                previewMode === "mobile"
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Smartphone size={15} />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Iframe area — pure white, no wrapper styling */}
      <div
        className="flex-1 overflow-hidden flex items-center justify-center bg-gray-50 transition-all duration-300"
      >
        {projectSlug ? (
          <div
            className="transition-all duration-300 bg-white overflow-hidden h-full"
            style={{
              width: previewMode === "mobile" ? "390px" : previewMode === "tablet" ? "768px" : "100%",
              height: previewMode === "mobile" ? "844px" : previewMode === "tablet" ? "1024px" : "100%",
              maxHeight: "100%",
              boxShadow:
                previewMode === "mobile" || previewMode === "tablet"
                  ? "0 0 0 1px #e5e7eb, 0 20px 60px rgba(0,0,0,0.15)"
                  : "none",
              borderRadius: previewMode === "mobile" || previewMode === "tablet" ? "12px" : "0",
            }}
          >
            <iframe
              key={previewKey}
              src={`/gallery/${projectSlug}?hideScroll=true`}
              className="w-full h-full border-none"
              title="Gallery Preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Monitor size={32} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">Share link not available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="fixed inset-0 z-40 bg-white flex">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-0"
          } border-r border-gray-200 bg-gray-50 flex flex-col transition-all duration-300 ease-in-out overflow-hidden`}
      >
        {/* Close Button */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Gallery</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-2">
          <button
            onClick={() => {
              setActiveTab("collections");
              setSelectedFolder(null);
              if (showSearchResults) {
                handleCloseSearchResults();
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${activeTab === "collections" && !selectedFolder
              ? "bg-primary-dark text-white"
              : "hover:bg-gray-200 text-gray-700"
              }`}
          >
            <Folder size={20} />
            <span className="font-medium">Collections</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("filmsReels");
              setSelectedFolder(null);
              if (showSearchResults) {
                handleCloseSearchResults();
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors mb-1 ${
              activeTab === "filmsReels" && !selectedFolder
                ? "bg-primary-dark text-white"
                : "hover:bg-gray-200 text-gray-700"
            }`}
          >
            <Video size={20} />
            <span className="font-medium">Films & Reels</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("starred");
              setSelectedFolder(null);
              if (showSearchResults) {
                handleCloseSearchResults();
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "starred" && !selectedFolder
              ? "bg-primary-dark text-white"
              : "hover:bg-gray-200 text-gray-700"
              }`}
          >
            <Heart size={20} />
            <span className="font-medium">Favorites</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("clients");
              setSelectedFolder(null);
              if (showSearchResults) {
                handleCloseSearchResults();
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeTab === "clients" && !selectedFolder
              ? "bg-primary-dark text-white"
              : "hover:bg-gray-200 text-gray-700"
              }`}
          >
            <Mail size={20} />
            <span className="font-medium">Clients</span>
          </button>

          {/* Preview is now triggered from the header play icon instead of a separate tab */}
        </div>
      </div>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-300 rounded-r-lg shadow-lg p-2 hover:bg-gray-50 transition-all duration-300"
        style={{ left: sidebarOpen ? "256px" : "0px" }}
      >
        <ChevronLeft
          size={20}
          className={`transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"
            }`}
        />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {(selectedFolder || showSearchResults) && (
              <button
                onClick={() => {
                  if (showSearchResults) {
                    handleCloseSearchResults();
                  } else {
                    setSelectedFolder(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ChevronLeft size={20} onClick={resetFew} />
              </button>
            )}

            {/* Title - Always show, no search bar */}
            <h2 className="text-2xl font-bold text-gray-900">
              {showSearchResults
                ? "Search Results"
                : selectedFolder
                  ? selectedFolder.name
                  : activeTab === "starred"
                    ? "Favorites"
                    : activeTab === "clients"
                      ? "Clients"
                      : activeTab === "filmsReels"
                        ? "Films & Reels"
                      : showPreview
                        ? "Gallery Preview"
                        : "Collections"}
            </h2>
          </div>

 <div className="flex items-center gap-3">
              {/* Custom Sort Dropdown */}
              {activeTab === "collections" && (
              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-1"
                >
                  <span>
                    {sortBy === "dateDesc" ? "Date (Newest)" : 
                     sortBy === "dateAsc" ? "Date (Oldest)" :
                     sortBy === "nameAsc" ? "Name (A-Z)" : "Name (Z-A)"}
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                
                {showSortMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                    {[
                      { value: "dateDesc", label: "Date (Newest)" },
                      { value: "dateAsc", label: "Date (Oldest)" },
                      { value: "nameAsc", label: "Name (A-Z)" },
                      { value: "nameDesc", label: "Name (Z-A)" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          sortBy === option.value ? "bg-gray-100 text-primary-dark font-semibold" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              )}
              {/* Custom Tag Filter Dropdown */}
              {(selectedFolder || showSearchResults) && allTags.length > 0 && (
                <div className="relative" ref={tagMenuRef}>
                  <button
                    onClick={() => setShowTagMenu(!showTagMenu)}
                    // CHANGED: bg-white -> bg-gray-100, hover:bg-gray-50 -> hover:bg-gray-200
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-1"
                  >
                    <Tag size={16} className="text-gray-400" />
                    <span className="max-w-[120px] truncate">
                      {selectedTag === "all" ? "All Tags" : selectedTag}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showTagMenu ? "rotate-180" : ""}`} />
                  </button>

                  {showTagMenu && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setSelectedTag("all");
                          setShowTagMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          selectedTag === "all" ? "bg-gray-100 text-primary-dark font-semibold" : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        All Tags
                      </button>
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTag(tag);
                            setShowTagMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedTag === tag ? "bg-gray-100 text-primary-dark font-semibold" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* View Mode Toggle with Dropdown - Only show inside folders */}
              {selectedFolder && (
                <div
                  // CHANGED: bg-white -> bg-gray-100
                  className="flex border border-gray-300 bg-gray-100 rounded-lg relative"
                  ref={gridMenuRef}
                >
                  <button
                    onClick={() => {
                      setViewMode("grid");
                      setShowGridMenu(!showGridMenu);
                    }}
                    // CHANGED: hover:bg-gray-50 -> hover:bg-gray-200
                    className={`p-2 ${viewMode === "grid"
                      ? "text-gray-900"
                      : "text-gray-600 hover:bg-gray-200"
                      } rounded-l-lg focus:outline-none`}
                  >
                    <Grid3x3 size={18} className="text-black" />
                  </button>

                  {/* Grid Settings Dropdown with Slider */}
                  {showGridMenu && viewMode === "grid" && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-3 px-4 z-50">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-500">
                            Images Per Row
                          </p>
                          <span className="text-sm font-medium text-primary-dark">
                            {imagesPerRow}
                          </span>
                        </div>

                        {/* Slider */}
                        <input
                          type="range"
                          min="2"
                          max="10"
                          value={tempImagesPerRow}
                          onChange={(e) => setTempImagesPerRow(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-dark smooth-slider"
                          style={{
                            background: `linear-gradient(to right, rgb(30, 58, 138) 0%, rgb(30, 58, 138) ${((tempImagesPerRow - 2) / 8) * 100}%, #e5e7eb ${((tempImagesPerRow - 2) / 8) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>2</span>
                          <span>10</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          Display
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">
                            Show Filename
                          </span>
                          <button
                            onClick={() => setShowFilename(!showFilename)}
                            className={`w-10 h-5 rounded-full transition-colors relative ${showFilename ? "bg-primary-dark" : "bg-gray-300"
                              }`}
                          >
                            <div
                              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showFilename ? "translate-x-5" : "translate-x-0.5"
                                }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Preview toggle – available outside folders, behaves like a play icon */}
              {!selectedFolder && !showSearchResults && (activeTab === "collections" || activeTab === "filmsReels") && (
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  // CHANGED: default bg-white -> bg-gray-100, default hover:bg-gray-100 -> hover:bg-gray-200
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-dark focus:ring-offset-1 ${
                    showPreview
                      ? "bg-primary-dark text-white border-primary-dark"
                      : "text-gray-700 hover:bg-gray-200 bg-gray-100"
                  }`}
                  title="Open live gallery preview"
                >
                  <Play size={16} fill={showPreview ? "currentColor" : "none"} />
                  <span>Preview</span>
                </button>
              )}

              {/* Add Link Button */}
              {!selectedFolder && !showSearchResults && activeTab === "filmsReels" && (
                <PermissionGate page="4" component="4_2" action="edit">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMediaLink(null);
                      setMediaModalContext("filmsReels");
                      setMediaHeroMode(false);
                      setShowMediaLinksModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors hover:bg-gray-200 bg-gray-100 text-gray-700"
                  >
                    <LinkIcon size={16} />
                    <span>Add Link</span>
                  </button>
                </PermissionGate>
              )}


              {/* Add Photos Button */}
              {(selectedFolder) && (
                <PermissionGate page="4" component="4_2" action="edit">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
                >
                  <Upload size={18} />
                  Add Photos
                </button>
                </PermissionGate>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : showSearchResults ? (
            // Search Results View
            <div style={getGridStyles()}>
              {currentItems.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <ImageIcon size={64} className="text-gray-300 mb-4" />
                  <p className="text-gray-500">No matching images found</p>
                </div>
              ) : (
                currentItems.map((image, index) =>
                  renderImageCard(image, index)
                )
              )}
            </div>
          ) : selectedFolder ? (
            // Folder Images View
            <div style={getGridStyles()}>
              {currentItems.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <ImageIcon size={64} className="text-gray-300 mb-4" />
                  <p className="text-gray-500">No images in this folder</p>
                </div>
              ) : (
                currentItems.map((image, index) =>
                  renderImageCard(image, index)
                )
              )}
            </div>
          ) : activeTab === "starred" ? (
            // Starred View - Two Sections
            <div className="space-y-8">
              {/* Starred Folders */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Folders
                </h3>
                {currentItems.folders.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Folder size={48} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No Liked folders</p>
                  </div>
                ) : (
                  <div style={getGridStyles()}>
                    {currentItems.folders.map((folder) =>
                      renderFolderCard(folder)
                    )}
                  </div>
                )}
              </div>

              {/* Starred Photos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Photos
                </h3>
                {currentItems.images.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <ImageIcon
                      size={48}
                      className="mx-auto text-gray-400 mb-2"
                    />
                    <p className="text-gray-500">No Liked photos</p>
                  </div>
                ) : (
                  <div style={getGridStyles()}>
                    {currentItems.images.map((image, index) =>
                      renderImageCard(image, index)
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "clients" ? (
            // Clients View
            <div className="space-y-6">
              {loadingClients ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dark mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading clients...</p>
                  </div>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Mail size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No client favorites yet</p>
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.email}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {client.email}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {client.imageCount} favorite{client.imageCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                        <PermissionGate page="4" component="4_2" action="edit">
                        <button
                          onClick={() => {
                            setClientToExport(client);
                            setShowExportModal(true);
                          }}
                          className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors flex items-center gap-2"
                        >
                          <Folder size={16} />
                          Export to Folder
                        </button>
                      </PermissionGate>
                    </div>

                    {/* Preview Images */}
                    {client.previewImages && client.previewImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3">
                        {client.previewImages.map((img) => (
                          <div
                            key={img._id || img.id}
                            className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                          >
                            <ProgressiveImage
                              thumbSrc={img.thumb_res_url}
                              lowResSrc={img.low_res_url}
                              originalSrc={img.image_url}
                              blurhash={img.blurhash}
                              alt={img.filename || "Preview"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {client.imageCount > 4 && (
                          <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-500 text-sm font-medium">
                              +{client.imageCount - 4} more
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : showPreview ? (
            // Preview View (Framer-style top bar)
            <div className="h-full flex flex-col">
              {/* Top Preview Bar */}
              <div className="flex items-center justify-between mb-4 bg-gray-900 text-gray-100 px-4 py-2 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="h-2 w-2 rounded-full bg-yellow-400" />
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                </div>

                <div className="flex items-center gap-3">
                  {/* Device dropdown */}
                  <select
                    value={previewMode}
                    onChange={(e) => setPreviewMode(e.target.value)}
                    className="bg-gray-800 text-gray-100 text-sm px-3 py-1.5 rounded-md border border-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-dark"
                  >
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="mobile">Mobile</option>
                    <option value="custom">Custom</option>
                  </select>

                  {/* Dimension inputs */}
                  <div className="flex items-center gap-1 text-xs text-gray-300">
                    <input
                      type="number"
                      min={320}
                      max={3840}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value) || 0)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-dark"
                    />
                    <span>W</span>
                    <input
                      type="number"
                      min={400}
                      max={2160}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value) || 0)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-dark"
                    />
                    <span>H</span>
                  </div>

                  {/* Refresh */}
                  <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="ml-2 inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-gray-700 hover:bg-gray-800 transition-colors"
                    title="Refresh preview"
                  >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
                >
                  <X size={14} />
                  <span>Close</span>
                </button>
              </div>

              {/* Iframe Preview */}
              <div className="flex-1 flex justify-center overflow-hidden bg-gray-50 rounded-b-2xl border border-gray-200 shadow-inner p-4">
                {projectSlug ? (
                  <div
                    className="transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) bg-white shadow-2xl overflow-hidden rounded-xl border border-gray-300 max-w-full"
                    style={{
                      width:
                        previewMode === "desktop"
                          ? "100%"
                          : previewMode === "tablet"
                            ? 768
                            : previewMode === "mobile"
                              ? 375
                              : customWidth || 1200,
                      height:
                        previewMode === "desktop"
                          ? "100%"
                          : previewMode === "tablet"
                            ? 1024
                            : previewMode === "mobile"
                              ? 620
                              : customHeight || 620,
                    }}
                  >
                    <iframe
                      key={previewKey}
                      src={`/gallery/${projectSlug}`}
                      className="w-full h-full border-none"
                      title="Gallery Preview"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl w-full border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                      <Monitor size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Generating Preview
                    </h3>
                    <p className="text-gray-500 max-w-xs text-sm">
                      We're setting up your live gallery link. This workspace's public URL will appear here in just a second.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Collections / Films&Reels views
            <div className="space-y-10">
              {activeTab === "filmsReels" ? (
                <div className="space-y-10">
                  {/* Hero video tile */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                      <Film size={20} className="text-gray-500" />
                      <h3 className="text-lg font-bold text-gray-800">Hero</h3>
                    </div>

                    {heroVideoLink ? (
                      <div
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group/card"
                      >
                        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Film size={20} className="text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate text-sm">
                              {heroVideoLink.title}
                            </h4>
                            <p className="text-xs text-gray-400 mt-0.5">Hero video</p>
                          </div>
                          <PermissionGate page="4" component="4_2" action="edit">
                            <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingMediaLink(heroVideoLink);
                                  setMediaModalContext("filmsReels");
                                  setMediaHeroMode(true);
                                  setShowMediaLinksModal(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMediaLink(heroVideoLink);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </PermissionGate>
                        </div>
                        <div className="px-5 py-3 flex items-center justify-between">
                          {heroVideoLink.description ? (
                            <p className="text-xs text-gray-500 truncate flex-1 mr-4">
                              {heroVideoLink.description}
                            </p>
                          ) : (
                            <span />
                          )}
                          <p className="text-xs text-gray-400 flex-shrink-0">
                            {new Date(heroVideoLink.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-white flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                          <Film size={32} className="text-blue-400" />
                        </div>
                        <h4 className="text-gray-900 font-semibold mb-2">No hero video set</h4>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                          Feature a single video at the very top of your gallery to greet your visitors.
                        </p>
                        <PermissionGate page="4" component="4_2" action="edit">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMediaLink(null);
                              setMediaModalContext("filmsReels");
                              setMediaHeroMode(true);
                              setShowMediaLinksModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-dark text-white text-sm font-semibold transition-all hover:bg-primary shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Film size={18} />
                            <span>Add Hero Video</span>
                          </button>
                        </PermissionGate>
                      </div>
                    )}
                  </div>

                  {/* Films & Reels Combined */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 border-b pb-2">
                      <Film size={20} className="text-gray-500" />
                      <h3 className="text-lg font-bold text-gray-800">Films & Reels</h3>
                    </div>
                    {otherMediaLinks.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center bg-white flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                           <Video size={32} className="text-blue-400" />
                        </div>
                        <h4 className="text-gray-900 font-semibold mb-2">No videos yet</h4>
                        <p className="text-gray-400 text-sm mb-6 max-w-xs">
                          Add cinema-style films or short reels to your project gallery.
                        </p>
                        <PermissionGate page="4" component="4_2" action="edit">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMediaLink(null);
                              setMediaModalContext("filmsReels");
                              setMediaHeroMode(false);
                              setShowMediaLinksModal(true);
                            }}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold transition-all hover:bg-gray-50 bg-white text-gray-700 shadow-sm hover:shadow"
                          >
                            <Plus size={18} />
                            <span>Add Your First Video</span>
                          </button>
                        </PermissionGate>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {otherMediaLinks.map((link) => (
                          <div
                            key={link._id}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group/card"
                          >
                            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                link.type === 'film' ? 'bg-blue-50' : 'bg-purple-50'
                              }`}>
                                {link.type === 'film' ? (
                                  <Film size={20} className="text-blue-600" />
                                ) : (
                                  <PlayCircle size={20} className="text-purple-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 truncate text-sm">
                                    {link.title}
                                  </h4>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                                    link.type === 'film' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {link.type === 'film' ? 'Film' : 'Reel'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {link.links?.length || 0} video{(link.links?.length || 0) !== 1 ? "s" : ""}
                                </p>
                              </div>
                              <PermissionGate page="4" component="4_2" action="edit">
                                <div className="flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingMediaLink(link);
                                      setMediaModalContext("filmsReels");
                                      setMediaHeroMode(false);
                                      setShowMediaLinksModal(true);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMediaLink(link);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </PermissionGate>
                            </div>
                            <div className="px-5 py-3 flex items-center justify-between">
                              {link.description ? (
                                <p className="text-xs text-gray-500 truncate flex-1 mr-4">
                                  {link.description}
                                </p>
                              ) : (
                                <span />
                              )}
                              <p className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(link.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Collections View - All Folders */
                <div>
                  {/* <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <Folder size={20} className="text-gray-500" />
                    <h3 className="text-lg font-bold text-gray-800">Folders</h3>
                  </div> */}
                  <div style={getGridStyles()}>
                    {currentItems.length === 0 ? (
                      <div className="col-span-full flex flex-col items-center justify-center py-20">
                        <Folder size={64} className="text-gray-300 mb-4" />
                        <p className="text-gray-500 mb-4">No folders yet</p>
                        <PermissionGate page="4" component="4_2" action="edit">
                          <button
                            onClick={onOpenCreateFolder}
                            className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary"
                          >
                            Create Folder
                          </button>
                        </PermissionGate>
                      </div>
                    ) : (
                      currentItems.map((folder) => renderFolderCard(folder))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Viewer Modal */}
      {/* Chatbot Button - Floating at Bottom Right */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-primary-dark text-white rounded-full p-4 shadow-2xl hover:shadow-lg transition-all duration-300 hover:scale-105"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        {isChatOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Chatbot Interface */}
      {isChatOpen && (
        <div
          className="fixed bottom-24 right-6 w-[420px] max-w-md z-50 flex flex-col max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/90 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-dark rounded-xl flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-base">
                    PLEXIS AI Assistant
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-gray-500">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-16 h-16 bg-primary-dark rounded-2xl flex items-center justify-center shadow-lg mb-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-gray-900 font-semibold text-lg mb-2">
                  AI Image Search
                </h4>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                  Describe the photos you're looking for and I'll find them for you.
                </p>
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.type === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  {msg.type === "bot" && (
                    <div className="w-8 h-8 bg-primary-dark rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex-1 max-w-[80%]">
                    <div
                      className={`${
                        msg.type === "bot"
                          ? "bg-white border-gray-200 text-gray-800"
                          : "bg-primary-dark border-primary-dark text-white"
                      } border rounded-2xl p-3.5 shadow-sm`}
                    >
                      <p className="text-sm leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                    <p className="text-gray-400 text-xs mt-1.5 ml-1">
                      {msg.time
                        ? new Date(msg.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Just now"}
                    </p>
                  </div>

                  {msg.type === "user" && (
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-xs font-semibold">
                        U
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-primary-dark rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-primary-dark rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={(ref) => {
                    if (ref) {
                      ref.style.height = "auto";
                      ref.style.height = `${Math.min(ref.scrollHeight, 128)}px`;
                    }
                  }}
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit();
                    }
                  }}
                  placeholder="Describe the photos you're looking for..."
                  rows="1"
                  className="w-full bg-gray-100 border border-gray-200 focus:border-primary-dark rounded-xl text-gray-900 placeholder-gray-500 px-4 py-3 text-sm focus:outline-none resize-none overflow-hidden m-0"
                  style={{ minHeight: "44px", maxHeight: "128px" }}
                />
              </div>

              <button
                onClick={handleChatSubmit}
                disabled={!chatMessage.trim() || isTyping}
                className="bg-primary-dark hover:opacity-90 disabled:bg-gray-300 disabled:opacity-50 text-white rounded-xl px-5 py-3 transition-all duration-200 shadow-sm disabled:cursor-not-allowed min-h-[44px] font-medium text-sm flex-shrink-0 border border-transparent"
              >
                {isTyping ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>Powered by PLEXIS AI</span>
              <span>•</span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>
      )}
      {showImageViewer && (() => {
        const items = getCurrentItems();
        const viewerImages = Array.isArray(items) ? items : (items?.images || []);
        const likedIds = new Set(
          viewerImages.filter((img) => img.likedByOwner).map((img) => (img._id || img.id)?.toString())
        );
        return (
          <>
            <DeviceCoverImageModal
              isOpen={showDeviceCoverModal}
              onClose={() => {
                setShowDeviceCoverModal(false);
                setImageForCover(null);
              }}
              onSelect={handleDeviceCoverSelected}
              image={imageForCover}
            />
            <ImageViewerModal
            open={showImageViewer}
            onClose={() => setShowImageViewer(false)}
            images={viewerImages}
            currentIndex={imageViewerIndex}
            onImageChange={setImageViewerIndex}
            projectId={projectId}
            onFavorite={handleToggleFavoriteImage}
            likedImages={likedIds}
          />
          </>
        );
      })()}
      {/* Toast Notifications */}
      {successMessage && (
        <Success 
          onClose={() => setSuccessMessage(null)} 
          autoClose={true}
          makeDarker={typeof successMessage === 'object' ? successMessage.makeDarker : false}
        >
          {typeof successMessage === 'object' ? successMessage.text : successMessage}
        </Success>
      )}
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)} autoClose={true}>
          {errorMessage}
        </Error>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              Delete {itemToDelete.type === "folder" 
                ? "Folder" 
                : itemToDelete.type === "mediaLink" 
                  ? (itemToDelete.item.type === 'film' ? 'Film' : 'Reel') 
                  : "Image"}?
            </h3>
            <p className="text-gray-600 mb-6">
              {itemToDelete.type === "folder"
                ? `Are you sure you want to delete "${itemToDelete.item.name}"? This action cannot be undone.`
                : itemToDelete.type === "mediaLink"
                  ? `Are you sure you want to delete this ${itemToDelete.item.type === 'film' ? 'film' : 'reel'}? This action cannot be undone.`
                  : "Are you sure you want to delete this image? This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cover Image Selection Modal */}
      {showCoverImageModal && folderForCoverUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold">Select Cover Image</h3>
              <button
                onClick={() => {
                  setShowCoverImageModal(false);
                  setFolderForCoverUpdate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images
                  .filter(
                    (img) => img.folderName === folderForCoverUpdate.fullPath
                  )
                  .map((image) => (
                    <div
                      key={image._id}
                      onClick={() => handleSelectCoverImage(image)}
                      className="aspect-square cursor-pointer rounded-lg overflow-hidden hover:ring-4 hover:ring-primary-dark transition-all"
                    >
                      <ProgressiveImage
                        thumbSrc={image.thumb_res_url}
                        lowResSrc={image.low_res_url}
                        originalSrc={image.image_url}
                        blurhash={image.blurhash}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Move/Copy Image Modal */}
      {showMoveModal && imageToMove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">
              {isCopyOperation ? "Copy Image to Folder" : "Move Image to Folder"}
            </h3>
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
                    onClick={() => handleMoveImage(folder)}
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
            </div>
            <button
              onClick={() => {
                setShowMoveModal(false);
                setImageToMove(null);
                setIsCopyOperation(false);
              }}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Photo Upload Modal - stays on same page with correct folder */}
      {showUploadModal && (
        <PhotoUploadModal
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
          selectedFolder={selectedFolder}
           folders={folders}     
          projectId={projectId}
          onUploadComplete={fetchData}
        />
      )}

      {/* Export Client Favorites Modal */}
      {showExportModal && clientToExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Export to Folder</h3>
            <p className="text-sm text-gray-600 mb-4">
              Export {clientToExport.email}'s {clientToExport.imageCount} favorites to:
            </p>
            
            {showCreateFolderInput ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Folder Name
                  </label>
                  <input
                    type="text"
                    value={newExportFolderName}
                    onChange={(e) => setNewExportFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                   <button
                    onClick={() => setShowCreateFolderInput(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateFolderAndExport}
                    disabled={!newExportFolderName.trim()}
                    className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create & Export
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleExportClientFavorites(folder)}
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
                  
                  {/* Create New Folder Option */}
                  <button
                    onClick={() => {
                      setShowCreateFolderInput(true);
                      setNewExportFolderName("");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-dashed border-primary-dark bg-blue-50/50 rounded-lg hover:bg-blue-50 transition-colors text-left text-primary-dark group"
                  >
                    <FolderPlus size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Create New Folder</span>
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setClientToExport(null);
                    setShowCreateFolderInput(false);
                  }}
                  className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <MediaLinksModal
        isOpen={showMediaLinksModal}
        onClose={() => {
          setShowMediaLinksModal(false);
          setEditingMediaLink(null);
          setMediaHeroMode(false);
        }}
        onSave={handleSaveMediaLink}
        initialData={editingMediaLink}
        context={mediaModalContext}
        isHeroMode={mediaHeroMode}
      />
      <MediaLinkPreviewModal
        isOpen={showMediaLinkPreview}
        onClose={() => {
          setShowMediaLinkPreview(false);
          setActiveMediaLink(null);
        }}
        link={activeMediaLink}
      />
    </div>
  );
};
