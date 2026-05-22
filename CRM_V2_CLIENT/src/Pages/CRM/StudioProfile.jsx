import React, { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "../../contexts/UserContext";
import { TourGuide } from "../../Components/TourGuide/TourGuide";
import {
  Building2,
  Database,
  CreditCard,
  Edit,
  Save,
  X,
  Plus,
  Phone,
  Mail,
  MapPin,
  Users,
  Image as ImageIcon,
  Upload,
  Calendar,
  ArrowUp, RotateCw,
  Trash2,
  FileText,
  Eye,
} from "lucide-react";
import {
  updateStudioProfile,
  deleteAccount,
} from "../../services/studioService";
import { recalculateStorage, getAuthToken } from '../../services/galleryService'
import { createTicket } from "../../services/ticketService";
import { logout } from "../../services/authService";

import { Success } from "../../Components/Success";
import { Error } from "../../Components/Error";
import { useNavigate } from "react-router-dom";
import { DangerConfirmDialog } from "../../Components/ui/confirm-dialog";
import { ImageCropModal } from '../../Components/ImageCropModal'
import { readFile } from '../../utils/cropImage'

import { studioProfileSteps } from "../../Components/TourGuide/steps/studioProfileSteps";
import { useSession } from "@/contexts/SessionContext";
import { PageGuard, PermissionGate } from "../utils/permissions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../Components/ui/dialog";
import { useSubscription } from "../../contexts/SubscriptionContext";


export const StudioProfile = () => {
  const { user, studio, refreshUser, clearUser } = useUser();
  const { subscription } = useSubscription();
  const { session } = useSession();
  const navigate = useNavigate();
  const startTourRef = useRef(null);

  // Listen for tour start event from Sidebar
  useEffect(() => {
    const handleStartTour = (event) => {
      if (event.detail?.tourKey === 'studio-profile-tour' && startTourRef.current) {
        startTourRef.current();
      }
    };

    window.addEventListener('plexis-start-tour', handleStartTour);
    return () => window.removeEventListener('plexis-start-tour', handleStartTour);
  }, []);

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [portfolioFiles, setPortfolioFiles] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [logoFile, setLogoFile] = useState(null);
  const [brochureFiles, setBrochureFiles] = useState([]);
  const [brochuresToRemove, setBrochuresToRemove] = useState([]);
  const [selectedBrochure, setSelectedBrochure] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [gstError, setGstError] = useState("");
  const [visibleImages, setVisibleImages] = useState(6); // Load first 6 images initially
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);
  const [deleteConfirm1, setDeleteConfirm1] = useState({ open: false });
  const [deleteConfirm2, setDeleteConfirm2] = useState({ open: false });
  const [deleteReason, setDeleteReason] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false)
  const [tempLogoUrl, setTempLogoUrl] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [logoPreview, setLogoPreview] = useState(null)
  const [brochureToView, setBrochureToView] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectionToast, setSelectionToast] = useState(null);
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      countryCode: user?.countryCode || "+91",
      receiveDailyActivityEmail: user?.receiveDailyActivityEmail || false,
    },
    studioInfo: {
      name: studio?.name || "",
      tagline: studio?.tagline || "",
      gstNumber: studio?.gstNumber || "",
      metaPixelId: studio?.form?.metaPixelId || "",
      mainAddress: {
        addressLine1: studio?.mainAddress?.addressLine1 || "",
        addressLine2: studio?.mainAddress?.addressLine2 || "",
        city: studio?.mainAddress?.city || "",
        state: studio?.mainAddress?.state || "",
        country: studio?.mainAddress?.country || "",
      },
      branches: studio?.branches || [],
      brochures: studio?.brochures || [],
    },
  });

  const planName = subscription?.planName || "Basic";
  const planStatus = subscription?.status || "Active";
  const isOwner = String(session?.role) === '1';

  const storageUsedBytes = studio?.storageUsed || 0;
  const storageTotalBytes = (subscription?.storageLimitGb || 500) * 1024 * 1024 * 1024;

  const storageUsedGb = Math.round((storageUsedBytes / (1024 * 1024 * 1024)) * 100) / 100;
  const storageTotalGb = Math.round((storageTotalBytes / (1024 * 1024 * 1024)) * 100) / 100;
  const storageRemainingGb = Math.max(0, (storageTotalBytes - storageUsedBytes) / (1024 * 1024 * 1024));

  const storagePercent = storageTotalBytes > 0
    ? Math.min(100, Math.round((storageUsedBytes / storageTotalBytes) * 100))
    : 0;

  // Get expiry date from user
  const expiryDate = user?.validUntil ? new Date(user.validUntil) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;

  const publicSlug = (studio?.name || "yourstudio")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const publicUrl = `${window.location.origin}/${publicSlug}/leadform`;

  const handleEdit = () => {
    setEditMode(true);
  };
  const handleLogoChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      const imageDataUrl = await readFile(file)
      setTempLogoUrl(imageDataUrl)
      setShowCropModal(true)
    }
  }
  const handleCropSave = (croppedBlob) => {
    const file = new File([croppedBlob], 'logo.jpg', { type: 'image/jpeg' })
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(croppedBlob))
    setShowCropModal(false)
    setTempLogoUrl(null)
  }


  const handleCancel = () => {
    setEditMode(false);
    setPortfolioFiles([]);
    setImagesToRemove([]);
    setLogoFile(null);
    setBrochureFiles([]);
    setBrochuresToRemove([]);
    setImageErrors(new Set());
    setGstError("");
  };

  // Sync formData when studio or user updates
  useEffect(() => {
    if (!editMode) {
      setFormData({
        personalInfo: {
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          phone: user?.phone || "",
          countryCode: user?.countryCode || "+91",
          receiveDailyActivityEmail: user?.receiveDailyActivityEmail || false,
        },
        studioInfo: {
          name: studio?.name || "",
          tagline: studio?.tagline || "",
          gstNumber: studio?.gstNumber || "",
          mainAddress: {
            addressLine1: studio?.mainAddress?.addressLine1 || "",
            addressLine2: studio?.mainAddress?.addressLine2 || "",
            city: studio?.mainAddress?.city || "",
            state: studio?.mainAddress?.state || "",
            country: studio?.mainAddress?.country || "",
          },
          branches: studio?.branches || [],
          brochures: studio?.brochures || [],
        },
      });
    }
  }, [studio, user, editMode]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Validate GST if provided and not empty
      if (
        formData.studioInfo.gstNumber &&
        formData.studioInfo.gstNumber.trim() !== ""
      ) {
        const gstPattern =
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstPattern.test(formData.studioInfo.gstNumber)) {
          if (formData.studioInfo.gstNumber.length > 0 && formData.studioInfo.gstNumber.length < 15) {
            setGstError("GSTIN must be 15 characters");
            setIsSaving(false);
            return;
          }
        }
      }
      setGstError("");

      /**
       * ❗ CRITICAL ORDER:
       * 1. Hit removals and normal text edits first (Clears slots for the 10-image limit check)
       * 2. Upload file assets individually after removals (Handles heavy files without timeout)
       */

      // Consolidated Update: Profile info, Portfolio images, Logo, and Brochures
      await updateStudioProfile(
        {
          personalInfo: formData.personalInfo,
          studioInfo: { ...formData.studioInfo, imagesToRemove, brochuresToRemove },
        },
        portfolioFiles,
        logoFile,
        brochureFiles
      );

      await refreshUser();
      setEditMode(false);
      setPortfolioFiles([]);
      setImagesToRemove([]);
      setLogoFile(null);
      setBrochureFiles([]);
      setBrochuresToRemove([]);
      setSuccessMessage("Studio Profile Updated");
    } catch (error) {
      console.error("Error saving:", error);
      setErrorMessage(
        error.message || "Failed to save changes. Please try again.",
      );
    } finally {
      setIsSaving(false);

        window.location.reload();
     
    }
  };



  const updateFormData = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateNestedFormData = (section, nestedPath, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedPath]: {
          ...prev[section][nestedPath],
          [field]: value,
        },
      },
    }));
  };

  const addBranch = () => {
    setFormData((prev) => ({
      ...prev,
      studioInfo: {
        ...prev.studioInfo,
        branches: [
          ...prev.studioInfo.branches,
          {
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            country: "",
            countryCode: "+91",
            phone: "",
          },
        ],
      },
    }));
  };

  const updateBranch = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      studioInfo: {
        ...prev.studioInfo,
        branches: prev.studioInfo.branches.map((branch, i) =>
          i === index ? { ...branch, [field]: value } : branch,
        ),
      },
    }));
  };

  const removeBranch = (index) => {
    setFormData((prev) => ({
      ...prev,
      studioInfo: {
        ...prev.studioInfo,
        branches: prev.studioInfo.branches.filter((_, i) => i !== index),
      },
    }));
  };
 
  const handlePortfolioChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    const currentCount = filteredImages.length + portfolioFiles.length;
    const maxAllowed = 10 - currentCount;

    if (currentCount >= 10) {
      setSelectionToast({
        selectedCount: 0,
        totalUploaded: filteredImages.length + portfolioFiles.length,
        isLimitReached: true
      });
      e.target.value = '';
      return;
    }

    const filesToSelect = selectedFiles.slice(0, maxAllowed);
    setPortfolioFiles(prev => [...prev, ...filesToSelect]);
    
    setSelectionToast({
      selectedCount: filesToSelect.length,
      totalUploaded: filteredImages.length + portfolioFiles.length + filesToSelect.length,
      isLimitReached: selectedFiles.length > maxAllowed
    });

    e.target.value = '';
  };

  // Close selection toast after 4s
  useEffect(() => {
    if (selectionToast) {
      const timer = setTimeout(() => setSelectionToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [selectionToast]);

  const handleBrochureUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setBrochureFiles((prev) => [...prev, ...files]);
    }
  };

  const removeBrochureFile = (index) => {
    setBrochureFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingBrochure = (brochureId) => {
    setBrochuresToRemove((prev) => [...prev, brochureId]);
    setFormData((prev) => ({
      ...prev,
      studioInfo: {
        ...prev.studioInfo,
        brochures: prev.studioInfo.brochures.filter((b) => b._id !== brochureId),
      },
    }));
  };

  const updateBrochureName = (id, newName) => {
    setFormData((prev) => ({
      ...prev,
      studioInfo: {
        ...prev.studioInfo,
        brochures: prev.studioInfo.brochures.map((b) =>
          b._id === id ? { ...b, name: newName } : b
        ),
      },
    }));
  };

  const handleUpgradeRequest = async () => {
    try {
      setRequestingUpgrade(true);
      setErrorMessage(null);

      await createTicket({
        title: "Plan Upgrade Request",
        issueType: "Plan Upgrade",
        description: `Studio: ${studio?.name || "N/A"}\nRef No: ${user?.refNo || "N/A"}\nCurrent Plan: ${planName}\nCurrent Storage: ${storageUsedGb.toFixed(2)} GB used / ${storageTotalGb.toFixed(2)} GB limit\nRemaining Storage: ${storageRemainingGb.toFixed(2)} GB\nExpiry Date: ${expiryDate ? expiryDate.toLocaleDateString("en-GB") : "N/A"}\n\nRequesting plan upgrade for better storage and extended validity.`,
        priority: "high",
      });

      setSuccessMessage(
        "Upgrade request submitted successfully! Our team will review it shortly.",
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error("Error submitting upgrade request:", error);
      setErrorMessage(
        error.message || "Failed to submit upgrade request. Please try again.",
      );
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setRequestingUpgrade(false);
    }
  }

  const handleSyncStorage = async () => {
    try {
      setIsSyncing(true)
      // Recalculate based on a dummy project or just trigger the studio-wide recalculation
      // Our backend recalculateStudioStorage doesn't actually need projectId, 
      // but the route has it. We can pass 'any' or update backend to be more generic.
      // For now, we'll use 'sync' as a placeholder if project ID isn't critical.
      await recalculateStorage('all')
      await refreshUser()
      setSuccessMessage('Storage usage synchronized successfully!')
    } catch (error) {
      console.error('Error syncing storage:', error)
      setErrorMessage('Failed to sync storage usage.')
    } finally {
      setIsSyncing(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleDateString("en-GB");
    } catch {
      return "N/A";
    }
  };

  const handleDeleteAccountClick = () => {
    setDeleteConfirm1({ open: true });
  };
  const handleDeleteConfirm1 = () => {
    setDeleteConfirm1({ open: false });
    setDeleteConfirm2({ open: true });
  };

  const handleDeleteConfirm2 = async (confirmed) => {
    if (!confirmed) {
      setShowDeleteConfirm2(false);
      setDeleteReason("");
      return;
    }

    if (!deleteReason.trim()) {
      setErrorMessage("Please provide a reason for deleting your account");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      setDeletingAccount(true);
      setErrorMessage(null);

      // Call delete account API
      await deleteAccount(deleteReason);

      // Clear user data
      clearUser();

      // Call logout
      await logout();

      // Redirect to login
      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      setErrorMessage(
        error.message || "Failed to delete account. Please try again.",
      );
      setDeletingAccount(false);
      setShowDeleteConfirm2(false);
      setDeleteReason("");
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;

    if (typeof url !== "string") {
      if (url instanceof File || url instanceof Blob) {
        return URL.createObjectURL(url);
      }
      if (url.image_url) url = url.image_url;
      else if (url.url) url = url.url;
      else if (url.low_res_url) url = url.low_res_url;
      else return null;
    }

    if (typeof url !== "string") return null;

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    if (url.startsWith("//")) {
      return `https:${url}`;
    }

    if (url.includes("digitaloceanspaces.com")) {
      if (url.match(/^[a-z0-9]+\.digitaloceanspaces\.com/)) {
        return `https://${url}`;
      }

      if (url.startsWith("plexis-images.")) {
        return `https://${url}`;
      }
    }
    return url;
  };

  const handleImageError = (imageUrl) => {
    console.error("❌ Image failed to load:", imageUrl);
    setImageErrors((prev) => new Set([...prev, imageUrl]));
  };

  // Memoize filtered images to prevent unnecessary recalculations
  const filteredImages = useMemo(() => {
    const images =
      studio?.portfolioImages?.filter(
        (image) => !imagesToRemove.includes(image),
      ) || [];

    return images;
  }, [studio?.portfolioImages, imagesToRemove]);

  // Reset visible images when portfolio changes
  useEffect(() => {
    setVisibleImages(6);
    setImageErrors(new Set());

    // Debug log when portfolio changes
  }, [studio?.portfolioImages, studio]);

  return (
    <PageGuard page="4">
      <div className="min-h-screen bg-gray-50">
        <TourGuide
          steps={studioProfileSteps}
          tourKey="studio-profile-tour"
          autoStart={false}
          onStartTour={(startFn) => { startTourRef.current = startFn; }}
        />

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

        {/* Custom Selection Toast */}
        {selectionToast && (
          <div className="fixed top-6 right-6 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 flex items-start gap-4 animate-slideInRight min-w-[280px]">
            <div className={`p-2.5 rounded-xl ${selectionToast.isLimitReached ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary-dark'}`}>
              <ImageIcon size={22} />
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-gray-900 leading-tight">
                {selectionToast.selectedCount > 0 
                  ? `${selectionToast.selectedCount} image(s) selected` 
                  : "Limit Reached"}
              </p>
              <p className="text-[11px] text-gray-500 mt-1.5 font-medium uppercase tracking-tight">
                {selectionToast.totalUploaded} portfolio images uploaded
              </p>
            </div>
            <button 
              onClick={() => setSelectionToast(null)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400 group"
            >
              <X size={16} className="group-hover:text-gray-600" />
            </button>
          </div>
        )}
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Header */}
          <div
            id="studio-profile-header" className="mb-6 flex items-center justify-between"
          >
            <div>
              <h1 className="text-2xl font-bold text-primary-dark">
                Studio Profile
              </h1>
              <p className="text-xs text-gray-600 mt-1">
                View and edit your studio details, plan, and storage usage.
              </p>
            </div>

            {isOwner && (
              !editMode ? (
                <button
                  id="studio-profile-edit-btn"
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90 transition-colors"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px] justify-center"
                  >
                    {isSaving ? (
                      <>
                        <RotateCw size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )
            )}

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div
              id="studio-profile-personal-info" className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Users size={20} className="text-primary-dark" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Personal Information
                </h2>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.personalInfo.firstName}
                        onChange={(e) =>
                          updateFormData(
                            "personalInfo",
                            "firstName",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {user?.firstName || "Not set"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={formData.personalInfo.lastName}
                        onChange={(e) =>
                          updateFormData(
                            "personalInfo",
                            "lastName",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {user?.lastName || "Not set"}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 flex items-center gap-2">
                    <Mail size={16} />
                    {user?.email}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  {editMode ? (
                    <div className="flex gap-2">
                      <select
                        value={formData.personalInfo.countryCode}
                        onChange={(e) =>
                          updateFormData(
                            "personalInfo",
                            "countryCode",
                            e.target.value,
                          )
                        }
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="+1">+1</option>
                        <option value="+91">+91</option>
                        <option value="+44">+44</option>
                      </select>
                      <input
                        type="tel"
                        value={formData.personalInfo.phone}
                        onChange={(e) =>
                          updateFormData(
                            "personalInfo",
                            "phone",
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900 flex items-center gap-2">
                      <Phone size={16} />
                      {user?.phone ? `${user.phone}` : "Not set"}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Daily Activity Email</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Receive a daily morning email summary of today's tasks, follow-ups, and payments.</p>
                  </div>
                  {editMode ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={formData.personalInfo.receiveDailyActivityEmail}
                        onChange={(e) => updateFormData("personalInfo", "receiveDailyActivityEmail", e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-dark"></div>
                    </label>
                  ) : (
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${user?.receiveDailyActivityEmail ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user?.receiveDailyActivityEmail ? 'Enabled' : 'Disabled'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Storage & Plan Card */}
            {isOwner && (
              <div id="studio-profile-storage" className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Database size={20} className="text-[#9916b1]" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Storage Plan
                  </h3>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    {storageUsedGb.toFixed(2)} GB used of {storageTotalGb.toFixed(2)} GB
                  </p>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#9916b1] rounded-full transition-all duration-500"
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {storageRemainingGb.toFixed(2)} GB remaining
                    </p>
                    <button
                      onClick={handleSyncStorage}
                      disabled={isSyncing}
                      className="text-gray-400 hover:text-[#9916b1] transition-colors p-1"
                      title="Refresh storage usage"
                    >
                      <RotateCw size={14} className={isSyncing ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{planName}</h3>
                    <p className="text-sm text-gray-600 mt-1 font-medium">
                      Status: <span className={isExpired ? "text-red-600" : "text-red-600"}>{planStatus}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Plan quota: {(subscription?.storageLimitGb || storageTotalGb).toFixed(0)} GB
                    </p>
                  </div>

                  {expiryDate && (
                    <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                      <Calendar size={16} />
                      <span>
                        {isExpired ? "Expired: " : "Expires: "} {formatDate(expiryDate)}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleUpgradeRequest}
                  disabled={requestingUpgrade}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-[#9916b1] text-white hover:bg-[#8a13a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  {requestingUpgrade ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <ArrowUp size={18} />
                      Request Plan Upgrade
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Studio Details */}
          <div id="studio-profile-details" className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 size={20} className="text-primary-dark" />
              <h2 className="text-lg font-semibold text-gray-900">
                Studio Details
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Studio Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.studioInfo.name}
                      onChange={(e) =>
                        updateFormData("studioInfo", "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  ) : (
                    <p className="text-gray-900">{studio?.name || "Not set"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.studioInfo.tagline}
                      onChange={(e) =>
                        updateFormData("studioInfo", "tagline", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {studio?.tagline || "Not set"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  {editMode ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={formData.studioInfo.gstNumber}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          updateFormData("studioInfo", "gstNumber", value);
                          if (gstError) setGstError("");
                        }}
                        placeholder="27AAPFU0939F1Z5"
                        maxLength={15}
                        className={`w-full px-3 py-2 border ${gstError ? "border-red-500" : "border-gray-300"} rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary`}
                      />
                      {gstError && (
                        <p className="text-xs text-red-500">{gstError}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Optional. Indian GSTIN format (15 characters)
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-900">
                      {studio?.gstNumber || "Not set"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Pixel ID
                  </label>
                  {editMode ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={formData.studioInfo.metaPixelId}
                        onChange={(e) => updateFormData("studioInfo", "metaPixelId", e.target.value.trim())}
                        placeholder="e.g. 123456789012345"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <p className="text-xs text-gray-500">
                        Active only on your lead form page ({publicUrl})
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-900 font-mono">
                      {studio?.form?.metaPixelId || "Not set"}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logo
                  </label>
                  {editMode ? (
                    <div className="space-y-2">
                      {logoPreview ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={logoPreview}
                            alt="New logo preview"
                            className="w-12 h-12 object-cover rounded border-2 border-primary"
                          />
                          <span className="text-sm text-primary font-medium">
                            New logo selected (preview)
                          </span>
                        </div>
                      ) : studio?.logo && (
                        <div className="flex items-center gap-2">
                          <img
                            src={studio.logo}
                            alt="Current logo"
                            className="w-12 h-12 object-cover rounded"
                            loading="lazy"
                            decoding="async"
                          />
                          <span className="text-sm text-gray-600">
                            Current logo
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {studio?.logo ? (
                        <img
                          src={studio.logo}
                          alt="Studio logo"
                          className="w-12 h-12 object-cover rounded"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                          No Logo
                        </div>
                      )}
                      <span className="text-sm text-gray-600">
                        {studio?.logo ? "Logo uploaded" : "No logo"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                {editMode ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={formData.studioInfo.mainAddress.addressLine1}
                      onChange={(e) =>
                        updateNestedFormData(
                          "studioInfo",
                          "mainAddress",
                          "addressLine1",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2"
                      value={formData.studioInfo.mainAddress.addressLine2}
                      onChange={(e) =>
                        updateNestedFormData(
                          "studioInfo",
                          "mainAddress",
                          "addressLine2",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={formData.studioInfo.mainAddress.city}
                        onChange={(e) =>
                          updateNestedFormData(
                            "studioInfo",
                            "mainAddress",
                            "city",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.studioInfo.mainAddress.state}
                        onChange={(e) =>
                          updateNestedFormData(
                            "studioInfo",
                            "mainAddress",
                            "state",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Country"
                      value={formData.studioInfo.mainAddress.country}
                      onChange={(e) =>
                        updateNestedFormData(
                          "studioInfo",
                          "mainAddress",
                          "country",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                ) : (
                  <div className="text-gray-900 flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5" />
                    <div>
                      {studio?.mainAddress?.addressLine1 && (
                        <p>{studio.mainAddress.addressLine1}</p>
                      )}
                      {studio?.mainAddress?.addressLine2 && (
                        <p>{studio.mainAddress.addressLine2}</p>
                      )}
                      <p>
                        {[
                          studio?.mainAddress?.city,
                          studio?.mainAddress?.state,
                          studio?.mainAddress?.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Not set"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Branches & Brochures */}
          {isOwner && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Branches */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 size={20} className="text-primary-dark" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Additional Branches
                    </h2>
                  </div>
                  {editMode && (
                    <button
                      onClick={addBranch}
                      className="flex items-center gap-2 px-3 py-1 bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90 transition-colors text-sm"
                    >
                      <Plus size={14} />
                      Add Branch
                    </button>
                  )}
                </div>
                {formData.studioInfo.branches.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">
                    No additional branches
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.studioInfo.branches.map((branch, index) => (
                      <div
                        key={index}
                        className="border border-gray-100 rounded-lg p-3 relative bg-gray-50/30"
                      >
                        {editMode && (
                          <button
                            onClick={() => removeBranch(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        )}
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          Branch {index + 1}
                        </h3>
                        {editMode ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Address Line 1"
                              value={branch.addressLine1}
                              onChange={(e) =>
                                updateBranch(index, "addressLine1", e.target.value)
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="City"
                                value={branch.city}
                                onChange={(e) =>
                                  updateBranch(index, "city", e.target.value)
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                              <input
                                type="text"
                                placeholder="State"
                                value={branch.state}
                                onChange={(e) =>
                                  updateBranch(index, "state", e.target.value)
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={branch.countryCode || "+91"}
                                onChange={(e) =>
                                  updateBranch(index, "countryCode", e.target.value)
                                }
                                className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                              >
                                <option value="+1">+1</option>
                                <option value="+91">+91</option>
                                <option value="+44">+44</option>
                              </select>
                              <input
                                type="tel"
                                placeholder="Phone"
                                value={branch.phone}
                                onChange={(e) =>
                                  updateBranch(
                                    index,
                                    "phone",
                                    e.target.value.replace(/\D/g, "").slice(0, 10),
                                  )
                                }
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-600 leading-relaxed">
                            <p className="font-medium text-gray-800">{branch.addressLine1}</p>
                            <p>{[branch.city, branch.state].filter(Boolean).join(", ")}</p>
                            {branch.phone && (
                              <p className="flex items-center gap-1.5 mt-1 text-primary-dark">
                                <Phone size={12} />
                                {branch.countryCode} {branch.phone}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Brochures */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-primary-dark" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      Studio Brochures
                    </h2>
                  </div>
                  {editMode && (
                    <label className="flex items-center gap-2 px-3 py-1 bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90 transition-colors text-sm cursor-pointer">
                      <Upload size={14} />
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleBrochureUpload}
                        multiple
                        accept=".pdf,image/*"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Existing Brochures */}
                  {formData.studioInfo.brochures.map((brochure) => (
                    <div
                      key={brochure._id}
                      className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/30 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editMode ? (
                            <input
                              type="text"
                              value={brochure.name}
                              onChange={(e) => updateBrochureName(brochure._id, e.target.value)}
                              className="w-full bg-transparent border-b border-gray-300 focus:border-primary outline-none text-sm font-medium"
                            />
                          ) : (
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {brochure.name}
                            </h3>
                          )}
                          <p className="text-xs text-gray-500">
                            {brochure.size ? `${(brochure.size / 1024 / 1024).toFixed(2)} MB` : 'Brochure'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setBrochureToView(brochure)}
                          className="p-1.5 text-gray-400 hover:text-primary-dark transition-colors"
                          title="View Brochure"
                        >
                          <Eye size={16} />
                        </button>
                        {editMode && (
                          <button
                            onClick={() => removeExistingBrochure(brochure._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pending Uploads */}
                  {brochureFiles.map((file, index) => (
                    <div
                      key={`new-${index}`}
                      className="flex items-center justify-between p-3 border border-dashed border-primary/30 rounded-lg bg-primary/5"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                          <Upload size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-primary truncate">
                            {file.name}
                          </h3>
                          <p className="text-xs text-primary/70">
                            Waiting to save...
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBrochureFile(index)}
                        className="p-1.5 text-primary/60 hover:text-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}

                  {formData.studioInfo.brochures.length === 0 && brochureFiles.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">
                      No brochures uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Gallery */}
          {isOwner && (
            <div
              id="studio-profile-gallery"
              className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              style={{
                contain: "layout style paint",
                willChange: "auto",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ImageIcon size={20} className="text-primary-dark" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Portfolio Gallery
                  </h2>
                  {filteredImages.length > 0 && (
                    <span className="text-sm text-gray-500">
                      ({filteredImages.length} images)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Add Images Button - Always visible */}
                  {editMode && (
                    <div className="relative group">
                      <label 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium cursor-pointer shadow-sm ${
                          filteredImages.length >= 10 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                          : 'bg-primary-dark text-white hover:bg-primary-dark/90 hover:shadow-md'
                        }`}
                        title={filteredImages.length >= 10 ? "Max 10 images uploaded" : ""}
                      >
                        <Plus size={16} />
                        Add Images
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handlePortfolioChange}
                          disabled={filteredImages.length >= 10}
                        />
                      </label>
              
                    </div>
                  )}
                </div>
              </div>
              {filteredImages.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.slice(0, visibleImages).map((image, index) => {
                      const imageUrl = getImageUrl(image);
                      const hasError = imageErrors.has(image);
                      const isAboveFold = index < 4; // Only first 4 load immediately

                      return (
                        <div
                          key={`${image}-${index}`}
                          className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative group bg-gray-100"
                        >
                          {hasError || !imageUrl ? (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="text-center p-4">
                                <ImageIcon
                                  size={24}
                                  className="text-gray-400 mx-auto mb-2"
                                />
                                <p className="text-xs text-gray-500">
                                  Image not available
                                </p>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={imageUrl}
                              alt={`Portfolio ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading={isAboveFold ? "eager" : "lazy"}
                              decoding="async"
                              onError={() => handleImageError(image)}
                            />
                          )}
                          {editMode && (
                            <button
                              onClick={() =>
                                setImagesToRemove((prev) => [...prev, image])
                              }
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                              aria-label="Remove image"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {filteredImages.length > visibleImages && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() =>
                          setVisibleImages((prev) =>
                            Math.min(prev + 6, filteredImages.length),
                          )
                        }
                        className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90 transition-colors text-sm font-medium"
                      >
                        Load More Images ({filteredImages.length - visibleImages}{" "}
                        remaining)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">
                    No portfolio images uploaded yet
                  </p>
                  {import.meta.env.DEV && studio?.portfolioImages && (
                    <p className="text-xs text-gray-400">
                      Debug: portfolioImages exists but is empty or all removed
                    </p>
                  )}
                </div>
              )}
              {editMode && portfolioFiles.length > 0 && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-dashed border-primary/30">
                  <p className="text-sm text-primary font-medium flex items-center gap-2">
                    <Plus size={16} />
                    {portfolioFiles.length} portfolio image(s) selected for upload
                  </p>
                </div>
              )}
            </div>
          )}


          {/* Delete Account Section */}
          {isOwner && (
            <div
              id="studio-profile-delete" className="mt-6 bg-white rounded-xl border border-red-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Trash2 size={20} className="text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Delete Account
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Once you delete your account, all your data including projects,
                clients, leads, and other information will be permanently removed.
                This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccountClick}
                disabled={deletingAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {deletingAccount ? "Deleting Account..." : "Delete My Account"}
              </button>
            </div>
          )}
        </div>

        {/* First Confirmation Dialog */}
        <DangerConfirmDialog
          open={deleteConfirm1.open}
          onOpenChange={(v) => setDeleteConfirm1({ open: v })}
          title="Are you sure you want to close your account?"
          description="This action will permanently delete all your data including projects, clients, leads, and other information. This cannot be undone."
          confirmText="Yes, Continue"
          cancelText="No, Keep Account"
          onConfirm={handleDeleteConfirm1}
        />

        {/* Delete Account Confirmation Dialogs */}
        {deleteConfirm2.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Icon Section */}
              <div className="flex justify-center pt-8 pb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 flex items-center justify-center shadow-lg ring-4 ring-white">
                  <Trash2 className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                </div>
              </div>

              {/* Content Section */}
              <div className="px-6 sm:px-8 pb-6">
                <div className="text-center space-y-3 mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    Tell us why you want to delete your account
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    Your feedback helps us improve our service.
                  </p>
                </div>

                {/* Textarea */}
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Please share your reason..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-6 min-h-[120px] resize-none text-sm sm:text-base transition-all"
                  disabled={deletingAccount}
                />

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                  {/* Cancel Button */}
                  <button
                    onClick={() => setDeleteConfirm2({ open: false })}
                    disabled={deletingAccount}
                    className="w-full sm:w-auto flex-1 h-12 sm:h-11 rounded-xl text-sm sm:text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteConfirm2(true)}
                    disabled={deletingAccount || !deleteReason.trim()}
                    className="w-full sm:w-auto flex-1 h-12 sm:h-11 rounded-xl text-sm sm:text-base font-semibold bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {deletingAccount ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setDeleteConfirm2({ open: false })}
                disabled={deletingAccount}
                className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:pointer-events-none"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
        {showCropModal && (
          <ImageCropModal
            image={tempLogoUrl}
            onSave={handleCropSave}
            onCancel={() => {
              setShowCropModal(false)
              setTempLogoUrl(null)
            }}
            aspectRatio={1}
          />
        )}

        {/* Brochure Viewer Modal */}
        <Dialog open={!!brochureToView} onOpenChange={(open) => !open && setBrochureToView(null)}>
          <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-4 border-b bg-white shrink-0">
              <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-primary-dark" size={20} />
                {brochureToView?.name || 'View Brochure'}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 bg-gray-100 relative">
              {brochureToView && (
                <iframe 
                  src={brochureToView.url} 
                  className="w-full h-full border-none"
                  title={brochureToView.name}
                />
              )}
            </div>
            <div className="p-3 border-t bg-gray-50 flex justify-end shrink-0">
               <button 
                onClick={() => setBrochureToView(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-sm"
               >
                 Close
               </button>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </PageGuard>
  );
};
