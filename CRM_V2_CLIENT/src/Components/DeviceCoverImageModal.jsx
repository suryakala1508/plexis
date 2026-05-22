import React, { useEffect, useState } from 'react';
import { Loader, Smartphone, Monitor } from 'lucide-react';

/**
 * Modal for selecting which device type (mobile/desktop) to set a cover image for.
 * Validates image suitability based on aspect ratio.
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Function to call when closing the modal
 * @param {function} onSelect - Function to call when a device is selected: (deviceType) => void
 * @param {object} image - Image object with image_url/url property
 * @param {boolean} isLoading - Whether the operation is loading
 */
export const DeviceCoverImageModal = ({
  isOpen,
  onClose,
  onSelect,
  image,
  isLoading = false,
}) => {
  const [show, setShow] = useState(false);
  const [dimensions, setDimensions] = useState(null);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
      validateImageDimensions();
    } else {
      setShow(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, image]);

  const validateImageDimensions = async () => {
    setValidating(true);
    try {
      const imageUrl = image?.image_url || image?.url;
      
      if (!imageUrl) {
        setDimensions(null);
        setValidating(false);
        return;
      }

      // If we already have dimensions in the object, use them
      if (image?.width && image?.height) {
        setDimensions({ width: image.width, height: image.height });
        setValidating(false);
        return;
      }

      // Otherwise load the image to get natural dimensions
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setValidating(false);
      };
      img.onerror = () => {
        setDimensions(null);
        setValidating(false);
      };
      img.src = imageUrl;
    } catch (error) {
      console.error("Error validating image dimensions:", error);
      setDimensions(null);
      setValidating(false);
    }
  };

  const isSuitableForDesktop = () => {
    if (!dimensions) return null;
    const ratio = dimensions.height / dimensions.width;
    // Desktop: landscape (ratio <= 1.2)
    return ratio <= 1.2;
  };

  const isSuitableForMobile = () => {
    if (!dimensions) return null;
    const ratio = dimensions.height / dimensions.width;
    // Mobile: portrait (ratio > 1.2)
    return ratio > 1.2;
  };

  const desktopSuitable = isSuitableForDesktop();
  const mobileSuitable = isSuitableForMobile();

  if (!isOpen) return null;



  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto" aria-labelledby="device-modal-title" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          show ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal content */}
      <div className={`flex min-h-full items-center justify-center p-4 transition-all duration-300 ${show ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
          <h3 className="text-lg font-medium leading-6 text-gray-900" id="device-modal-title">
            Select Device for Cover Image
          </h3>

          {validating ? (
            <div className="mt-6 flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Validating image...</span>
            </div>
          ) : (
            <>

              <div className="mt-6 space-y-3">
                {/* Desktop Option */}
                <button
                  onClick={() => desktopSuitable && onSelect('desktop')}
                  disabled={!desktopSuitable || isLoading}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    desktopSuitable
                      ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                      : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-gray-700" />
                      <div>
                        <p className="font-semibold text-gray-900">Desktop/Laptop</p>
                        <p className="text-xs text-gray-600">Landscape (wider) format</p>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Mobile Option */}
                <button
                  onClick={() => mobileSuitable && onSelect('mobile')}
                  disabled={!mobileSuitable || isLoading}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    mobileSuitable
                      ? 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer'
                      : 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-gray-700" />
                      <div>
                        <p className="font-semibold text-gray-900">Mobile</p>
                        <p className="text-xs text-gray-600">Portrait (taller) format</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {dimensions && (
                <p className="mt-4 text-center text-xs text-gray-500">
                  Image ratio: {dimensions.width} × {dimensions.height}
                </p>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
