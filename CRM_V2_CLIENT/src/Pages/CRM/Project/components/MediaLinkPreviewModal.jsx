import React from "react";
import { X, Film, PlayCircle } from "lucide-react";

const MediaLinkPreviewModal = ({ isOpen, onClose, link }) => {
  if (!isOpen || !link) return null;

  const isFilm = link.type === "film";
  const links = link.links || [];

  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${ytMatch[2]}?autoplay=1`;
    }

    // Vimeo
    const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const vimeoMatch = url.match(vimeoRegExp);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    }

    // fallback - just return the url if it's already an embed link
    if (url.includes('embed')) return url;
    
    return url;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isFilm ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
            {isFilm ? <Film size={20} /> : <PlayCircle size={20} />}
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{link.title}</h3>
            {link.description && <p className="text-gray-400 text-xs mt-1">{link.description}</p>}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all hover:rotate-90 active:scale-95 border border-white/10 shadow-lg"
        >
          <X size={24} />
        </button>
      </div>

      <div className="w-full h-full p-4 md:p-12 lg:p-20 flex items-center justify-center">
        {isFilm ? (
          /* Film View - Large centered video */
          <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 relative group">
            <iframe
              src={getEmbedUrl(links[0])}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={link.title}
            />
          </div>
        ) : (
          /* Reels View - Scrollable list / grid */
          <div className="w-full h-full flex flex-col items-center justify-center gap-8 overflow-hidden pt-16">
            <div className="flex flex-wrap items-center justify-center gap-6 overflow-y-auto max-h-full w-full pb-12 custom-scrollbar px-4">
              {links.map((url, idx) => (
                <div 
                  key={idx} 
                  className="w-full max-w-[320px] aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02] duration-300 flex-shrink-0"
                >
                   <iframe
                    src={getEmbedUrl(url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${link.title} - ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-white/40 text-[10px] uppercase tracking-widest font-bold">
              <span>{links.length} Videos</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Scroll to view all</span>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
};

export default MediaLinkPreviewModal;
