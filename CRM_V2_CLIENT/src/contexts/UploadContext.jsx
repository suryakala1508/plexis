import React, { createContext, useContext, useState, useCallback ,useRef} from "react";
import { uploadImages, getAuthToken } from "@/services/galleryService";
import { useUser } from "./UserContext";

const UploadContext = createContext();

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
};

export const UploadProvider = ({ children }) => {
  const { refreshUser } = useUser();
  const [showWidget, setShowWidget] = useState(false);
  const activeUploadsCount = useRef(0);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const uploadStartTimeRef = useRef(null);
  const bytesUploadedRef = useRef(0);
  const totalBytesRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);
const [uploadBatches,setUploadBatches]=useState([]);
const [uploadQueue,setUploadQueue]=useState([]);

  const isUploading = uploadBatches.some((b) =>
    b.files.some((f) => f.status === "uploading" || f.status === "pending")
  );

  const startTimer = () => {
  uploadStartTimeRef.current = Date.now();
  bytesUploadedRef.current = 0;

  timerRef.current = setInterval(() => {
    const elapsed = (Date.now() - uploadStartTimeRef.current) / 1000; // seconds
    const bytesPerSec = bytesUploadedRef.current / (elapsed || 1);
    const remaining = totalBytesRef.current - bytesUploadedRef.current;
    const secsLeft = bytesPerSec > 0 ? remaining / bytesPerSec : null;

    if (secsLeft === null) {
      setTimeLeft("Calculating...");
    } else if (secsLeft < 60) {
      setTimeLeft(`${Math.ceil(secsLeft)} sec left`);
    } else {
      setTimeLeft(`${Math.ceil(secsLeft / 60)} min left`);
    }
  }, 1000);
  };

const stopTimer = () => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
  setTimeLeft(null);
};
const updateFileInBatch = (batchId, fileId, updates) => {
  setUploadBatches((prev) =>
    prev.map((batch) =>
      batch.batchId === batchId
        ? {
            ...batch,
            files: batch.files.map((f) =>
              f.id === fileId ? { ...f, ...updates } : f
            ),
          }
        : batch
    )
  );
};
  const uploadFile = useCallback(async (fileObj, projectId, selectedFolder, token, batchId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const eventName = projectId || "default";
        const eventDate = new Date().toISOString().split("T")[0];
        
        const folderName = selectedFolder?.name || 
                           (typeof selectedFolder === 'string' ? selectedFolder.split('/').pop() : "AllPhotos");

        const progressInterval = setInterval(() => {
          setUploadBatches((prev) =>
            prev.map((batch) =>
              batch.batchId === batchId
                ? {
                    ...batch,
                    files: batch.files.map((f) =>
                      f.id === fileObj.id && f.progress < 90
                        ? { ...f, progress: Math.min(f.progress + 10, 90) }
                        : f
                    ),
                  }
                : batch
            )
          );
        }, 200);

        await uploadImages([fileObj.file], eventName, eventDate, folderName, fileObj.tags || [], token);
        resolve({ success: true });
      } catch (error) {
        reject(error);
      } finally {
        clearInterval(progressInterval);
      }
    });
  }, []);

  const processFileUpload = useCallback(async (file, projectId, selectedFolder, token, batchId) => {
    updateFileInBatch(batchId, file.id, { status: "uploading" });
    try {
      await uploadFile(file, projectId, selectedFolder, token, batchId);
      updateFileInBatch(batchId, file.id, { status: "completed", progress: 100 });
    } catch {
      updateFileInBatch(batchId, file.id, { status: "error" });
    }
  }, [uploadFile]);

  const finalizeUpload = useCallback(async (onUploadComplete) => {
    if (onUploadComplete) onUploadComplete();
    try {
      await refreshUser();
    } catch (e) {
      console.error("Failed to sync user stats:", e);
    }
  }, [refreshUser]);

const startUpload = useCallback(async ({ files, projectId, selectedFolder, onUploadComplete }) => {
  const batchId = `batch-${Date.now()}`;
  const folderName = selectedFolder?.name || "AllPhotos";

  const batchFiles = files.map((f) => ({ ...f, status: "pending", progress: 0 }));

  // Push new batch — don't clear existing ones
  setUploadBatches((prev) => [
    ...prev,
    { batchId, folderName, projectId, files: batchFiles },
  ]);
  setShowWidget(true);

  activeUploadsCount.current++;
  totalBytesRef.current += files.reduce((sum, f) => sum + (f.file?.size || 0), 0);
  
  if (activeUploadsCount.current === 1) {
    bytesUploadedRef.current = 0;
    startTimer();
  }

  const token = await getAuthToken();

  for (const file of batchFiles) {
    // Mark uploading
    updateFileInBatch(batchId, file.id, { status: "uploading" });
    try {
      await uploadFile(file, projectId, selectedFolder, token, batchId);
      updateFileInBatch(batchId, file.id, { status: "completed", progress: 100 });
      bytesUploadedRef.current += file.file?.size || 0;
    } catch {
      updateFileInBatch(batchId, file.id, { status: "error" });
    }
  }

  activeUploadsCount.current--;
  if (activeUploadsCount.current === 0) {
    stopTimer();
    totalBytesRef.current = 0;
    bytesUploadedRef.current = 0;
  }
  
  await finalizeUpload(onUploadComplete);
}, [uploadFile, finalizeUpload]);

  const handleRetry = useCallback(async (file, projectId, selectedFolder, onUploadComplete, batchId) => {
    const token = await getAuthToken();
    await processFileUpload(file, projectId, selectedFolder, token, batchId);
    const stillActive = uploadBatches.some((b) =>
      b.files.some((f) => f.status === "uploading" || f.status === "pending")
    );
    if (!stillActive) await finalizeUpload(onUploadComplete);
  }, [processFileUpload, finalizeUpload, uploadBatches]);

  const dismissWidget = useCallback(() => {
    setShowWidget(false);
    setActiveProjectId(null);
    setActiveFolder(null);
    setUploadQueue([]);
    setUploadBatches([]);
  }, []);

  const value = {
    uploadBatches,
    setUploadBatches,
    showWidget,
    isUploading,
    activeProjectId,
    activeFolder,
    startUpload,
    handleRetry,
    dismissWidget,
    timeLeft,
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
};
