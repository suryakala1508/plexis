import React, { useState } from "react";
import { Upload, CheckCircle, AlertCircle, RotateCw, X, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * UploadProgressWidget
 * Props:
 *  - uploadQueue   : array of file objects
 *  - onRetry(file) : retry a failed file
 *  - onDismiss()   : fully close widget
 */
const Spinner = ({ progress }) => {
  const size = 22;
  const r = (size - 3) / 2;
  const circ = 2 * Math.PI * r;
  const isIndeterminate = progress === null || progress === undefined;
  const filled = isIndeterminate ? circ * 0.7 : (progress / 100) * circ;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        flexShrink: 0,
        transform: "rotate(-90deg)",
        ...(isIndeterminate ? { animation: "widgetSpin 1s linear infinite" } : {}),
      }}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={2.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={progress === 100 ? "#34a853" : "#9916b1"}
        strokeWidth={2.5}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        style={{ transition: isIndeterminate ? "none" : "stroke-dasharray 0.3s" }}
      />
    </svg>
  );
};

const FileThumbnail = () => (
  <div style={{
    width: 36, height: 36, borderRadius: 4, background: "#f1f3f4",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#bdc1c6" strokeWidth="1.5"/>
      <circle cx="8.5" cy="8.5" r="1.5" fill="#bdc1c6"/>
      <path d="M3 15l5-5 4 4 3-3 6 6" stroke="#bdc1c6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const FolderBatchItem = ({ batch, activeTab, defaultExpanded, onRetry }) => {
  const batchTabFiles = activeTab === "uploading"
    ? batch.files.filter((f) => f.status !== "completed")
    : batch.files.filter((f) => f.status === "completed");

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (batchTabFiles.length === 0) return null;

  return (
    <div key={batch.batchId}>
      {/* Folder label */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: "6px 16px",
          fontSize: 11,
          fontWeight: 600,
          color: "#9916b1",
          background: "#f8f0ff",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <span>{batch.folderName} ({batchTabFiles.length})</span>
        <span style={{ display: "flex", alignItems: "center", color: "#9916b1" }}>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {isExpanded && batchTabFiles.map((file) => (
        <div key={file.id} className="uwt-row">
          <FileThumbnail />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 500, color: "#202124",
              margin: "0 0 1px", whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {file.name}
            </p>
            <p style={{ fontSize: 11.5, color: "#5f6368", margin: 0 }}>
              {file.status === "error"     && "Failed to upload"}
              {file.status === "pending"   && `Queued · ${file.size}`}
              {file.status === "uploading" && `Uploading · ${file.size}`}
              {file.status === "completed" && file.size}
            </p>
          </div>
          {file.status === "uploading" && <Spinner progress={file.progress > 0 ? file.progress : null} />}
          {file.status === "pending"   && <Spinner progress={0} />}
          {file.status === "completed" && <Spinner progress={100} />}
          {file.status === "error" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => onRetry && onRetry(file, batch.projectId, { name: batch.folderName }, null, batch.batchId)}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "3px 8px", background: "#fce8e6",
                  border: "none", borderRadius: 4, cursor: "pointer",
                  fontSize: 11, fontWeight: 600, color: "#c5221f",
                }}
              >
                <RotateCw size={10} /> Retry
              </button>
              <AlertCircle size={17} color="#c5221f" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const UploadProgressWidget = ({  uploadBatches = [], onRetry, onDismiss, projectId, timeLeft}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("uploading");
  const navigate = useNavigate();
  const allFiles = uploadBatches.flatMap((b) => b.files);
  const completedFiles = allFiles.filter((f) => f.status === "completed");
  const uploadingFiles = allFiles.filter((f) => f.status === "uploading" || f.status === "pending");
  const errorFiles = allFiles.filter((f) => f.status === "error");
  const totalFiles = allFiles.length;
  const allDone = totalFiles > 0 && completedFiles.length + errorFiles.length === totalFiles;
  const progressPct = totalFiles > 0 ? Math.round((completedFiles.length / totalFiles) * 100) : 0;
  if (totalFiles === 0) return null;

  const tabFiles = activeTab === "uploading"
    ? [...uploadingFiles, ...errorFiles]
    : completedFiles;

  const multipleBatchesCount = uploadBatches.filter(batch => {
    return activeTab === "uploading"
      ? batch.files.some(f => f.status !== "completed")
      : batch.files.some(f => f.status === "completed");
  }).length;

  return (
    <>
      <style>{`
        @keyframes widgetSpin { from { transform: rotate(-90deg); } to { transform: rotate(270deg); } }
        .uwt { font-family: 'Google Sans', Roboto, Arial, sans-serif; }
        .uwt-tab { background: none; border: none; cursor: pointer; padding: 7px 14px; font-size: 13px; font-weight: 500; color: #5f6368; border-radius: 20px; transition: background 0.15s; }
        .uwt-tab:hover { background: #f1f3f4; }
        .uwt-tab.active { background: #e8f0fe; color: #9916b1; }
        .uwt-row { display: flex; align-items: center; gap: 12px; padding: 8px 16px; transition: background 0.1s; cursor: default; }
        .uwt-row:hover { background: #f8f9fa; }
        .uwt-btn { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #5f6368; transition: background 0.15s; }
        .uwt-btn:hover { background: #f1f3f4; }
      `}</style>

      <div
        className="uwt"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 350,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* ── Header ── */}
        <div
          onClick={() => setExpanded((p) => !p)}
          style={{
            display: "flex", alignItems: "center",
            padding: "12px 8px 12px 16px", gap: 10,
            cursor: "pointer", userSelect: "none",
          }}
        >
          <Upload size={20} color="#5f6368" style={{ flexShrink: 0 }} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: "#202124", margin: 0 }}>
              {allDone
                ? errorFiles.length > 0
                  ? `Upload complete — ${errorFiles.length} failed`
                  : "Upload complete"
                : `Uploading ${totalFiles} item${totalFiles !== 1 ? "s" : ""}`}
            </p>
            {!allDone && (
              <p style={{ fontSize: 11.5, color: "#5f6368", margin: "1px 0 0" }}>
                {completedFiles.length} of {totalFiles} uploaded
                {timeLeft ? ` · ${timeLeft}` : ""}
              </p>
            )}
          </div>

          {allDone && projectId && (
            <button
              className="uwt-btn"
              title="View Gallery"
              onClick={(e) => { 
                e.stopPropagation(); 
                navigate(`/project/${projectId}/gallery`);
              }}
              style={{ color: "#9916b1" }}
            >
              <ExternalLink size={18} />
            </button>
          )}

          <button
            className="uwt-btn"
            onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }}
          >
            {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

          {allDone && (
            <button
              className="uwt-btn"
              onClick={(e) => { e.stopPropagation(); onDismiss && onDismiss(); }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Progress strip ── */}
        {!allDone ? (
          <div style={{ height: 3, background: "#e8eaed" }}>
            <div style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "#9916b1",
              transition: "width 0.4s ease",
            }} />
          </div>
        ) : (
          <div style={{ height: 3, background: errorFiles.length ? "#ea4335" : "#34a853" }} />
        )}

        {/* ── Expanded panel ── */}
        {expanded && (
          <div style={{ borderTop: "1px solid #e8eaed" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, padding: "8px 12px 6px" }}>
              <button
                className={`uwt-tab${activeTab === "uploading" ? " active" : ""}`}
                onClick={() => setActiveTab("uploading")}
              >
                Uploading ({uploadingFiles.length + errorFiles.length})
              </button>
              <button
                className={`uwt-tab${activeTab === "completed" ? " active" : ""}`}
                onClick={() => setActiveTab("completed")}
              >
                Completed ({completedFiles.length})
              </button>
            </div>

            <div style={{ borderTop: "1px solid #f1f3f4", height: 280, overflowY: "auto" }}>
              {tabFiles.length === 0 ? (
                <p style={{ fontSize: 13, color: "#9aa0a6", textAlign: "center", padding: "20px 16px" }}>
                  {activeTab === "uploading" ? "No files uploading" : "Completed files will appear here"}
                </p>
              ) : (
// Replace the tabFiles.map(...) section with this:
uploadBatches.map((batch) => (
  <FolderBatchItem
    key={batch.batchId}
    batch={batch}
    activeTab={activeTab}           
    defaultExpanded={true}          
    onRetry={onRetry}               
    multipleBatchesCount={multipleBatchesCount}
  />
))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UploadProgressWidget;