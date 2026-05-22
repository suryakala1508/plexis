import React, { useMemo, useState, useEffect } from "react";
import { X, Plus, Trash2, Film, PlayCircle, Loader2, Link as LinkIcon } from "lucide-react";

const MediaLinksModal = ({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  context = "collections", // 'collections' | 'filmsReels'
  isHeroMode = false,
}) => {
  const [type, setType] = useState("film");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState([""]);
  const [layoutColumns, setLayoutColumns] = useState(1);
  const [loading, setLoading] = useState(false);

  const isFilmsReelsContext = context === "filmsReels";
  const supportsMultiLinks = isFilmsReelsContext && !isHeroMode;
  const showLayoutPicker = supportsMultiLinks;

  const layoutOptions = useMemo(() => {
    if (type === "film") {
      // Films: 1–3 columns
      return [
        { columns: 1, label: "1 column", hint: "Single focal video per row" },
        { columns: 2, label: "2 columns", hint: "Side‑by‑side showcase" },
        { columns: 3, label: "3 columns", hint: "Compact film grid" },
      ];
    }
    // Reels: 2–4 columns
    return [
      { columns: 2, label: "2 columns", hint: "Larger reels, easier to view" },
      { columns: 3, label: "3 columns", hint: "Balanced grid for reels" },
      { columns: 4, label: "4 columns", hint: "Dense grid for many reels" },
    ];
  }, [type]);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || "film");
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setLinks(initialData.links && initialData.links.length > 0 ? [...initialData.links] : [""]);
      setLayoutColumns(
        initialData.layout?.columns ||
          (initialData.type === "reels" ? 2 : 1)
      );
    } else {
      setType(isHeroMode ? "film" : "film");
      setTitle("");
      setDescription("");
      setLinks([""]);
      setLayoutColumns(1);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isHeroMode) {
      setType("film");
      setLinks((prev) => (prev?.length ? [prev[0]] : [""]));
    }
  }, [isHeroMode]);

  // Keep layoutColumns within valid range when type changes
  useEffect(() => {
    const opts = layoutOptions;
    if (!opts || opts.length === 0) return;
    const cols = layoutColumns;
    const min = opts[0].columns;
    const max = opts[opts.length - 1].columns;
    if (cols < min || cols > max) {
      setLayoutColumns(min);
    }
  }, [layoutOptions, layoutColumns]);

  const handleAddLink = () => {
    setLinks([...links, ""]);
  };

  const handleRemoveLink = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks.length > 0 ? newLinks : [""]);
  };

  const handleLinkChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const filteredLinks = links.filter((link) => link.trim() !== "");
      if (filteredLinks.length === 0) {
        alert("Please add at least one link");
        setLoading(false);
        return;
      }

      await onSave({
        type,
        title,
        description,
        links: filteredLinks,
        layout: showLayoutPicker ? { columns: layoutColumns } : undefined,
        isHero: !!isHeroMode,
      });
      onClose();
    } catch (error) {
      console.error("Error saving media link:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${type === 'film' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
              {type === 'film' ? <Film size={20} /> : <PlayCircle size={20} />}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {initialData ? "Edit Media Link" : "Add Media Link"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #e5e7eb;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #d1d5db;
            }
          `}</style>
          {/* Type Selection */}
          {!isHeroMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setType("film");
                    if (!supportsMultiLinks && links.length > 1) setLinks([links[0]]);
                  }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    type === "film"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-100 hover:border-gray-200 text-gray-500"
                  }`}
                >
                  <Film size={24} />
                  <span className="font-medium">Film</span>
                  <p className="text-xs text-center opacity-70">Showcase video</p>
                </button>
                <button
                  type="button"
                  onClick={() => setType("reels")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    type === "reels"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-100 hover:border-gray-200 text-gray-500"
                  }`}
                >
                  <PlayCircle size={24} />
                  <span className="font-medium">Reels</span>
                  <p className="text-xs text-center opacity-70">Short videos</p>
                </button>
              </div>

              {/* Descriptive Note for Film/Reel */}
              <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 transition-colors duration-200 ${
                type === 'film' ? 'border-blue-100 bg-blue-50/50' : 'border-purple-100 bg-purple-50/50'
              }`}>
                <div className={`p-2 rounded-lg bg-white ${
                  type === 'film' ? 'text-blue-600' : 'text-purple-600'
                }`}>
                  {type === 'film' ? <Film size={18} /> : <PlayCircle size={18} />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${
                    type === 'film' ? 'text-blue-900' : 'text-purple-900'
                  }`}>
                    {type === 'film' ? "Gallery Film" : "Gallery Reel"}
                  </p>
                  <p className={`text-xs ${
                    type === 'film' ? 'text-blue-700/80' : 'text-purple-700/80'
                  }`}>
                    {type === 'film' 
                      ? "Films are your main video content, displayed in a dedicated section of the gallery."
                      : "Reels are short, portrait-oriented videos, perfect for social-media style content."
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white text-blue-600">
                <Film size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-900">Hero video</p>
                <p className="text-xs text-blue-700/80">
                  This is the featured video shown right after the hero image on the public gallery.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Wedding Highlights"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe this video content..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all h-20 resize-none"
              />
            </div>

            {/* Layout Picker (Films & Reels only) */}
            {showLayoutPicker && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Grid layout
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {layoutOptions.map((opt) => {
                    const active = layoutColumns === opt.columns;
                    return (
                      <button
                        key={opt.columns}
                        type="button"
                        onClick={() => setLayoutColumns(opt.columns)}
                        className={`group relative rounded-lg border-2 p-1.5 text-left transition-all duration-200 ${
                          active
                            ? "border-primary-dark bg-primary-dark/5 shadow-sm ring-1 ring-primary-dark/10"
                            : "border-gray-100 hover:border-primary-dark/30 bg-white"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div
                            className={`grid gap-1 p-1 rounded-md transition-colors duration-200 ${
                              active
                                ? "bg-primary-dark/5"
                                : "bg-gray-50 group-hover:bg-gray-100"
                            }`}
                            style={{
                              gridTemplateColumns: `repeat(${opt.columns}, minmax(0, 1fr))`,
                            }}
                          >
                            {Array.from({ length: 6 }).map((_, i) => (
                              <div
                                key={i}
                                className={`h-2.5 rounded-sm shadow-sm transition-all duration-200 ${
                                  active
                                    ? "bg-primary-dark shadow-primary-dark/20"
                                    : "bg-gray-300 group-hover:bg-gray-400"
                                }`}
                              />
                            ))}
                          </div>
                          <div className="px-0.5">
                            <span
                              className={`block text-[9px] font-bold uppercase tracking-wider transition-colors ${
                                active ? "text-primary-dark" : "text-gray-900"
                              }`}
                            >
                              {opt.label}
                            </span>
                            <p className="text-[8px] text-gray-400 mt-0.5 leading-tight group-hover:text-gray-500 line-clamp-1">
                              {opt.hint}
                            </p>
                          </div>
                        </div>
                        {active && (
                          <div className="absolute -top-1 -right-1 bg-primary-dark text-white p-0.5 rounded-full shadow-md">
                            <Plus size={6} className="rotate-45" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400">
                  This controls how the links appear on the public gallery page.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Video Links
                </label>
                {(supportsMultiLinks || type === "reels") && !isHeroMode && (
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="text-xs font-semibold text-primary-dark hover:text-primary flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Link
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => handleLinkChange(index, e.target.value)}
                        placeholder="https://..."
                        required
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    {links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400">
                Supports YouTube, Shorts, and Vimeo links.
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-dark text-white font-semibold rounded-lg hover:bg-primary disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {initialData ? "Save Changes" : "Add Gallery Link"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaLinksModal;
