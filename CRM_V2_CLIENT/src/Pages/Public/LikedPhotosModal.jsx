import React, { useState, useEffect } from "react";
import { X, CheckCircle, Circle, Download, Loader2 } from "lucide-react";

export const LikedPhotosModal = ({
  showLikedPhotosModal,
  setShowLikedPhotosModal,
  likedImageObjects,
  handleBatchDownload,
  clientEmail,
}) => {
  // We'll manage a local set of selected images for batch actions natively within the modal
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [isDownloadingWeb, setIsDownloadingWeb] = useState(false);
  const [isDownloadingHigh, setIsDownloadingHigh] = useState(false);

  useEffect(() => {
    if (showLikedPhotosModal) {
      // By default, select all liked photos when opening the modal
      const allIds = new Set(likedImageObjects.map((img) => img.id || img._id));
      setSelectedPhotos(allIds);
    }
  }, [showLikedPhotosModal, likedImageObjects]);

  if (!showLikedPhotosModal) return null;

  const handleToggleSelect = (id) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPhotos(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(likedImageObjects.map((img) => img.id || img._id));
    setSelectedPhotos(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  // Prepare array of URLs for the selected images to pass to Google Photos
  const selectedUrls = likedImageObjects
    .filter((img) => selectedPhotos.has(img.id || img._id))
    .map((img) => img.src || img.url || img.image_url);

  // We wrap batch downloads to pass the exact Set of IDs we want
  const onDownloadWebSize = async () => {
      setIsDownloadingWeb(true);
      try {
        await handleBatchDownload(selectedPhotos, "web");
      } finally {
        setIsDownloadingWeb(false);
      }
  }

  const onDownloadHighRes = async () => {
       setIsDownloadingHigh(true);
       try {
         await handleBatchDownload(selectedPhotos, "high");
       } finally {
         setIsDownloadingHigh(false);
       }
  }

  return (
    <div className="fixed inset-0 z-[100] flex bg-black/40 backdrop-blur-sm p-4 sm:p-8 md:p-12 overflow-hidden" style={{ fontFamily: "'PT Sans', sans-serif" }}>
      <div className="bg-white rounded-xl shadow-2xl w-full h-full flex flex-col overflow-hidden relative">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-xl tracking-[2px] font-semibold text-gray-700 uppercase">
            View Favorites
          </h2>
          <button
            onClick={() => setShowLikedPhotosModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" strokeWidth={1.5} />
          </button>
        </div>

        {/* Modal Body: Two Column Layout */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-gray-50/50 overflow-y-auto md:overflow-hidden">
          
          {/* Left Sidebar Actions */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 bg-white p-6 shrink-0 overflow-visible md:overflow-y-auto">
            <div className="flex flex-col gap-4 sticky top-0">
              <button 
                onClick={onDownloadWebSize}
                disabled={selectedPhotos.size === 0 || isDownloadingWeb}
                className="w-full bg-[#3d3d3d] hover:bg-black text-white px-4 py-4 uppercase text-[11px] tracking-[1.5px] font-bold text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloadingWeb && <Loader2 size={14} className="animate-spin" />}
                {isDownloadingWeb ? "Preparing Download..." : "Download Photos - Web-Size"}
              </button>
              
              <button 
                onClick={onDownloadHighRes}
                disabled={selectedPhotos.size === 0 || isDownloadingHigh}
                className="w-full border-2 border-[#e6e6e6] hover:border-gray-400 text-gray-800 px-4 py-4 uppercase text-[11px] tracking-[1.5px] font-bold text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white flex items-center justify-center gap-2"
              >
                {isDownloadingHigh && <Loader2 size={14} className="animate-spin" />}
                {isDownloadingHigh ? "Preparing Download..." : "Download Photos - High-Res"}
              </button>

               {/* <SaveToGooglePhotos 
                  imageUrl={selectedUrls} 
                  clientEmail={clientEmail}
                  disabled={selectedPhotos.size === 0}
                  className="w-full border-2 border-blue-500 hover:bg-blue-50 text-blue-600 px-4 py-4 uppercase text-[11px] tracking-[1.5px] font-bold text-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Save To Google Photos
               </SaveToGooglePhotos> */}

              <div className="mt-6 text-sm text-gray-600 font-medium">
                {selectedPhotos.size} Photo{selectedPhotos.size !== 1 && "s"} selected
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#fafafa]">
             {/* Action Bar */}
             <div className="flex flex-wrap items-center gap-6 px-8 py-4 border-b border-gray-200 bg-white shrink-0">
                <span className="text-sm tracking-widest text-gray-500 font-semibold uppercase">My Favorites</span>
                
                <div className="h-4 w-px bg-gray-300"></div>
                
                <button 
                  onClick={handleDeselectAll}
                  className="text-xs text-gray-400 hover:text-gray-700 tracking-widest uppercase transition-colors flex items-center gap-1.5"
                >
                  <X size={14} /> Remove All
                </button>
                
                <button 
                  onClick={handleSelectAll}
                  className="text-xs text-gray-400 hover:text-gray-700 tracking-widest uppercase transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle size={14} /> Add all photos
                </button>
             </div>

             {/* Grid View */}
             <div className="flex-1 overflow-visible md:overflow-y-auto p-4 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                  {likedImageObjects.map((img) => {
                    console.log("the image",img)
                    const id = img.id || img._id;
                    const isSelected = selectedPhotos.has(id);
                    const imgSrc = img.lowResSrc;
                    
                    return (
                      <div 
                        key={id} 
                        onClick={() => handleToggleSelect(id)}
                        className={`relative aspect-[3/4] cursor-pointer group rounded-sm overflow-hidden border-4 transition-all ${isSelected ? 'border-gray-500' : 'border-transparent hover:border-gray-200'}`}
                        style={{ backgroundColor: '#f0f0f0' }}
                      >
                        <img 
                          src={imgSrc} 
                          alt={img.filename || "Favorite"} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        
                        {/* Selection status indicator (bottom left) */}
                        <div className="absolute bottom-2 left-2 z-10 drop-shadow-md">
                           {isSelected ? (
                             <div className="bg-[#3d3d3d] rounded-full p-0.5 border border-white">
                               <CheckCircle size={18} className="text-white bg-[#3d3d3d] rounded-full" />
                             </div>
                           ) : (
                              <Circle size={22} className="text-white opacity-60 group-hover:opacity-100 transition-opacity" />
                           )}
                        </div>
                        
                        {/* Overlay to dim unselected slightly on hover */}
                        <div className={`absolute inset-0 bg-black/10 transition-opacity ${isSelected ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}></div>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
