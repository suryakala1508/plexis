import React, { useState, useEffect, useMemo } from 'react';
import { LoadingSpinner } from '../../../Components/Loading';
import { useRef } from 'react';
import { useUser } from '../../../contexts/UserContext';
import { Toast } from '../../../Components/ui/toast';
import { canEdit } from "@/Pages/utils/permissions";
import { useSession } from "@/contexts/SessionContext";

/**
 * Utility to compress image before upload
 */
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        let width = img.width;
        let height = img.height;
        const maxDim = 800; // Max dimension
        
        if (width > height && width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else if (height > maxDim) {
          width = (width * maxDim) / height;
          height = maxDim;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          "image/jpeg",
          0.7 // Quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};


/**
 * Toast Notification Component
 */

/**
 * Three-step Modal for onboarding Crew and Staff
 */
export const CrewModal = ({
  isOpen,
  onClose,
  onSave,
  roles = [],
  initialData = null,
  existingEmails = [],
  userEmail = '',
  staffAccessLocked = false,
  staffAccessLockMessage = 'Upgrade to access staff role-based permissions.',
}) => {
  // Step management
  const [step, setStep] = useState(1);
  const [lockedPages, setLockedPages] = useState({});
  const [lockedComponents, setLockedComponents] = useState({});
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const isEditMode = !!initialData;
  const { user } = useUser()
  const { session } = useSession();

  const canEditCrew = canEdit(session, "7", "7_1");
  const canEditStaff = canEdit(session, "7", "7_2");
  const isStaffToggleLocked = staffAccessLocked && !isEditMode;

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        name: initialData.name || '',
        position: initialData.position || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        hasaccess: !!initialData.hasAccess,
        role: initialData.role || '',
        photo: initialData.photo || null,
      });
      setPhotoPreview(initialData.photo || null);
      setPhotoFile(null);

      if (initialData.pages) {
        const cleanPages = {};

        Object.entries(initialData.pages).forEach(([key, val]) => {
          if (!key) return;          // ❌ remove ""
          if (!/^\d+$/.test(key)) return; // ❌ only numbers

          cleanPages[key] = !!val;
        });

        setPagePermissions(cleanPages);
      }

      if (initialData.components) {
        const normalized = {};

        PAGES.forEach(p => {
          normalized[p.key] = {};

          p.components.forEach(c => {
            const saved = initialData.components?.[p.key]?.[c.key] || {};

            const perm = {
              view: !!saved.view,
              edit: !!saved.edit,
              deny: !!saved.deny
            };

            if (perm.edit) {
              perm.view = true;
              perm.deny = false;
            }

            if (perm.deny) {
              perm.view = false;
              perm.edit = false;
            }

            if (!perm.view && !perm.edit && !perm.deny) {
              perm.view = true;
            }

            normalized[p.key][c.key] = perm;
          });
        });

        setComponentPermissions(normalized);
      }

      setStep(1);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && initialData) {
      setLockedPages({});
      setLockedComponents({});
    }
  }, [isOpen, initialData]);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: '',
    phone: '',
    hasaccess: false,
    role: '',
    photo: null,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const HIDDEN_PAGES = ["1", "9"]; // Dashboard page key


  const PAGES = useMemo(
    () => [
      { key: '2', label: 'Calendar', components: [{ key: '2_1', label: 'Events' }] },
      { key: '3', label: 'Leads', components: [{ key: '3_1', label: 'Leads' }, { key: '3_2', label: 'Lead form' }] },
      { key: '4', label: 'Projects', components: [{ key: '4_1', label: 'Projects' }, { key: '4_2', label: 'Gallery' }] },
      { key: '5', label: 'Clients', components: [{ key: '5_1', label: 'Clients' }] },
      { key: '6', label: 'Accounts', components: [{ key: '6_1', label: 'Access' }] },
      { key: '7', label: 'Crew & Staff', components: [{ key: '7_1', label: 'Crew' }, { key: '7_2', label: 'Staff' }] },
      { key: '8', label: 'Inventory', components: [{ key: '8_1', label: 'Items' }] },
      { key: '10', label: 'Templates', components: [{ key: '10_1', label: 'Templates' }] },
      { key: '11', label: 'Pricing Setup', components: [{ key: '11_1', label: 'Pricing Setup' }] },
    ],
    []
  );

  const COMPONENT_ACTIONS = {
    "2_1": ["view", "edit"], // Calendar → Events
    "3_1": ["view", "edit"],                 // Leads → Leads
    "3_2": ["view", "edit"],                 // Leads → Lead form
    "4_1": ["view", "edit", "deny"],         // Projects → Projects
    "4_2": ["view", "edit", "deny"],         // Projects → Gallery
    "5_1": ["view", "edit"],         // Clients → Clients
    "6_1": ["view", "edit"],         // Accounts → Access
    "7_1": ["view", "edit", "deny"], // Crew & Staff → Crew
    "7_2": ["view", "edit", "deny"], // Crew & Staff → Staff
    "8_1": ["view", "edit"], // Inventory → Items
    "10_1": ["view", "edit"], // Templates → Templates
    "11_1": ["view", "edit"], // Pricing Setup → Pricing Setup
  };

  const getAllowedActions = (componentKey) =>
    COMPONENT_ACTIONS[componentKey] || ["view", "edit", "deny"];


  const ROLE_DEFAULTS = {
    '1': ['2', '3', '4', '5', '6', '7', '8', '9'],
    '2': ['4'],
    '3': ['3'],
    '4': ['9'],
    '5': ['7'],
  };

  const [pagePermissions, setPagePermissions] = useState(() => {
    const obj = {};
    PAGES.forEach((p) => {
      obj[p.key] = false;
    });
    return obj;
  });


  const [componentPermissions, setComponentPermissions] = useState(() => {
    const obj = {};
    PAGES.forEach((p) => {
      obj[p.key] = {};
      p.components.forEach((c) => {
        obj[p.key][c.key] = { view: true, edit: false, deny: false };
      });
    });
    return obj;
  });

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep(1);
        setFormData({
          name: '',
          position: '',
          email: '',
          phone: '',
          hasaccess: false,
          role: '',
          photo: null,
        });
        setPhotoFile(null);
        setPhotoPreview(null);

        setErrors({});
        setSaving(false);

        const pp = {};
        const cp = {};
        const lp = {};
        const lc = {};

        PAGES.forEach((p) => {
          pp[p.key] = false;
          lp[p.key] = false;

          cp[p.key] = {};
          lc[p.key] = {};

          p.components.forEach((c) => {
            cp[p.key][c.key] = { view: true, edit: false, deny: false };
            lc[p.key][c.key] = { view: true, edit: false, deny: false };
          });
        });

        setPagePermissions(pp);
        setComponentPermissions(cp);
        setLockedPages(lp);
        setLockedComponents(lc);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "hasaccess" && checked && isStaffToggleLocked) {
      setErrors((prev) => ({
        ...prev,
        hasaccess: staffAccessLockMessage,
      }));
      return;
    }

    // Special handling for phone number - only allow digits
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, ""); // Remove all non-digit characters
      setFormData((prev) => ({
        ...prev,
        [name]: digitsOnly,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.position.trim()) newErrors.position = "Position is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    else {
      if (user?.email && formData.email.toLowerCase() === user.email.toLowerCase()) {
        newErrors.email = "This email is already registered with user";
      }
      else if (!isEditMode || (isEditMode && formData.email.toLowerCase() !== initialData.email.toLowerCase())) {
        const emailExists = existingEmails.some(
          email => email && email.toLowerCase() === formData.email.toLowerCase()
        );
        if (emailExists) {
          newErrors.email = "This email is already registered with another team member";
        }
      }
    }

    if (formData.phone && formData.phone.trim()) {
      if (formData.phone.length !== 10) {
        newErrors.phone = "Phone number must be exactly 10 digits";
      }
    }

    if (formData.hasaccess && isStaffToggleLocked) {
      newErrors.hasaccess = staffAccessLockMessage;
    }

    if (formData.hasaccess && !formData.role)
      newErrors.role = "Role is required for staff members";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Pure function for render-time check
  const isStep1Valid = () => {
    if (!formData.name.trim()) return false;
    if (!formData.position.trim()) return false;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return false;
    
    if (user?.email && formData.email.toLowerCase() === user.email.toLowerCase()) return false;
    
    if (!isEditMode || (isEditMode && formData.email.toLowerCase() !== initialData.email.toLowerCase())) {
      const emailExists = existingEmails.some(
        email => email && email.toLowerCase() === formData.email.toLowerCase()
      );
      if (emailExists) return false;
    }

    if (formData.phone && formData.phone.trim() && formData.phone.length !== 10) return false;
    if (formData.hasaccess && isStaffToggleLocked) return false;
    if (formData.hasaccess && !formData.role) return false;

    return true;
  };

  const validateStep2 = () => {
    const newErrors = {};
    const anySelected = Object.entries(pagePermissions).some(
      ([key, value]) => value && !HIDDEN_PAGES.includes(key)
    );

    if (!anySelected) newErrors.pages = 'At least one page must be selected';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Pure function for render-time check
  const isStep2Valid = () => {
    return Object.entries(pagePermissions).some(
      ([key, value]) => value && !HIDDEN_PAGES.includes(key)
    );
  };

  const applyRoleDefaults = (roleId) => {
    const roleObj = roles.find((r) => String(r.roleId) === String(roleId)) || {};

    const defaults =
      roleObj.defaultPages ||
      ROLE_DEFAULTS[String(roleObj.roleId)] ||
      [];

    const newPages = {};
    const newLockedPages = {};
    const newComponents = {};
    const newLockedComponents = {};

    PAGES.forEach((p) => {
      const isDefault = defaults.includes(p.key);

      newPages[p.key] = isDefault;
      newLockedPages[p.key] = isDefault;

      newComponents[p.key] = {};
      newLockedComponents[p.key] = {};

      p.components.forEach((c) => {
        newComponents[p.key][c.key] = {
          view: isDefault,
          edit: roleObj.roleName === "Admin",
          deny: roleObj.roleName === "Admin"
        };

        newLockedComponents[p.key][c.key] = {
          view: isDefault,
          edit: roleObj.roleName === "Admin",
          deny: roleObj.roleName === "Admin"
        };
      });
    });

    if (roleObj.defaultComponents) {
      Object.keys(roleObj.defaultComponents).forEach((pKey) => {
        Object.keys(roleObj.defaultComponents[pKey]).forEach((cKey) => {
          newComponents[pKey][cKey] = {
            ...newComponents[pKey][cKey],
            ...roleObj.defaultComponents[pKey][cKey],
          };

          newLockedComponents[pKey][cKey] = {
            ...newLockedComponents[pKey][cKey],
            ...roleObj.defaultComponents[pKey][cKey],
          };
        });
      });
    }

    setPagePermissions(newPages);
    setComponentPermissions(newComponents);
    setLockedPages(newLockedPages);
    setLockedComponents(newLockedComponents);
  };

  const togglePage = (key) => {
    setPagePermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleComponent = (pageKey, compKey, mode) => {
    setComponentPermissions(prev => {
      let next = { view: false, edit: false, deny: false };

      if (mode === "view") {
        next.view = true;
      }

      if (mode === "edit") {
        next.view = true;
        next.edit = true;
      }

      if (mode === "deny") {
        next.deny = true;
      }

      return {
        ...prev,
        [pageKey]: {
          ...prev[pageKey],
          [compKey]: next
        }
      };
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;

      if (!formData.hasaccess) {
        handleFinalSubmit();
        return;
      }

      if (!isEditMode) {
        applyRoleDefaults(formData.role);
      }

      setTimeout(() => {
        setStep(2);
      }, 0);

      return;
    }

    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleFinalSubmit = async () => {
    // Final validation check for all steps
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (formData.hasaccess && !validateStep2()) {
      setStep(2);
      return;
    }

    setSaving(true);

    try {
      // Create FormData if photo is being uploaded
      const isFormData = !!photoFile;
      const payloadBase = {
        name: formData.name.trim(),
        position: formData.position.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        hasaccess: !!formData.hasaccess,
        photo: formData.photo, // Existing photo URL if no new file
      };

      // If editing and no new photo file, keep existing photo
      if (isEditMode && !photoFile && formData.photo) {
        payloadBase.photo = formData.photo;
      }

      if (!formData.hasaccess) {
        if (isFormData) {
          // Use FormData for photo upload
          const formDataToSend = new FormData();
          Object.keys(payloadBase).forEach((key) => {
            if (key !== "photo" || photoFile) {
              formDataToSend.append(key, payloadBase[key]);
            }
          });
          if (photoFile) {
            formDataToSend.append("photo", photoFile);
          }
          if (isEditMode) {
            formDataToSend.append("id", initialData.id);
          }
          await onSave(formDataToSend, true);
        } else {
          const payload = isEditMode
            ? { ...payloadBase, id: initialData.id }
            : payloadBase;
          await onSave(payload);
        }

        // Close modal after a brief delay
        setTimeout(() => {
          onClose();
        }, 500);
        return;
      }

      // Logic for staff members (with access)
      const pagesPayload = {};
      Object.keys(pagePermissions).forEach((pKey) => {
        pagesPayload[pKey] = !!pagePermissions[pKey];
      });

      const componentsPayload = {};
      Object.keys(componentPermissions).forEach((pKey) => {
        if (!pagesPayload[pKey]) return;

        componentsPayload[pKey] = {};
        Object.keys(componentPermissions[pKey]).forEach((cKey) => {
          const perm = componentPermissions[pKey][cKey];

          const safePerm = {
            view: !!perm.view,
            edit: !!perm.edit,
            deny: !!perm.deny,
          };

          if (safePerm.edit) {
            safePerm.view = true;
            safePerm.deny = false;
          }

          if (safePerm.deny) {
            safePerm.view = false;
            safePerm.edit = false;
          }

          componentsPayload[pKey][cKey] = safePerm;
        });
      });

      if (isFormData) {
        // Use FormData for photo upload
        const formDataToSend = new FormData();
        Object.keys(payloadBase).forEach((key) => {
          if (key !== "photo" || photoFile) {
            const value = payloadBase[key];
            if (value !== null && value !== undefined) {
              formDataToSend.append(
                key,
                typeof value === "boolean" ? value.toString() : value,
              );
            }
          }
        });
        if (photoFile) {
          formDataToSend.append("photo", photoFile);
        }
        formDataToSend.append("role", formData.role);
        formDataToSend.append("pages", JSON.stringify(pagesPayload));
        formDataToSend.append("components", JSON.stringify(componentsPayload));
        if (isEditMode) {
          formDataToSend.append("id", initialData.id);
        }
        await onSave(formDataToSend, true);
      } else {
        const finalPayload = {
          ...payloadBase,
          role: formData.role,
          pages: pagesPayload,
          components: componentsPayload,
        };

        if (isEditMode) {
          finalPayload.id = initialData.id;
        }

        await onSave(finalPayload);
      }

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      // Parse error message from backend
      let errorMessage = err?.message || "Failed to save member. Please try again.";

      // Check for specific error messages
      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      // Check for email already exists
      if (
        errorMessage.toLowerCase().includes("email") &&
        (errorMessage.toLowerCase().includes("already") ||
          errorMessage.toLowerCase().includes("exists") ||
          errorMessage.toLowerCase().includes("duplicate"))
      ) {
        setErrors({
          email: "Email already exists. Please use a different email address.",
        });
      } else if (
        errorMessage.toLowerCase().includes("phone") &&
        (errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("format"))
      ) {
        setErrors({
          phone: "Phone number must be exactly 10 digits.",
        });
      } else {
        setErrors({
          submit: errorMessage,
        });
      }

      // Show error toast
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleNext();
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  if (!isOpen) return null;

  const renderStep1 = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }}
      className="px-4 sm:px-6 py-4 sm:py-5"
    >
      <div className="space-y-3 sm:space-y-4">
        {/* Member Type Toggle */}
        {canEditStaff && (
          <div className="bg-gradient-to-r from-primary-light/10 to-primary-light/5 p-3 sm:p-4 rounded-xl border border-primary-light/20 transition-all hover:border-primary-light/40">
            <label className={`flex items-start sm:items-center gap-2 sm:gap-3 ${isStaffToggleLocked ? "cursor-not-allowed" : "cursor-pointer"} group`}>
              <input
                type="checkbox"
                name="hasaccess"
                checked={formData.hasaccess}
                onChange={handleChange}
                disabled={isEditMode || isStaffToggleLocked}
                className="w-4 h-4 sm:w-5 sm:h-5 text-primary-dark rounded focus:ring-2 focus:ring-primary-dark mt-0.5 sm:mt-0 flex-shrink-0 cursor-pointer"
              />
              <div className="min-w-0">
                <span className="font-semibold text-sm sm:text-base text-primary-dark block group-hover:text-primary transition-colors">
                  Staff Member (Dashboard Access)
                </span>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Check this if the person should have access to the dashboard
                  with assigned roles
                </p>
                {isStaffToggleLocked && (
                  <p className="text-xs sm:text-sm text-amber-700 mt-1">
                    {staffAccessLockMessage}
                  </p>
                )}
              </div>
            </label>
          </div>
        )}
        {errors.hasaccess && (
          <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.hasaccess}</p>
        )}

        {/* Name */}
        <div className="group">
          <label className="block text-xs sm:text-sm font-semibold text-primary-dark mb-1.5 sm:mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.name
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 focus:border-primary-dark focus:ring-primary-dark/20"
              } rounded-xl focus:ring-4 transition-all`}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

        {/* Position */}
        <div className="group">
          <label className="block text-xs sm:text-sm font-semibold text-primary-dark mb-1.5 sm:mb-2">
            Position <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="e.g. Photographer, Videographer, Editor"
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.position
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-200 focus:border-primary-dark focus:ring-primary-dark/20"
              } rounded-xl focus:ring-4 transition-all`}
          />
          {errors.position && (
            <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.position}
            </p>
          )}
        </div>

        {/* Photo Upload */}
        <div className="group">
          <label className="block text-xs sm:text-sm font-semibold text-primary-dark mb-1.5 sm:mb-2">
            Photo
          </label>
          <div className="space-y-2">
            {photoPreview && (
              <div className="relative w-20 h-20  border-2 border-gray-200">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(null);
                    setPhotoFile(null);
                    setFormData(prev => ({ ...prev, photo: null }));
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    // Compress the image to reduce storage usage
                    const compressedFile = await compressImage(file);
                    setPhotoFile(compressedFile);

                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPhotoPreview(reader.result);
                    };
                    reader.readAsDataURL(compressedFile);
                  } catch (error) {
                    console.error('Error compressing image:', error);
                    // Fallback to original file if compression fails
                    setPhotoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPhotoPreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                } else {
                  setPhotoFile(null);
                  setPhotoPreview(formData.photo);
                }
              }}
              className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-primary-dark focus:ring-4 focus:ring-primary-dark/20 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
          </div>
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="group">
            <label className="block text-xs sm:text-sm font-semibold text-primary-dark mb-1.5 sm:mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled={isEditMode}
              onChange={handleChange}
              placeholder="email@example.com"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-primary-dark focus:ring-primary-dark/20"
                } rounded-xl focus:ring-4 transition-all ${isEditMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          <div className="group">
            <label className="block text-xs sm:text-sm font-semibold text-primary-dark mb-1.5 sm:mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="1234567890"
              maxLength={10}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.phone
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-primary-dark focus:ring-primary-dark/20"
                } rounded-xl focus:ring-4 transition-all`}
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Role Selection */}
        {formData.hasaccess && (
          <div className="group">
            <label className="block text-xs sm:text-sm font-semibold text-primary-dark mb-1.5 sm:mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isEditMode}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 ${errors.role
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-200 focus:border-primary-dark focus:ring-primary-dark/20"
                } rounded-xl focus:ring-4 transition-all ${isEditMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.roleName}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {errors.role}
              </p>
            )}
            {roles.length === 0 && (
              <p className="mt-2 text-xs sm:text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                No roles available. Please create roles first in Settings.
              </p>
            )}
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs sm:text-sm text-red-800 font-medium">
              {errors.submit}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button
          type="button"
          onClick={handleClose}
          disabled={saving}
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base
            border-2 border-gray-300 rounded-xl font-semibold text-gray-700
            hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base
            bg-primary-dark text-white rounded-xl font-semibold
            hover:bg-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
            transition-all disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              {isEditMode ? "Saving…" : "Adding…"}
            </>
          ) : (
            <>
              {formData.hasaccess ? (
                <>
                  Next
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Add Member"
              )}
            </>
          )}
        </button>
      </div>
    </form>
  );

  const renderStep2 = () => (
    <div className='px-4 sm:px-6 py-4 sm:py-5'>
      <div className='space-y-3 sm:space-y-4'>
        <div className='bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg'>
          <p className='text-xs sm:text-sm text-blue-800 font-medium'>
            Select pages this role will have access to. Defaults are applied based on the chosen role.
          </p>
        </div>

        {errors.pages && (
          <div className='bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg'>
            <p className='text-xs sm:text-sm text-red-800 font-medium'>{errors.pages}</p>
          </div>
        )}

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4'>
          {PAGES
            .filter(p => !HIDDEN_PAGES.includes(p.key))
            .map((p) => (

              <label
                key={p.key}
                className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all
                hover:shadow-md hover:scale-[1.02]
                ${lockedPages[p.key]
                    ? "border-purple-400 bg-purple-50 shadow-sm"
                    : pagePermissions[p.key]
                      ? "border-green-400 bg-green-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }
              `}
              >
                <input
                  type="checkbox"
                  checked={!!pagePermissions[p.key]}
                  disabled={lockedPages[p.key]}
                  onChange={() => togglePage(p.key)}
                  className="w-4 h-4 sm:w-5 sm:h-5 disabled:opacity-50 flex-shrink-0 mt-0.5 cursor-pointer"
                />

                <div className='min-w-0 flex-1'>
                  <div className='font-semibold text-sm sm:text-base flex items-center gap-2'>
                    {p.label}
                    {lockedPages[p.key] && (
                      <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  {p.components.length > 0 && (
                    <div className='text-xs sm:text-sm text-gray-600 mt-1 break-words'>
                      {p.components.map(c => c.label).join(', ')}
                    </div>
                  )}
                </div>
              </label>
            ))}
        </div>
      </div>

      {/* Footer */}
      <div className='mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end'>
        <button
          type='button'
          onClick={handleBack}
          disabled={saving}
          className='w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base
            border-2 border-gray-300 rounded-xl font-semibold text-gray-700
            hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2'
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button
          type='button'
          onClick={handleNext}
          disabled={saving}
          className='w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base
            bg-primary-dark text-white rounded-xl font-semibold
            hover:bg-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
            transition-all disabled:opacity-50 flex items-center justify-center gap-2'
        >
          Next
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="px-4 sm:px-6 py-4 sm:py-5">
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
          <p className="text-xs sm:text-sm text-blue-800 font-medium">
            Configure detailed permissions for each component within the
            selected pages.
          </p>
        </div>

        {PAGES.filter((p) => pagePermissions[p.key]).map((p) => (
          <div
            key={p.key}
            className="p-3 sm:p-4 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50"
          >
            <div className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 text-primary-dark flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              {p.label}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {p.components.map((c) => (
                <div
                  key={c.key}
                  className="flex flex-col p-3 sm:p-4 border-2 rounded-xl bg-white hover:shadow-md transition-all"
                >
                  <div className="font-semibold text-sm mb-3 text-gray-800">
                    {c.label}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 w-full">
                    <label
                      title="View"
                      className={`cursor-pointer select-none rounded-lg border px-3 py-2 text-xs sm:text-sm font-semibold text-center transition-colors flex items-center justify-center ${componentPermissions[p.key]?.[c.key]?.view &&
                          !componentPermissions[p.key]?.[c.key]?.edit &&
                          !componentPermissions[p.key]?.[c.key]?.deny
                          ? "bg-green-50 border-green-300 text-green-800"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name={`${p.key}_${c.key}`}
                        checked={
                          componentPermissions[p.key]?.[c.key]?.view &&
                          !componentPermissions[p.key]?.[c.key]?.edit &&
                          !componentPermissions[p.key]?.[c.key]?.deny
                        }
                        onChange={() => toggleComponent(p.key, c.key, "view")}
                        className="sr-only"
                      />
                      <span>View</span>
                    </label>

                    <label
                      title="Edit"
                      className={`cursor-pointer select-none rounded-lg border px-3 py-2 text-xs sm:text-sm font-semibold text-center transition-colors flex items-center justify-center ${componentPermissions[p.key]?.[c.key]?.edit
                          ? "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name={`${p.key}_${c.key}`}
                        checked={componentPermissions[p.key]?.[c.key]?.edit}
                        onChange={() => toggleComponent(p.key, c.key, "edit")}
                        className="sr-only"
                      />
                      <span>Edit</span>
                    </label>

                    <label
                      title="Deny"
                      className={`cursor-pointer select-none rounded-lg border px-3 py-2 text-xs sm:text-sm font-semibold text-center transition-colors flex items-center justify-center ${componentPermissions[p.key]?.[c.key]?.deny
                          ? "bg-red-50 border-red-300 text-red-800"
                          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <input
                        type="radio"
                        name={`${p.key}_${c.key}`}
                        checked={componentPermissions[p.key]?.[c.key]?.deny}
                        onChange={() => toggleComponent(p.key, c.key, "deny")}
                        className="sr-only"
                      />
                      <span>Deny</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
        <button
          type="button"
          onClick={handleBack}
          disabled={saving}
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base
          border-2 border-gray-300 rounded-xl font-semibold text-gray-700
          hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <button
          type="button"
          onClick={handleFinalSubmit}
          disabled={saving}
          className="w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base
          bg-primary-dark text-white rounded-xl font-semibold
          hover:bg-primary hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
          transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              {isEditMode ? "Updating…" : "Creating…"}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEditMode ? "Update Staff Member" : "Create Staff Member"}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity z-40"
        onClick={handleClose}
      />

      {/* Side Popup */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[510px] bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-primary-dark">
              {isEditMode ? 'Edit Team Member' : 'Add New Team Member'}
            </h2>
            <button
              onClick={handleClose}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          {formData.hasaccess && (
            <div className='mt-4'>
              <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
                <div
                  className='h-2 bg-gradient-to-r from-primary-dark to-primary transition-all duration-500 ease-out'
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
              </div>

              <div className='flex justify-between text-xs font-medium text-gray-500 mt-2 gap-1'>
                <button
                  type='button'
                  onClick={() => setStep(1)}
                  className={`flex-1 truncate transition-colors ${step === 1 ? 'font-bold text-primary-dark' : 'hover:text-primary-dark'
                    }`}
                >
                  1. Details
                </button>
                <button
                  type='button'
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  disabled={step < 2 && !isStep1Valid()}
                  className={`flex-1 truncate transition-colors ${step === 2 ? 'font-bold text-primary-dark' : step > 2 ? 'hover:text-primary-dark' : 'cursor-not-allowed'
                    }`}
                >
                  2. Permissions
                </button>
                <button
                  type='button'
                  onClick={() => {
                    if (validateStep1() && validateStep2()) setStep(3);
                  }}
                  disabled={step < 3 && (!isStep1Valid() || !isStep2Valid())}
                  className={`flex-1 truncate transition-colors ${step === 3 ? 'font-bold text-primary-dark' : 'cursor-not-allowed'
                    }`}
                >
                  3. Features
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>
      </div>
    </>
  );
};