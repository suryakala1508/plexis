import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { publicSearchImages } from '@/services/galleryService';

const SearchSidebar = ({ isOpen, onClose, projectId, onSearchResults, isSemanticSearchEnabled = true }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (!isSemanticSearchEnabled) {
      setErrorMsg('Semantic search is available on Pro and Pro Max plans.');
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);
    try {
      const results = await publicSearchImages(projectId, query);
      onSearchResults(results);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to search images");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setErrorMsg(null);
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-[9999] transition-opacity duration-300"
        onClick={onClose}
      />
      <div 
        className="fixed top-0 left-0 h-full w-[100vw] sm:w-[500px] bg-white z-[10000] shadow-2xl flex flex-col transition-transform duration-300 transform translate-x-0"
        style={{ fontFamily: "'Jost', sans-serif" }}
      >
        
        {/* Close Button top-left */}
        <button 
          onClick={onClose}
          className="absolute top-6 left-6 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X size={24} className="text-gray-400" strokeWidth={1.5} />
        </button>

        {/* Using user requested layout */}
        <div className="flex-1 overflow-y-auto w-full pt-20 px-10 sm:px-14">
          <div className="gallerySidePanelText">
            
            <div className="searchCaption text-2xl uppercase tracking-[2px] mb-12 text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Search by keywords
            </div>
            
            <div className="searchInput relative mb-8">
              <input
                id="searchInput"
                autoComplete="off"
                className="w-full border-b border-gray-300 pb-3 text-[15px] focus:outline-none focus:border-black transition-colors"
                placeholder="E.g.: group photo, happy, sunset"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                enterKeyHint="search"
                style={{ fontFamily: "'Jost', sans-serif" }}
              />
              
              <div className="absolute right-0 bottom-3 flex items-center gap-2 bg-white">
                {query && (
                  <button onClick={handleClear} className="text-gray-400 hover:text-gray-900 transition-colors p-1 bg-white">
                    <X size={18} strokeWidth={1.5} />
                  </button>
                )}
                
                <button onClick={handleSearch} disabled={isSearching || !isSemanticSearchEnabled} className="text-gray-400 hover:text-gray-900 transition-colors p-1 bg-white disabled:opacity-50">
                   {isSearching ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Search size={18} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
            
            <div className="searchDescriptionWrapper text-[14px] text-gray-400 leading-relaxed font-light tracking-wide space-y-4">
              <div>Explore gallery photos with search based on keywords.</div>
              <div>E.g.: Dress, smile, flowers, black and white, emotional, having fun, walking down the aisle.</div>
            </div>

            {errorMsg && (
              <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-md text-sm">
                {errorMsg}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchSidebar;
