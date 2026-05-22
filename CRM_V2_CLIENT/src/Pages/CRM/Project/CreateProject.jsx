import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Save } from "lucide-react";
import { createProject, syncProjectMilestones } from "../../../services/projectService";
import { useUser } from "../../../contexts/UserContext";
import { Success } from "../../../Components/Success";
import { Error } from "../../../Components/Error";
import { DatePicker } from "antd";
import dayjs from "dayjs";

export const CreateProject = ({
  isOpen,
  onClose,
  prefillData = {},
  onSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [sendClientMail, setSendClientMail] = useState(true); // default checked


  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const [formData, setFormData] = useState({
    projectTitle: "",
    projectDescription: "",
    startDate: "",
    endDate: "",
    projectType: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    budget: "",
    additionalBudget: "0",
    projectAmount: 0,
    location: "",
    sendClientMail: true,
  });

  const [projectTypes, setProjectTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [budgetDisplay, setBudgetDisplay] = useState("");

  // Format number with Indian number system (commas)
  const formatIndianNumber = (value) => {
    try {
      if (!value || value === "" || value === null || value === undefined)
        return "";

      // Remove all non-digit characters except decimal point
      const numericValue = value.toString().replace(/[^\d.]/g, "");
      if (!numericValue) return "";

      // Split by decimal point
      const parts = numericValue.split(".");
      const integerPart = parts[0] || "";
      const decimalPart = parts[1] || "";

      // Format integer part with Indian number system using Intl.NumberFormat
      let formattedInteger = integerPart;
      if (integerPart) {
        const num = parseFloat(integerPart);
        if (!isNaN(num) && num >= 0) {
          formattedInteger = new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 0,
          }).format(num);
        }
      }

      // Combine with decimal part (limit to 2 decimal places)
      const formattedDecimal = decimalPart.slice(0, 2);

      return decimalPart !== "" || value.toString().endsWith(".")
        ? `${formattedInteger}.${formattedDecimal}`
        : formattedInteger;
    } catch (error) {
      console.error("Error formatting Indian number:", error);
      return value?.toString() || "";
    }
  };

  // Parse formatted number back to numeric value
  const parseIndianNumber = (value) => {
    try {
      if (!value || value === "") return "";
      const numericValue = value.toString().replace(/[^\d.]/g, "");
      return numericValue === "" ? "" : parseFloat(numericValue) || "";
    } catch (error) {
      console.error("Error parsing Indian number:", error);
      return "";
    }
  };

  // Reset form when modal opens/closes or prefillData changes
  useEffect(() => {
    if (isOpen) {
      // Helper function to convert YYYY-MM-DD to DD/MM/YYYY
      const convertDate = (dateStr) => {
        if (!dateStr) return "";
        try {
          // Check if it's already in DD/MM/YYYY format
          if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            return dateStr;
          }
          // Convert from YYYY-MM-DD to DD/MM/YYYY
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateStr.split("-");
            return `${day}/${month}/${year}`;
          }
          // Try parsing as Date object
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
          }
          return "";
        } catch (e) {
          console.error("Date conversion error:", e);
          return "";
        }
      };

      // Helper function to clean budget value
      const cleanBudget = (budgetVal) => {
        if (!budgetVal) return "";
        if (typeof budgetVal === "number") return budgetVal;

        // If it's a common placeholder string, return empty
        const lowerVal = budgetVal.toString().toLowerCase();
        if (
          lowerVal.includes("uncategorized") ||
          lowerVal.includes("n/a") ||
          lowerVal.includes("null")
        ) {
          return "";
        }

        // Remove currency symbols, commas, and other non-numeric chars (except decimal)
        const cleaned = budgetVal.toString().replace(/[^0-9.]/g, "");
        return cleaned;
      };

      const initialBudget = cleanBudget(prefillData.budget);
      setFormData({
        projectTitle: prefillData.title || prefillData.projectTitle || "",
        projectDescription:
          prefillData.description || prefillData.projectDescription || "",
        startDate: convertDate(prefillData.startDate),
        endDate: convertDate(prefillData.endDate),
        projectType: prefillData.projectType || "",
        clientName: prefillData.clientName || "",
        clientEmail: prefillData.clientEmail || "",
        clientPhone: prefillData.clientPhone || "",
        budget: initialBudget,
        additionalBudget: prefillData.additionalBudget || "0",
        projectAmount: prefillData.projectAmount || 0,
        location: prefillData.location || "",
        sendClientMail: sendClientMail,
      });

      setBudgetDisplay(formatIndianNumber(initialBudget));
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, prefillData]);

  useEffect(() => {
    // Fetch project types from backend
    // For now, using a default list
    setProjectTypes([
      { id: "1", typeName: "Wedding" },
      { id: "2", typeName: "Pre-wedding" },
      { id: "3", typeName: "Portrait" },
      { id: "4", typeName: "Corporate" },
      { id: "5", typeName: "Event" },
      { id: "6", typeName: "Other" },
    ]);
  }, []);

  // Helper to convert DD/MM/YYYY to YYYY-MM-DD for backend
  const convertToISODate = (dateStr) => {
    if (!dateStr) return '';
    // If already in YYYY-MM-DD format, return as-is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    // Convert DD/MM/YYYY
    if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    // Convert DD-MM-YYYY
    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = dateStr.split('-');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate date range
      if (formData.startDate && formData.endDate) {
        const start = dayjs(formData.startDate, 'DD/MM/YYYY');
        const end = dayjs(formData.endDate, 'DD/MM/YYYY');
        if (end.isBefore(start, 'day')) {
          setErrorMessage("The End Date should be above than the Start Date");
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      setLoading(true);
      const projectData = {
        ...formData,
        // Convert dates to ISO format so backend can parse them correctly
        startDate: convertToISODate(formData.startDate),
        endDate: convertToISODate(formData.endDate),
        projectAmount: prefillData.projectAmount || formData.budget,
        createdBy: user?._id || user?.id,
        progressTimeline: [],
        paymentMilestones: prefillData.paymentMilestones || [],
        sourceLeadId: prefillData.sourceLeadId || null,
        sourceQuotationId: prefillData.sourceQuotationId || null,
        sourceContractId: prefillData.sourceContractId || null,
        contractUrl: prefillData.contractUrl || null
      }
      const createdProject = await createProject(projectData)

      // If this project came from a Lead/Quotation with milestones,
      // immediately sync them into the unified Payment Schedule collection.
      if (prefillData.sourceLeadId || prefillData.sourceQuotationId) {
        try {
          await syncProjectMilestones(createdProject._id || createdProject.id);
        } catch (syncErr) {
          console.error("Failed to sync payment milestones to schedule:", syncErr);
          // Non-blocking: we still proceed with project creation UX
        }
      }
      setSuccessMessage('Project created successfully!')
      setTimeout(() => {
        handleClose();
        if (onSuccess) {
          onSuccess(createdProject);
        } else {
          navigate(`/project/${createdProject._id || createdProject.id}`);
        }
      }, 1500);
    } catch (error) {
      console.error("Error creating project:", error);
      setErrorMessage(`Failed to create project: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity animate-fadeIn z-40"
        onClick={handleBackdropClick}
      />

      {/* Slide-in Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto no-scrollbar animate-slideInRight">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-primary-dark">
                Create New Project
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Fill in the details to create a new project
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {successMessage && (
            <Success
              onClose={() => setSuccessMessage(null)}
            >
              {successMessage}
            </Success>
          )}
          {errorMessage && (
            <Error onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Error>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.projectTitle}
                onChange={(e) =>
                  setFormData({ ...formData, projectTitle: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                placeholder="e.g., Sarah & John Wedding Photography"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Description
              </label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectDescription: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark resize-none"
                rows="4"
                placeholder="Describe the project..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                placeholder="e.g., Grand Hotel, Mumbai"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={formData.startDate ? dayjs(formData.startDate, 'DD/MM/YYYY') : null}
                  onChange={(date) =>
                    setFormData({ ...formData, startDate: date ? date.format('DD/MM/YYYY') : '' })
                  }
                  format="DD/MM/YYYY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                  placeholder="Select start date"
                  minDate={dayjs()}
                  style={{ width: '100%', height: '42px' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <DatePicker
                  value={formData.endDate ? dayjs(formData.endDate, 'DD/MM/YYYY') : null}
                  onChange={(date) => {
                    const formattedDate = date ? date.format('DD/MM/YYYY') : '';
                    if (formData.startDate && formattedDate) {
                      const start = dayjs(formData.startDate, 'DD/MM/YYYY');
                      const end = dayjs(formattedDate, 'DD/MM/YYYY');
                      if (end.isBefore(start, 'day')) {
                        setErrorMessage("The End Date should be above than the Start Date");
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setErrorMessage(null);
                      }
                    }
                    setFormData({ ...formData, endDate: formattedDate });
                  }}
                  format="DD/MM/YYYY"
                  disabledDate={(current) => {
                    const today = dayjs().startOf('day');
                    if (!formData.startDate) return current && current.isBefore(today, 'day');
                    const start = dayjs(formData.startDate, 'DD/MM/YYYY');
                    return current && (current.isBefore(today, 'day') || current.isBefore(start, 'day'));
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                  placeholder="Select end date"
                  minDate={dayjs()}
                  style={{ width: '100%', height: '42px' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.projectType}
                onChange={(e) =>
                  setFormData({ ...formData, projectType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                required
              >
                <option value="">Select project type</option>
                {projectTypes.map((type) => (
                  <option key={type.id} value={type.typeName}>
                    {type.typeName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, clientEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      clientPhone: e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={budgetDisplay}
                  onChange={(e) => {
                    const formatted = formatIndianNumber(e.target.value);
                    setBudgetDisplay(formatted);
                    const numeric = parseIndianNumber(e.target.value);
                    setFormData({ ...formData, budget: numeric });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                  placeholder="Enter budget amount"
                  required
                />
              </div>
            </div>

            {/* Send Mail Checkbox */}
            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="sendMail"
                checked={sendClientMail}
                onChange={(e) => setSendClientMail(e.target.checked)}
                className="w-4 h-4 text-primary-dark border-gray-300 rounded focus:ring-primary-dark"
              />
              <label
                htmlFor="sendMail"
                className="text-sm text-gray-700 select-none cursor-pointer"
              >
                Send email to client after project creation
              </label>
            </div>


            <div className="flex gap-4 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={16} />
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
