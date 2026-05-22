import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Info,
} from "lucide-react";
import { PermissionGate } from "@/Pages/utils/permissions";
import { ProgressiveImage } from "./ProgressiveImage";

const ImageViewerModal = ({
  images = [],
  initialIndex = 0,
  currentIndex: currentIndexProp,
  isOpen = false,
  open: openProp,
  onClose,
  onLike,
  onFavorite,
  onDownload,
  likedImages = new Set(),
  favoriteImages,
  allowDownload = true,
}) => {
  const isOpenResolved = openProp !== undefined ? openProp : isOpen;
  const initialIndexResolved = currentIndexProp !== undefined ? currentIndexProp : initialIndex;
  const onLikeResolved = onFavorite || onLike;
  const likedImagesResolved = favoriteImages || likedImages;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndexResolved);
    setZoom(1);
    setRotation(0);
    setRotation(0);
  }, [initialIndexResolved, isOpenResolved]);

  useEffect(() => {
    if (!isOpenResolved) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpenResolved, currentIndex]);

  if (!isOpenResolved || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const likedSet = likedImagesResolved instanceof Set ? likedImagesResolved : new Set(likedImagesResolved || []);
  const isLiked = likedSet.has((currentImage._id || currentImage.id)?.toString()) || currentImage.likedByOwner === true;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
      setRotation(0);
      setRotation(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
      setRotation(0);
      setRotation(0);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentImage.image_url || currentImage.url;
    link.download = currentImage.filename || `image-${currentIndex + 1}.jpg`;
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentImage.filename || "Image",
          url: currentImage.image_url || currentImage.url,
        });
      } catch (error) {
        alert("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(
        currentImage.image_url || currentImage.url
      );
      alert("Link copied to clipboard!");
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    const elem = document.querySelector(".image-viewer-container");
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm image-viewer-container">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4">
          {/* Left: Image Counter */}
          <div className="flex items-center gap-4">
            <div className="text-white font-medium">
              {currentIndex + 1} / {images.length}
            </div>
            {currentImage.filename && (
              <div className="text-white/80 text-sm hidden md:block truncate max-w-xs">
                {currentImage.filename}
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <PermissionGate page="4" component="4_3" action="edit">
              <button
                onClick={(e) => onLikeResolved && onLikeResolved(currentImage, e)}
                className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white"
                title="Like"
              >
                <Heart
                  size={20}
                  className={isLiked ? "fill-red-500 text-red-500" : ""}
                />
              </button>

              {allowDownload && (
                <button
                  onClick={(e) =>
                    onDownload ? onDownload(currentImage, e) : handleDownload()
                  }
                  className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white"
                  title="Download"
                >
                  <Download size={20} />
                </button>
              )}
            </PermissionGate>

            <button
              onClick={handleShare}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white"
              title="Share"
            >
              <Share2 size={20} />
            </button>

            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white"
              title="Info"
            >
              <Info size={20} />
            </button>

            <div className="h-6 w-px bg-white/20 mx-1" />

            <button
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-red-500/80 backdrop-blur-sm rounded-lg transition-all text-white"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-28">
        <div 
          className="w-full h-full max-w-full max-h-full"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          <ProgressiveImage
            thumbSrc={currentImage.thumb_res_url}
            lowResSrc={currentImage.low_res_url}
            originalSrc={currentImage.image_url || currentImage.url}
            blurhash={currentImage.blurhash}
            alt={currentImage.filename || currentImage.alt}
            objectFit="contain"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-white z-10"
          title="Previous (←)"
        >
          <ChevronLeft size={32} strokeWidth={2.5} />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all text-white z-10"
          title="Next (→)"
        >
          <ChevronRight size={32} strokeWidth={2.5} />
        </button>
      )}

      {/* Bottom Bar - Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4">
          {/* Left: Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>

            <span className="text-white text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>

            <button
              onClick={handleRotate}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white ml-2"
              title="Rotate"
            >
              <RotateCw size={18} />
            </button>

            <button
              onClick={handleFullscreen}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-white"
              title="Fullscreen"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Right: Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto mx-4 scrollbar-hide">
            {images
              .slice(Math.max(0, currentIndex - 2), currentIndex + 3)
              .map((img, idx) => {
                const actualIndex = Math.max(0, currentIndex - 2) + idx;
                return (
                  <button
                    key={img._id || img.id || idx}
                    onClick={() => {
                      setCurrentIndex(actualIndex);
                      setZoom(1);
                      setRotation(0);
                    }}
                    className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      actualIndex === currentIndex
                        ? "ring-2 ring-white scale-110"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <ProgressiveImage
                      thumbSrc={img.thumb_res_url}
                      lowResSrc={img.low_res_url}
                      originalSrc={img.image_url || img.url}
                      blurhash={img.blurhash}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="absolute right-4 top-20 w-80 bg-black/90 backdrop-blur-sm rounded-lg p-4 text-white border border-white/10">
          <h3 className="font-semibold text-lg mb-3">Image Details</h3>
          <div className="space-y-2 text-sm">
            {currentImage.filename && (
              <div>
                <span className="text-white/60">Filename:</span>
                <p className="truncate">{currentImage.filename}</p>
              </div>
            )}
            {currentImage.folderName && (
              <div>
                <span className="text-white/60">Folder:</span>
                <p className="truncate">{currentImage.folderName}</p>
              </div>
            )}
            <div>
              <span className="text-white/60">Position:</span>
              <p>
                {currentIndex + 1} of {images.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageViewerModal;
