import React, { useState, useEffect,useRef } from "react";
import { Search, Download, Share2, Heart, User, ChevronDown, Check, Copy,X,Loader2, LogOut } from "lucide-react";
import { downloadImagesAsZip, publicSearchImages } from "../../services/galleryService";

export const GalleryToolbar = ({
  slug,
  project,
  folders,
  selectedFolder,
  onFolderClick,
  showFavoritesOnly,
  setShowFavoritesOnly,
  setShowLikedPhotosModal,
  filteredImagesLength,
  likedImages,
  images,
  setSuccessMessage,
  setErrorMessage,
  isSelectMode,
  setIsSelectMode,
  selectedImages,
  setSelectedImages,
  handleBatchDownload,
  onSearchResults,
  clientEmail,
  setShowEmailModal,
  handleLogout,
  isPinVerified,
  galleryPin,
  onRequirePin,
  onSessionExpired,
  allTags = [],
  selectedTag = null,
  setSelectedTag,
  searchQuery,
  setSearchQuery,
  onFolderVisible,
  onProfileClick,
  isSemanticSearchEnabled = true,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery || "");

  // Sync local query when prop changes (e.g. from parent clearing)
  useEffect(() => {
    setLocalQuery(searchQuery || "");
  }, [searchQuery]);

  const handleSearch = async (skipPinCheck = false) => {
    if (!localQuery.trim()) {
      onSearchResults([], "");
      return;
    }

    if (!isSemanticSearchEnabled) {
      setErrorMessage("Semantic search is available on Pro and Pro Max plans.");
      return;
    }
    
    if (!skipPinCheck && !isPinVerified && galleryPin) {
      onRequirePin(() => handleSearch(true));
      return;
    }
    
    setIsSearching(true);
    try {
      // Assuming projectId is passed from parent
      const results = await publicSearchImages(project?.id, localQuery);
      onSearchResults(results, localQuery);
    } catch (err) {
      if (err.code === "SESSION_EXPIRED" && onSessionExpired) {
        onSessionExpired();
      } else {
        console.error(err);
        setErrorMessage(err.message || "Failed to search images");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchActive(false);
    onSearchResults([], "");
  };

  const handleFavoritesDownload = async (skipPinCheck = false) => {
    if (!skipPinCheck && !isPinVerified && galleryPin) {
      onRequirePin(() => handleFavoritesDownload(true));
      return;
    }

    try {
      const favoriteImageIds = Array.from(likedImages);
      const favoritesForDownload = images
        .filter((img) => favoriteImageIds.includes(img.id))
        .map((img) => ({ ...img, _id: img.id }));

      await downloadImagesAsZip(
        favoriteImageIds,
        favoritesForDownload,
        "high",
        slug
      );
      setSuccessMessage(`Downloading ${favoriteImageIds.length} favorites...`);
    } catch (error) {
      console.error("Error downloading favorites:", error);
      setErrorMessage("Failed to download favorites");
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200" style={{ fontFamily: "'PT Sans', sans-serif" }}>
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8 h-[76px] flex items-center justify-between">
          
          {/* Left Side: Studio Info & Navigation */}
          <div className={`items-center h-full flex-grow ${isSearchActive ? 'hidden sm:flex' : 'flex'}`}>
            {/* Studio Info */}
            <div className="flex flex-col justify-center mr-4 sm:mr-12 min-w-max">
              <span className="text-[10px] text-gray-400 font-bold tracking-[1.5px] uppercase leading-tight">
                Photos By
              </span>
              <span className="text-[12px] text-gray-400 font-bold tracking-[1.5px] uppercase leading-tight mt-0.5">
                {project?.studioName || ""}
              </span>
            </div>

            {/* Folder Navigation */}
            <div className="hidden lg:flex items-center h-full overflow-hidden flex-grow">
              <div className="flex items-center gap-8 h-full overflow-x-auto scrollbar-hide">
                {folders.map((folder) => {
                  const isActive = selectedFolder?.id === folder.id && !showFavoritesOnly;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => {
                      onFolderClick(folder);
                    }}
                      className={`h-full shrink-0 flex items-center whitespace-nowrap text-[13px] tracking-[1.5px] font-semibold uppercase transition-colors relative`}
                      style={{ color: isActive ? '#000' : '#bbbbbb' }}
                    >
                      {folder.name?.split("/").pop()}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Action Icons */}
          <div className={`flex items-center ${isSearchActive ? 'gap-3 sm:gap-6 w-full sm:w-auto' : 'gap-4 sm:gap-6'} h-full flex-shrink-0 ml-auto transition-all`}>
            {/* Search Input */}
            <div className={`transition-all duration-300 flex items-center ${isSearchActive ? 'flex-1 sm:flex-none sm:w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-3 pr-8 py-1 text-sm border-b border-gray-300 focus:border-gray-900 focus:outline-none bg-transparent transition-colors"
                  style={{ fontFamily: "'Jost', sans-serif" }}
                />
                {searchQuery && (
                  <button 
                    onClick={handleClearSearch}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 p-1"
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>

            {/* Search Toggle / Execute Button */}
            <div className={`relative group ${!isSemanticSearchEnabled ? 'cursor-not-allowed' : ''}`}>
              <button 
                className={`text-gray-400 transition-colors ${isSemanticSearchEnabled ? 'hover:text-gray-900' : 'opacity-70'}`}
                onClick={() => {
                  if (!isSearchActive) {
                    if (!isSemanticSearchEnabled) {
                      setErrorMessage("Semantic search is available on Pro and Pro Max plans.");
                      return;
                    }
                    const activateSearch = (skip = false) => {
                      setIsSearchActive(true);
                    };
                    if (!isPinVerified && galleryPin) {
                      onRequirePin(() => activateSearch(true));
                      return;
                    }
                    activateSearch();
                  } else if (localQuery.trim()) {
                    handleSearch();
                  } else {
                     setIsSearchActive(false);
                  }
                }}
                disabled={isSearching || !isSemanticSearchEnabled}
                aria-describedby={!isSemanticSearchEnabled ? 'semantic-search-premium-tip' : undefined}
              >
                {isSearching ? <Loader2 className="w-[20px] h-[20px] animate-spin" /> : <Search className="w-[20px] h-[20px]" strokeWidth={1.5} />}
              </button>

              {!isSemanticSearchEnabled && (
                <div
                  id="semantic-search-premium-tip"
                  role="tooltip"
                  className="pointer-events-none absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Premium feature</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">Semantic search is available on Pro and Pro Max plans.</div>
                </div>
              )}
            </div>

            {/* Favorites (Heart) */}
            <button 
               className={`transition-colors relative ${showFavoritesOnly ? "text-gray-900" : "text-gray-400 hover:text-gray-900"}`}
               onClick={() => {
                  if (showFavoritesOnly) {
                    setShowFavoritesOnly(false);
                  } else if (likedImages && likedImages.size > 0) {
                    setShowLikedPhotosModal(true);
                  } else {
                    onProfileClick();
                  }
               }}
            >
              <Heart className="w-[22px] h-[22px]" strokeWidth={1} fill={showFavoritesOnly ? "currentColor" : "none"} />
              {likedImages && likedImages.size > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none border border-white">
                  {likedImages.size}
                </span>
              )}
            </button>
            
            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 mx-1"></div>

            {/* User Profile */}
            {clientEmail ? (
              <div className="flex items-center gap-2 group">
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
                  title={clientEmail}
                  onClick={onProfileClick}
                >
                  <div className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                    {clientEmail.charAt(0)}
                  </div>
                  <span className="text-[11px] font-bold tracking-wider text-gray-700 uppercase hidden sm:block max-w-[120px] truncate">
                    {clientEmail.split('@')[0]}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="text-gray-400 hover:text-gray-900 transition-colors"
                onClick={onProfileClick}
              >
                 <User className="w-[22px] h-[22px]" strokeWidth={1} />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation (Scrollable) */}
        {folders.length > 0 && (
          <div className="lg:hidden px-4 h-12 flex items-center overflow-x-auto scrollbar-hide border-t border-gray-100">
            <div className="flex items-center gap-6 w-max">
              {folders.map((folder) => {
                const isActive = selectedFolder?.id === folder.id && !showFavoritesOnly;

                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onFolderClick(folder);
                    }}
                    className={`h-12 flex items-center whitespace-nowrap text-[12px] tracking-[1.5px] font-medium uppercase transition-colors relative`}
                    style={{ color: isActive ? '#000' : '#bbbbbb' }}
                  >
                    {folder.name?.split("/").pop()}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Global Tags Bar */}
      {allTags.length > 0 && (
        <div className="bg-gray-50/50 border-b border-gray-100 py-3 overflow-hidden">
          <div className="max-w-[1920px] mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[1px] mr-2 shrink-0">Tags:</span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all shrink-0 ${
                  !selectedTag 
                    ? "bg-gray-900 text-white shadow-sm" 
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-900 hover:text-gray-900"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all shrink-0 ${
                    selectedTag === tag 
                      ? "bg-gray-900 text-white shadow-sm" 
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-900 hover:text-gray-900"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Mode / Filter Info Bar */}
      {(isSelectMode || showFavoritesOnly) && (
        <div className="max-w-[1920px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between border-b border-gray-100 bg-white shadow-sm z-30 relative" style={{ fontFamily: "'PT Sans', sans-serif" }}>
           <div className="flex items-center gap-4">
             {showFavoritesOnly && (
               <button
                 onClick={() => setShowFavoritesOnly(false)}
                 className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
               >
                 ← Back to Gallery
               </button>
             )}
             <span className="text-[13px] text-gray-500 uppercase tracking-widest font-semibold">
                {showFavoritesOnly ? "Your Favorites • " : ""}
                {filteredImagesLength} Photo{filteredImagesLength !== 1 ? "s" : ""}
             </span>
           </div>
           
           <div className="flex items-center gap-3">
             {showFavoritesOnly && likedImages.size > 0 && (
                <button
                  onClick={() => handleFavoritesDownload()}
                  className="px-6 py-2.5 bg-gray-900 text-white hover:bg-black transition-colors text-[11px] font-bold tracking-[2px] uppercase"
                >
                  Download All ({likedImages.size})
                </button>
             )}

             {!showFavoritesOnly && (
               <button
                 onClick={() => {
                   setIsSelectMode(!isSelectMode);
                   if (isSelectMode) setSelectedImages(new Set());
                 }}
                 className="px-6 py-2.5 bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors text-[11px] font-bold tracking-[2px] uppercase"
               >
                 {isSelectMode ? "Cancel Select" : "Select Photos"}
               </button>
             )}

             {isSelectMode && selectedImages.size > 0 && (
               <button
                 onClick={handleBatchDownload}
                 className="px-6 py-2.5 bg-gray-900 text-white hover:bg-black transition-colors text-[11px] font-bold tracking-[2px] uppercase"
               >
                 Download ({selectedImages.size})
               </button>
             )}
           </div>
        </div>
      )}
    </>
  );
};
