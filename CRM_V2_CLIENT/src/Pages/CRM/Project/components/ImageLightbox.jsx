import React from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export const ImageLightbox = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
  onGoToImage,
}) => {
  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowLeft":
        onPrevious();
        break;
      case "ArrowRight":
        onNext();
        break;
      default:
        break;
    }
  };

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
      >
        <X size={24} />
      </button>

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Main image */}
      <div className="max-w-full max-h-full p-4">
        <img
          src={currentImage.image_url || currentImage.url}
          alt={currentImage.filename || currentImage.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Thumbnail strip (optional) */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
          {images.map((image, index) => (
            <button
              key={image._id || image.id || index}
              onClick={() => onGoToImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                index === currentIndex
                  ? "border-white"
                  : "border-gray-500 hover:border-gray-300"
              } overflow-hidden`}
            >
              <img
                src={image.image_url || image.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
