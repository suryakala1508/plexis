import React, { useState, useEffect, useRef,useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Heart,
  Download,
  X,
  ChevronDown,
  MapPin,
  Mail,
  Phone,
  Globe,
  Smartphone,
  RefreshCw,
  Video,
  Film,
  PlayCircle,
  Loader2,
  ChevronLeft,

} from "lucide-react";
import { Masonry } from "masonic";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  accessSharedGallery,
  fetchGalleryImagePage,
  downloadImagesAsZip,
  downloadSingleImage,
  verifyClientPassword,
  toggleClientFavorite,
  getClientFavorites,
} from "../../services/galleryService";
import { Success } from "../../Components/Success";
import { Error } from "../../Components/Error";
import "./MasonryGallery.css"; // Import the CSS file
import { GalleryToolbar } from "./GalleryToolbar";
import { GalleryModals } from "./GalleryModals";
import { LikedPhotosModal } from "./LikedPhotosModal";
import { Blurhash } from "react-blurhash";
import { GooglePhotosSuccessModal } from "./GooglePhotosSuccessModal";
import { GooglePhotosErrorModal } from "./GooglePhotosErrorModal";

/**
 * ProgressiveImage — 3-layer progressive approach:
 *   Layer 1 (bottom): Blurhash (instant, no network)
 *   Layer 2: thumb_res_url (starts when in viewport; fades in)
 *   Layer 3 (top): low_res_url (starts when in viewport; fades in once ready)
 */
const ProgressiveImage = ({
  thumbSrc,
  lowResSrc,
  alt,
  width,
  height,
  blurhash,
  onDimensionsLoad,
}) => {
  const [inView, setInView] = useState(false);
  const containerRef = useRef(null);

  const thumbRef = useRef(null);
  const lowResRef = useRef(null);

  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [lowResLoaded, setLowResLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { rootMargin: "300px" },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setThumbLoaded(false);
    setLowResLoaded(false);
  }, [thumbSrc, lowResSrc]);

  const handleImgLoad = (ref, type) => {
    if (type === "thumb") setThumbLoaded(true);
    else if (type === "lowRes") setLowResLoaded(true);

    if (!width || !height) {
      if (
        ref.current &&
        ref.current.naturalWidth &&
        ref.current.naturalHeight
      ) {
        onDimensionsLoad?.({
          width: ref.current.naturalWidth,
          height: ref.current.naturalHeight,
        });
      }
    }
  };

  // Cached-image detection
  useEffect(() => {
    if (!inView) return;
    if (thumbRef.current?.complete && thumbRef.current.naturalWidth > 0) {
      handleImgLoad(thumbRef, "thumb");
    }
  }, [inView, thumbSrc]);

  useEffect(() => {
    if (!inView) return;
    if (lowResRef.current?.complete && lowResRef.current.naturalWidth > 0) {
      handleImgLoad(lowResRef, "lowRes");
    }
  }, [inView, lowResSrc]);

  const aspectRatio = width && height ? (height / width) * 100 : null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        overflow: "hidden",
        background: "#e5e7eb",
        ...(aspectRatio
          ? { paddingBottom: `${aspectRatio}%` }
          : { minHeight: "100px" }),
      }}
    >
      {/* Layer 1: Blurhash (no network) */}
      {blurhash && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <Blurhash
            hash={blurhash}
            width="100%"
            height="100%"
            resolutionX={32}
            resolutionY={32}
            punch={1}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      )}

      {/* Layer 2: Thumb */}
      {inView && thumbSrc && (
        <img
          ref={thumbRef}
          src={thumbSrc}
          alt={alt}
          onLoad={() => handleImgLoad(thumbRef, "thumb")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: thumbLoaded ? 1 : 0,
            transition: "opacity 0.15s ease-in-out",
            zIndex: 2,
          }}
        />
      )}

      {/* Layer 3: Low-res */}
      {inView && lowResSrc && (
        <img
          ref={lowResRef}
          src={lowResSrc}
          alt={alt}
          onLoad={() => handleImgLoad(lowResRef, "lowRes")}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: lowResLoaded ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
};

const VideoEmbed = ({ url, type = "film" }) => {
  const getEmbedConfig = (url) => {
    if (!url) return { embedUrl: null, platform: null };

    // YouTube (including shorts)
    const ytMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/)?([a-zA-Z0-9_-]{11})/,
    );
    if (ytMatch) {
      const isShorts = url.includes("/shorts/");
      return {
        embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&controls=1${isShorts ? "&loop=1&playlist=" + ytMatch[1] : ""}`,
        platform: "youtube",
      };
    }

    // Instagram reels
    const igMatch = url.match(
      /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reels|reel)\/([^/?#&]+)/,
    );
    if (igMatch) {
      return {
        embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/captioned/`,
        platform: "instagram",
      };
    }

    // Vimeo
    const vMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (vMatch) {
      return {
        embedUrl: `https://player.vimeo.com/video/${vMatch[1]}?title=0&byline=0&portrait=0&controls=1`,
        platform: "vimeo",
      };
    }

    return { embedUrl: url, platform: "unknown" };
  };

  const { embedUrl, platform } = getEmbedConfig(url);

  const isReel = type !== "film";

  if (isReel && platform === "instagram") {
    // Instagram reels — constrained wrapper to clip their chrome
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "320px",
          margin: "0 auto",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#000",
          // Clip the top bar and bottom bar Instagram forces in
          // Their embed is ~554px tall for a 320px wide container
          // We clip top ~60px (header) and keep the video portion
        }}
      >
        {/* Outer clip mask — hides IG header/footer chrome */}
        <div
          style={{
            position: "relative",
            width: "100%",
            // paddingTop gives us true 9:16 visible area
            paddingTop: "calc(177.78% + 80px)", // extra 80px so iframe has room
            overflow: "hidden",
            borderRadius: "16px",
          }}
        >
          <iframe
            src={embedUrl}
            scrolling="no"
            allowTransparency="true"
            style={{
              position: "absolute",
              // Shift iframe UP to hide the top IG header (~60px)
              top: "-62px",
              left: "-2px",
              width: "calc(100% + 4px)",
              // Make iframe taller than container so bottom chrome is clipped too
              height: "calc(100% + 130px)",
              border: "none",
              overflow: "hidden",
              borderRadius: "12px",
            }}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title="Instagram Reel"
          />
        </div>
      </div>
    );
  }

  // YouTube Shorts & Vimeo reels — clean 9:16
  if (isReel) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "320px",
          margin: "0 auto",
          paddingTop: "177.78%",
          borderRadius: "16px",
          overflow: "hidden",
          background: "#000",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <iframe
          src={embedUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Reel"
        />
      </div>
    );
  }

  // Film — landscape 16:9
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        paddingTop: "56.25%",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#000",
        boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
      }}
    >
      <iframe
        src={embedUrl}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "none",
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        title="Film"
      />
    </div>
  );
};
export const PublicGallery = () => {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [studioInfo, setStudioInfo] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showLikedPhotosModal, setShowLikedPhotosModal] = useState(false);
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [likedImages, setLikedImages] = useState(new Set());
  const [galleryPin, setGalleryPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hideScroll, setHideScroll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pendingDownloadAction, setPendingDownloadAction] = useState(null);
  const [pendingGeneralAction, setPendingGeneralAction] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showHero, setShowHero] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const [isMobileDevice, setIsMobileDevice] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => setIsMobileDevice(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Search state
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExecuted, setIsSearchExecuted] = useState(false);

  // PIN verification state with expiration
  const [pinVerificationTime, setPinVerificationTime] = useState(null);
  const [clientEmail, setClientEmail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pendingFavoriteAction, setPendingFavoriteAction] = useState(null);

  // Download Quality Selection State
  const [showDownloadQualityModal, setShowDownloadQualityModal] =
    useState(false);
  const [selectedQuality, setSelectedQuality] = useState("high"); // 'high' or 'web'
  const [downloadTarget, setDownloadTarget] = useState(null); // stores the image object or 'batch'

  // Google Photos State
  const [googlePhotosSuccessInfo, setGooglePhotosSuccessInfo] = useState(null);
  const [googlePhotosError, setGooglePhotosError] = useState(null);
  const [mediaLinks, setMediaLinks] = useState([]);

  // Pagination / infinite scroll state
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const sentinelRef = useRef(null);
  const observerRef = useRef(null); // replaces sentinelRef

const lastImageRef = useCallback((node) => {
  if (isFetchingMore) return;
  if (observerRef.current) observerRef.current.disconnect();
  
  observerRef.current = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !fetchingLockRef.current) {
      loadMoreForInfiniteScroll();
    }
  }, { rootMargin: "300px" });
  
  if (node) observerRef.current.observe(node);
}, [isFetchingMore]); // only re-creates when loading state changes

  // Folder-aware pagination (server never mixes folders in one response)
  const folderCursorRef = useRef({}); // { [folderName]: { page, hasMoreInFolder, nextFolder } }
  const loadedFoldersRef = useRef(new Set()); // tracks folders that have been fetched at least once
  const [folderLoadingByName, setFolderLoadingByName] = useState({});

  const fetchingLockRef = useRef(false);
  const observerCooldownRef = useRef(false);
  const selectedFolderRef = useRef(null);
  const foldersRef = useRef([]);
  const debounceTimeoutRef = useRef(null);

  const galleryRef = useRef(null);
  const heroRef = useRef(null);

  useEffect(() => {
    selectedFolderRef.current = selectedFolder;
  }, [selectedFolder]);

  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  // ✅ SINGLE useEffect - Replace lines 58-220 with this
  useEffect(() => {
    const fetchSharedGallery = async () => {
      if (!slug) {
        setError("Invalid gallery link");
        setLoading(false);
        return;
      }

      // Check Google Photos URL params
      const searchParams = new URLSearchParams(window.location.search);

      if (searchParams.get("hideScroll") === "true") {
        setHideScroll(true);
      }

      const gpStatus = searchParams.get("googlePhotos");
      if (gpStatus === "success") {
        const email = searchParams.get("email") || "";
        const count = searchParams.get("count") || "some";
        setGooglePhotosSuccessInfo({ email, count });
        searchParams.delete("googlePhotos");
        searchParams.delete("email");
        searchParams.delete("count");
        const newUrl =
          window.location.pathname +
          (searchParams.toString() ? `?${searchParams.toString()}` : "");
        window.history.replaceState({}, "", newUrl);
      } else if (gpStatus === "error") {
        const msg = searchParams.get("msg") || "";
        let displayMsg =
          "There was an error saving your photos to Google Photos. Please try again.";
        if (msg === "batch_expired")
          displayMsg = "Your session expired. Please try uploading again.";
        if (msg === "missing_params")
          displayMsg =
            "Missing authorization details from Google. Please try again.";
        setGooglePhotosError(displayMsg);
        searchParams.delete("googlePhotos");
        searchParams.delete("msg");
        const newUrl =
          window.location.pathname +
          (searchParams.toString() ? `?${searchParams.toString()}` : "");
        window.history.replaceState({}, "", newUrl);
      }

      setLoading(true);
      try {
        // Fetch the whole first folder to keep scrolling stable.
        const data = await accessSharedGallery(slug, 1, 40, true);

        if (!data || !data.success) {
          setError("Gallery not found or no longer available");
          setLoading(false);
          return;
        }
        setProject({
          id: data.projectId,
          title: data.projectTitle || "Shared Gallery",
          eventDate: data.eventDate || new Date().toISOString(),
          studioName: data.studioName || "",
          studioLogo: data.studioLogo || null,
          coverImage: data.coverImage || null,
          subscription: data.subscription || null,
        });

        if (data.mediaLinks) {
          setMediaLinks(data.mediaLinks);
        }

        if (data.studioInfo) {
          setStudioInfo(data.studioInfo);
        }

        const processedFolders = (data.folders || []).map((folder) => ({
          id: folder._id || folder.id,
          name: folder.name,
          description: folder.description || "",
          imageCount: folder.imageCount || 0,
        }));
        setFolders(processedFolders);

        if (processedFolders.length > 0) {
          setSelectedFolder(processedFolders[0]);
        }

        const processedImages = (data.images || []).map((img, idx) => ({
          id: img._id || img.id || idx,
          thumbSrc: img.thumb_res_url || null,
          lowResSrc: img.low_res_url || img.image_url || img.url || null,
          alt: img.filename || img.title || img.alt || "",
          blurhash: img.blurhash || null,
          folderName: img.folderName || "AllPhotos",
          width: img.width ?? img.dimensions?.width ?? null,
          height: img.height ?? img.dimensions?.height ?? null,
          likedByClients: img.likedByClients || [],
          tags: img.tags || [],
        }));
        setImages(processedImages);

        // Store folder pagination metadata for the current folder only.
        if (data.currentFolder) {
          folderCursorRef.current[data.currentFolder] = {
            page: data.folderPage || 1,
            hasMoreInFolder: !!data.hasMoreInFolder,
            nextFolder: data.nextFolder || null,
          };
          loadedFoldersRef.current.add(data.currentFolder);
        }
        const canUsePinDownload = Boolean(data.pinDownloadEnabled);
        setGalleryPin(canUsePinDownload ? data.galleryPin || null : null);

        if (!canUsePinDownload) {
          setPinVerificationTime(null);
          localStorage.removeItem(`pin_verified_${slug}`);
          document.cookie =
            "guest_search_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }

        // ✅ Load PIN verification from localStorage if it exists and is not expired
        const storedPinTime = localStorage.getItem(`pin_verified_${slug}`);
        if (storedPinTime) {
          try {
            const pinTime = JSON.parse(storedPinTime);
            setPinVerificationTime(pinTime);
          } catch (e) {
            console.warn("Could not parse stored PIN time");
          }
        }

        // ✅ Load client email from localStorage if it exists
        const storedEmail = localStorage.getItem(`client_email_${slug}`);
        if (storedEmail) {
          setClientEmail(storedEmail);

          // Initialize liked images from processed images
          const favoriteIds = new Set();
          processedImages.forEach((img) => {
            if (
              img.likedByClients &&
              img.likedByClients.includes(storedEmail.toLowerCase())
            ) {
              favoriteIds.add(img.id);
            }
          });
          setLikedImages(favoriteIds);

          // Also fetch from API to ensure we have the latest
          loadClientFavorites(storedEmail);
        }
      } catch (err) {
        console.error("Error fetching shared gallery:", err);
        if (err.message.includes("expired")) {
          setError("This gallery link has expired");
        } else if (err.message.includes("not available")) {
          setError("This gallery is no longer available");
        } else {
          setError("Failed to load gallery");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedGallery();
  }, [slug]);

  // ── Folder-aware infinite scroll via IntersectionObserver ──────────────
  const normalizeServerImage = (img) => ({
    id: img._id || img.id,
    thumbSrc: img.thumb_res_url || null,
    lowResSrc: img.low_res_url || img.image_url || img.url || null,
    alt: img.filename || img.alt || img.title || "",
    blurhash: img.blurhash || null,
    folderName: img.folderName || "AllPhotos",
    width: img.width ?? img.dimensions?.width ?? null,
    height: img.height ?? img.dimensions?.height ?? null,
    likedByClients: img.likedByClients || [],
    tags: img.tags || [],
  });

  const loadFolderFirstPage = async (
    folderName,
    { showLoader = true } = {},
  ) => {
    if (!folderName) return;
    if (
      loadedFoldersRef.current.has(folderName) &&
      folderCursorRef.current[folderName]
    )
      return;

    if (showLoader) {
      setFolderLoadingByName((prev) => ({ ...prev, [folderName]: true }));
    }

    try {
      const data = await fetchGalleryImagePage(slug, folderName, 1, 15, true);
      const newImages = (data?.images || []).map(normalizeServerImage);

      setImages((prev) => [...prev, ...newImages]);

      folderCursorRef.current[folderName] = {
        page: data?.folderPage || 1,
        hasMoreInFolder: !!data?.hasMoreInFolder,
        nextFolder: data?.nextFolder || null,
        lastFetchedCount: newImages.length,
      };
      loadedFoldersRef.current.add(folderName);

      return data;
    } finally {
      if (showLoader) {
        setFolderLoadingByName((prev) => ({ ...prev, [folderName]: false }));
      }
    }
  };

  const loadMoreForInfiniteScroll = async () => {
    const activeFolder = selectedFolderRef.current?.name;
    if (!activeFolder) return;
    if (fetchingLockRef.current) return;

    fetchingLockRef.current = true;
    setIsFetchingMore(true);

    try {
      const cursor = folderCursorRef.current[activeFolder];

      // If the folder is already exhausted, queue the next folder (no fetch here).
      if (cursor && !cursor.hasMoreInFolder) {
        let nextFolderName = cursor.nextFolder;
        // Skip empty folders and auto-fetch next folder's first page.
        // This ensures the user never gets stuck with the gallery ending early.
        let safety = 0;
        while (nextFolderName && safety < 5) {
          safety++;
          const nextFolderObj = foldersRef.current.find(
            (f) => f.name === nextFolderName,
          );
          if (nextFolderObj)
            setTimeout(() => setSelectedFolder(nextFolderObj), 0);

          let data = null;
          if (!loadedFoldersRef.current.has(nextFolderName)) {
            data = await loadFolderFirstPage(nextFolderName, {
              showLoader: true,
            });
          }

          const cursorForNext = folderCursorRef.current[nextFolderName];
          const lastCountFromData = data?.images?.length;
          const lastCount =
            lastCountFromData !== undefined
              ? lastCountFromData
              : cursorForNext?.lastFetchedCount;

          // If we don't know (undefined), assume folder has images so we don't skip it accidentally.
          if (lastCount === undefined || lastCount > 0) break;

          // If folder had no images, advance again.
          nextFolderName = (cursorForNext && cursorForNext.nextFolder) || null;
        }

        fetchingLockRef.current = false;
        setIsFetchingMore(false);
        return;
      }

      // If the folder isn't loaded yet, fetch page 1.
      // Otherwise, fetch the next page for this folder only.
      const requestPage = !cursor ? 1 : (cursor.page || 1) + 1;
      const data = await fetchGalleryImagePage(
        slug,
        activeFolder,
        requestPage,
        15,
        true,
      );
      const newImages = (data?.images || []).map(normalizeServerImage);

      if (newImages.length > 0) {
        setImages((prev) => [...prev, ...newImages]);
      }

      folderCursorRef.current[activeFolder] = {
        page: data?.folderPage || requestPage,
        hasMoreInFolder: !!data?.hasMoreInFolder,
        nextFolder: data?.nextFolder || null,
      };
      loadedFoldersRef.current.add(activeFolder);

      // If this folder becomes exhausted, switch to next folder so the sentinel moves there.
      if (!data?.hasMoreInFolder && data?.nextFolder) {
        const nextFolderObj = foldersRef.current.find(
          (f) => f.name === data.nextFolder,
        );
        if (nextFolderObj)
          setTimeout(() => setSelectedFolder(nextFolderObj), 0);
      }
    } catch (err) {
      console.error("Error loading more images:", err);
    } finally {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fetchingLockRef.current = false;
          observerCooldownRef.current = false;
          setIsFetchingMore(false);
        });
      });
    }
  };

  const activeFolderLoading = selectedFolder?.name
    ? !!folderLoadingByName[selectedFolder.name]
    : false;

  useEffect(() => {
    // Infinite scroll is only for the folder grid (not tag/search mode).
    const isInfiniteScrollEnabled =
      !showFavoritesOnly && !selectedTag && !searchQuery;

    if (!isInfiniteScrollEnabled) return;
    if (!sentinelRef.current) return;
    if (activeFolderLoading) return; // Wait until active folder loader finishes

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !fetchingLockRef.current &&
          !observerCooldownRef.current
        ) {
          observerCooldownRef.current = true;
          loadMoreForInfiniteScroll();
        }
      },
      { rootMargin: "400px" }, // trigger earlier
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, selectedFolder?.name, showFavoritesOnly, selectedTag, searchQuery]);

  // Keep the hero intersection observer
  useEffect(() => {
    if (!heroRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToGallery = () => {
    galleryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadClientFavorites = async (email) => {
    try {
      const response = await getClientFavorites(slug, email);
      if (response.success && response.images) {
        // Extract favorite IDs
        const favoriteIds = new Set(
          response.images.map((img) => img._id || img.id),
        );
        setLikedImages(favoriteIds);
        
        // Also normalize and add the image objects to the images array so they can be displayed in modal
        const normalizedFavorites = response.images.map(normalizeServerImage);
        setImages((prev) => {
          // Merge: don't duplicate if image already exists
          const existingIds = new Set(prev.map((img) => img.id));
          const newFavorites = normalizedFavorites.filter(
            (img) => !existingIds.has(img.id)
          );
          return [...prev, ...newFavorites];
        });
      }
    } catch (error) {
      console.error("Error loading client favorites:", error);
    }
  };

  // Check if PIN verification has expired (15 minutes = 900000 ms)
  const isPinExpired = () => {
    if (!pinVerificationTime) return true;
    const currentTime = Date.now();
    const PIN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
    return currentTime - pinVerificationTime > PIN_EXPIRY_MS;
  };

  // Check if PIN is currently valid
  const isPinVerified = pinVerificationTime && !isPinExpired();

  const handleClientPasswordVerification = async () => {
    if (!pinInput.trim()) {
      setPinError("Please enter PIN");
      return;
    }

    try {
      await verifyClientPassword(slug, pinInput.trim());
      // Store the PIN verification time with timestamp
      setPinVerificationTime(Date.now());
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
      setSuccessMessage(
        "PIN verified! You can now download and favorite images.",
      );
      localStorage.setItem(`pin_verified_${slug}`, JSON.stringify(Date.now()));

      if (pendingDownloadAction) {
        pendingDownloadAction(true);
        setPendingDownloadAction(null);
      }
      if (pendingFavoriteAction) {
        pendingFavoriteAction(null, true);
        setPendingFavoriteAction(null);
      }
      if (pendingGeneralAction) {
        pendingGeneralAction(true);
        setPendingGeneralAction(null);
      }
    } catch (error) {
      setPinError(error.message || "Invalid PIN");
    }
  };

  const handleFolderClick = async (folder) => {
    setShowFavoritesOnly(false);
    setSelectedFolder(folder);

    // If the folder hasn't been loaded yet, show a folder-level loader and fetch first 15.
    if (folder?.name && !loadedFoldersRef.current.has(folder.name)) {
      try {
        await loadFolderFirstPage(folder.name, { showLoader: true });
      } catch (e) {
        console.error("Failed to load folder:", e);
      }
    }

    // Smooth scroll to folder section with offset
    setTimeout(() => {
      const folderEl = document.getElementById(`folder-${folder.id}`);
      if (folderEl) {
        const yOffset = -100; // Account for sticky toolbar
        const y =
          folderEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }, 250);
  };

  const handleLike = async (
    imageId,
    e,
    skipPin = false,
    emailOverride = null,
  ) => {
    if (e) e.stopPropagation();

    // 1. Check if PIN is verified first (if required)
    if (!skipPin && !isPinVerified && galleryPin) {
      setPendingGeneralAction(
        () => (skip) => handleLike(imageId, null, skip, emailOverride),
      );
      setShowPinModal(true);
      return;
    }

    // 2. Check if client email exists
    const targetEmail = emailOverride || clientEmail;
    if (!targetEmail) {
      setPendingFavoriteAction(
        () => (email, skip) => handleLike(imageId, null, skip || true, email),
      );
      setShowEmailModal(true);
      return;
    }

    try {
      const isCurrentlyLiked = likedImages.has(imageId);
      const action = isCurrentlyLiked ? "remove" : "add";

      // Optimistic UI update
      const newLikedImages = new Set(likedImages);
      if (isCurrentlyLiked) {
        newLikedImages.delete(imageId);
      } else {
        newLikedImages.add(imageId);
      }
      setLikedImages(newLikedImages);

      const response = await toggleClientFavorite(slug, imageId, targetEmail);
      if (!response.success) {
        // Rollback on failure
        setLikedImages(likedImages);
        setErrorMessage("Failed to update favorite");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleImageLoad = (imageId, dimensions) => {
    const updateList = (list) =>
      list.map((img) => (img.id === imageId ? { ...img, ...dimensions } : img));

    setImages((prev) => updateList(prev));
    setSearchResults((prev) => updateList(prev));
  };

  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) {
      setEmailError("Please enter your email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    const normalizedEmail = emailInput.trim().toLowerCase();
    setClientEmail(normalizedEmail);
    localStorage.setItem(`client_email_${slug}`, normalizedEmail);
    setShowEmailModal(false);
    setEmailError("");
    setEmailInput("");
    setSuccessMessage("Email saved! You can now favorite your images");

    // Load existing favorites for this email
    await loadClientFavorites(normalizedEmail);

    // Execute pending favorite action if any
    if (pendingFavoriteAction) {
      await pendingFavoriteAction(normalizedEmail);
      setPendingFavoriteAction(null);
    }
  };

  const handleDownload = async (image, e, skipPin = false) => {
    if (e) e.stopPropagation();

    // Check if PIN is valid
    if (!skipPin && !isPinVerified && galleryPin) {
      setPendingDownloadAction(() => (skip) => {
        handleDownload(image, null, skip);
      });
      setShowPinModal(true);
      return;
    }

    // Instead of downloading immediately, show quality modal
    setDownloadTarget(image);
    setShowDownloadQualityModal(true);
  };

  const performDownload = async (image, quality = "high") => {
    try {
      await downloadSingleImage(
        project.id,
        image.id,
        image.alt || "image.jpg",
        quality,
        slug,
      );
      setSuccessMessage("Download started");
    } catch (error) {
      console.error("Error downloading image:", error);
      setErrorMessage("Failed to download image");
    }
  };

  const handleBatchDownload = async (skipPin = false) => {
    if (selectedImages.size === 0) {
      setErrorMessage("Please select images to download");
      return;
    }

    // Check if PIN is valid
    if (!skipPin && !isPinVerified && galleryPin) {
      setPendingDownloadAction(() => (skip) => {
        handleBatchDownload(skip);
      });
      setShowPinModal(true);
      return;
    }

    // Instead of downloading immediately, show quality modal
    setDownloadTarget("batch");
    setShowDownloadQualityModal(true);
  };

  const performBatchDownload = async (
    quality = "high",
    customIdsSet = null,
  ) => {
    try {
      const targetIds = customIdsSet || selectedImages;
      const selectedImageIds = Array.from(targetIds);
      const filteredImages = selectedFolder
        ? images.filter((img) => img.folderName === selectedFolder.name)
        : images;
      // Search through ALL images to resolve IDs properly if we are passing favorites globally
      const searchSource = customIdsSet ? images : filteredImages;
      const photosForDownload = searchSource
        .filter((img) => selectedImageIds.includes(img.id))
        .map((img) => ({ ...img, _id: img.id }));

      await downloadImagesAsZip(selectedImageIds, photosForDownload, quality, slug);
      setSuccessMessage(`Downloading ${selectedImageIds.length} images...`);
      if (!customIdsSet) {
        setSelectedImages(new Set());
        setIsSelectMode(false);
      }
    } catch (error) {
      console.error("Error downloading images:", error);
      setErrorMessage("Failed to download images");
    }
  };

  const handleQualitySelection = () => {
    setShowDownloadQualityModal(false);

    if (downloadTarget === "batch") {
      performBatchDownload(selectedQuality);
    } else if (downloadTarget) {
      performDownload(downloadTarget, selectedQuality);
    }

    setDownloadTarget(null);
  };

  const handleToggleSelect = (imageId, e) => {
    e.stopPropagation();
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleImageClick = (index, e) => {
    if (isSelectMode) {
      const image = filteredImages[index];
      handleToggleSelect(image.id, e);
    } else {
      setLightboxIndex(index);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(`client_email_${slug}`);
    localStorage.removeItem(`pin_verified_${slug}`);
    setClientEmail(null);
    setPinVerificationTime(null);
    setLikedImages(new Set());
    setSuccessMessage("Logged out successfully");
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchExecuted(false);
  };

  const handleProfileClick = (skipPin = false, emailOverride = null) => {
    if (!skipPin && !isPinVerified && galleryPin) {
      setPendingGeneralAction(
        () => (skip) => handleProfileClick(skip, emailOverride),
      );
      setShowPinModal(true);
      return;
    }

    const targetEmail = emailOverride || clientEmail;
    if (!targetEmail) {
      setPendingFavoriteAction(
        () => (email, skip) => handleProfileClick(skip || true, email),
      );
      setShowEmailModal(true);
      return;
    }

    setShowLikedPhotosModal(true);
  };

  const filteredImages = showFavoritesOnly
    ? images.filter((img) => likedImages.has(img.id))
    : selectedTag
      ? images.filter((img) => img.tags && img.tags.includes(selectedTag))
      : images;

  const allTags = [...new Set(images.flatMap((img) => img.tags || []))].sort();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Guard: suppress scroll-spy briefly after user clicks a folder (prevents flickering)
  const userClickedFolderRef = useRef(false);
  const lastSelectedFolderRef = useRef(null);
  const scrollDebounceRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const scrollSettleTimeoutRef = useRef(null);

  // Wrap handleFolderClick's setSelectedFolder to set the guard
  const handleFolderClickWrapped = async (folder) => {
    userClickedFolderRef.current = true;
    lastSelectedFolderRef.current = folder.id;
    lastScrollYRef.current = window.scrollY; // Capture current scroll position at click time
    await handleFolderClick(folder);
    
    // After click, monitor scroll until it settles, then remove guard
    const checkScrollSettled = () => {
      const currentScrollY = window.scrollY;
      const delta = Math.abs(currentScrollY - lastScrollYRef.current);
      
      if (delta < 2) {
        // Scroll has settled (less than 2px movement = animation done)
        // Force set the folder back to the one that was clicked (in case scroll-spy interfered)
        setSelectedFolder(folder);
        userClickedFolderRef.current = false;
        if (scrollSettleTimeoutRef.current) clearTimeout(scrollSettleTimeoutRef.current);
      } else {
        // Still scrolling, check again soon
        lastScrollYRef.current = currentScrollY;
        if (scrollSettleTimeoutRef.current) clearTimeout(scrollSettleTimeoutRef.current);
        scrollSettleTimeoutRef.current = setTimeout(checkScrollSettled, 50); // Check more frequently (50ms)
      }
    };
    
    // Start checking after initial delay for scroll animation to begin
    if (scrollSettleTimeoutRef.current) clearTimeout(scrollSettleTimeoutRef.current);
    scrollSettleTimeoutRef.current = setTimeout(checkScrollSettled, 200); // Start checking sooner
  };

  // Scroll spy for folders — uses topmost-visible strategy with hysteresis to prevent flickering
  useEffect(() => {
    if (showFavoritesOnly || folders.length === 0) return;

    const TOOLBAR_HEIGHT = 140; // sticky toolbar height + padding
    const SWITCH_THRESHOLD = 80; // pixels - must be this much closer to switch folders (hysteresis)

    // Enhanced folder detection with "sticky" behavior to prevent rapid switching
    const pickTopmostFolder = () => {
      // Skip if user just clicked a folder or we're in the middle of fetching
      if (userClickedFolderRef.current) return;
      if (fetchingLockRef.current) return;

      let bestFolder = null;
      let bestDistance = Infinity;
      const currentFolderId = lastSelectedFolderRef.current || selectedFolderRef.current?.id;
      let currentFolderDistance = Infinity;

      // Scan all folders to find best and current positions
      for (const folder of folders) {
        const el = document.getElementById(`folder-${folder.id}`);
        if (!el) continue;

        const rect = el.getBoundingClientRect();

        // Skip folders that are completely scrolled past
        if (rect.bottom < TOOLBAR_HEIGHT) continue;

        // Skip folders that are way below the viewport
        if (rect.top > TOOLBAR_HEIGHT + 500) continue;

        // Calculate distance from toolbar (negative = above toolbar, positive = below)
        const distance = rect.top - TOOLBAR_HEIGHT;

        // Track the currently selected folder's distance
        if (folder.id === currentFolderId) {
          currentFolderDistance = Math.abs(distance);
        }

        // Prefer the folder whose top is closest to toolbar (but not above it)
        // Prioritize folders near the toolbar: abs distance
        const absDistance = Math.abs(distance);

        if (absDistance < bestDistance) {
          bestDistance = absDistance;
          bestFolder = folder;
        }
      }

      // Only switch to a new folder if it's significantly closer (hysteresis)
      if (
        bestFolder &&
        bestFolder.id !== currentFolderId &&
        currentFolderDistance - bestDistance > SWITCH_THRESHOLD // new folder must be > 80px closer
      ) {
        lastSelectedFolderRef.current = bestFolder.id;
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
          setSelectedFolder((prev) =>
            prev?.id !== bestFolder.id ? bestFolder : prev,
          );
        }, 250); // Moderate debounce to batch rapid updates
      }
    };

    const observer = new IntersectionObserver(
      () => {
        // Trigger folder detection when any folder's visibility changes
        pickTopmostFolder();
      },
      {
        rootMargin: "-80px 0px -30% 0px",
        threshold: [0, 0.1, 0.25, 0.5],
      },
    );

    folders.forEach((folder) => {
      const el = document.getElementById(`folder-${folder.id}`);
      if (el) observer.observe(el);
    });

    // Listen to scroll with HEAVY debouncing to prevent rapid recalculation
    const onScroll = () => {
      if (scrollDebounceRef.current) {
        clearTimeout(scrollDebounceRef.current);
      }
      
      scrollDebounceRef.current = setTimeout(() => {
        if (!userClickedFolderRef.current && !fetchingLockRef.current) {
          pickTopmostFolder();
        }
        scrollDebounceRef.current = null;
      }, 200); // Wait 200ms after scroll stops before recalculating
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
      if (scrollSettleTimeoutRef.current) clearTimeout(scrollSettleTimeoutRef.current);
    };
  }, [folders, showFavoritesOnly]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading your gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <X className="h-20 w-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Gallery Not Available
          </h2>
          <p className="text-gray-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Public gallery renders hero from the set coverImage or the first low-res photo.
  const getCoverImageUrl = () => {
    if (!project?.coverImage) return null;
    if (typeof project.coverImage === "string") return project.coverImage;

    if (isMobileDevice) {
      return project.coverImage.mobile || project.coverImage.desktop || null;
    } else {
      return project.coverImage.desktop || project.coverImage.mobile || null;
    }
  };

  const fallbackImage = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920";

  const heroImage =
    getCoverImageUrl() ||
    (images.length > 0 ? images[0].lowResSrc || images[0].thumbSrc : fallbackImage);

  const heroVideoLink = (mediaLinks || []).find((l) => l?.isHero);
  const filmLinks = (mediaLinks || []).filter(
    (l) => !l?.isHero && l?.type === "film",
  );
  const reelLinks = (mediaLinks || []).filter(
    (l) => !l?.isHero && l?.type !== "film",
  );

  return (
    <div className="min-h-screen bg-white">
      {hideScroll && (
        <style>{`
            ::-webkit-scrollbar {
              display: none;
            }
            body {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
      )}
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
      {/* Hero Section - Full Screen with Fade */}
      {showHero && heroImage && (
        <div
          ref={heroRef}
          className={`relative h-screen w-full overflow-hidden transition-opacity duration-1000 ${
            heroVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Background Image with Parallax Effect */}
          <div
            className="absolute inset-0 bg-cover bg-center transform scale-105"
            style={{
              backgroundImage: `url(${heroImage})`,
              filter: "brightness(0.75)",
              transition: "transform 0.3s ease-out",
            }}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

          {/* Animated Content */}
          <div
            className="absolute inset-0 z-10 p-8 md:p-12 flex flex-col justify-between cursor-pointer"
            onClick={scrollToGallery}
          >
            {/* Bottom Left: Title & Date */}
            <div className="mt-auto w-full flex items-end justify-between">
              <div className="flex flex-col text-left">
                <h1
                  className="animate-slideUp drop-shadow-2xl m-0 p-0 text-white"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(24px, 2.67vw, 48px)",
                    letterSpacing: "0.17vw",
                    fontWeight: 400,
                    marginBottom: "1.5vh",
                    lineHeight: "normal",
                    textTransform: "none",
                    animationDelay: "0.4s",
                    animationFillMode: "both",
                    textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
                  }}
                >
                  {project?.title?.toUpperCase()}
                </h1>

                <div
                  className="animate-slideUp drop-shadow-lg text-white"
                  style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: "clamp(12px, 1.07vw, 20px)",
                    letterSpacing: "0.32vw",
                    fontWeight: 400,
                    lineHeight: "18px",
                    textTransform: "uppercase",
                    animationDelay: "0.6s",
                    animationFillMode: "both",
                    textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
                  }}
                >
                  {formatDate(project?.eventDate)}
                </div>
              </div>

              {/* Animated Scroll Indicator (Bottom Right/Center) */}
              <div
                className="animate-bounce mb-4 ml-4"
                style={{ animationDelay: "1s" }}
              >
                <ChevronDown
                  className="text-white opacity-80"
                  size={32}
                  strokeWidth={1.5}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toolbar */}
      <div
        ref={galleryRef}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100"
      >
        <GalleryToolbar
          project={project}
          isSemanticSearchEnabled={Boolean(project?.subscription?.features?.ai_features)}
          folders={folders}
          selectedFolder={selectedFolder}
          onFolderClick={handleFolderClickWrapped}
          showFavoritesOnly={showFavoritesOnly}
          setShowFavoritesOnly={setShowFavoritesOnly}
          setShowLikedPhotosModal={setShowLikedPhotosModal}
          likedImages={likedImages}
          isSelectMode={isSelectMode}
          setIsSelectMode={setIsSelectMode}
          selectedImages={selectedImages}
          handleBatchDownload={handleBatchDownload}
          handleLogout={handleLogout}
          clientEmail={clientEmail}
          onProfileClick={handleProfileClick}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearchResults={(results, query) => {
            const normalizedResults = (results || []).map((r, idx) => ({
              id: r._id || r.id || idx,
              thumbSrc: r.thumb_res_url || r.thumbSrc || null,
              lowResSrc:
                r.low_res_url || r.lowResSrc || r.image_url || r.url || null,
              alt: r.filename || r.alt || r.title || "",
              blurhash: r.blurhash || null,
              folderName: r.folderName || "AllPhotos",
              width: r.width ?? r.dimensions?.width ?? null,
              height: r.height ?? r.dimensions?.height ?? null,
              likedByClients: r.likedByClients || [],
              tags: r.tags || [],
            }));

            setSearchResults(normalizedResults);
            setSearchQuery(query);
            setIsSearchExecuted(!!query);
          }}
          slug={slug}
          images={images}
          allTags={allTags}
          selectedTag={selectedTag}
          setSelectedTag={(tag) => {
            setSelectedTag(tag);
            if (tag) {
              setShowFavoritesOnly(false);
              setSearchQuery("");
              setSearchResults([]);
              setIsSearchExecuted(false);
              setTimeout(() => {
                galleryRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 100);
            }
          }}
          setShowEmailModal={setShowEmailModal}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
          filteredImagesLength={filteredImages.length}
          isPinVerified={isPinVerified}
          galleryPin={galleryPin}
          onRequirePin={(callback) => {
            setPendingGeneralAction(() => callback);
            setShowPinModal(true);
          }}
          onSessionExpired={() => {
            // Clear ALL session data at once
            localStorage.removeItem(`client_email_${slug}`);
            localStorage.removeItem(`pin_verified_${slug}`);
            document.cookie =
              "guest_search_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setClientEmail(null);
            setPinVerificationTime(null);
            setLikedImages(new Set());
            setSearchQuery("");
            setSearchResults([]);
            setErrorMessage(
              "Your session has expired. Please re-enter your PIN to continue.",
            );
            setShowPinModal(true);
          }}
        />

        {/* Masonry Gallery Sections */}
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 pb-20 pt-8"
        style={{ overflowAnchor: "none" }}
        >
          {showFavoritesOnly ? (
            filteredImages.length === 0 ? (
              <div className="masonry-empty">
                <p>No favorite photos yet</p>
              </div>
            ) : (
              <div className="mb-16">
                <h2
                  className="text-2xl font-bold uppercase tracking-widest mb-8 text-gray-900"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  Your Favorites
                </h2>
                <Masonry
                  items={filteredImages}
                  columnGutter={12}
                  columnWidth={280}
                  overscanBy={2}
                  render={({ data: image, index }) => {
                    const isSelected = selectedImages.has(image.id);
                    const isLiked = likedImages.has(image.id);
                    return (
                      <div
                        key={image.id}
                        className="masonry-image-container"
                        onClick={(e) => handleImageClick(index, e)}
                      >
                        <ProgressiveImage
                          thumbSrc={image.thumbSrc}
                          lowResSrc={image.lowResSrc}
                          alt={image.alt}
                          blurhash={image.blurhash}
                          width={image.width}
                          height={image.height}
                          onDimensionsLoad={(dims) =>
                            handleImageLoad(image.id, dims)
                          }
                        />
                        {isSelectMode && (
                          <div
                            className="masonry-checkbox-wrapper"
                            onClick={(e) => handleToggleSelect(image.id, e)}
                          >
                            <div
                              className={`masonry-checkbox ${isSelected ? "selected" : "not-selected"}`}
                            >
                              {isSelected && (
                                <svg
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                          </div>
                        )}
                        {!isSelectMode && (
                          <>
                            <div className="masonry-overlay"></div>
                            <div className="masonry-actions">
                              <button
                                onClick={(e) => handleLike(image.id, e)}
                                className={`masonry-action-btn ${isLiked ? "liked" : "not-liked"}`}
                              >
                                <Heart
                                  size={18}
                                  fill={isLiked ? "currentColor" : "none"}
                                  strokeWidth={2}
                                />
                              </button>
                              <button
                                onClick={(e) => handleDownload(image, e)}
                                className="masonry-action-btn download"
                              >
                                <Download size={18} strokeWidth={2} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            )
          ) : selectedTag || (isSearchExecuted && searchQuery) ? (
            (selectedTag ? filteredImages : searchResults).length > 0 ? (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <h2
                    className="text-2xl font-bold uppercase tracking-widest text-gray-900"
                    style={{ fontFamily: "'Jost', sans-serif" }}
                  >
                    {selectedTag ? `` : "Search Results"}
                  </h2>
                  <button
                    onClick={() => {
                      if (selectedTag) setSelectedTag(null);
                      setSearchResults([]);
                      setSearchQuery("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-900 uppercase tracking-widest font-semibold border-b border-gray-400"
                  >
                    Clear {selectedTag ? "Tag" : "Search"}
                  </button>
                </div>
                <Masonry
                  items={selectedTag ? filteredImages : searchResults}
                  columnGutter={12}
                  columnWidth={280}
                  overscanBy={2}
                  render={({ data: result, index: idx }) => {
                    const fullImage = result;
                    const globalIndex = images.findIndex(
                      (img) => img.id === fullImage.id,
                    );
                    const isSelected = selectedImages.has(fullImage.id);
                    const isLiked = likedImages.has(fullImage.id);

                    return (
                      <div
                        key={fullImage.id || idx}
                        className="masonry-image-container"
                        onClick={(e) =>
                          handleImageClick(
                            globalIndex >= 0 ? globalIndex : idx,
                            e,
                          )
                        }
                      >
                          <ProgressiveImage
                            thumbSrc={fullImage.thumbSrc}
                            lowResSrc={fullImage.lowResSrc}
                            alt={fullImage.alt}
                            blurhash={fullImage.blurhash}
                            width={fullImage.width}
                            height={fullImage.height}
                            onDimensionsLoad={(dims) =>
                              handleImageLoad(fullImage.id, dims)
                            }
                          />
                          {isSelectMode && (
                            <div
                              className="masonry-checkbox-wrapper"
                              onClick={(e) =>
                                handleToggleSelect(fullImage.id, e)
                              }
                            >
                              <div
                                className={`masonry-checkbox ${isSelected ? "selected" : "not-selected"}`}
                              >
                                {isSelected && (
                                  <svg
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          )}
                          {!isSelectMode && (
                            <>
                              <div className="masonry-overlay"></div>
                              <div className="masonry-actions">
                                <button
                                  onClick={(e) => handleLike(fullImage.id, e)}
                                  className={`masonry-action-btn ${isLiked ? "liked" : "not-liked"}`}
                                >
                                  <Heart
                                    size={18}
                                    fill={isLiked ? "currentColor" : "none"}
                                    strokeWidth={2}
                                  />
                                </button>
                                <button
                                  onClick={(e) => handleDownload(fullImage, e)}
                                  className="masonry-action-btn download"
                                >
                                  <Download size={18} strokeWidth={2} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                  }}
                />
              </div>
            ) : (
              <div className="mb-16 min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
                <h2
                  className="text-2xl font-bold uppercase tracking-widest text-gray-900 mb-6"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  No Photos Found
                </h2>
                <p
                  className="text-gray-500 text-xl max-w-2xl leading-relaxed"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: "italic",
                  }}
                >
                  {selectedTag
                    ? `No images found with tag "${selectedTag}".`
                    : searchQuery
                      ? (() => {
                          const messages = [
                            "Sometimes the best moments are just hiding under a different name.",
                            "We couldn't find any photos matching that description. Try another keyword?",
                            "It seems these memories are playing hide and seek.",
                            "No matches found this time. Let's try searching for something else.",
                          ];
                          return (
                            messages[searchQuery.length % messages.length] ||
                            messages[0]
                          );
                        })()
                      : ""}
                </p>
                <button
                  onClick={() => {
                    setSelectedTag(null);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="mt-8 px-8 py-3 bg-gray-900 text-white hover:bg-black uppercase tracking-widest text-xs font-bold transition-colors"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                >
                  Clear {selectedTag ? "Tag" : "Search"}
                </button>
              </div>
            )
          ) : (
            <>
              {/* Hero Video (if set) — after hero image */}
              {heroVideoLink && !selectedTag && !searchQuery && (
                <div className="mt-12 mb-24 px-4">
                  <div className="max-w-6xl mx-auto text-center">
                    <div className="mb-10">
                      <h2
                        className="text-4xl font-light uppercase tracking-[0.3em] text-gray-900 mb-4"
                        style={{ fontFamily: "'Jost', sans-serif" }}
                      >
                        {heroVideoLink.title}
                      </h2>
                      {heroVideoLink.description && (
                        <p
                          className="text-gray-500 text-xl italic max-w-2xl mx-auto leading-relaxed"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          {heroVideoLink.description}
                        </p>
                      )}
                    </div>
                    <VideoEmbed url={heroVideoLink.links?.[0]} type="film" />
                  </div>
                </div>
              )}

              {/* Films Section */}
              {filmLinks.length > 0 && !selectedTag && !searchQuery && (
                <div className="mt-12 mb-20 px-4">
                  <div className="space-y-32">
                    {filmLinks.map((link) => (
                      <div key={link._id} className="scroll-mt-28">
                        <div className="max-w-5xl mx-auto text-center">
                          <div className="mb-10">
                            <h2
                              className="text-4xl font-light uppercase tracking-[0.3em] text-gray-900 mb-4"
                              style={{ fontFamily: "'Jost', sans-serif" }}
                            >
                              {link.title}
                            </h2>
                            {link.description && (
                              <p
                                className="text-gray-500 text-xl italic max-w-2xl mx-auto leading-relaxed"
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                }}
                              >
                                {link.description}
                              </p>
                            )}
                          </div>
                          {(link.links || []).length <= 1 ? (
                            <VideoEmbed url={link.links?.[0]} type="film" />
                          ) : (
                            <div className="w-full flex flex-wrap justify-center gap-10 items-start">
                              {(link.links || []).map((url, idx) => {
                                const cols = Number(link.layout?.columns) || 1;
                                let widthClass = "w-full";
                                if (cols === 2)
                                  widthClass =
                                    "w-full md:w-[calc(50%-1.25rem)]";
                                if (cols === 3)
                                  widthClass =
                                    "w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-1.7rem)]";

                                return (
                                  <div
                                    key={idx}
                                    className={`${widthClass} max-w-[900px]`}
                                  >
                                    <VideoEmbed url={url} type="film" />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reels Section */}
              {reelLinks.length > 0 && !selectedTag && !searchQuery && (
                <div className="mt-12 mb-20 px-4">
                  <div className="space-y-32">
                    {reelLinks.map((link) => (
                      <div key={link._id} className="scroll-mt-28">
                        <div className="w-full">
                          <div className="text-center mb-12">
                            <h2
                              className="text-4xl font-light uppercase tracking-[0.3em] text-gray-900 mb-4"
                              style={{ fontFamily: "'Jost', sans-serif" }}
                            >
                              {link.title}
                            </h2>
                            {link.description && (
                              <p
                                className="text-gray-500 text-xl italic max-w-2xl mx-auto leading-relaxed"
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                }}
                              >
                                {link.description}
                              </p>
                            )}
                          </div>
                          <div className="w-full max-w-6xl mx-auto">
                            <div className="w-full flex flex-wrap justify-center gap-8 items-start">
                              {(link.links || []).map((url, idx) => {
                                const cols = Number(link.layout?.columns) || 2;
                                let widthClass = "w-full";
                                if (cols === 2)
                                  widthClass = "w-full sm:w-[calc(50%-1rem)]";
                                if (cols === 3)
                                  widthClass =
                                    "w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.4rem)]";
                                if (cols === 4)
                                  widthClass =
                                    "w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.4rem)] lg:w-[calc(25%-1.5rem)]";

                                return (
                                  <div
                                    key={idx}
                                    className={`${widthClass} max-w-sm`}
                                  >
                                    <VideoEmbed url={url} type="reels" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Folders Section */}
              {folders.map((folder) => {
                const folderImages = images.filter(
                  (img) => img.folderName === folder.name,
                );
                const isFolderLoading = !!folderLoadingByName[folder.name];
                if (folderImages.length === 0) {
                  if (!isFolderLoading) return null;
                  return (
                    <div
                      key={folder.id}
                      id={`folder-${folder.id}`}
                      className="mb-16 scroll-mt-28 min-h-[50vh]"
                      style={{ overflowAnchor: "none" }}
                    >
                      <h2
                        className="text-xl font-bold uppercase tracking-widest text-center mt-12 mb-8 text-gray-900 pb-2"
                        style={{ fontFamily: "'Jost', sans-serif" }}
                      >
                        {folder.name?.split("/").pop()}
                      </h2>
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={folder.id}
                    id={`folder-${folder.id}`}
                    className="mb-16 scroll-mt-28 min-h-[50vh]"
                  >
                    <h2
                      className="text-xl font-bold uppercase tracking-widest text-center mt-12 mb-8 text-gray-900 pb-2"
                      style={{ fontFamily: "'Jost', sans-serif" }}
                    >
                      {folder.name?.split("/").pop()}
                    </h2>
                    <Masonry
                      items={folderImages}
                      columnGutter={12}
                      columnWidth={280}
                      overscanBy={2}
                      render={({ data: image, index }) => {
                        const globalIndex = images.findIndex(
                          (img) => img.id === image.id,
                        );
                        const isSelected = selectedImages.has(image.id);
                        const isLiked = likedImages.has(image.id);
                        const isLastImage = 
                      folder.name === selectedFolder?.name && 
                      index === folderImages.length - 1 &&
                      !showFavoritesOnly && !selectedTag && !searchQuery;
                        return (
                          <div
                            key={image.id}
                            ref={isLastImage ? lastImageRef : null}  
                            className="masonry-image-container"
                            onClick={(e) =>
                              handleImageClick(
                                showFavoritesOnly ? index : globalIndex,
                                e,
                              )
                            }
                          >
                            <ProgressiveImage
                              thumbSrc={image.thumbSrc}
                              lowResSrc={image.lowResSrc}
                              alt={image.alt}
                              blurhash={image.blurhash}
                              width={image.width}
                              height={image.height}
                              onDimensionsLoad={(dims) =>
                                handleImageLoad(image.id, dims)
                              }
                            />
                            {isSelectMode && (
                              <div
                                className="masonry-checkbox-wrapper"
                                onClick={(e) => handleToggleSelect(image.id, e)}
                              >
                                <div
                                  className={`masonry-checkbox ${isSelected ? "selected" : "not-selected"}`}
                                >
                                  {isSelected && (
                                    <svg
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                </div>
                              </div>
                            )}
                            {!isSelectMode && (
                              <>
                                <div className="masonry-overlay"></div>
                                <div className="masonry-actions">
                                  <button
                                    onClick={(e) => handleLike(image.id, e)}
                                    className={`masonry-action-btn ${isLiked ? "liked" : "not-liked"}`}
                                  >
                                    <Heart
                                      size={18}
                                      fill={isLiked ? "currentColor" : "none"}
                                      strokeWidth={2}
                                    />
                                  </button>
                                  <button
                                    onClick={(e) => handleDownload(image, e)}
                                    className="masonry-action-btn download"
                                  >
                                    <Download size={18} strokeWidth={2} />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      }}
                    />


                  </div>
                );
              })}
              {isFetchingMore && !activeFolderLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
            </div>
          )}
            </>
          )}

          {/* Sentinel is rendered inside the active folder section */}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={filteredImages.map((img) => ({
          src: img.lowResSrc || img.thumbSrc,
          alt: img.alt,
        }))}
        styles={{
          container: { backgroundColor: "rgba(0, 0, 0, 0.95)" },
        }}
        controller={{ closeOnBackdropClick: true }}
      />

      {/* Studio Footer */}


      {/* Liked Photos Modal */}
      <LikedPhotosModal
        showLikedPhotosModal={showLikedPhotosModal}
        setShowLikedPhotosModal={setShowLikedPhotosModal}
        likedImageObjects={images.filter((img) => likedImages.has(img.id))}
        clientEmail={clientEmail}
        handleBatchDownload={async (customIdsSet, quality) => {
          if (!isPinVerified && galleryPin) {
            setPendingDownloadAction(
              () => () => performBatchDownload(quality, customIdsSet),
            );
            setShowPinModal(true);
            return;
          }
          await performBatchDownload(quality, customIdsSet);
        }}
      />

      {/* GalleryModals */}
      <GalleryModals
        showPinModal={showPinModal}
        setShowPinModal={setShowPinModal}
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        setPinError={setPinError}
        setPendingDownloadAction={setPendingDownloadAction}
        setPendingFavoriteAction={setPendingFavoriteAction}
        handleClientPasswordVerification={handleClientPasswordVerification}
        showEmailModal={showEmailModal}
        setShowEmailModal={setShowEmailModal}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        emailError={emailError}
        setEmailError={setEmailError}
        handleEmailSubmit={handleEmailSubmit}
        showDownloadQualityModal={showDownloadQualityModal}
        setShowDownloadQualityModal={setShowDownloadQualityModal}
        selectedQuality={selectedQuality}
        setSelectedQuality={setSelectedQuality}
        handleQualitySelection={handleQualitySelection}
        downloadTarget={downloadTarget}
        clientEmail={clientEmail}
      />

      {/* Google Photos Success/Error Modals */}
      <GooglePhotosSuccessModal
        isOpen={!!googlePhotosSuccessInfo}
        onClose={() => setGooglePhotosSuccessInfo(null)}
        email={googlePhotosSuccessInfo?.email}
        count={googlePhotosSuccessInfo?.count}
      />
      <GooglePhotosErrorModal
        isOpen={!!googlePhotosError}
        onClose={() => setGooglePhotosError(null)}
        errorMsg={googlePhotosError}
      />
    </div>
  );
};
