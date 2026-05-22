import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Mail,
  Check,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
  Loader2,
  Send,
  Settings,
  Info,
} from "lucide-react";
import {
  getShareLink,
  updateShareLink,
  updateFolderVisibility,
  sendShareEmail,
} from "../../../../services/galleryService";
import { Success } from '../../../../Components/Success'
import { Error } from '../../../../Components/Error'

const GalleryShareModal = ({ open, onClose, projectId, folders }) => {
  const normalizeShareUrl = (url, slug, isActive) => {
    if (!isActive || !slug) return null;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return `${window.location.origin.replace(/\/$/, "")}/gallery/${slug}`;
    }

    if (!url) return null;
    return url.replace(/([^:]\/)\/+?/g, "$1");
  };

  // State
  const [loading, setLoading] = useState(true);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Settings state
  const [isActive, setIsActive] = useState(false);
  const [expiryDays, setExpiryDays] = useState(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);
  const [folderVisibility, setFolderVisibility] = useState({});

  // Email state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [includePinOption, setIncludePinOption] = useState(true);
  const [pinDownloadEnabled, setPinDownloadEnabled] = useState(false);

  useEffect(() => {
    if (open) {
      loadShareLink();
    }
  }, [open, projectId]);

  const loadShareLink = async () => {
    try {
      setLoading(true);
      const response = await getShareLink(projectId);

      const normalizedShareLink = {
        ...response.shareLink,
        url: normalizeShareUrl(
          response?.shareLink?.url,
          response?.shareLink?.slug,
          response?.shareLink?.isActive
        ),
      };

      setShareData({
        ...response,
        shareLink: normalizedShareLink,
      });
      setPinDownloadEnabled(Boolean(response?.pinDownloadEnabled));
      setIsActive(normalizedShareLink.isActive);
      setSelectedFolderIds(normalizedShareLink.accessibleFolders || []);

      // Calculate expiry days from date
      if (response.shareLink.expiresAt) {
        const days = Math.ceil(
          (new Date(response.shareLink.expiresAt) - new Date()) /
          (1000 * 60 * 60 * 24)
        );
        setExpiryDays(days > 0 ? days : null);
      } else {
        setExpiryDays(null);
      }

      // Initialize folder visibility
      const visibility = {};
      response.publicFolders?.forEach((folder) => {
        visibility[folder.id || folder._id] = "public";
      });
      setFolderVisibility(visibility);
    } catch (error) {
      setErrorMessage("Failed to load share link");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareData?.shareLink?.url) {
      setErrorMessage("Please activate the link first");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareData.shareLink.url);
      setCopied(true);
      setSuccessMessage("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setErrorMessage("Failed to copy link");
    }
  };

  const handleToggleActive = async () => {
    const newStatus = !isActive;
    
    // If activating and no folders selected, select ALL by default
    let idsToSave = selectedFolderIds;
    if (newStatus && (!idsToSave || idsToSave.length === 0)) {
      const allIds = (shareData?.publicFolders || []).map(f => f.id || f._id);
      idsToSave = allIds;
      setSelectedFolderIds(allIds);
    }

    setIsActive(newStatus);

    try {
      const settings = {
        isActive: newStatus,
        expiresInDays: expiryDays,
        accessibleFolderIds: idsToSave,
      };

      await updateShareLink(projectId, settings);
      setSuccessMessage(`Share link ${newStatus ? "activated" : "deactivated"}`);
      await loadShareLink();
    } catch (error) {
      setIsActive(!newStatus);
      setErrorMessage("Failed to update status");
      console.error(error);
    }
  };

  const handleUpdateSettings = async () => {
    try {
      setLoading(true);

      const settings = {
        isActive, // Use current active state
        expiresInDays: expiryDays,
        accessibleFolderIds:
          selectedFolderIds.length > 0 ? selectedFolderIds : [],
      };

      await updateShareLink(projectId, settings);

      setSuccessMessage("Share settings updated!");
      await loadShareLink();
      setShowSettings(false);
    } catch (error) {
      setErrorMessage("Failed to update settings");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFolderVisibility = async (folderId, currentVisibility) => {
    const newVisibility = currentVisibility === "public" ? "hidden" : "public";

    try {
      await updateFolderVisibility(projectId, folderId, newVisibility);

      setFolderVisibility((prev) => ({
        ...prev,
        [folderId]: newVisibility,
      }));

      // If folder is set to hidden, remove it from selected folders
      if (newVisibility === "hidden") {
        setSelectedFolderIds((prev) => prev.filter((id) => id !== folderId));
      }

      setSuccessMessage(
        `Folder ${newVisibility === "public" ? "visible" : "hidden"}`
      );
    } catch (error) {
      setErrorMessage("Failed to update folder visibility");
    }
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setErrorMessage("Email address is required");
      return;
    }

    if (!isActive) {
      setErrorMessage("Please activate the share link first");
      return;
    }

    try {
      setSendingEmail(true);

      await sendShareEmail(projectId, {
        email: email.trim(),
        message: message.trim(),
        includePin: pinDownloadEnabled ? includePinOption : false,
      });

      setSuccessMessage("Share email sent successfully!");
      setEmail("");
      setMessage("");
      setIncludePinOption(true);
      setShowEmailForm(false);
    } catch (error) {
      setErrorMessage("Failed to send email");
      console.error(error);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleFolderSelection = (folderId) => {
    setSelectedFolderIds((prev) => {
      if (prev.includes(folderId)) {
        return prev.filter((id) => id !== folderId);
      } else {
        return [...prev, folderId];
      }
    });
  };

  const handleSelectAll = () => {
    const allFolderIds = (shareData?.publicFolders || []).map((f) => f.id || f._id);

    if (selectedFolderIds.length === allFolderIds.length) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(allFolderIds);
    }
  };

  const getExpiryText = () => {
    if (!shareData?.shareLink?.expiresAt) return "Never expires";

    const expiryDate = new Date(shareData.shareLink.expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return "Expired";
    if (daysLeft === 0) return "Expires today";
    if (daysLeft === 1) return "Expires tomorrow";
    return `Expires in ${daysLeft} days`;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {successMessage && (
        <Success onClose={() => setSuccessMessage(null)} autoClose={true}>
          {successMessage}
        </Success>
      )}
      {errorMessage && (
        <Error onClose={() => setErrorMessage(null)} autoClose={true}>
          {errorMessage}
        </Error>
      )}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-primary-dark">
                Share Gallery
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Share your gallery with a permanent link
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={40} />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Link Display Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Collection URL
                  </label>
                  <div className="flex items-center gap-4">
                    {/* Active Toggle - Moved to top */}
                    <button
                      onClick={handleToggleActive}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          isActive ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    {shareData?.shareLink?.expiresAt && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {getExpiryText()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
                    <LinkIcon size={18} className="text-gray-400" />
                    <input
                      type="text"
                      value={
                        shareData?.shareLink?.url ||
                        "Activate link to generate URL"
                      }
                      readOnly
                      className="flex-1 bg-transparent outline-none text-sm text-gray-700"
                    />
                  </div>
                  <button
                    onClick={handleCopyLink}
                    disabled={!isActive}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${isActive
                      ? "bg-primary hover:bg-primary-dark text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                {/* Download PIN */}
                {pinDownloadEnabled && shareData?.galleryPin && (
                  <div className="bg-primary-lighter border border-primary-light rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary-dark">
                          Download PIN
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          Share this PIN for downloads
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-primary tracking-wider">
                        {shareData.galleryPin}
                      </div>
                    </div>
                  </div>
                )}
                {!pinDownloadEnabled && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700">
                      Download PIN is available only on Pro and Pro Max plans.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="You can edit the link expiration, accessible folders, and other share permissions here"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Settings size={18} />
                  {showSettings ? "Hide Settings" : "Edit Settings"}
                  <Info size={14} className="text-gray-400" />
                </button>
                <button
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  disabled={!isActive}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${isActive
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <Mail size={18} />
                  Send via Email
                </button>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <div className="border-2 border-gray-200 rounded-lg p-5 space-y-5 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Link Settings</h3>

                  {/* Expiry Settings */}
                  <div>
                    <label className="font-medium text-gray-700 block mb-2">
                      Link Expiration
                    </label>
                    <select
                      value={expiryDays || "never"}
                      onChange={(e) =>
                        setExpiryDays(
                          e.target.value === "never"
                            ? null
                            : parseInt(e.target.value)
                        )
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="never">Never expires</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>

                  {/* Folder Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-medium text-gray-700">
                        Accessible Folders
                      </label>
                      <button
                        onClick={handleSelectAll}
                        className="text-sm text-primary hover:text-primary-dark font-medium"
                      >
                        {selectedFolderIds.length ===
                          shareData?.publicFolders?.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {shareData?.publicFolders?.map((folder) => {
                        const folderId = folder.id || folder._id;
                        const isPublic =
                          folderVisibility[folderId] === "public";

                        return (
                          <div
                            key={folderId}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isPublic
                              ? "bg-white border-gray-200 hover:border-primary"
                              : "bg-gray-100 border-gray-200 opacity-60"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedFolderIds.includes(folderId)}
                                onChange={() =>
                                  handleToggleFolderSelection(folderId)
                                }
                                disabled={!isPublic}
                                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                              />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {folder.name?.split("/").pop()}
                                </p>
                                {/* <p className="text-xs text-text-muted">
                                  {folder.imageCount} photos
                                </p> */}
                              </div>
                            </div>

                            {/* <button
                              onClick={() =>
                                handleToggleFolderVisibility(
                                  folderId,
                                  folderVisibility[folderId]
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title={isPublic ? "Hide folder" : "Make public"}
                            >
                              {isPublic ? (
                                <Eye size={18} className="text-green-600" />
                              ) : (
                                <EyeOff size={18} className="text-gray-400" />
                              )}
                            </button> */}
                          </div>
                        );
                      })}
                    </div>

                    {selectedFolderIds.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2 text-center bg-amber-50 p-3 rounded-lg border border-amber-200">
                        ⚠️ No folders selected - please select at least one folder to share
                      </p>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleUpdateSettings}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Save Settings"}
                  </button>
                </div>
              )}

              {/* Email Form */}
              {showEmailForm && (
                <div className="border-2 border-gray-200 rounded-lg p-5 space-y-4 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">
                    Send via Email
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    />
                  </div>

                  {pinDownloadEnabled && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="includePinOption"
                        checked={includePinOption}
                        onChange={(e) => setIncludePinOption(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
                      />
                      <label
                        htmlFor="includePinOption"
                        className="text-sm font-medium text-gray-700"
                      >
                        Include download PIN in email
                      </label>
                    </div>
                  )}

                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium disabled:opacity-50"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryShareModal;