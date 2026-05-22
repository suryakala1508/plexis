import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, Tag, ChevronDown } from "lucide-react";
import { useUpload } from "@/contexts/UploadContext";
import { formatFileSize } from "@/utils/formatUtils";

// ── Tag input component ───────────────────────────────────────────────────────
const SUGGESTED_TAGS = ["Bride", "Groom", "Wedding", "Portrait", "Group"];

const TagInput = ({ tags, onChange }) => {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const filtered = SUGGESTED_TAGS.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  const addTag = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => inputRef.current?.focus()}
        className="min-h-[38px] flex flex-wrap gap-1.5 p-2 border border-gray-200 rounded-lg cursor-text bg-white hover:border-gray-300 transition-colors"
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-dark/10 text-primary-dark rounded-md text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="hover:text-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === ",") && input.trim()) {
              e.preventDefault();
              addTag(input);
            }
            if (e.key === "Backspace" && !input && tags.length) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[80px] outline-none text-xs bg-transparent text-gray-700 placeholder-gray-400"
        />
      </div>

      {showSuggestions && (input || filtered.length > 0) && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Success card (unchanged) ──────────────────────────────────────────────────
const SUGGESTIONS = [
  "Browse your photo projects",
  "Check your client galleries",
  "Review upcoming events",
  "Update your templates",
  "Explore your folders",
];

const SuccessCard = ({ fileCount, onContinue }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIdx((p) => (p + 1) % SUGGESTIONS.length);
        setVisible(true);
      }, 200);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center px-8 py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-5">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v9m0-9l-3 3m3-3l3 3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 14v4a1 1 0 001 1h12a1 1 0 001-1v-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">We'll handle the rest</h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-7 max-w-[280px]">
        Your {fileCount} photo{fileCount !== 1 ? "s" : ""} are uploading in the background.
        Close this and keep working — you won't lose a thing.
      </p>
      <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-6 flex items-center gap-3 text-left min-h-[48px]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
          <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2"/>
          <path d="M12 8v4l3 3" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span
          className="text-sm text-gray-600 font-medium transition-all duration-200"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(3px)" }}
        >
          {SUGGESTIONS[msgIdx]}
        </span>
      </div>
      <button
        onClick={onContinue}
        className="w-full py-3 bg-primary-dark hover:bg-primary text-white rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
      >
        Got it, keep working
      </button>
    </div>
  );
};

const useThumbnailQueue = (selectedFiles, setSelectedFiles) => {
  const queueRef = useRef([]);
  const processingRef = useRef(false);
  const cancelledIds = useRef(new Set());

  const generateThumbnail = (file) => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file.file);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 120;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > h) { h = Math.round((h / w) * MAX); w = MAX; }
        else { w = Math.round((w / h) * MAX); h = MAX; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url); // revoke full-size immediately
        canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob)); // tiny blob ~3-5KB
        }, "image/jpeg", 0.7);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  };

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (queueRef.current.length > 0) {
      // Take 3 at a time
      const batch = queueRef.current.splice(0, 3);
      await Promise.all(
        batch.map(async (file) => {
          if (cancelledIds.current.has(file.id)) return;
          const thumb = await generateThumbnail(file);
          if (cancelledIds.current.has(file.id)) {
            if (thumb) URL.revokeObjectURL(thumb);
            return;
          }
          setSelectedFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, preview: thumb } : f))
          );
        })
      );
      // Yield to main thread between batches
      await new Promise((r) => setTimeout(r, 0));
    }

    processingRef.current = false;
  };

  useEffect(() => {
    const withoutPreview = selectedFiles.filter((f) => !f.preview && f.file);
    if (withoutPreview.length === 0) return;
    queueRef.current.push(...withoutPreview);
    processQueue();
  }, [selectedFiles.length]); // only re-run when count changes

  const cancelFile = (id) => {
    cancelledIds.current.add(id);
  };

  const cancelAll = () => {
    queueRef.current = [];
    selectedFiles.forEach((f) => cancelledIds.current.add(f.id));
  };

  return { cancelFile, cancelAll };
};

// ── Main Modal ────────────────────────────────────────────────────────────────
export const PhotoUploadModal = ({
  showUploadModal,
  setShowUploadModal,
  selectedFolder,
   folders = [],  
  projectId,
  onUploadComplete,
}) => {
  const { startUpload } = useUpload();
  const [isDragging, setIsDragging]       = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [screen, setScreen]               = useState("select");
  const [globalTags, setGlobalTags]       = useState([]);
  const [perFileTags, setPerFileTags]     = useState({});        // { fileId: string[] }
  const [expandedFileId, setExpandedFileId] = useState(null);
  const [uploadToFolder, setUploadToFolder] = useState(selectedFolder || null);

  const fileInputRef = useRef(null);
  const dragCounter  = useRef(0);
  const { cancelFile, cancelAll } = useThumbnailQueue(selectedFiles, setSelectedFiles);
  useEffect(() => {
  setUploadToFolder(selectedFolder);
}, [selectedFolder]);
  useEffect(() => {
    if (showUploadModal) {
      setScreen("select");
      setSelectedFiles([]);
      setGlobalTags([]);
      setPerFileTags({});
      setExpandedFileId(null);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      cancelAll();
      selectedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    }
    return () => { 
      document.body.style.overflow = "unset";
        cancelAll();
      selectedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview);
      });
    };
  }, [showUploadModal]);

  const handleDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items?.length > 0) setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (--dragCounter.current === 0) setIsDragging(false);
  };
  const handleDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounter.current = 0;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) handleFilesSelected(files);
  };
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) handleFilesSelected(files);
  };
  
  const handleFilesSelected = (files) => {
    const mapped = files.map((file, i) => ({
      id: `${Date.now()}-${i}`,
      file,
      name: file.name, 
      size: formatFileSize(file.size),
      status: "pending", 
      progress: 0,
      preview: null, 
    }));
    setSelectedFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (id) => {
  cancelFile(id); 
  setSelectedFiles((prev) => {
    const fileToRemove = prev.find((f) => f.id === id);
    if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
    return prev.filter((f) => f.id !== id);
  });
  setPerFileTags((prev) => { const n = { ...prev }; delete n[id]; return n; });
  if (expandedFileId === id) setExpandedFileId(null);
};

  const setFileTag = (fileId, tags) => setPerFileTags((prev) => ({ ...prev, [fileId]: tags }));

  const getFileTags = (fileId) => perFileTags[fileId] ?? [];

  // Merge global + per-file tags for upload payload
  const buildFilesWithTags = () =>
    selectedFiles.map((f) => ({
      ...f,
      tags: [...new Set([...globalTags, ...getFileTags(f.id)])],
    }));

  const handleStartUpload = async () => {
    setScreen("success");
    await startUpload({
      files: buildFilesWithTags(),
      projectId,
      selectedFolder:uploadToFolder,
      onUploadComplete,
    });
  };

  const closeModalOnly = () => {
    setShowUploadModal(false);
    setScreen("select");
    setSelectedFiles([]);
    setGlobalTags([]);
    setPerFileTags({});
    setExpandedFileId(null);
  };

  if (!showUploadModal) return null;

  return (
    <>
      <div className="fixed inset-0 z-[10000] overflow-y-auto">
        <div className="fixed inset-0 bg-black/35 backdrop-blur-sm" onClick={closeModalOnly} />

        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="relative bg-white rounded-[20px] shadow-2xl w-full overflow-hidden transition-all duration-350"
            style={{
              maxWidth: screen === "success" ? 420 : 700,
              animation: "modalIn 0.3s cubic-bezier(0.22,1,0.36,1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {screen === "success" ? (
              <SuccessCard fileCount={selectedFiles.length} onContinue={closeModalOnly} />
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="min-w-0 pr-4 flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 truncate">Upload Photos</h2>
                    <p className="text-gray-500 text-sm mt-1 truncate">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                        : "Select or drag photos to upload"}
                    </p>
                      {folders.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 max-w-full">
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Upload to:</span>
                        <select
                          value={uploadToFolder?.id || ""}
                          onChange={(e) => {
                            const found = folders.find((f) => f.id === e.target.value);
                            setUploadToFolder(found || null);
                          }}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-primary-dark font-medium bg-white focus:outline-none focus:ring-2 focus:ring-primary-dark/20 focus:border-primary-dark cursor-pointer transition-colors min-w-0 max-w-[280px] sm:max-w-xs w-full truncate hover:border-gray-300"
                        >
                          {folders.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeModalOnly}
                    className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500 hover:text-gray-700 flex-shrink-0"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">

                  {/* Drag & Drop Zone */}
                  {selectedFiles.length === 0 && (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                      isDragging
                        ? "border-primary-dark bg-gray-50 scale-[1.01]"
                        : "border-gray-200 hover:border-gray-400 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-full transition-all ${isDragging ? "bg-primary-dark" : "bg-gray-100"}`}>
                        <Upload size={32} className={isDragging ? "text-white" : "text-gray-400"} />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-700 mb-1">
                          {isDragging ? "Drop photos here" : "Drag Photos Here"}
                        </p>
                        <p className="text-gray-500 text-sm mb-3">or</p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2.5 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                          Browse Computer
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">Supports: JPG, PNG, GIF, WEBP</p>
                    </div>
                  </div>
                  )}
                  {/* Global tags — only show once files are selected */}
                  {selectedFiles.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag size={13} className="text-primary-dark" />
                        <p className="text-xs font-semibold text-gray-700">Apply tags to ALL photos</p>
                      </div>
                      <TagInput tags={globalTags} onChange={setGlobalTags} />
                    </div>
                  )}

                  {/* File list */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => {
                        const isExpanded = expandedFileId === file.id;
                        const fileTags   = getFileTags(file.id);
                        const totalTags  = [...new Set([...globalTags, ...fileTags])];

                        return (
                          <div
                            key={file.id}
                            className={`border border-gray-200 rounded-xl transition-all ${
                              isExpanded ? "relative z-10 bg-gray-50/50" : "overflow-hidden"
                            }`}
                          >
                            {/* File row */}
                            <div className="flex items-center gap-3 p-3 bg-white">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                              {file.preview ? (
                                <img
                                  src={file.preview}
                                  className="w-full h-full object-cover"
                                  alt="thumbnail"
                                />
                              ) : (
                                <div className="w-full h-full relative overflow-hidden bg-gray-100 flex items-center justify-center">
                                  {/* shimmer effect */}
                                  <div
                                    style={{
                                      position: "absolute",
                                      inset: 0,
                                      background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                                      backgroundSize: "200% 100%",
                                      animation: "shimmer 1.2s infinite",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">{file.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-gray-400">{file.size}</p>
                                  {totalTags.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                      {totalTags.slice(0, 3).map((tag) => (
                                        <span key={tag} className="px-1.5 py-0.5 bg-primary-dark/10 text-primary-dark rounded text-[10px] font-medium">
                                          {tag}
                                        </span>
                                      ))}
                                      {totalTags.length > 3 && (
                                        <span className="text-[10px] text-gray-400">+{totalTags.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Per-file tag toggle */}
                              <button
                                onClick={() => setExpandedFileId(isExpanded ? null : file.id)}
                                className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${
                                  isExpanded
                                    ? "bg-primary-dark/10 text-primary-dark"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                                title="Add tags to this photo"
                              >
                                <Tag size={13} />
                                <ChevronDown size={12} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                              <button
                                onClick={() => removeFile(file.id)}
                                className="p-1.5 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-all flex-shrink-0"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            {/* Per-file tag row */}
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-2 bg-gray-50 border-t border-gray-100">
                                <div className="flex gap-4">
                                  {/* Larger Preview */}
                                <div className="w-24 h-24 bg-white rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm">
                                  {file.preview ? (
                                    <img
                                      src={file.preview}
                                      className="w-full h-full object-cover"
                                      alt="preview"
                                    />
                                  ) : (
                                    <div className="w-full h-full relative overflow-hidden bg-gray-100">
                                      <div
                                        style={{
                                          position: "absolute",
                                          inset: 0,
                                          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                                          backgroundSize: "200% 100%",
                                          animation: "shimmer 1.2s infinite",
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                  
                                  {/* Tag Input Section */}
                                  <div className="flex-1">
                                    <p className="text-[11px] font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                                      <Tag size={10} />
                                      Tags for this photo
                                    </p>
                                    <TagInput tags={fileTags} onChange={(tags) => setFileTag(file.id, tags)} />
                                    <p className="text-[10px] text-gray-400 mt-2 italic">
                                      Adding relevant tags helps you find this photo later.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add more */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary-dark hover:bg-gray-50 transition-all text-gray-400 hover:text-primary-dark text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload size={16} /> Add More Photos
                      </button>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />

                {/* Footer */}
                {selectedFiles.length > 0 && (
                  <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      onClick={closeModalOnly}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold text-sm text-gray-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartUpload}
                      className="px-5 py-2.5 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-semibold text-sm shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload size={16} /> Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? "s" : ""}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { transform: translateY(16px) scale(0.97); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
          
      `}</style>
    </>
  );
};

export default PhotoUploadModal;