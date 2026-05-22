import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
  Package,
  DollarSign,
  IndianRupee,
  Image as ImageIcon,
  Plus,
  CheckCircle2,
  Edit,
  Save,
  X,
  Tag,
  Wallet,
  CreditCard,
  Trash2,
  RefreshCw,
  MessageCircle,
  FileText,
  Link,
  HardDrive,
  MoreVertical,
  Split,
  Clock,
  Loader2,
  Eye,
  FileSearch,
  Check,
  PlayCircle,
  Search,
  Loader,
} from "lucide-react";
import DeleteProjectModal from "../../../Components/DeleteProjectModal";
import {
  getProjectById,
  updateProject,
  addTimelineEntry,
  deleteTimelineEntry,
  getPaymentSchedules,
  addPaymentSchedule,
  updatePaymentSchedule,
  deletePaymentSchedule,
  deleteProject,
  syncProjectMilestones,
  releaseEquipment,
  addInHouseTask,
  updateInHouseTaskStatus,
  updateInHouseTask,
  deleteInHouseTask
} from "../../../services/projectService";
import { getCrewListWithProjects } from "../../../services/crewService";
import { useUser } from "../../../contexts/UserContext";
import { Success } from "../../../Components/Success";
import { Error } from "../../../Components/Error";
import { Skeleton } from "../../../Components/Skeleton";
import { ProjectGallery } from "./components/ProjectGallery";
import ProgressTimeline from "./components/ProgressTimeline";
import {
  getInventoryItems,
  assignInventoryItem,
  batchAssignInventory,
} from "../../../services/inventoryService";
import {
  exportQuotationToPdf,
} from "../../../services/quotationService";
import {
  exportContractPdf,
} from "../../../services/contractService";
import { openPdfInNewTab } from "../../../services/pdfService";
import { formatDate, formatIndianCurrency, formatFileSize } from "../../../utils/formatUtils";
import { ExpenseModal } from "../../CRM/Accounts/ExpenseModal";
import { addExpense, getExpenses, deleteExpense, updateExpense, uploadPaymentScreenshots } from "../../../services/expenseService";
import ScreenshotUploader from "../../../Components/ScreenshotUploader";
import { API_URL, get, post, del } from "../../../services/api";
import { DatePicker, Tooltip } from "antd";
import dayjs from "dayjs";
import { ExpenseModalCentered } from "../Accounts/ExpenseModalCentered";
import { recalculateStorage } from "../../../services/galleryService";
import { PermissionGate, PageGuard } from "@/Pages/utils/permissions";
import { useSession } from "@/contexts/SessionContext";
import { TourGuide } from "../../../Components/TourGuide/TourGuide";
import { projectDetailTourSteps } from "../../../Components/TourGuide/steps/projectsTourSteps";
import { canDeny } from "../../utils/permissions";
import { ExpenseCategoryLabel } from "../Accounts/components/ExpenseCategoryLabel";


const maskEmail = (email) => {
  if (!email) return "N/A";
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.charAt(0)}***@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return "N/A";
  const str = phone.toString();
  if (str.length < 4) return "****";
  return `******${str.slice(-4)}`;
};

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();
  const { user, subscription } = useUser();
  const isRoleBasedUser = user && String(user.role) !== "1";
  const startTourRef = React.useRef(null);


  const [isTourMode, setIsTourMode] = useState(false);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [crewMembers, setCrewMembers] = useState([]);
  const [availableCrew, setAvailableCrew] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [projectExpenses, setProjectExpenses] = useState([]);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (!isTourMode) {
      return localStorage.getItem(`projectTab_${projectId}`) || "overview";  // ✅ Already has fallback
    }
    return "overview";
  });

  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);


  // Modal states
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentScreenshots, setPaymentScreenshots] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [selectedCrewToAdd, setSelectedCrewToAdd] = useState("");
  const [payments, setPayments] = useState([]);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);
  const [storageRefreshing, setStorageRefreshing] = useState(false);
  const [showReleaseEquipmentModal, setShowReleaseEquipmentModal] = useState(false);
  const [isReleasingEquipment, setIsReleasingEquipment] = useState(false);
  const [selectedItemsToRelease, setSelectedItemsToRelease] = useState([]);

  // New states for amount formatting
  const [budgetDisplay, setBudgetDisplay] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAmountDisplay, setPaymentAmountDisplay] = useState("");

  // Payment Schedule / Project Amount states
  const [paymentSchedules, setPaymentSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showProjectAmountModal, setShowProjectAmountModal] = useState(false);
  const [projectAmountInput, setProjectAmountInput] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleRows, setScheduleRows] = useState([
    { description: "", amount: "", dueDate: "" },
  ]);
  const [scheduleToMarkPaid, setScheduleToMarkPaid] = useState(null);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markPaidForm, setMarkPaidForm] = useState({
    paidByName: "",
    paymentMethod: "Cash",
    payerPhone: "",
    paidDate: dayjs().format("YYYY-MM-DD"),
    screenshots: [],
  });

  const [showSplitModal, setShowSplitModal] = useState(false);
  const [scheduleToSplit, setScheduleToSplit] = useState(null);
  const [splitParts, setSplitParts] = useState([]);

  // Edit Schedule State
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState(null);
  const [editScheduleForm, setEditScheduleForm] = useState({
    description: "",
    amount: "",
    dueDate: "",
  });


  const [showDeleteScheduleModal, setShowDeleteScheduleModal] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false);

  // Delete In-House Task State
  const [showDeleteInHouseTaskModal, setShowDeleteInHouseTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeletingInHouseTask, setIsDeletingInHouseTask] = useState(false);

  // Delete Project State
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
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

  // Payment Milestone states
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState(null);
  const [milestoneFormData, setMilestoneFormData] = useState({
    description: "",
    amount: "",
    dueDate: "",
    percentage: "",
    status: "Pending"
  });

  // Equipment quantity states
  const [equipmentQuantities, setEquipmentQuantities] = useState({}); // {itemId: quantity}
  const [equipmentModalSnapshot, setEquipmentModalSnapshot] = useState(null); // snapshot for cancel in modal

  // In-house crew timeline state
  // formData.inHouseCrew: array of tasks
  // { id, crewId, name, dueDate, status }
  const [showAddInHouseTaskModal, setShowAddInHouseTaskModal] = useState(false);
  const [inHouseTaskForm, setInHouseTaskForm] = useState({
    crewId: "",
    name: "",
    dueDate: "",
  });
  const [editingInHouseTask, setEditingInHouseTask] = useState(null);

  // Compute assigned crew members from project data
  const assignedCrewMembers = useMemo(() => {
    if (!project || !project.assignedCrew) return [];

    return project.assignedCrew.map((crew) => {
      // If crew is already populated (has name, position, etc.), return it
      if (crew && typeof crew === 'object' && (crew.name || crew._id)) {
        return crew;
      }

      // If crew is just an ID, find it in crewMembers
      const crewId = crew?._id || crew?.id || crew;
      if (crewId) {
        const foundCrew = crewMembers.find(
          (c) => (c._id || c.id)?.toString() === crewId.toString()
        );
        return foundCrew || { _id: crewId, name: 'Unknown', position: '' };
      }

      return null;
    }).filter(Boolean);
  }, [project, crewMembers]);

  // Form states
  const [formData, setFormData] = useState({
    projectTitle: "",
    projectDescription: "",
    startDate: "",
    endDate: "",
    projectType: "",
    clientEmail: "",
    clientPhone: "",
    budget: "",
    assignedCrew: [],
    assignedEquipment: [], // Now stores objects: {id: string, quantity: number}
    storageUrl: "",
    // In-house crew timeline entries
    // Each entry: { id (crew id), role, status, dueDate, name }
    inHouseCrew: [],
  });

  const denyOverview = canDeny(session, "4", "4_1");
  const denyGallery = canDeny(session, "4", "4_2");



  useEffect(() => {
    if (!session) return;

    let safeTab = !isTourMode ? (localStorage.getItem(`projectTab_${projectId}`) || "overview") : "overview";

    if (safeTab === "overview" && denyOverview) {
      safeTab = "gallery";
    }

    if (safeTab === "gallery" && denyGallery) {
      safeTab = "overview";
    }

    setActiveTab(safeTab);
  }, [session, projectId, denyOverview, denyGallery, isTourMode]);




  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchCrewMembers();
      fetchInventoryItems();
      fetchProjectExpenses();
      fetchPaymentSchedulesForProject();
    }
  }, [projectId, isTourMode]);

  useEffect(() => {
    if (showBudgetModal && formData.budget) {
      setBudgetDisplay(formatIndianNumber(formData.budget));
    }
  }, [showBudgetModal, formData.budget]);

  useEffect(() => {
    if (!showPaymentModal) {
      setPaymentAmount("");
      setPaymentAmountDisplay("");
    }
  }, [showPaymentModal]);

  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  useEffect(() => {
    if (projectId && activeTab) {
      localStorage.setItem(`projectTab_${projectId}`, activeTab);
    }
  }, [projectId, activeTab]);


  // Update the useEffect that checks for continueTour
  useEffect(() => {
    console.log("👀 [ProjectDetail] Tour check:", { continueTour: location.state?.continueTour, loading, hasProject: !!project });
    if (location.state?.continueTour && !loading && project) {
      setIsTourMode(true); // Enable tour mode
      console.log("🎯 [ProjectDetail] Starting tour timer...");
      const timer = setTimeout(() => {
        if (startTourRef.current) {
          console.log("🚀 [ProjectDetail] Calling startTourRef.current()");
          startTourRef.current();
          window.history.replaceState({}, document.title);
        } else {
          console.warn("⚠️ [ProjectDetail] startTourRef.current is not defined");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.state, loading, project]);

  // Listen for tour start event from Sidebar
  useEffect(() => {
    const handleStartTour = (event) => {
      if (event.detail?.tourKey === 'projects-tour' && startTourRef.current) {
        setIsTourMode(true);
        // Add a small delay for state update
        setTimeout(() => {
          if (startTourRef.current) startTourRef.current();
        }, 300);
      }
    };

    window.addEventListener('plexis-start-tour', handleStartTour);
    return () => window.removeEventListener('plexis-start-tour', handleStartTour);
  }, []);



  const USE_MOCK_DATA = false; // Change to false to use real API

  const getMockProject = () => {
    const mockProjects = {
      1: {
        _id: "1",
        projectTitle: "Sarah & John Wedding Photography",
        projectDescription:
          "Complete wedding photography package including pre-wedding, ceremony, and reception coverage. Full day event with multiple locations. We will capture all the special moments from the morning preparations through the evening reception.",
        startDate: "2024-12-15",
        endDate: "2024-12-17",
        projectType: "General",
        clientEmail: "sarah.johnson@email.com",
        clientPhone: "+91 9876543210",
        budget: "150000",
        assignedCrew: ["crew1", "crew2"],
        assignedEquipment: [
          { id: { _id: "equip1", itemName: "Canon EOS R5", category: "Camera" }, quantity: 2 },
          { id: { _id: "equip2", itemName: "Sony A7III", category: "Camera" }, quantity: 1 },
        ],
        inHouseCrew: [
          {
            _id: "task1",
            name: "Setup & Location Scouting",
            crewId: { _id: "crew1", name: "John Photographer" },
            dueDate: "2024-12-14",
            status: "Completed",
          },
          {
            _id: "task2",
            name: "Wedding Day Photography",
            crewId: { _id: "crew2", name: "Sarah Assistant" },
            dueDate: "2024-12-15",
            status: "In Progress",
          },
          {
            _id: "task3",
            name: "Photo Editing & Delivery",
            crewId: { _id: "crew1", name: "John Photographer" },
            dueDate: "2024-12-20",
            status: "Pending",
          },
        ],
        progressTimeline: [
          {
            title: "Project Created",
            description:
              "Project has been created and initial planning started",
            completedAt: new Date("2024-11-01"),
          },
          {
            title: "Pre-wedding Shoot",
            description:
              "Completed romantic pre-wedding photoshoot at beach location",
            completedAt: new Date("2024-11-15"),
          },
          {
            title: "Wedding Day Coverage",
            description:
              "Full day wedding photography including ceremony and reception",
            completedAt: null,
          },
          {
            title: "Photo Editing",
            description: "Post-processing and editing of all wedding photos",
            completedAt: null,
          },
          {
            title: "Final Delivery",
            description: "Deliver all edited photos to client",
            completedAt: null,
          },
        ],
        createdBy: user?._id || user?.id,
        assignedTo: null,
      },
      2: {
        _id: "2",
        projectTitle: "Corporate Event - Tech Summit 2024",
        projectDescription:
          "Corporate event photography for annual tech summit. Coverage includes keynote sessions, networking events, and product launches. Multiple photographers will cover different sessions simultaneously.",
        startDate: "2024-11-20",
        endDate: "2024-11-20",
        projectType: "General",
        clientEmail: "events@techsolutions.com",
        clientPhone: "+91 9876543211",
        budget: "75000",
        assignedCrew: ["crew3"],
        assignedEquipment: [
          { id: { _id: "equip3", itemName: "DJI Ronin Gimbal", category: "Stabilizer" }, quantity: 1 },
        ],
        progressTimeline: [
          {
            title: "Project Created",
            description: "Project has been created",
            completedAt: new Date("2024-10-15"),
          },
          {
            title: "Event Coverage",
            description:
              "Completed full event photography covering all sessions",
            completedAt: new Date("2024-11-20"),
          },
          {
            title: "Photo Delivery",
            description: "Delivered all photos to client via online gallery",
            completedAt: new Date("2024-11-25"),
          },
        ],
        createdBy: user?._id || user?.id,
        assignedTo: null,
      },
      3: {
        _id: "3",
        projectTitle: "Portrait Session - Family Photos",
        projectDescription:
          "Family portrait session at outdoor location. Includes individual and group shots with natural lighting. Perfect for holiday cards and family albums.",
        startDate: "2024-12-01",
        endDate: "2024-12-01",
        projectType: "General",
        clientEmail: "emily.r@family.com",
        clientPhone: "+91 9876543212",
        budget: "25000",
        assignedCrew: ["crew1"],
        assignedEquipment: [
          { id: { _id: "equip1", itemName: "Canon EOS R5", category: "Camera" }, quantity: 1 },
        ],
        progressTimeline: [
          {
            title: "Project Created",
            description: "Project has been created",
            completedAt: new Date("2024-11-10"),
          },
          {
            title: "Photo Session",
            description: "Completed portrait session with family",
            completedAt: new Date("2024-12-01"),
          },
          {
            title: "Photo Editing",
            description: "Editing and retouching in progress",
            completedAt: null,
          },
        ],
        createdBy: user?._id || user?.id,
        assignedTo: null,
      },
    };
    return mockProjects[projectId] || mockProjects["1"];
  };



  const fetchProject = async () => {
    try {
      setLoading(true);
      const isTourNavigation = location.state?.continueTour;
      // Use mock data if enabled
      if (USE_MOCK_DATA || isTourNavigation || isTourMode) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
        const mockData = getMockProject();
        if (!mockData.projectAmount && mockData.budget) {
          mockData.projectAmount = parseFloat(mockData.budget);
        }
        if (!mockData.budget && mockData.projectAmount) {
          mockData.budget = mockData.projectAmount.toString();
        }
        setProject(mockData);
        setPayments(mockData.payments || []);
        setFormData({
          projectTitle: mockData.projectTitle || "",
          projectDescription: mockData.projectDescription || "",
          startDate: mockData.startDate
            ? new Date(mockData.startDate).toISOString().split("T")[0]
            : "",
          endDate: mockData.endDate
            ? new Date(mockData.endDate).toISOString().split("T")[0]
            : "",
          projectType: mockData.projectType?._id || mockData.projectType || "",
          clientEmail: mockData.clientEmail || "",
          clientPhone: mockData.clientPhone || "",
          budget: mockData.budget || "",
          assignedCrew: mockData.assignedCrew || [],
          assignedEquipment: (mockData.assignedEquipment || []).map((item) =>
            typeof item === "string" ? { id: item, quantity: 1 } : item
          ),
          storageUrl: mockData.storageUrl || "",
          inHouseCrew: Array.isArray(mockData.inHouseCrew)
            ? mockData.inHouseCrew
            : [],
        });
        return;
      }

      // Real API call
      const data = await getProjectById(projectId);
      if (!data.projectAmount && data.budget) {
        data.projectAmount = parseFloat(data.budget);
      }
      if (!data.budget && data.projectAmount) {
        data.budget = data.projectAmount.toString();
      }

      setProject(data);
      setPayments(data.payments || []);

      const crewIds = Array.isArray(data.assignedCrew)
        ? data.assignedCrew.map((crew) => {
          if (!crew) return "";
          return (crew._id || crew.id || crew).toString();
        }).filter(Boolean)
        : [];

      // Map in-house crew into roles with tasks if present
      let mappedInHouse = [];
      if (Array.isArray(data.inHouseCrew)) {
        // If already in the new structure (has tasks array), keep as is
        if (data.inHouseCrew.some((r) => Array.isArray(r.tasks))) {
          mappedInHouse = data.inHouseCrew;
        } else {
          mappedInHouse = data.inHouseCrew;
        }
      }

      setFormData({
        projectTitle: data.projectTitle || "",
        projectDescription: data.projectDescription || "",
        startDate: data.startDate
          ? new Date(data.startDate).toISOString().split("T")[0]
          : "",
        endDate: data.endDate
          ? new Date(data.endDate).toISOString().split("T")[0]
          : "",
        projectType: data.projectType?._id || data.projectType || "",
        clientEmail: data.clientEmail || "",
        clientPhone: data.clientPhone || "",
        budget: data.budget || "",
        assignedCrew: crewIds,
        assignedEquipment: (data.assignedEquipment || [])
          .filter((item) => item && (item.id || item._id))
          .map((item) => {
            const itemId = item.id?._id || item.id || item._id;
            return {
              id: itemId ? itemId.toString() : "",
              quantity: item.quantity || 1,
            };
          })
          .filter(i => i.id),
        storageUrl: data.storageUrl || "",
        inHouseCrew: mappedInHouse,
      });
    } catch (error) {
      // Error handled by UI states
    } finally {
      setLoading(false);
    }
  };

  const fetchCrewMembers = async () => {
    try {
      if (isTourMode || location.state?.continueTour) {
        const mockCrew = [
          { _id: "crew1", id: "crew1", name: "John Photographer", position: "Lead Photographer" },
          { _id: "crew2", id: "crew2", name: "Sarah Assistant", position: "Assistant" },
          { _id: "crew3", id: "crew3", name: "Mike Videographer", position: "Videographer" },
        ];
        setCrewMembers(mockCrew);
        setAvailableCrew(mockCrew);
        return;
      }

      // Real API call
      const crew = await getCrewListWithProjects();
      setCrewMembers(crew);
      // Filter available crew (not assigned to other projects on the same dates)
      // For now, show all crew as available
      setAvailableCrew(crew);
    } catch (error) {
      // Error handled
    }
  };

  const fetchProjectExpenses = async () => {
    try {
      if (isTourMode) {
        setProjectExpenses([]);
        return;
      }

      const allExpenses = await getExpenses();
      // Filter expenses for this project only - handle both populated object and string ID
      const filtered = allExpenses.filter(exp => {
        const expProjectId = exp.projectId?._id || exp.projectId;
        return expProjectId === projectId;
      });
      setProjectExpenses(filtered);
    } catch (error) {
      setProjectExpenses([]);
    }
  };

  const fetchPaymentSchedulesForProject = async () => {
    if (isTourMode) {
      setPaymentSchedules([]);
      return;
    }

    try {
      setLoadingSchedules(true);
      const schedules = await getPaymentSchedules(projectId);
      setPaymentSchedules(schedules || []);
    } catch (error) {
      setPaymentSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleAddPayment = async (paymentData) => {
    try {
      const response = await post(`/project/${projectId}/payments`, paymentData);
      // Update local state directly from the returned project — no full re-fetch
      const updatedProject = response?.data || response;
      if (updatedProject && updatedProject.payments) {
        setProject(updatedProject);
        setPayments(updatedProject.payments);
      }
      setSuccessMessage("Payment added successfully!");
      setShowPaymentModal(false);
      setPaymentScreenshots([]);
    } catch (error) {
      setErrorMessage(`Failed to add payment: ${error.message}`);
    }
  };



  const sanitizeFormData = (data) => {
    const clean = { ...data };

    // Sanitize crew
    if (Array.isArray(clean.assignedCrew)) {
      clean.assignedCrew = clean.assignedCrew
        .map(id => id ? (id._id || id.id || id).toString() : "")
        .filter(id => id && id !== "[object Object]");
    }

    // Sanitize equipment
    if (Array.isArray(clean.assignedEquipment)) {
      clean.assignedEquipment = clean.assignedEquipment
        .filter(item => item && (item.id || item._id))
        .map(item => {
          const id = item.id?._id || item.id || item._id;
          return {
            id: id ? id.toString() : "",
            quantity: item.quantity || 1
          };
        })
        .filter(i => i.id && i.id !== "[object Object]");
    }

    // Sanitize in-house crew roles & tasks
    if (!Array.isArray(clean.inHouseCrew)) {
      clean.inHouseCrew = [];
    } else {
      clean.inHouseCrew = clean.inHouseCrew.map((task) => {
        const taskId = task.id || task._id || `${task.crewId || ""}-${task.name || ""}`;
        const crewId = task.crewId || "";
        return {
          id: taskId,
          crewId,
          name: task.name || "",
          dueDate: task.dueDate || "",
          status: task.status || "Pending",
        };
      });
    }

    return clean;
  };

  const handleSave = async (silent = false) => {
    try {
      const sanitizedData = sanitizeFormData(formData);
      const updatedData = await updateProject(projectId, sanitizedData);

      if (!silent) {
        setSuccessMessage("Project updated successfully!");
      }
      setEditing(false);
      // Update local project state and SYNC formData with returned data
      if (updatedData) {
        setProject(updatedData);
        // Sync formData with the updated project data to prevent stale state
        const crewIds = Array.isArray(updatedData.assignedCrew)
          ? updatedData.assignedCrew.map((c) => {
            if (!c) return "";
            return (c._id || c.id || c).toString();
          }).filter(Boolean)
          : [];
        setFormData(prev => ({
          ...prev,
          assignedCrew: crewIds,
          assignedEquipment: (updatedData.assignedEquipment || [])
            .filter((item) => item && (item.id || item._id))
            .map((item) => {
              const itemId = item.id?._id || item.id || item._id;
              return {
                id: itemId ? itemId.toString() : "",
                quantity: item.quantity || 1,
              };
            })
            .filter(i => i.id),
          storageUrl: updatedData.storageUrl || "",
        }));
      } else {
        fetchProject();
      }
      return updatedData;
    } catch (error) {
      setErrorMessage(`Failed to update project: ${error.message}`);
      throw error;
    }
  };

  const handleAddTimelineEntry = async (entryData) => {
    try {
      const response = await addTimelineEntry(projectId, entryData);

      // Update project with new timeline and status
      setProject(prev => ({
        ...prev,
        progressTimeline: response.progressTimeline,
        projectStatus: response.projectStatus || prev.projectStatus
      }));

      // Calculate progress percentage based on timeline completion
      const completedEntries = response.progressTimeline?.filter(entry => entry.completedAt !== null).length || 0;
      const totalEntries = response.progressTimeline?.length || 1;
      const progressPercentage = Math.round((completedEntries / totalEntries) * 100);

      // Show detailed success message to user
      let message = `Timeline updated successfully! "${entryData.title}" added to project progress. ` +
        `Current status: ${completedEntries}/${totalEntries} milestones completed (${progressPercentage}%).`;

      if (entryData.sendToClient) {
        message += ' Email notification sent to client.';
      }

      if (entryData.status) {
        message += ` Project status updated to: ${entryData.status}.`;
      }

      setSuccessMessage(message);

    } catch (error) {
      setErrorMessage(`Failed to add timeline entry: ${error.message}`);
    }
  };

  const handleUpdateTimelineEntry = async (entryIndex, entryData) => {
    try {
      const { updateTimelineEntry } = await import("../../../services/projectService");
      const response = await updateTimelineEntry(projectId, entryIndex, entryData);

      // Update project with new timeline and status
      setProject(prev => ({
        ...prev,
        progressTimeline: response.progressTimeline || prev.progressTimeline,
        projectStatus: response.projectStatus || prev.projectStatus
      }));

      let message = "Timeline entry updated successfully!";

      if (entryData.sendToClient) {
        message += ' Email notification sent to client.';
      }

      if (entryData.status) {
        message += ` Project status updated to: ${entryData.status}.`;
      }

      setSuccessMessage(message);
      fetchProject();
    } catch (error) {
      setErrorMessage(`Failed to update timeline entry: ${error.message}`);
    }
  };

  const handleDeleteTimelineEntry = async (entry) => {
    try {
      const index = project.progressTimeline.indexOf(entry);
      if (index !== -1) {
        await deleteTimelineEntry(projectId, index);
        setSuccessMessage("Timeline entry deleted successfully!");
        fetchProject();
      }
    } catch (error) {
      setErrorMessage(`Failed to delete timeline entry: ${error.message}`);
    }
  };

  const handleAddInHouseTask = async () => {
    try {
      if (!inHouseTaskForm.crewId || !inHouseTaskForm.name) {
        setErrorMessage("Please select a crew member and enter a task name");
        return;
      }

      if (editingInHouseTask) {
        // Update existing task
        await updateInHouseTask(projectId, editingInHouseTask.id || editingInHouseTask._id, {
          crewId: inHouseTaskForm.crewId,
          name: inHouseTaskForm.name,
          dueDate: inHouseTaskForm.dueDate,
        });
        setFormData(prev => ({
          ...prev,
          inHouseCrew: prev.inHouseCrew.map(task => {
            const taskId = task._id || task.id;
            const editId = editingInHouseTask._id || editingInHouseTask.id;
            if (taskId === editId) {
              return {
                ...task,
                crewId: inHouseTaskForm.crewId,
                name: inHouseTaskForm.name,
                dueDate: inHouseTaskForm.dueDate,
              };
            }
            return task;
          })
        }));
        setSuccessMessage("Task updated successfully!");
      } else {
        // Add new task
        const response = await addInHouseTask(projectId, {
          crewId: inHouseTaskForm.crewId,
          name: inHouseTaskForm.name,
          dueDate: inHouseTaskForm.dueDate,
        });
        const newTask = { id: response.newTaskId, crewId: inHouseTaskForm.crewId, name: inHouseTaskForm.name, dueDate: inHouseTaskForm.dueDate, status: "Pending" };
        setFormData(prev => ({ ...prev, inHouseCrew: [...prev.inHouseCrew, newTask] }));
      }


      setShowAddInHouseTaskModal(false);
      setInHouseTaskForm({ crewId: "", name: "", dueDate: "" });
      setEditingInHouseTask(null); // Reset editing state
    } catch (error) {
      setErrorMessage(`Failed to ${editingInHouseTask ? 'update' : 'add'} task: ${error.message}`);
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setFormData(prev => ({
        ...prev,
        inHouseCrew: prev.inHouseCrew.map(task =>
          (task._id === taskId || task.id === taskId) ? { ...task, status: newStatus } : task
        )
      }));

      await updateInHouseTaskStatus(projectId, taskId, newStatus);
      setSuccessMessage("Task status updated successfully!");
      setSuccessMessage("Task status updated successfully!");
    } catch (error) {
      setErrorMessage(`Failed to update status: ${error.message}`);
      fetchProject(); // Revert on error by refetching
    }
  };

  const handleDeleteInHouseTask = (task) => {
    setTaskToDelete(task);
    setShowDeleteInHouseTaskModal(true);
  };

  const confirmDeleteInHouseTask = async () => {
    if (!taskToDelete) return;

    try {
      setIsDeletingInHouseTask(true);
      const taskId = taskToDelete._id || taskToDelete.id;

      await deleteInHouseTask(projectId, taskId);
      setFormData(prev => ({
        ...prev,
        inHouseCrew: prev.inHouseCrew.filter(task => task._id !== taskId && task.id !== taskId)
      }));
      setSuccessMessage("Task deleted successfully!");
      setShowDeleteInHouseTaskModal(false);
      setTaskToDelete(null);
    } catch (error) {
      setErrorMessage(`Failed to delete task: ${error.message}`);
    } finally {
      setIsDeletingInHouseTask(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      setIsDeletingProject(true);
      await deleteProject(projectId);
      navigate('/project', { replace: true });
    } catch (error) {
      setErrorMessage(`Failed to delete project: ${error.message}`);
      setIsDeletingProject(false);
      setShowDeleteProjectModal(false);
    }
  };

  const handleEditInHouseTask = (task) => {
    // Handle populated crewId (object) or string ID
    const crewId = task.crewId && (task.crewId._id || task.crewId.id || task.crewId).toString();

    setInHouseTaskForm({
      crewId: crewId || "",
      name: task.name || "",
      dueDate: task.dueDate || "",
    });
    setEditingInHouseTask(task);
    setShowAddInHouseTaskModal(true);
  };

  // PDF Viewing Handlers
  const handleViewQuotationPDF = async (quotationId) => {
    try {
      setPdfLoadingId(quotationId);
      const pdfUrl = await exportQuotationToPdf(quotationId, { force: true });
      if (pdfUrl) {
        openPdfInNewTab(pdfUrl);
        setSuccessMessage("Quotation PDF opened in new tab");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage("PDF not available. Please try again later.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (error) {
      setErrorMessage(`Failed to view PDF: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleViewContractPDF = async (contractId) => {
    try {
      setPdfLoadingId(contractId);
      const response = await exportContractPdf(contractId);
      const pdfUrl = response.pdfUrl || response.data?.pdfUrl || response;
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
        setSuccessMessage("Contract PDF opened in new tab");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error('PDF URL not found');
      }
    } catch (error) {
      setErrorMessage(`Failed to view contract PDF: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const handleRefreshStorage = async () => {
    try {
      setStorageRefreshing(true);
      const response = await recalculateStorage(projectId);

      // The backend returns projectBreakdown with storage per project
      const projectStorage = response.projectBreakdown?.[projectId] || 0;

      // Update project with actual storage value from backend
      setProject(prev => ({
        ...prev,
        storageUsed: projectStorage
      }));
    } catch (error) {
      setErrorMessage(`Failed to refresh storage: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setStorageRefreshing(false);
    }
  };

  const handleAssignCrew = (crewMemberId) => {
    setFormData((prev) => ({
      ...prev,
      assignedCrew: prev.assignedCrew.includes(crewMemberId)
        ? prev.assignedCrew.filter((id) => id !== crewMemberId)
        : [...prev.assignedCrew, crewMemberId],
    }));
  };

  const addSelectedCrew = () => {
    if (!selectedCrewToAdd) return;
    handleAssignCrew(selectedCrewToAdd);
    setSelectedCrewToAdd("");
  };

  const fetchInventoryItems = async () => {
    if (isTourMode) {
      const mockInventory = [
        { _id: "equip1", id: "equip1", itemName: "Canon EOS R5", category: "Camera", quantity: 5, available: 3 },
        { _id: "equip2", id: "equip2", itemName: "Sony A7III", category: "Camera", quantity: 3, available: 2 },
        { _id: "equip3", id: "equip3", itemName: "DJI Ronin Gimbal", category: "Stabilizer", quantity: 2, available: 1 },
      ];
      setInventoryItems(mockInventory);
      return;
    }
    try {
      const items = await getInventoryItems();
      setInventoryItems(items);
    } catch (error) {
      // Error handled
    }
  };

  const handleAssignEquipment = (equipmentId) => {
    if (!equipmentId) return;
    const equipIdStr = equipmentId.toString();

    setFormData((prev) => {
      // 1. Sanitize current assigned equipment to ensure they are all strings and valid
      const sanitized = (prev.assignedEquipment || [])
        .filter(item => item && (item.id || item._id))
        .map(item => {
          const id = item.id?._id || item.id || item._id;
          return {
            id: id ? id.toString() : "",
            quantity: item.quantity || 1
          };
        })
        .filter(i => i.id && i.id !== "[object Object]");

      // 2. Check if the item is already assigned
      const isCurrentlyAssigned = sanitized.some(item => item.id === equipIdStr);

      if (isCurrentlyAssigned) {
        // Remove
        const newAssigned = sanitized.filter(item => item.id !== equipIdStr);
        return { ...prev, assignedEquipment: newAssigned };
      } else {
        // Add
        const quantity = equipmentQuantities[equipIdStr] || 1;
        return { ...prev, assignedEquipment: [...sanitized, { id: equipIdStr, quantity }] };
      }
    });

    // Also update equipmentQuantities locally if needed
    if (equipmentQuantities[equipIdStr] === undefined) {
      setEquipmentQuantities(prev => ({ ...prev, [equipIdStr]: 1 }));
    }
  };

  const openEquipmentModal = () => {
    // Refetch to get latest available counts
    fetchInventoryItems();
    
    // Snapshot current equipment state so Cancel can revert
    setEquipmentModalSnapshot({
      assignedEquipment: formData.assignedEquipment || [],
      quantities: { ...equipmentQuantities },
    });
    setShowEquipmentModal(true);
  };

  const handleCloseEquipmentModal = () => {
    if (equipmentModalSnapshot) {
      setFormData((prev) => ({
        ...prev,
        assignedEquipment: equipmentModalSnapshot.assignedEquipment || [],
      }));
      setEquipmentQuantities(equipmentModalSnapshot.quantities || {});
    }
    setShowEquipmentModal(false);
  };

  const handleQuantityChange = (equipmentId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    const equipIdStr = (equipmentId?._id || equipmentId || "").toString();

    if (!equipIdStr || equipIdStr === "[object Object]") return;

    setEquipmentQuantities((prev) => ({
      ...prev,
      [equipIdStr]: numQuantity,
    }));

    // Update formData if equipment is already assigned
    setFormData((prev) => ({
      ...prev,
      assignedEquipment: (prev.assignedEquipment || [])
        .filter((item) => item && (item.id || item._id))
        .map((item) => {
          const id = (item.id?._id || item.id || item._id || "").toString();
          if (id === equipIdStr) {
            return { ...item, id, quantity: numQuantity };
          }
          return item;
        }),
    }));
  };

  const handleSaveCrew = async () => {
    try {
      // If there's a crew member selected in the dropdown but not added yet, add it automatically
      let finalAssignedCrew = [...formData.assignedCrew];

      if (selectedCrewToAdd && !finalAssignedCrew.includes(selectedCrewToAdd)) {
        finalAssignedCrew.push(selectedCrewToAdd);

        // Update formData immediately for handleSave to use
        const updatedFormData = sanitizeFormData({
          ...formData,
          assignedCrew: finalAssignedCrew
        });

        // Call updateProject with the updated data directly to avoid waiting for state sync
        const updatedProject = await updateProject(projectId, updatedFormData);

        setProject(updatedProject);
        if (finalAssignedCrew.length > 0) {
          setSuccessMessage("Crew updated successfully!");
        }

        // Sync formData with result
        const crewIds = Array.isArray(updatedProject.assignedCrew)
          ? updatedProject.assignedCrew.map((c) => {
            if (!c) return "";
            return (c._id || c.id || c).toString();
          }).filter(Boolean)
          : [];
        setFormData(prev => ({
          ...prev,
          assignedCrew: crewIds,
          assignedEquipment: (updatedProject.assignedEquipment || [])
            .filter((item) => item && (item.id || item._id))
            .map((item) => {
              const itemId = item.id?._id || item.id || item._id;
              return {
                id: itemId ? itemId.toString() : "",
                quantity: item.quantity || 1,
              };
            })
            .filter(i => i.id)
        }));
      } else {
        // Normal save with whatever is in formData.assignedCrew
        await handleSave(finalAssignedCrew.length === 0);
      }

      setShowCrewModal(false);
      setSelectedCrewToAdd("");
    } catch (error) {
      setErrorMessage(`Failed to save crew: ${error.message}`);
    }
  };

  const handleSaveEquipment = async () => {
    try {
      // 1. Identify items to unassign (were assigned but now removed)
      const previouslyAssigned = (project.assignedEquipment || []).filter(
        (item) => item && (item.id || item._id)
      );
      const currentlyAssigned = (formData.assignedEquipment || []).filter(
        (item) => item && item.id
      );

      const toUnassign = previouslyAssigned.filter(
        (prev) =>
          !currentlyAssigned.some((curr) => curr.id === (prev.id || prev._id))
      );

      // 2. Build batch assignment data
      const assignments = [];
      
      // Add items to unassign (quantity 0)
      for (const item of toUnassign) {
        assignments.push({
          itemId: item.id || item._id,
          quantity: 0
        });
      }

      // Add/Update current items
      for (const assignedItem of currentlyAssigned) {
        assignments.push({
          itemId: assignedItem.id,
          quantity: assignedItem.quantity
        });
      }

      if (assignments.length > 0) {
        const batchData = {
          assignments,
          projectId: projectId,
          assignedFrom: project.startDate || new Date().toISOString(),
          assignedTo: project.endDate || new Date().toISOString(),
        };
        const response = await batchAssignInventory(batchData);
        
        // Update inventoryItems state locally with returned updated items
        if (response && response.data) {
          setInventoryItems(prevItems => {
            const updatedItems = response.data;
            const updatedMap = new Map(updatedItems.map(item => [item._id || item.id, item]));
            return prevItems.map(item => updatedMap.get(item._id || item.id) || item);
          });
        }
      }

      // 3. Update the project with the new assigned equipment list
      const cleanedEquipment = currentlyAssigned.map(item => ({
        id: item.id.toString(),
        quantity: item.quantity
      }));

      const updatedProject = await updateProject(projectId, { assignedEquipment: cleanedEquipment });

      if (updatedProject) {
        setProject(updatedProject);
        // Sync formData to match project
        setFormData(prev => ({
          ...prev,
          assignedEquipment: (updatedProject.assignedEquipment || [])
            .filter((item) => item && (item.id || item._id))
            .map((item) => {
              const itemId = item.id?._id || item.id || item._id;
              return {
                id: itemId ? itemId.toString() : "",
                quantity: item.quantity || 1,
              };
            })
            .filter(i => i.id)
        }));
      }

      setSuccessMessage("Equipment assignment updated successfully!");
      setShowEquipmentModal(false);
    } catch (error) {
      setErrorMessage(`Failed to save equipment: ${error.message}`);
    }
  };

  const handleSaveBudget = () => {
    const numericBudget = parseFloat(formData.budget) || 0;

    // Validate: budget cannot be less than sum of all payment schedules + sum of all payment history
    const totalScheduled = (paymentSchedules || []).filter(s => s.status !== 'paid').reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalAllocatedNow = totalScheduled + totalPaid;

    if (numericBudget > 0 && numericBudget < totalAllocatedNow) {
      setErrorMessage(`Budget cannot be less than amount already paid or scheduled (${formatIndianCurrency(totalAllocatedNow, true, 0)})`);
      return;
    }

    // Sync projectAmount = budget so all schedule logic works correctly
    setFormData(prev => ({ ...prev, budget: formData.budget }));

    const isBudgetEmpty = numericBudget === 0;
    handleSave(isBudgetEmpty).then(() => {
      // After save, also update projectAmount on the project state directly
      updateProject(projectId, { projectAmount: numericBudget, budget: numericBudget })
        .then(() => {
          setProject(prev => ({ ...prev, projectAmount: numericBudget, budget: numericBudget }));
        })
        .catch(() => { });
    });

    setShowBudgetModal(false);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItemsToRelease(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleReleaseEquipment = async () => {
    try {
      if (selectedItemsToRelease.length === 0) {
        setErrorMessage("Please select at least one item to release");
        return;
      }
      setIsReleasingEquipment(true);
      const result = await releaseEquipment(projectId, selectedItemsToRelease);

      const releasedCount = result.data?.totalReleased || result.releasedItems?.length || 0;
      setSuccessMessage(`Successfully released ${releasedCount} equipment item(s) back to inventory`);

      setShowReleaseEquipmentModal(false);
      fetchProject(); // Refresh project data
      fetchInventoryItems(); // Refresh inventory
    } catch (error) {
      setErrorMessage(error.message || 'Failed to release equipment');
    } finally {
      setIsReleasingEquipment(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          {/* Breadcrumb Skeleton */}
          <div className="mb-4">
            <Skeleton className="h-4 w-32 mb-2" />
          </div>

          {/* Header Section Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96 mb-4" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          {/* Tabs Skeleton */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-1">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <Error message="Project not found" />
        </div>
      </div>
    );
  }

  // ============ PAYMENT MILESTONE HANDLERS ============
  const handleAddMilestone = () => {
    setMilestoneFormData({
      description: "",
      amount: "",
      dueDate: "",
      percentage: "",
      status: "Pending"
    });
    setEditingMilestoneIndex(null);
    setShowMilestoneModal(true);
  };

  const handleEditMilestone = (milestone, index) => {
    setMilestoneFormData({
      description: milestone.description || "",
      amount: milestone.amount || "",
      dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0] : "",
      percentage: milestone.percentage || "",
      status: milestone.status || (milestone.paid ? "Paid" : "Pending")
    });
    setEditingMilestoneIndex(index);
    setShowMilestoneModal(true);
  };

  const handleSaveMilestone = async () => {
    try {
      if (!milestoneFormData.description || !milestoneFormData.amount) {
        setErrorMessage("Description and amount are required");
        return;
      }

      const updatedMilestones = [...(project.paymentMilestones || [])];
      const milestoneData = {
        description: milestoneFormData.description,
        amount: parseFloat(milestoneFormData.amount),
        dueDate: milestoneFormData.dueDate || null,
        percentage: milestoneFormData.percentage ? parseFloat(milestoneFormData.percentage) : null,
        status: milestoneFormData.status,
        paid: milestoneFormData.status === "Paid"
      };

      if (editingMilestoneIndex !== null) {
        // Edit existing milestone
        updatedMilestones[editingMilestoneIndex] = milestoneData;
      } else {
        // Add new milestone
        updatedMilestones.push(milestoneData);
      }

      // Update project with new milestones
      await updateProject(projectId, { paymentMilestones: updatedMilestones });

      setProject({ ...project, paymentMilestones: updatedMilestones });
      setSuccessMessage(editingMilestoneIndex !== null ? "Milestone updated successfully!" : "Milestone added successfully!");
      setShowMilestoneModal(false);
      setEditingMilestoneIndex(null);
    } catch (error) {
      setErrorMessage(`Failed to save milestone: ${error.message}`);
    }
  };

  const handleDeleteMilestone = async (index) => {
    try {
      const updatedMilestones = project.paymentMilestones.filter((_, i) => i !== index);
      await updateProject(projectId, { paymentMilestones: updatedMilestones });

      setProject({ ...project, paymentMilestones: updatedMilestones });
      setSuccessMessage("Milestone deleted successfully!");
    } catch (error) {
      setErrorMessage(`Failed to delete milestone: ${error.message}`);
    }
  };

  const handleToggleMilestonePaid = async (index) => {
    try {
      const updatedMilestones = [...project.paymentMilestones];
      const currentStatus = updatedMilestones[index].status || (updatedMilestones[index].paid ? "Paid" : "Pending");
      const newStatus = currentStatus === "Paid" ? "Pending" : "Paid";

      updatedMilestones[index] = {
        ...updatedMilestones[index],
        status: newStatus,
        paid: newStatus === "Paid"
      };

      await updateProject(projectId, { paymentMilestones: updatedMilestones });

      setProject({ ...project, paymentMilestones: updatedMilestones });
      setSuccessMessage(`Milestone marked as ${newStatus.toLowerCase()}!`);
    } catch (error) {
      setErrorMessage(`Failed to update milestone: ${error.message}`);
    }
  };

  // ============ PROJECT AMOUNT & PAYMENT SCHEDULE HELPERS ============

  const openProjectAmountModal = () => {
    const currentAmount =
      project && typeof project.projectAmount === "number"
        ? project.projectAmount
        : 0;
    setProjectAmountInput(
      currentAmount ? currentAmount.toString() : ""
    );
    setShowProjectAmountModal(true);
  };

  const handleSaveProjectAmount = async () => {
    const numericValue = parseFloat(projectAmountInput);
    if (isNaN(numericValue) || numericValue <= 0) {
      setErrorMessage("Please enter a valid project amount");
      return;
    }

    try {
      await updateProject(projectId, { projectAmount: numericValue });
      setProject((prev) =>
        prev ? { ...prev, projectAmount: numericValue } : prev
      );
      setSuccessMessage("Project amount updated successfully!");
      setShowProjectAmountModal(false);
    } catch (error) {
      setErrorMessage(
        `Failed to update project amount: ${error.message}`
      );
    }
  };

  const handleOpenScheduleModal = () => {
    setScheduleRows([{ description: "", amount: "", dueDate: "" }]);
    setShowScheduleModal(true);
  };

  const handleAddScheduleRow = () => {
    setScheduleRows((rows) => [
      ...rows,
      { description: "", amount: "", dueDate: "" },
    ]);
  };

  const handleRemoveScheduleRow = (index) => {
    setScheduleRows((rows) => rows.filter((_, i) => i !== index));
  };

  const handleChangeScheduleRow = (index, field, value) => {
    setScheduleRows((rows) =>
      rows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSaveSchedules = async () => {
    if (!project || !projectId) return;

    const cleanedRows = scheduleRows
      .map((row) => ({
        description: row.description?.trim(),
        amount: parseFloat(row.amount),
        dueDate: row.dueDate,
      }))
      .filter(
        (row) =>
          row.description &&
          !isNaN(row.amount) &&
          row.amount > 0 &&
          row.dueDate
      );

    if (cleanedRows.length === 0) {
      setErrorMessage("Please add at least one valid schedule row");
      return;
    }

    const projectAmountValue = parseFloat(project.budget || 0);

    if (projectAmountValue > 0) {
      // Always use the payments array (project.payments) as the source of truth for paid amounts
      const totalPaidHistory = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      // Only count pending/overdue schedules as future committed amounts
      const _upcoming = (paymentSchedules || []).filter(s => s.status === 'pending' || s.status === 'overdue');
      const totalUnpaidScheduled = _upcoming.reduce((sum, s) => sum + (s.amount || 0), 0);

      // 3. New Schedule Amount
      const newRowsTotal = cleanedRows.reduce((sum, r) => sum + r.amount, 0);

      // Total Utilized = Application of Funds (Paid) + Future Commitments (Unpaid Schedule) + New Commitments
      const totalProjectedUtilization = totalPaidHistory + totalUnpaidScheduled + newRowsTotal;
      console.log("the cals ar ", totalProjectedUtilization, projectAmountValue);

      if (totalProjectedUtilization > projectAmountValue + 0.01) {
        setErrorMessage(
          `Total combined amount (Paid: ${formatIndianCurrency(totalPaidHistory)} + Scheduled: ${formatIndianCurrency(totalUnpaidScheduled + newRowsTotal)}) exceeds project amount (${formatIndianCurrency(projectAmountValue)})`
        );
        return;
      }
    }

    try {
      for (const row of cleanedRows) {
        await addPaymentSchedule(projectId, {
          description: row.description,
          amount: row.amount,
          dueDate: row.dueDate,
        });
      }
      await fetchPaymentSchedulesForProject();
      setShowScheduleModal(false);
      setSuccessMessage("Payment schedule added successfully!");
    } catch (error) {
      setErrorMessage(
        `Failed to add payment schedule: ${error.message}`
      );
    }
  };

  const handleOpenMarkPaidModal = (schedule) => {
    setScheduleToMarkPaid(schedule);
    setMarkPaidForm({
      paidByName:
        schedule.paidByName ||
        project?.clientName ||
        "",
      paymentMethod: schedule.paymentMethod || "Cash",
      payerPhone:
        schedule.payerPhone || project?.clientPhone || "",
      paidDate: schedule.paidDate
        ? dayjs(schedule.paidDate).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      screenshots: schedule.screenshots || [],
    });
    setShowMarkPaidModal(true);
  };

  const handleConfirmMarkPaid = async () => {
    if (!scheduleToMarkPaid) return;

    try {
      const updatedScheduleData = {
        status: "paid",
        paidDate: markPaidForm.paidDate,
        paidByName: markPaidForm.paidByName,
        paymentMethod: markPaidForm.paymentMethod,
        payerPhone: markPaidForm.payerPhone,
        screenshots: markPaidForm.screenshots || [],
      };

      await updatePaymentSchedule(
        projectId,
        scheduleToMarkPaid._id,
        updatedScheduleData
      );

      // Update paymentSchedules state locally — replace the marked schedule
      setPaymentSchedules(prev =>
        prev.map(s =>
          s._id === scheduleToMarkPaid._id
            ? { ...s, ...updatedScheduleData }
            : s
        )
      );

      // Append the new payment into project.payments + payments state locally
      const newPaymentEntry = {
        amount: scheduleToMarkPaid.amount,
        paidBy: markPaidForm.paidByName || project?.clientName || "Client",
        phoneNumber: markPaidForm.payerPhone || project?.clientPhone || "",
        paymentMethod: markPaidForm.paymentMethod || "Other",
        paymentDate: markPaidForm.paidDate || new Date().toISOString(),
        notes: scheduleToMarkPaid.description
          ? `From schedule: ${scheduleToMarkPaid.description}`
          : "From payment schedule",
        _id: `local_${Date.now()}`,
      };
      setProject(prev => ({
        ...prev,
        payments: [...(prev.payments || []), newPaymentEntry],
      }));
      setPayments(prev => [...prev, newPaymentEntry]);

      setShowMarkPaidModal(false);
      setScheduleToMarkPaid(null);
      setSuccessMessage("Payment marked as paid!");
    } catch (error) {
      setErrorMessage(
        `Failed to update payment schedule: ${error.message}`
      );
    }
  };




  const handleDeleteSchedule = (scheduleId) => {
    setScheduleToDelete(scheduleId);
    setShowDeleteScheduleModal(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    setIsDeletingSchedule(true);
    try {
      await deletePaymentSchedule(projectId, scheduleToDelete);
      await fetchPaymentSchedulesForProject();
      setSuccessMessage("Payment schedule deleted successfully!");
      setShowDeleteScheduleModal(false);
      setScheduleToDelete(null);
    } catch (error) {
      setErrorMessage(`Failed to delete payment schedule: ${error.message}`);
    } finally {
      setIsDeletingSchedule(false);
    }
  };

  const handleOpenEditModal = (schedule) => {
    setScheduleToEdit(schedule);
    setEditScheduleForm({
      description: schedule.description || "",
      amount: schedule.amount || "",
      dueDate: schedule.dueDate ? new Date(schedule.dueDate).toISOString().split("T")[0] : "",
    });
    setShowEditScheduleModal(true);
  };

  const handleSaveEditSchedule = async () => {
    if (!scheduleToEdit) return;

    try {
      await updatePaymentSchedule(
        projectId,
        scheduleToEdit._id,
        {
          description: editScheduleForm.description,
          amount: parseFloat(editScheduleForm.amount),
          dueDate: editScheduleForm.dueDate,
        }
      );

      await fetchPaymentSchedulesForProject();
      setShowEditScheduleModal(false);
      setScheduleToEdit(null);
      setSuccessMessage("Payment schedule updated successfully!");
    } catch (error) {
      setErrorMessage(`Failed to update payment schedule: ${error.message}`);
    }
  };

  const handleOpenSplitModal = (schedule) => {
    setScheduleToSplit(schedule);
    const total = schedule.amount;
    const half = Math.round(total / 2);
    const remainder = total - half;

    const date1 = schedule.dueDate ? new Date(schedule.dueDate) : new Date();
    const date2 = new Date(date1);
    date2.setDate(date2.getDate() + 15);

    // Use the description as prefix: "Advance" → "Advance 1", "Advance 2"
    const baseName = schedule.description || "Part";

    setSplitParts([
      { description: `${baseName} 1`, amount: half, dueDate: date1.toISOString().split('T')[0] },
      { description: `${baseName} 2`, amount: remainder, dueDate: date2.toISOString().split('T')[0] }
    ]);
    setShowSplitModal(true);
  };
  const handleAddSplitPart = () => {
    const baseName = scheduleToSplit?.description || "Part";
    const newCount = splitParts.length + 1;

    const lastDate = splitParts[splitParts.length - 1]?.dueDate
      ? new Date(splitParts[splitParts.length - 1].dueDate)
      : new Date();
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + 15);

    setSplitParts([
      ...splitParts,
      {
        description: `${baseName} ${newCount}`,
        amount: 0,
        dueDate: nextDate.toISOString().split('T')[0],
      }
    ]);
  };

  const handleRemoveSplitPart = (index) => {
    if (splitParts.length <= 2) {
      alert("Minimum 2 parts required for split");
      return;
    }
    const newCount = splitParts.length - 1;
    const newAmount = scheduleToSplit.amount / newCount;

    const updatedParts = splitParts
      .filter((_, i) => i !== index)
      .map(part => ({ ...part, amount: newAmount }));

    setSplitParts(updatedParts);
  };

  const handleSaveSplit = async () => {
    if (!scheduleToSplit) return;

    if (splitParts.some(p => !p.description.trim())) {
      setErrorMessage("All split parts must have a description");
      return;
    }

    const totalPartsAmount = splitParts.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    if (Math.abs(totalPartsAmount - scheduleToSplit.amount) > 1) {
      setErrorMessage("Amount is not summing up to Total");
      return;
    }

    try {
      await deletePaymentSchedule(projectId, scheduleToSplit._id);
      for (const part of splitParts) {
        await addPaymentSchedule(projectId, {
          description: part.description,
          amount: parseFloat(part.amount),
          dueDate: part.dueDate
        });
      }
      await fetchPaymentSchedulesForProject();
      setShowSplitModal(false);
      setScheduleToSplit(null);
      setSuccessMessage("Payment schedule split successfully!");
    } catch (error) {
      setErrorMessage(`Failed to split payment schedule: ${error.message}`);
    }
  };




  const paidSchedules = (paymentSchedules || []).filter((s) => s.status === "paid");
  const upcomingSchedules = (paymentSchedules || []).filter(
    (s) => s.status === "pending" || s.status === "overdue"
  );
  // Remaining amount = Budget - (already paid) - (pending/overdue schedules)
  const totalPaidHistory = (payments || []).reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const totalScheduledPending = upcomingSchedules.reduce(
    (sum, s) => sum + (s.amount || 0),
    0
  );
  const remainingAmount =
    (parseFloat(project.budget || 0)) - (totalPaidHistory + totalScheduledPending);


  const getStatusColor = (status) => {
    switch (status) {
      case "Planning":
        return "bg-purple-100 text-purple-700";
      case "In Progress":
        return "bg-blue-100 text-blue-700";
      case "Review":
        return "bg-yellow-100 text-yellow-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "On Hold":
        return "bg-orange-100 text-orange-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  const NoAccessFallback = ({ section }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        You don’t have access to this {section}.
      </h3>
      <p className="text-gray-500 text-sm">
        Please contact your administrator if you believe this is a mistake.
      </p>
    </div>
  );

  // Use projectStatus from project if available, otherwise calculate from endDate
  const projectStatus = project.projectStatus || (project.endDate
    ? new Date(project.endDate) < new Date()
      ? "Completed"
      : "In Progress"
    : "Planning");

  const hasSavedQuotationPdf = Boolean(
    project?.sourceQuotationId?.pdfUrl || project?.sourceQuotationId?.quotationPdf
  );
  const hasSavedContractPdf = Boolean(
    project?.sourceContractId?.pdfUrl || project?.contractUrl
  );

  return (
    <>
      <PageGuard page="4">
        <div className="p-6 bg-gray-50 min-h-screen">
          <TourGuide
            steps={projectDetailTourSteps}
            tourKey="project-detail-tour"
            autoStart={false}
            onStartTour={(startFn) => {
              startTourRef.current = startFn;
            }}
            onExit={() => {
              if (location.state?.individualSectionReturnTo) {
                navigate(location.state.individualSectionReturnTo);
              }
            }}
            onComplete={() => {
              if (location.state?.individualSectionReturnTo) {
                navigate(location.state.individualSectionReturnTo);
              }
            }}
          />
          <div className="max-w-[1400px] mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <button
                  onClick={() => navigate("/project")}
                  className="hover:text-primary-dark transition-colors"
                >
                  Projects
                </button>
                <span>/</span>
                <span className="text-gray-900 font-medium">
                  {project.projectTitle || "Project"}
                </span>
              </div>
            </div>

            {/* Header Section */}
            <div id="project-header-section" className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-primary-dark mb-1">
                      {editing ? (
                        <input
                          type="text"
                          value={formData.projectTitle}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              projectTitle: e.target.value,
                            })
                          }
                          className="border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                        />
                      ) : (
                        project.projectTitle || "Untitled Project"
                      )}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        projectStatus
                      )}`}
                    >
                      {projectStatus}
                    </span>
                  </div>

                  {project.projectDescription && (
                    <p className="text-sm text-gray-600 mt-3 mb-4 leading-relaxed px-1">
                      {project.projectDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      <span><span className="font-semibold">Start:</span> {formatDate(project.startDate)?.replace(/\//g, '-')}</span>
                      {project.endDate && (
                        <span> | <span className="font-semibold">End:</span> {formatDate(project.endDate)?.replace(/\//g, '-')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={14} />
                      <span className="font-semibold">Budget:</span>{" "}
                      {editing ? (
                        <input
                          type="number"
                          value={formData.budget}
                          onChange={(e) =>
                            setFormData({ ...formData, budget: e.target.value })
                          }
                          className="border border-gray-300 rounded-lg px-2 py-0.5 text-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark w-32"
                          placeholder="Budget"
                        />
                      ) : (
                        isRoleBasedUser ? "₹ **,***" : (project.budget ? formatIndianCurrency(parseFloat(project.budget), true, 0) : "Not set")
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {editing ? (
                        <input
                          type="text"
                          value={formData.location || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                          }
                          className="border border-gray-300 rounded-lg px-2 py-0.5 text-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark w-32"
                          placeholder="Location"
                        />
                      ) : (
                        project.location || "Not specified"
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={() => {
                          setEditing(false);
                          fetchProject();
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <X size={16} className="inline mr-2" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors text-sm font-medium"
                      >
                        <Save size={16} className="inline mr-2" />
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <PermissionGate page="4" component="4_1" action="edit">
                        <button
                          onClick={() => setEditing(true)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          <Edit size={16} className="inline mr-2" />
                          Edit
                        </button>
                      </PermissionGate>
                      <PermissionGate page="4" component="4_1" action="edit">
                        <button
                          onClick={() => setShowDeleteProjectModal(true)}
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                          <Trash2 size={16} className="inline mr-2" />
                          Delete
                        </button>
                      </PermissionGate>
                    </>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                {/* Email */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-700">Email</span>
                  </div>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clientEmail: e.target.value,
                        })
                      }
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                      placeholder="Email address"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900 pl-0.5">
                      {isRoleBasedUser ? maskEmail(project.clientEmail) : (project.clientEmail || "N/A")}
                    </div>
                  )}
                </div>

                {/* WhatsApp / Phone */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <MessageCircle size={14} className="text-green-600 shrink-0" />
                    <span className="text-xs font-bold text-gray-700">WhatsApp</span>
                  </div>
                  {editing ? (
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
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                      placeholder="Phone number"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900 pl-0.5">
                      {isRoleBasedUser ? maskPhone(project.clientPhone) : (
                        project.clientPhone ? (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${project.clientPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-gray-900 hover:text-green-700 transition-colors"
                          >
                            {project.clientPhone}
                          </a>
                        ) : "N/A"
                      )}
                    </div>
                  )}
                </div>

                {/* Project Type */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} className="text-gray-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-700">Project Type</span>
                  </div>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.projectType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          projectType: e.target.value,
                        })
                      }
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                      placeholder="Project type"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900 pl-0.5">
                      {project.projectType || "General"}
                    </div>
                  )}
                </div>

                {/* Storage Used */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <HardDrive size={14} className="text-gray-500 shrink-0" />
                    <span className="text-xs font-bold text-gray-700">Storage Used</span>
                    <button
                      onClick={handleRefreshStorage}
                      disabled={storageRefreshing}
                      className="ml-auto p-0.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh storage calculation"
                    >
                      <RefreshCw
                        size={12}
                        className={`text-gray-500 hover:text-primary-dark ${storageRefreshing ? 'animate-spin' : ''}`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-0.5">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-primary-dark h-1.5 rounded-full transition-all duration-300"
                          style={{
                           width: `${Math.min((project.storageUsed || 0) / ((subscription?.storageLimitGb || 500) * 1024 * 1024 * 1024) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {(() => {
                        const bytes = project.storageUsed || 0;
                        const gb = bytes / (1024 * 1024 * 1024);
                        if (gb >= 1) return `${gb.toFixed(1)} GB`;
                        if (gb >= 0.01) return `${gb.toFixed(2)} GB`;
                        if (gb > 0) {
                          const mb = bytes / (1024 * 1024);
                          return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
                        }
                        return '0 GB';
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Messages */}
            {successMessage && (
              <Success
                message={successMessage}
                onClose={() => setSuccessMessage(null)}
              />
            )}
            {errorMessage && (
              <Error onClose={() => setErrorMessage(null)}>
                {errorMessage}
              </Error>
            )}
            {/* Tabs */}
            <div className="mb-6">
              <div className="inline-flex gap-3 rounded-full bg-gray-100 px-1.5 py-1.5">
                {!denyOverview && (
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-colors ${
                      activeTab === "overview"
                        ? "bg-white text-primary-dark shadow-sm border border-primary-dark/20"
                        : "text-gray-700 hover:text-gray-900 hover:bg-white/80"
                    }`}
                  >
                    <User size={18} />
                    <span className="font-semibold">Overview</span>
                  </button>
                )}

                {!denyGallery && (
                  <button
                    onClick={() => setActiveTab("gallery")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-colors ${
                      activeTab === "gallery"
                        ? "bg-white text-primary-dark shadow-sm border border-primary-dark/20"
                        : "text-gray-700 hover:text-gray-900 hover:bg-white/80"
                    }`}
                  >
                    <ImageIcon size={18} />
                    <span className="font-semibold">Gallery</span>
                  </button>
                )}
              </div>
            </div>



            {activeTab === "overview" && (
              <PermissionGate
                page="4"
                component="4_1"
                fallback={<NoAccessFallback section="Overview" />}
              >
                <div className="space-y-6">
                  {/* Main Content Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* div1: Project Timeline - Col 1-2, Row 1 */}
                    <div
                      id="project-timeline-section"
                      className="col-span-3 row-start-1 bg-white rounded-xl border border-gray-200 p-5 flex flex-col h-[400px]"
                    >
                      <ProgressTimeline
                        timeline={project.progressTimeline || []}
                        onAddEntry={handleAddTimelineEntry}
                        onUpdateEntry={handleUpdateTimelineEntry}
                        onDeleteEntry={handleDeleteTimelineEntry}
                        projectClientEmail={project.clientEmail}
                      />
                    </div>

                    {/* Equipment - Col 1, Row 2 */}
                    <div
                      id="project-equipment-section"
                      className="col-span-1 row-start-2 bg-white rounded-xl border border-gray-200 p-4 h-[400px] flex flex-col overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-primary-dark flex items-center gap-2 text-sm">
                          <Package size={16} />
                          Equipment ({formData.assignedEquipment.length})
                        </h3>
                        <PermissionGate page="4" component="4_1" action="edit">
                          <div className="flex gap-1">
                            <button
                              onClick={openEquipmentModal}
                              disabled={projectStatus === 'Completed'}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all text-[10px] font-medium ${projectStatus === 'Completed'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-dark text-white hover:bg-primary'
                                }`}
                            >
                              <Plus size={12} />
                              {formData.assignedEquipment.length > 0 ? "Edit" : "Add"}
                            </button>
                            <button
                              onClick={() => {
                                const allIds = formData.assignedEquipment
                                  .filter(item => item && (item.id || item._id))
                                  .map(item => (item.id?._id || item.id || item._id).toString());
                                setSelectedItemsToRelease(allIds);
                                setShowReleaseEquipmentModal(true);
                              }}
                              disabled={formData.assignedEquipment.length === 0}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all text-[10px] font-medium ${formData.assignedEquipment.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                                : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              title={formData.assignedEquipment.length === 0 ? "No equipment to release" : "Release equipment back to inventory"}
                            >
                              <RefreshCw size={12} />
                              Release
                            </button>
                          </div>
                        </PermissionGate>
                      </div>
                      {formData.assignedEquipment.length > 0 ? (
                        <div className="space-y-1 overflow-y-auto scrollbar-hide flex-1">
                          {formData.assignedEquipment.filter((item) => item && (item.id || item._id)).map((assignedItem) => {
                            const rawId = assignedItem.id?._id || assignedItem.id || assignedItem._id;
                            const assignedId = rawId ? rawId.toString() : "";
                            if (!assignedId || assignedId === "[object Object]") return null;
                            const populatedItem = assignedItem.id && typeof assignedItem.id === 'object' ? assignedItem.id : null;
                            const item = populatedItem || inventoryItems.find((inv) => (inv.id || inv._id)?.toString() === assignedId);

                            return (
                              <div key={assignedId} className="p-2 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors bg-gray-50/50">
                                <div className="flex justify-between items-center gap-1">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{item?.itemName || "Unknown"}</p>
                                    <p className="text-[9px] text-gray-500 truncate">{item?.category || item?.categeory || "Uncategorized"}</p>
                                  </div>
                                  <span className="shrink-0 text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-100">Q: {assignedItem.quantity || 1}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 text-center py-2 italic border border-dashed border-gray-200 rounded-lg">No equipment</p>
                      )}
                    </div>

                    {/* Crew - Col 2, Row 2 */}
                    <div
                      id="project-crew-section"
                      className="col-span-1 row-start-2 bg-white rounded-xl border border-gray-200 p-4 h-[400px] flex flex-col overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-primary-dark flex items-center gap-2 text-sm">
                          <Users size={16} />
                          Crew ({assignedCrewMembers.length})
                        </h3>
                        <PermissionGate page="4" component="4_1" action="edit">
                          <button
                            onClick={() => setShowCrewModal(true)}
                            disabled={projectStatus === "Completed"}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all text-[10px] font-medium ${projectStatus === "Completed"
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-primary-dark text-white hover:bg-primary"
                              }`}
                          >
                            <Plus size={12} />
                            {assignedCrewMembers.length > 0 ? "Edit" : "Add"}
                          </button>
                        </PermissionGate>
                      </div>
                      {assignedCrewMembers.length > 0 ? (
                        <div className="space-y-1.5 overflow-y-auto scrollbar-hide flex-1">
                          {assignedCrewMembers.map((crewMember) => {
                            const crewId = crewMember._id || crewMember.id;
                            return (
                              <div
                                key={crewId}
                                className="p-2 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors bg-gray-50/50"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[11px] text-gray-900 truncate">
                                      {crewMember.name}
                                    </p>
                                    <p className="text-[9px] text-gray-500 truncate">
                                      {crewMember.position || "Staff"}
                                    </p>
                                  </div>
                                  <PermissionGate
                                    page="4"
                                    component="4_1"
                                    action="edit"
                                  >
                                    <button
                                      onClick={() => {
                                        const phone =
                                          crewMember.phone ||
                                          crewMember.contactInfo?.phone;
                                        if (!phone) return;
                                        const cleanPhone = phone.replace(/\D/g, "");
                                        window.open(
                                          `https://wa.me/${cleanPhone.startsWith("91")
                                            ? cleanPhone
                                            : "91" + cleanPhone
                                          }`,
                                          "_blank"
                                        );
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                      <MessageCircle size={12} />
                                    </button>
                                  </PermissionGate>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500 text-center py-2 italic border border-dashed border-gray-200 rounded-lg">
                          No crew
                        </p>
                      )}
                    </div>

                    {/* InHouse Crew Timeline - Col 3, Row 2 */}
                    <div
                      id="project-inhouse-crew-section"
                      className="col-span-1 row-start-2 bg-white rounded-xl border border-gray-200 p-4 h-[400px] flex flex-col overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <h3 className="font-bold text-primary-dark flex items-center gap-2 text-sm">
                          <Users size={16} />
                          InHouse Crew Timeline
                        </h3>
                        <PermissionGate page="4" component="4_1" action="edit">
                          <button
                            onClick={() => {
                              setInHouseTaskForm({ crewId: "", name: "", dueDate: "" });
                              setShowAddInHouseTaskModal(true);
                            }}
                            disabled={projectStatus === "Completed"}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all text-xs font-medium ${projectStatus === "Completed"
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-primary-dark text-white hover:bg-primary"
                              }`}
                          >
                            <Plus size={12} />
                            Add Task
                          </button>
                        </PermissionGate>
                      </div>

                      {/* Tasks List */}
                      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 min-h-0" style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}>
                        {(!formData.inHouseCrew ||
                          !Array.isArray(formData.inHouseCrew) ||
                          formData.inHouseCrew.length === 0) ? (
                          <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 rounded-lg">
                            <p className="text-xs text-gray-400 italic">
                              Click "Add Task" to assign tasks to crew.
                            </p>
                          </div>
                        ) : (
                          <>

                            {formData.inHouseCrew.map((task) => {
                              const taskId = task._id || task.id;

                              // Handle both populated object and string ID for crewId
                              const taskCrewId = task.crewId && (task.crewId._id || task.crewId.id || task.crewId).toString();
                              // If task.crewId is an object with a name, use it directly (populated data)
                              const populatedName = task.crewId && task.crewId.name;

                              const crewMember = crewMembers.find(
                                (c) => (c._id || c.id)?.toString() === taskCrewId
                              ) || (populatedName ? { name: populatedName } : {});

                              const isDone = task.status === "Completed";
                              const isActive = task.status === "In Progress";
                              const isReview = task.status === "Review";
                              const isPending = task.status === "Pending";

                              // Determine colors and icon based on status
                              let statusColor = "text-gray-400"; // default
                              let statusBg = "bg-gray-100";
                              let statusBorder = "border-gray-300";
                              let StatusIcon = Clock; // default

                              if (isDone) {
                                statusColor = "text-green-600";
                                statusBg = "bg-green-100";
                                statusBorder = "border-green-300";
                                StatusIcon = CheckCircle2;
                              } else if (isActive) {
                                statusColor = "text-blue-600";
                                statusBg = "bg-blue-100";
                                statusBorder = "border-blue-300";
                                StatusIcon = PlayCircle; // Or PlayCircle
                              } else if (isReview) {
                                statusColor = "text-amber-600";
                                statusBg = "bg-amber-100";
                                statusBorder = "border-amber-300";
                                StatusIcon = Search; // Or Eye
                              } else {
                                // Pending
                                statusColor = "text-gray-500";
                                statusBg = "bg-gray-100";
                                statusBorder = "border-gray-300";
                                StatusIcon = Clock;
                              }

                              return (
                                <div
                                  key={taskId}
                                  className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors flex-shrink-0 relative group"
                                >
                                  {/* Status Icon Indicator */}
                                  <div
                                    className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 flex-shrink-0 mt-[2px] ${statusBg} ${statusBorder} ${statusColor}`}
                                  >
                                    <StatusIcon size={12} className={isActive ? "" : ""} />
                                  </div>

                                  {/* Card Content */}
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="font-semibold text-gray-900 truncate leading-tight mb-1 pr-12"
                                      style={{ fontSize: "12px" }}
                                      title={task.name}
                                    >
                                      {task.name || "Task"}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="absolute top-1 right-1 flex items-center gap-1 opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditInHouseTask(task);
                                        }}
                                        className="p-1 text-gray-400 hover:text-primary-dark hover:bg-white rounded-full transition-colors"
                                        title="Edit Task"
                                      >
                                        <Edit size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteInHouseTask(task);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded-full transition-colors"
                                        title="Delete Task"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1 mb-1">
                                      <User size={10} className="text-gray-400" />
                                      <span className="text-gray-600 truncate text-[10px]" title={crewMember.name || "Unassigned"}>
                                        {crewMember.name || "Unassigned"}
                                      </span>
                                    </div>

                                    {task.dueDate && (
                                      <div className="flex items-center gap-1 mb-2">
                                        <Calendar size={10} className="text-gray-400" />
                                        <span className="text-gray-500 text-[10px]">
                                          {formatDate(task.dueDate)}
                                        </span>
                                      </div>
                                    )}

                                    <div className="relative">
                                      <select
                                        value={task.status || "Pending"}
                                        onChange={(e) => handleUpdateTaskStatus(taskId, e.target.value)}
                                        style={{
                                          width: "100%",
                                          fontSize: "11px",
                                          padding: "2px 20px 2px 8px", // Added right padding for arrow
                                          borderRadius: "12px", // More rounded
                                          border: `1px solid`,
                                          borderColor: isDone ? '#86efac' : isActive ? '#93c5fd' : isReview ? '#fcd34d' : '#d1d5db',
                                          background: isDone ? '#f0fdf4' : isActive ? '#eff6ff' : isReview ? '#fefce8' : '#f9fafb',
                                          color: isDone ? '#166534' : isActive ? '#1e40af' : isReview ? '#854d0e' : '#374151',
                                          outline: "none",
                                          fontWeight: 600,
                                          appearance: "none", // Hide default arrow
                                          cursor: "pointer",
                                        }}
                                      >
                                        <option value="Pending" style={{ background: '#fff', color: '#000' }}>Pending</option>
                                        <option value="In Progress" style={{ background: '#fff', color: '#000' }}>In Progress</option>
                                        <option value="Review" style={{ background: '#fff', color: '#000' }}>Review</option>
                                        <option value="Completed" style={{ background: '#fff', color: '#000' }}>Completed</option>
                                      </select>
                                      {/* Custom Dropdown Arrow */}
                                      <div
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none flex items-center justify-center"
                                        style={{ color: isDone ? '#166534' : isActive ? '#1e40af' : isReview ? '#854d0e' : '#374151' }}
                                      >
                                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M6 9l6 6 6-6" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>



                    {/* --- Row 3-4 (Documentation) --- */}
                    {/* div4: Project Quotation - Col 1-2, Row 3-4 */}
                    <div className="col-span-3 row-start-3 grid grid-cols-2 gap-4">
                      <div
                        id="project-quotation-section"
                        className=" bg-white rounded-xl border border-gray-200 p-4 h-[400px] overflow-hidden flex flex-col"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={18} className="text-primary-dark" />
                          <h4 className="font-bold text-gray-900 text-sm">Project Quotation</h4>
                        </div>
                        {hasSavedQuotationPdf ? (
                          <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            <iframe
                              src={`${API_URL}/project/${projectId}/quotation/pdf`}
                              className="w-full h-full border-0"
                              title="Quotation PDF"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 border border-gray-200 rounded-lg flex items-center justify-center bg-white">
                            <div className="text-center px-4">
                              <FileText size={32} className="text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-xs italic mb-1">Quotation not generated</p>
                              <p className="text-gray-400 text-xs">Generate and save a quotation to view it here</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* div6: Service Contract - Col 3-4, Row 3-4 */}
                      <div id="project-service-contract-section" className=" bg-white rounded-xl border border-gray-200 p-4 h-[400px] overflow-hidden flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText size={18} className="text-primary-dark" />
                          <h4 className="font-bold text-gray-900 text-sm">Service Contract</h4>
                        </div>
                        {hasSavedContractPdf ? (
                          <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                            <iframe
                              src={`${API_URL}/project/${projectId}/contract/pdf`}
                              className="w-full h-full border-0"
                              title="Contract PDF"
                              onError={(e) => {
                                console.error('❌ Contract PDF failed to load');
                                setErrorMessage('Failed to load contract PDF. Please check the server logs for details.');
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex-1 border border-gray-200 rounded-lg flex items-center justify-center bg-white">
                            <div className="text-center px-4">
                              <FileText size={32} className="text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-xs italic mb-1">Contract not generated</p>
                              <p className="text-gray-400 text-xs">Save the contract before it appears here</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* div7: Budget & Expenses - Full Width */}
                  <div id="project-budget-expenses-section" className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
                        <IndianRupee size={20} className="text-primary-dark" />
                        Budget & Expenses
                      </h2>
                      <div className="flex gap-2">
                        <PermissionGate page="4" component="4_1" action="edit">
                          <button
                            onClick={() => {
                              setExpenseToEdit(null);
                              setShowExpenseModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary-dark text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-medium"
                          >
                            <Plus size={16} /> Add Expense
                          </button>
                          <Tooltip title={remainingAmount <= 0 ? "Cannot add payment. Remaining amount reached" : ""}>
                            <div className="inline-block">
                              <button
                                onClick={() => setShowPaymentModal(true)}
                                disabled={remainingAmount <= 0}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all text-sm font-medium ${remainingAmount <= 0
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                  }`}
                              >
                                <Plus size={16} /> Add Payment
                              </button>
                            </div>
                          </Tooltip>
                          <button onClick={() => setShowBudgetModal(true)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium">
                            {project.budget ? "Edit Budget" : "Set Budget"}
                          </button>
                        </PermissionGate>
                      </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Budget</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(() => {
                            const originalBudget = parseFloat(project.budget || '0');
                            const additionalBudget = parseFloat(project.additionalBudget || '0');
                            const totalBudget = originalBudget + additionalBudget;

                            if (totalBudget === 0) return "Not set";
                            return formatIndianCurrency(totalBudget, true, 0);
                          })()}
                        </div>
                        {(() => {
                          const originalBudget = parseFloat(project.budget || '0');
                          const additionalBudget = parseFloat(project.additionalBudget || '0');

                          if (additionalBudget > 0) {
                            return (
                              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                <div>Original: {formatIndianCurrency(originalBudget, true, 0)}</div>
                                <div className="text-green-600">Additional: {formatIndianCurrency(additionalBudget, true, 0)}</div>
                              </div>
                            );
                          } else if (originalBudget > 0) {
                            return <div className="text-xs text-gray-500 mt-1">Original budget</div>;
                          }
                          return null;
                        })()}
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="text-xs text-gray-600 mb-1">Expenses</div>
                        <div className="text-2xl font-bold text-gray-900">
                          {formatIndianCurrency(projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0), true, 0)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {projectExpenses.length} expense{projectExpenses.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className={`rounded-lg p-4 shadow-sm ${(() => {
                        const originalBudget = parseFloat(project.budget || '0');
                        const additionalBudget = parseFloat(project.additionalBudget || '0');
                        const totalBudget = originalBudget + additionalBudget;
                        const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                        return (totalBudget - totalExpenses) >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200';
                      })()}`}>
                        <div className={`text-xs mb-1 ${(() => {
                          const originalBudget = parseFloat(project.budget || '0');
                          const additionalBudget = parseFloat(project.additionalBudget || '0');
                          const totalBudget = originalBudget + additionalBudget;
                          const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                          return (totalBudget - totalExpenses) >= 0 ? 'text-green-700' : 'text-red-700';
                        })()}`}>
                          {(() => {
                            const originalBudget = parseFloat(project.budget || '0');
                            const additionalBudget = parseFloat(project.additionalBudget || '0');
                            const totalBudget = originalBudget + additionalBudget;
                            const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                            return (totalBudget - totalExpenses) >= 0 ? 'Profit' : 'Loss';
                          })()}
                        </div>
                        <div className={`text-2xl font-bold ${(() => {
                          const originalBudget = parseFloat(project.budget || '0');
                          const additionalBudget = parseFloat(project.additionalBudget || '0');
                          const totalBudget = originalBudget + additionalBudget;
                          const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                          return (totalBudget - totalExpenses) >= 0 ? 'text-green-900' : 'text-red-900';
                        })()}`}>
                          {(() => {
                            const originalBudget = parseFloat(project.budget || '0');
                            const additionalBudget = parseFloat(project.additionalBudget || '0');
                            const totalBudget = originalBudget + additionalBudget;
                            const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                            return formatIndianCurrency(Math.abs(totalBudget - totalExpenses), true, 0);
                          })()}
                        </div>
                        <div className={`text-xs mt-1 ${(() => {
                          const originalBudget = parseFloat(project.budget || '0');
                          const additionalBudget = parseFloat(project.additionalBudget || '0');
                          const totalBudget = originalBudget + additionalBudget;
                          const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                          return (totalBudget - totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600';
                        })()}`}>
                          {(() => {
                            const originalBudget = parseFloat(project.budget || '0');
                            const additionalBudget = parseFloat(project.additionalBudget || '0');
                            const totalBudget = originalBudget + additionalBudget;
                            const totalExpenses = projectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
                            return ((totalBudget - totalExpenses) >= 0 ? 'Under' : 'Over') + ' budget';
                          })()}
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
                        <div className="text-xs text-blue-700 mb-1">Paid Amount</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {formatIndianCurrency(
                            payments.reduce((sum, p) => sum + (p.amount || 0), 0),
                            true,
                            0
                          )}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {`${payments.length} payment${payments.length !== 1 ? "s" : ""}`}
                        </div>
                      </div>
                    </div>

                    {/* Payment Schedule Table */}
                    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden mb-5">
                      <div className="flex items-center justify-between bg-gray-100 px-4 py-3 border-b border-gray-200">
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">Payment Schedule</h3>
                          <p className="text-xs text-gray-500">
                            Plan upcoming payments against the project amount.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4 hidden sm:block">
                            {project.budget > 0 && (
                              <div className={`text-[10px] text-right mt-1 ${remainingAmount < 0 ? 'text-red-500 font-bold' : 'text-green-600'}`}>
                                Remaining: {formatIndianCurrency(remainingAmount, true, 0)}
                              </div>
                            )}
                          </div>
                          <PermissionGate page="4" component="4_1" action="edit">
                            <Tooltip title={!project.budget ? "Please set project budget first" : remainingAmount <= 0 ? "Cannot add schedule. Budget reached." : ""}>
                              <div className="inline-block ml-2">
                                <button
                                  onClick={handleOpenScheduleModal}
                                  disabled={!project.budget || remainingAmount <= 0}
                                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${project.budget && remainingAmount > 0
                                      ? "bg-primary-dark text-white hover:bg-primary"
                                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    }`}
                                >
                                  <Plus size={12} />
                                  Add Schedule
                                </button>
                              </div>
                            </Tooltip>
                          </PermissionGate>
                        </div>
                      </div>
                      {loadingSchedules ? (
                        <div className="py-6 text-center text-gray-500 text-sm">
                          Loading schedules...
                        </div>
                      ) : upcomingSchedules.length > 0 ? (
                        <>
                          <div className="bg-gray-50 px-2 py-2 border-b border-gray-200">
                            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700">
                              <div className="col-span-4">Description</div>
                              <div className="col-span-2">Due Date</div>
                              <div className="col-span-2">Amount</div>
                              <div className="col-span-2">Status</div>
                              <div className="col-span-2 text-center">Actions</div>
                            </div>
                          </div>
                          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                            {upcomingSchedules.map((schedule) => (
                              <div
                                key={schedule._id}
                                className="px-2 py-3 hover:bg-gray-50 transition-colors text-sm"
                              >
                                <div className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-4 font-medium text-gray-900 truncate">
                                    {schedule.description}
                                  </div>
                                  <div className="col-span-2 text-xs text-gray-700">
                                    {schedule.dueDate
                                      ? new Date(schedule.dueDate).toLocaleDateString(
                                        "en-IN",
                                        { day: "2-digit", month: "short" }
                                      )
                                      : "-"}
                                  </div>
                                  <div className="col-span-2 font-semibold text-gray-900">
                                    {formatIndianCurrency(schedule.amount, true, 0)}
                                  </div>
                                  <div className="col-span-2">
                                    {(() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      const due = schedule.dueDate ? new Date(schedule.dueDate) : null;
                                      if (due) due.setHours(0, 0, 0, 0);
                                      const isDueToday = due && due.getTime() === today.getTime();
                                      const isOverdue = schedule.status === "overdue" && !isDueToday;
                                      return (
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${isOverdue
                                              ? "bg-red-100 text-red-700"
                                              : "bg-orange-100 text-orange-700"
                                            }`}
                                        >
                                          {isOverdue ? "Overdue" : "Pending"}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <div className="col-span-2 flex justify-end gap-1">
                                    <PermissionGate page="4" component="4_1" action="edit">
                                      <button
                                        onClick={() => handleOpenEditModal(schedule)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Schedule"
                                      >
                                        <Edit size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleOpenSplitModal(schedule)}
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Split Schedule"
                                      >
                                        <Split size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSchedule(schedule._id)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Schedule"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleOpenMarkPaidModal(schedule)}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-green-600 text-white hover:bg-green-700 transition-colors ml-1"
                                      >

                                        Mark Paid
                                      </button>
                                    </PermissionGate>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="py-6 text-center text-gray-500 text-sm">
                          No upcoming payment schedules.{" "}
                          {project.projectAmount
                            ? "Click 'Add Schedule' to plan payments."
                            : "Set a project amount to start planning schedules."}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Expenses Box */}
                      {/* Expenses Box */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                          <h3 className="font-bold text-gray-800">Expenses</h3>
                        </div>
                        {projectExpenses.length > 0 ? (
                          <>
                            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700">
                                <div className="col-span-3">Description</div>
                                <div className="col-span-2">Category</div>
                                <div className="col-span-2">Amount</div>
                                <div className="col-span-2">Date</div>
                                <div className="col-span-2">Crew</div>
                                <div className="col-span-1"></div>
                              </div>
                            </div>
                            <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
                              {projectExpenses.map((expense, idx) => {
                                const crewId = expense.assignedCrew?._id || expense.assignedCrew;
                                const crewName = expense.assignedCrew?.name || crewMembers.find(c => (c._id || c.id) === crewId)?.name;
                                return (
                                  <div key={expense._id || idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                    <div className="grid grid-cols-12 gap-2 items-center text-sm">
                                      <div className="col-span-3 font-medium text-gray-900 truncate">{expense.description}</div>
                                      <div className="col-span-2 truncate" title={expense.category || expense.categeory || 'Uncategorized'}>
                                        <ExpenseCategoryLabel
                                          category={expense.category || expense.categeory || 'Other'}
                                          className="text-[10px]"
                                        />
                                      </div>
                                      <div className="col-span-2 font-semibold text-gray-900">{formatIndianCurrency(expense.amount, true, 0)}</div>
                                      <div className="col-span-2 text-gray-600 text-xs">{new Date(expense.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })}</div>
                                      <div className="col-span-2 text-xs text-gray-600 truncate">{crewName || 'N/A'}</div>
                                      <div className="col-span-1 flex justify-end gap-1">
                                        <PermissionGate page="4" component="4_1" action="edit">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpenseToEdit(expense);
                                              setShowExpenseModal(true);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-primary-dark hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Edit Expense"
                                          >
                                            <Edit size={14} />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setExpenseToDelete(expense);
                                              setShowDeleteExpenseModal(true);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete Expense"
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </PermissionGate>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <DollarSign size={28} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No expenses yet</p>
                          </div>
                        )}
                      </div>

                      {/* Payment History Box */}
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-green-100 px-4 py-3 border-b border-green-200 flex items-center justify-between">
                          <h3 className="font-bold text-green-800">Payment History</h3>
                          {payments.length > 0 && <span className="text-[10px] text-green-600 flex items-center gap-1"><Eye size={10} /> to view details</span>}
                        </div>
                        {payments.length > 0 ? (
                          <>
                            <div className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                              {payments.map((payment) => (
                                <div key={payment._id} className="px-4 py-3 hover:bg-green-50 transition-colors">
                                  {/* Main row */}
                                  <div className="flex items-center gap-2 text-sm">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-gray-900 truncate">{payment.paidBy}</span>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{payment.paymentMethod}</span>
                                        <span className="font-bold text-green-700">{formatIndianCurrency(payment.amount, true, 0)}</span>
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                        <span>{payment.phoneNumber}</span>
                                        <span>·</span>
                                        <span>{new Date(payment.paymentDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                        {payment.notes && <><span>·</span><span className="italic truncate max-w-[120px]">{payment.notes}</span></>}
                                      </div>
                                    </div>
                                    {/* View details button */}
                                    <button
                                      onClick={() => setSelectedPayment(payment)}
                                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                                      title="View details"
                                    >
                                      <Eye size={15} />
                                    </button>
                                  </div>

                                  {/* Screenshot strip — visible directly in the row */}
                                  {payment.screenshots?.length > 0 && (
                                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                                      {payment.screenshots.map((url, i) => (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => setLightboxSrc(url)}
                                          className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-purple-200 hover:border-purple-500 shadow-sm hover:shadow-md transition-all group"
                                          title="Click to enlarge"
                                        >
                                          <img src={url} alt={`receipt ${i + 1}`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Eye size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </div>
                                        </button>
                                      ))}
                                      <span className="text-[10px] text-purple-500 font-medium">tap to enlarge</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Wallet size={28} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No payments yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </PermissionGate>
            )}



            {activeTab === "gallery" && (
              <PermissionGate
                page="4"
                component="4_2"
                fallback={<NoAccessFallback section="Gallery" />}
              >
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <ProjectGallery
                    projectId={projectId}
                    projectTitle={project?.projectTitle}
                  />
                </div>
              </PermissionGate>

            )
            }


            {/* Crew Assignment Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {showCrewModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={() => setShowCrewModal(false)}
                  />
                  <div className="flex items-center justify-center min-h-screen p-4">
                    <div
                      className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-primary-dark">
                          Assign Crew
                        </h2>
                        <button
                          onClick={() => setShowCrewModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {formData.assignedCrew.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {formData.assignedCrew.map((crewId) => {
                                const member = crewMembers.find(
                                  (m) => (m._id || m.id) === crewId
                                );
                                return member ? (
                                  <div
                                    key={crewId}
                                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm"
                                  >
                                    <span className="font-medium text-gray-900">
                                      {member.name}
                                    </span>
                                    <button
                                      onClick={() => handleAssignCrew(crewId)}
                                      className="p-1 rounded-full hover:bg-red-100 text-red-500"
                                      aria-label="Remove crew"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 text-center py-3">
                              No crew assigned
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 items-center">
                          <select
                            value={selectedCrewToAdd}
                            onChange={(e) => setSelectedCrewToAdd(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark"
                          >
                            <option value="">Select crew to add</option>
                            {availableCrew
                              .filter(
                                (m) => !formData.assignedCrew.includes(m._id || m.id)
                              )
                              .map((member) => (
                                <option
                                  key={member._id || member.id}
                                  value={member._id || member.id}
                                >
                                  {member.name}{" "}
                                  {member.position ? `- ${member.position}` : ""}
                                </option>
                              ))}
                          </select>
                          <button
                            onClick={addSelectedCrew}
                            disabled={!selectedCrewToAdd}
                            className="px-3 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowCrewModal(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCrew}
                          className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PermissionGate>

            {/* Add InHouse Task Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {showAddInHouseTaskModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={() => {
                      setShowAddInHouseTaskModal(false);
                      setEditingInHouseTask(false);
                    }}
                  />
                  <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingInHouseTask ? "Edit In-House Task" : "Add In-House Task"}
                      </h2>
                      <button
                        onClick={() => {
                          setShowAddInHouseTaskModal(false);
                          setEditingInHouseTask(false);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Name
                        </label>
                        <input
                          type="text"
                          value={inHouseTaskForm.name}
                          onChange={(e) =>
                            setInHouseTaskForm({
                              ...inHouseTaskForm,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                          placeholder="Enter task description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Assign to Crew Member
                        </label>
                        <select
                          value={inHouseTaskForm.crewId}
                          onChange={(e) =>
                            setInHouseTaskForm({
                              ...inHouseTaskForm,
                              crewId: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                        >
                          <option value="">Select Crew Member</option>
                          {crewMembers.map((crew) => (
                            <option key={crew._id || crew.id} value={crew._id || crew.id}>
                              {crew.name} ({crew.position || 'Staff'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Due Date
                        </label>
                        <DatePicker
                          value={inHouseTaskForm.dueDate ? dayjs(inHouseTaskForm.dueDate) : null}
                          format="DD/MM/YYYY"
                          onChange={(date) =>
                            setInHouseTaskForm({
                              ...inHouseTaskForm,
                              dueDate: date ? date.format('YYYY-MM-DD') : '',
                            })
                          }
                          className="w-full h-10 border border-gray-300 rounded-lg"
                          placeholder="Select due date"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddInHouseTaskModal(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddInHouseTask}
                          className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
                        >
                          {editingInHouseTask ? "Update Task" : "Add Task"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PermissionGate>

            {/* Equipment Assignment Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {
                showEquipmentModal && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                      onClick={handleCloseEquipmentModal}
                    />
                    <div className="flex items-center justify-center min-h-screen p-4">
                      <div
                        className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold text-primary-dark">
                            Assign Equipment
                          </h2>
                          <button
                            onClick={handleCloseEquipmentModal}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {inventoryItems.length === 0 ? (
                            <div className="text-center py-12">
                              <Package size={48} className="mx-auto mb-4 text-gray-400" />
                              <p className="text-gray-600 font-medium mb-2">No equipment items available</p>
                              <p className="text-sm text-gray-500">
                                Please add items in inventory to assign them to project
                              </p>
                            </div>
                          ) : (
                            inventoryItems.map((item) => {
                              const itemId = item.id || item._id;
                              const validAssignedEquipment =
                                formData.assignedEquipment.filter(
                                  (eq) => eq && (eq.id || eq._id)
                                );
                              const isAssigned = validAssignedEquipment.some(
                                (eq) => (eq.id || eq._id) === itemId
                              );
                              const assignedItem = validAssignedEquipment.find(
                                (eq) => (eq.id || eq._id) === itemId
                              );
                              const currentQuantity = assignedItem
                                ? assignedItem.quantity
                                : equipmentQuantities[itemId] || 1;
                              const initialAssignedItem =
                                equipmentModalSnapshot?.assignedEquipment?.find((eq) => {
                                  const baseId = eq.id?._id || eq.id || eq._id;
                                  return (baseId ? baseId.toString() : "") === (itemId ? itemId.toString() : "");
                                }) || null;
                              const initialQuantity = initialAssignedItem?.quantity || 0;
                              const availableNow =
                                item.available !== undefined ? item.available : item.quantity;
                              const maxQuantity = initialQuantity + (availableNow || 0);
                              const isAvailable =
                                (item.available !== undefined
                                  ? item.available
                                  : item.quantity) > 0 || isAssigned;

                              return (
                                <div
                                  key={itemId}
                                  onClick={() =>
                                    isAvailable && handleAssignEquipment(itemId)
                                  }
                                  className={`py-2 px-3 border rounded-lg cursor-pointer transition-all duration-300 ${isAssigned
                                    ? "border-gray-300 shadow-md bg-white ring-1 ring-gray-100"
                                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"
                                    } ${!isAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      readOnly
                                      className="w-4 h-4 text-primary-dark focus:ring-primary-dark rounded"
                                      disabled={!isAvailable}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {item.itemName}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {item.category || item.categeory || "Uncategorized"}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Available:{" "}
                                        {item.available !== undefined
                                          ? item.available
                                          : item.quantity}{" "}
                                        / {item.quantity}
                                      </p>
                                    </div>
                                    {isAssigned && (
                                      <div
                                        className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <span className="text-[10px] font-semibold text-gray-500 uppercase">
                                          Qty
                                        </span>
                                        <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleQuantityChange(
                                                itemId,
                                                Math.max(1, currentQuantity - 1)
                                              );
                                            }}
                                            className="px-2 py-0.5 hover:bg-gray-100 transition-colors border-r border-gray-200 text-gray-600 font-bold text-xs"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            min="1"
                                            max={maxQuantity}
                                            value={currentQuantity}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              const raw = parseInt(e.target.value) || 0;
                                              const clamped = Math.max(
                                                1,
                                                Math.min(maxQuantity || 1, raw)
                                              );
                                              handleQuantityChange(itemId, clamped);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="w-10 text-center py-0.5 text-xs focus:outline-none appearance-none font-semibold text-gray-900"
                                          />
                                          <button
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (!maxQuantity) {
                                                handleQuantityChange(
                                                  itemId,
                                                  (currentQuantity || 1) + 1
                                                );
                                                return;
                                              }
                                              handleQuantityChange(
                                                itemId,
                                                Math.min(
                                                  maxQuantity,
                                                  (currentQuantity || 1) + 1
                                                )
                                              );
                                            }}
                                            disabled={maxQuantity && currentQuantity >= maxQuantity}
                                            className="px-2 py-0.5 hover:bg-gray-100 transition-colors border-l border-gray-200 text-gray-600 font-bold text-xs"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                          <button
                            onClick={handleCloseEquipmentModal}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEquipment}
                            className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </PermissionGate>

            {/* Budget Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {
                showBudgetModal && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                      onClick={() => setShowBudgetModal(false)}
                    />
                    <div className="flex items-center justify-center min-h-screen p-4">
                      <div
                        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-2xl font-bold text-primary-dark">
                            Set Budget
                          </h2>
                          <button
                            onClick={() => setShowBudgetModal(false)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Budget Amount <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={formData.budget}
                              onChange={(e) => {
                                let value = e.target.value;

                                // Convert to number
                                let num = Number(value);

                                // Strict check
                                if (value === "") {
                                  setFormData({ ...formData, budget: "" });
                                  return;
                                }

                                if (isNaN(num) || num < 0) return;

                                setFormData({ ...formData, budget: num });
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                              placeholder="Enter budget amount"
                            />

                            <p className="text-xs text-gray-500 mt-1">
                              Budget can be set from contract or entered manually
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowBudgetModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveBudget}
                            className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </PermissionGate>

            {/* Expense Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {
                showExpenseModal && (
                  <ExpenseModalCentered
                    isOpen={showExpenseModal}
                    onClose={() => {
                      setShowExpenseModal(false);
                      setExpenseToEdit(null);
                    }}
                    onSubmit={async (formData) => {
                      try {
                        if (expenseToEdit) {
                          await updateExpense(expenseToEdit._id, formData);
                          setSuccessMessage("Expense updated successfully!");
                        } else {
                          await addExpense(formData);
                          setSuccessMessage("Expense added successfully!");
                        }
                        setShowExpenseModal(false);
                        setExpenseToEdit(null);
                        // Refresh expenses list
                        fetchProjectExpenses();
                      } catch (error) {
                        setErrorMessage(`Failed to ${expenseToEdit ? 'update' : 'add'} expense: ${error.message}`);
                      }
                    }}
                    expense={expenseToEdit}
                    isLoading={false}
                    preselectedProjectId={projectId}
                  />
                )
              }
            </PermissionGate>

            {/* Payment Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {
                showPaymentModal && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowPaymentModal(false); setPaymentScreenshots([]); }} />
                    <div className="flex items-center justify-center min-h-screen p-4">
                      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold text-primary-dark flex items-center gap-2">
                            <CreditCard size={24} />
                            Add Payment
                          </h2>
                          <button onClick={() => { setShowPaymentModal(false); setPaymentScreenshots([]); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X size={20} />
                          </button>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          const dateValue = formData.get("paymentDate");

                          const paymentData = {
                            amount: paymentAmount || 0,
                            paidBy: formData.get("paidBy"),
                            phoneNumber: formData.get("phoneNumber"),
                            paymentMethod: formData.get("paymentMethod"),
                            paymentDate: dateValue || new Date().toISOString().split('T')[0],
                            notes: formData.get("notes") || "",
                            screenshots: paymentScreenshots
                          };
                          handleAddPayment(paymentData);
                        }} className="space-y-4">

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                              <input
                                type="text"
                                name="amount"
                                value={paymentAmountDisplay}
                                onChange={(e) => {
                                  const formatted = formatIndianNumber(e.target.value);
                                  setPaymentAmountDisplay(formatted);
                                  const numeric = parseIndianNumber(e.target.value);
                                  setPaymentAmount(numeric);
                                }}
                                required
                                className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 ${project.projectAmount > 0 && (paymentAmount || 0) > remainingAmount
                                    ? 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50'
                                    : 'border-gray-300 focus:ring-primary-dark focus:border-primary-dark'
                                  }`}
                                placeholder="0.00"
                              />
                            </div>
                            {project.projectAmount > 0 && (paymentAmount || 0) > remainingAmount && (
                              <p className="text-red-500 text-xs mt-1">Amount exceeds the client payable . Modify Budget.</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Paid By <span className="text-red-500">*</span></label>
                            <input type="text" name="paidBy" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark" placeholder="Enter payer name" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                            <input type="tel" name="phoneNumber" required pattern="[0-9]{10}" maxLength="10" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark" placeholder="10-digit phone number" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method <span className="text-red-500">*</span></label>
                              <select name="paymentMethod" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark bg-white">
                                <option value="">Select method</option>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="UPI">UPI</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                              <DatePicker
                                className="w-full border-gray-300 rounded-lg"
                                style={{ height: '42px', width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Select date"
                                defaultValue={dayjs()}
                                allowClear={false}
                                onChange={(date, dateString) => {
                                  // We need to ensure this value gets submitted. 
                                  // Since we are using native FormData, we might need a hidden input or state.
                                  // Let's use a hidden input for simplicity if we want to stick to FormData, 
                                  // OR better, control the state.
                                  // For now, I'll add a hidden input that updates.
                                  const input = document.getElementById('paymentDateInput');
                                  if (input) input.value = date ? date.format('YYYY-MM-DD') : '';
                                }}
                              />
                              <input type="hidden" name="paymentDate" id="paymentDateInput" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <textarea name="notes" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark resize-none" placeholder="Add any additional notes" maxLength={200} />
                            <p className="text-xs text-gray-500 text-right mt-1">Max 200 characters</p>
                          </div>

                          <ScreenshotUploader
                            urls={paymentScreenshots}
                            onChange={setPaymentScreenshots}
                            onUpload={uploadPaymentScreenshots}
                          />

                          <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                            <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            <button
                              type="submit"
                              disabled={project.projectAmount > 0 && (paymentAmount || 0) > remainingAmount}
                              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${project.projectAmount > 0 && (paymentAmount || 0) > remainingAmount
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-primary-dark text-white hover:bg-primary'
                                }`}
                            >
                              Add Payment
                            </button>                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                )
              }
            </PermissionGate>

            {/* Project Amount Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {showProjectAmountModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={() => setShowProjectAmountModal(false)}
                  />
                  <div className="flex items-center justify-center min-h-screen p-4">
                    <div
                      className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                          {project.projectAmount ? "Edit Project Amount" : "Set Project Amount"}
                        </h2>
                        <button
                          onClick={() => setShowProjectAmountModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Amount <span className="text-red-500">*</span>
                          </label>
                          {(() => {
                            const numericValue = parseFloat(projectAmountInput) || 0;
                            // Validation: Check if new amount is less than already paid + scheduled
                            const _paid = (paymentSchedules || []).filter(s => s.status === 'paid');
                            const _upcoming = (paymentSchedules || []).filter(s => s.status === 'pending' || s.status === 'overdue');

                            const totalPaidHistory = _paid.length > 0
                              ? _paid.reduce((sum, s) => sum + (s.amount || 0), 0)
                              : (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

                            const totalUnpaidScheduled = _upcoming.reduce((sum, s) => sum + (s.amount || 0), 0);
                            const totalAllocated = totalPaidHistory + totalUnpaidScheduled;

                            const isInvalid = numericValue < totalAllocated;

                            return (
                              <>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    ₹
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={projectAmountInput}
                                    onChange={(e) => setProjectAmountInput(e.target.value)}
                                    className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 ${isInvalid
                                      ? 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50'
                                      : 'border-gray-300 focus:ring-primary-dark focus:border-primary-dark'
                                      }`}
                                    placeholder="Enter total project amount"
                                  />
                                </div>
                                {isInvalid ? (
                                  <p className="text-red-500 text-xs mt-1">
                                    Total cannot be less than the amount already paid or scheduled.
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-500 mt-1">
                                    This is the amount you expect to receive from the client.
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-gray-200 mt-4">
                          <button
                            type="button"
                            onClick={() => setShowProjectAmountModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          {(() => {
                            const numericValue = parseFloat(projectAmountInput) || 0;
                            const _paid = (paymentSchedules || []).filter(s => s.status === 'paid');
                            const _upcoming = (paymentSchedules || []).filter(s => s.status === 'pending' || s.status === 'overdue');
                            const totalPaidHistory = _paid.length > 0
                              ? _paid.reduce((sum, s) => sum + (s.amount || 0), 0)
                              : (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
                            const totalUnpaidScheduled = _upcoming.reduce((sum, s) => sum + (s.amount || 0), 0);
                            const totalAllocated = totalPaidHistory + totalUnpaidScheduled;
                            const isInvalid = numericValue < totalAllocated;

                            return (
                              <button
                                type="button"
                                onClick={handleSaveProjectAmount}
                                disabled={isInvalid}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm ${isInvalid
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-primary-dark text-white hover:bg-primary'
                                  }`}
                              >
                                Save
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PermissionGate>

            {/* Add Payment Schedule Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {showScheduleModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={() => setShowScheduleModal(false)}
                  />
                  <div className="flex items-center justify-center min-h-screen p-4">
                    <div
                      className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">
                          Add Payment Schedule
                        </h2>
                        <button
                          onClick={() => setShowScheduleModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* Remaining Budget Indicator */}
                      {project?.projectAmount > 0 && (
                        <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center">
                          <span className="text-xs text-blue-700 font-medium">Remaining Amount</span>
                          <span className="text-sm font-bold text-blue-800">
                            {formatIndianCurrency(Math.max(0, remainingAmount))}
                          </span>
                        </div>
                      )}

                      <div className="space-y-4">
                        {scheduleRows.map((row, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500">
                                Milestone {index + 1}
                              </span>
                              {scheduleRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveScheduleRow(index)}
                                  className="text-xs text-red-500 hover:bg-red-50 rounded px-2 py-0.5"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <input
                                type="text"
                                value={row.description}
                                onChange={(e) =>
                                  handleChangeScheduleRow(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                                placeholder="e.g., Booking advance"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Amount
                                </label>

                                {(() => {
                                  const newRowsTotal = scheduleRows.reduce(
                                    (sum, r) => sum + (parseFloat(r.amount) || 0),
                                    0
                                  );
                                  const totalAllocatedForValidation =
                                    totalPaidHistory + totalScheduledPending;
                                  const wouldExceed =
                                    project.projectAmount > 0 &&
                                    (totalAllocatedForValidation + newRowsTotal) > project.projectAmount;
                                  return (
                                    <>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.amount}
                                        onChange={(e) => handleChangeScheduleRow(index, "amount", e.target.value)}
                                        className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 text-sm ${wouldExceed
                                            ? 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50'
                                            : 'border-gray-300 focus:ring-primary-dark focus:border-primary-dark'
                                          }`}
                                        placeholder="0.00"
                                      />
                                      {wouldExceed && (
                                        <p className="text-red-500 text-[10px] mt-0.5">Amount exceeds the client payable.</p>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Due Date
                                </label>
                                <DatePicker
                                  value={row.dueDate ? dayjs(row.dueDate) : null}
                                  onChange={(date, dateString) =>
                                    handleChangeScheduleRow(
                                      index,
                                      "dueDate",
                                      date ? date.format('YYYY-MM-DD') : ''
                                    )
                                  }
                                  className="w-full border-gray-300 rounded-lg hover:border-primary-dark focus:border-primary-dark"
                                  style={{ height: "34px" }}
                                  placeholder="Select date"
                                  format="DD/MM/YYYY"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddScheduleRow}
                          className="inline-flex items-center gap-1 text-xs text-primary-dark hover:text-primary font-medium"
                        >
                          <Plus size={12} />
                          Add another milestone
                        </button>
                        <div className="flex gap-2 pt-3 border-t border-gray-200 mt-4">
                          <button
                            type="button"
                            onClick={() => setShowScheduleModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          {(() => {
                            const newRowsTotal = scheduleRows.reduce(
                              (sum, r) => sum + (parseFloat(r.amount) || 0),
                              0
                            );
                            const totalAllocatedForValidation = totalPaidHistory + totalScheduledPending;
                            const wouldExceed =
                              project.projectAmount > 0 &&
                              (totalAllocatedForValidation + newRowsTotal) > project.projectAmount;
                            return (
                              <button
                                type="button"
                                onClick={handleSaveSchedules}
                                disabled={wouldExceed}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm ${wouldExceed
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-primary-dark text-white hover:bg-primary'
                                  }`}
                              >
                                Save Schedule
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PermissionGate>

            {/* Mark Schedule as Paid Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {showMarkPaidModal && scheduleToMarkPaid && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                  <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    onClick={() => setShowMarkPaidModal(false)}
                  />
                  <div className="flex items-center justify-center min-h-screen p-4">
                    <div
                      className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-green-600" />
                          Mark Schedule as Paid
                        </h2>
                        <button
                          onClick={() => setShowMarkPaidModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        {scheduleToMarkPaid.description} —{" "}
                        {formatIndianCurrency(scheduleToMarkPaid.amount, true, 0)}
                      </p>
                      <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
                        These details are auto-filled from the client's info. If someone else is making this payment, please update them accordingly.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Paid By
                          </label>
                          <input
                            type="text"
                            value={markPaidForm.paidByName}
                            onChange={(e) =>
                              setMarkPaidForm((prev) => ({
                                ...prev,
                                paidByName: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                            placeholder="Client name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={markPaidForm.payerPhone}
                              onChange={(e) =>
                                setMarkPaidForm((prev) => ({
                                  ...prev,
                                  payerPhone: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                              placeholder="Optional"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Paid Date
                            </label>
                            <DatePicker
                              value={markPaidForm.paidDate ? dayjs(markPaidForm.paidDate) : null}
                              onChange={(date, dateString) =>
                                setMarkPaidForm((prev) => ({
                                  ...prev,
                                  paidDate: date ? date.format('YYYY-MM-DD') : '',
                                }))
                              }
                              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm bg-white"
                              format="DD/MM/YYYY"
                              placeholder="Select paid date"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Payment Method
                          </label>
                          <select
                            value={markPaidForm.paymentMethod}
                            onChange={(e) =>
                              setMarkPaidForm((prev) => ({
                                ...prev,
                                paymentMethod: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm bg-white"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <ScreenshotUploader
                          urls={markPaidForm.screenshots}
                          onChange={(urls) => setMarkPaidForm(prev => ({ ...prev, screenshots: urls }))}
                          onUpload={uploadPaymentScreenshots}
                        />
                        <div className="flex gap-2 pt-3 border-t border-gray-200 mt-4">
                          <button
                            type="button"
                            onClick={() => setShowMarkPaidModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmMarkPaid}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Confirm Paid
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </PermissionGate>

            {/* Payment Detail Modal */}
            {selectedPayment && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => setSelectedPayment(null)}
                />
                <div className="flex items-center justify-center min-h-screen p-4">
                  <div
                    className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard size={18} className="text-green-600" />
                        Payment Details
                      </h2>
                      <button
                        onClick={() => setSelectedPayment(null)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Paid By</p>
                          <p className="text-sm font-semibold text-gray-900">{selectedPayment.paidBy}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Phone</p>
                          <p className="text-sm text-gray-800">{selectedPayment.phoneNumber || '—'}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Amount</p>
                          <p className="text-sm font-bold text-green-700">{formatIndianCurrency(selectedPayment.amount, true, 0)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Method</p>
                          <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{selectedPayment.paymentMethod}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Payment Date</p>
                          <p className="text-sm text-gray-800">{new Date(selectedPayment.paymentDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>

                      {selectedPayment.notes && (
                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Notes</p>
                          <p className="text-sm text-gray-700">{selectedPayment.notes}</p>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Screenshots {selectedPayment.screenshots?.length > 0 && `(${selectedPayment.screenshots.length})`}
                          </p>
                          {selectedPayment.screenshots?.length > 0 && (
                            <span className="text-[10px] text-purple-500">tap to view full screen</span>
                          )}
                        </div>
                        {selectedPayment.screenshots?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedPayment.screenshots.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setLightboxSrc(url)}
                                className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-purple-200 hover:border-purple-500 shadow-sm hover:shadow-lg transition-all group"
                              >
                                <img src={url} alt={`screenshot ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                  <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-3 px-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <ImageIcon size={16} className="text-gray-300 flex-shrink-0" />
                            <p className="text-xs text-gray-400">No screenshots attached to this payment</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lightbox */}
            {lightboxSrc && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={() => setLightboxSrc(null)}
              >
                <button
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                  onClick={() => setLightboxSrc(null)}
                >
                  <X size={18} />
                </button>
                <img
                  src={lightboxSrc}
                  alt="Screenshot"
                  className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Delete Expense Confirmation Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {
                showDeleteExpenseModal && expenseToDelete && (
                  <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                      onClick={() => {
                        setShowDeleteExpenseModal(false);
                        setExpenseToDelete(null);
                      }}
                    />
                    <div className="flex items-center justify-center min-h-screen p-4">
                      <div
                        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Trash2 size={20} className="text-red-500" />
                            Delete Expense
                          </h2>
                          <button
                            onClick={() => {
                              setShowDeleteExpenseModal(false);
                              setExpenseToDelete(null);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="mb-6">
                          <p className="text-gray-600 mb-4">
                            Are you sure you want to delete this expense? This action cannot be undone.
                          </p>
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-gray-900">{expenseToDelete.description}</p>
                                <p className="text-sm text-gray-600">{expenseToDelete.category}</p>
                              </div>
                              <p className="text-lg font-bold text-red-600">
                                {formatIndianCurrency(expenseToDelete.amount || 0, true, 0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowDeleteExpenseModal(false);
                              setExpenseToDelete(null);
                            }}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await deleteExpense(expenseToDelete._id);
                                setSuccessMessage("Expense deleted successfully!");
                                fetchProjectExpenses();
                                setShowDeleteExpenseModal(false);
                                setExpenseToDelete(null);
                              } catch (error) {
                                setErrorMessage(`Failed to delete expense: ${error.message}`);
                                setShowDeleteExpenseModal(false);
                                setExpenseToDelete(null);
                              }
                            }}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            </PermissionGate>



            {/* Delete Payment Confirmation Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {
                showDeletePaymentModal && paymentToDelete && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                      onClick={() => {
                        setShowDeletePaymentModal(false);
                        setPaymentToDelete(null);
                      }}
                    />
                    <div
                      className="relative bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Trash2 size={20} className="text-red-500" />
                          Delete Payment
                        </h2>
                        <button
                          onClick={() => {
                            setShowDeletePaymentModal(false);
                            setPaymentToDelete(null);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="mb-6">
                        <p className="text-gray-600 mb-4">
                          Are you sure you want to delete this payment? This action cannot be undone.
                        </p>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-900">{paymentToDelete.paidBy}</p>
                              <p className="text-sm text-gray-600">{paymentToDelete.paymentMethod}</p>
                            </div>
                            <p className="text-lg font-bold text-green-600">
                              {formatIndianCurrency(paymentToDelete.amount || 0, true, 0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowDeletePaymentModal(false);
                            setPaymentToDelete(null);
                          }}
                          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await del(`/project/${projectId}/payments/${paymentToDelete._id}`);
                              setSuccessMessage("Payment deleted successfully!");
                              await fetchProject();
                              setShowDeletePaymentModal(false);
                              setPaymentToDelete(null);
                            } catch (error) {
                              setErrorMessage(`Failed to delete payment: ${error.message}`);
                              setShowDeletePaymentModal(false);
                              setPaymentToDelete(null);
                            }
                          }}
                          className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }
            </PermissionGate>

            {/* Release Equipment Confirmation Modal */}
            <PermissionGate page="4" component="4_1" action="edit">
              {
                showReleaseEquipmentModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                      className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                      onClick={() => setShowReleaseEquipmentModal(false)}
                    />
                    <div
                      className="relative bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <RefreshCw size={20} className="text-green-600" />
                          Release Equipment
                        </h2>
                        <button
                          onClick={() => setShowReleaseEquipmentModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="mb-6">
                        <p className="text-gray-600 mb-4 text-sm">
                          Select the equipment items you want to release back to inventory:
                        </p>
                        <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden flex flex-col">
                          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-green-100 border-b border-green-200 text-[10px] font-bold text-green-800 uppercase tracking-wider sticky top-0 z-10 items-center">
                            <div className="col-span-1" />
                            <div className="col-span-5">Equipment Item</div>
                            <div className="col-span-4 text-center">Category</div>
                            <div className="col-span-2 text-center">Qty</div>
                          </div>

                          <div className="max-h-[160px] overflow-y-scroll divide-y divide-green-100 bg-white/50 border-t border-green-100" style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#22c55e #f0fdf4'
                          }}>
                            {formData.assignedEquipment.filter(item => item && (item.id || item._id)).map((assignedItem) => {
                              const rawId = assignedItem.id?._id || assignedItem.id || assignedItem._id;
                              const assignedId = rawId ? rawId.toString() : "";
                              const populatedItem = assignedItem.id && typeof assignedItem.id === 'object' ? assignedItem.id : null;
                              const item = populatedItem || inventoryItems.find((inv) => (inv.id || inv._id)?.toString() === assignedId);
                              const isSelected = selectedItemsToRelease.includes(assignedId);

                              return (
                                <div
                                  key={assignedId}
                                  onClick={() => toggleItemSelection(assignedId)}
                                  className={`grid grid-cols-12 gap-2 items-center px-3 py-2 cursor-pointer transition-colors hover:bg-green-50/50 ${isSelected ? '' : 'opacity-50 grayscale-[0.5]'
                                    }`}
                                >
                                  <div className="col-span-1 flex justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => { }} // Controlled by div onClick
                                      className="w-3.5 h-3.5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                                    />
                                  </div>
                                  <div className="col-span-5 min-w-0">
                                    <p className="text-[11px] font-semibold text-gray-800 truncate" title={item?.itemName}>{item?.itemName || "Unknown Item"}</p>
                                  </div>
                                  <div className="col-span-4 min-w-0 text-center flex justify-center">
                                    <p className="text-[10px] text-gray-500 truncate" title={item?.category || "Uncategorized"}>{item?.category || "Uncategorized"}</p>
                                  </div>
                                  <div className="col-span-2 text-center flex justify-center">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                      {assignedItem.quantity || 1}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-2">
                          <p className="text-[11px] text-amber-800 leading-tight">
                            <strong>Note:</strong> Action cannot be undone. By clicking the checkbox, you confirm that these items have been returned to the inventory.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowReleaseEquipmentModal(false)}
                          disabled={isReleasingEquipment}
                          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReleaseEquipment}
                          disabled={isReleasingEquipment}
                          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isReleasingEquipment ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              Releasing...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={16} />
                              Release
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }
            </PermissionGate>
          </div>
        </div>
      </PageGuard>

      {/* Delete Schedule Confirmation Modal */}
      <PermissionGate page="4" component="4_1" action="edit">
        {showDeleteScheduleModal && scheduleToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteScheduleModal(false);
                setScheduleToDelete(null);
              }}
            />
            <div
              className="relative bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trash2 size={20} className="text-red-500" />
                  Delete Payment Schedule
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteScheduleModal(false);
                    setScheduleToDelete(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this payment schedule? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      {(() => {
                        const schedule = paymentSchedules.find(s => s._id === scheduleToDelete);
                        return (
                          <>
                            <p className="font-semibold text-gray-900">{schedule?.description || 'Schedule'}</p>
                            <p className="text-sm text-gray-600">
                              Due: {schedule?.dueDate ? new Date(schedule.dueDate).toLocaleDateString("en-IN") : "-"}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      {(() => {
                        const schedule = paymentSchedules.find(s => s._id === scheduleToDelete);
                        return formatIndianCurrency(schedule?.amount || 0, true, 0);
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteScheduleModal(false);
                    setScheduleToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSchedule}
                  disabled={isDeletingSchedule}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingSchedule ? (
                    <>
                      <Trash2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </PermissionGate>


      {/* Delete In-House Task Confirmation Modal */}
      <PermissionGate page="4" component="4_1" action="edit">
        {showDeleteInHouseTaskModal && taskToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => {
                setShowDeleteInHouseTaskModal(false);
                setTaskToDelete(null);
              }}
            />
            <div
              className="relative bg-white rounded-xl w-full max-w-md p-6 shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Trash2 size={20} className="text-red-500" />
                  Delete Task
                </h2>
                <button
                  onClick={() => {
                    setShowDeleteInHouseTaskModal(false);
                    setTaskToDelete(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold text-gray-900">{taskToDelete.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className={`px-2 py-0.5 rounded-full ${taskToDelete.status === 'Completed' ? 'bg-green-100 text-green-700' :
                        taskToDelete.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          taskToDelete.status === 'Review' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                        }`}>
                        {taskToDelete.status || 'Pending'}
                      </span>
                      {taskToDelete.dueDate && (
                        <span>Due: {formatDate(taskToDelete.dueDate)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteInHouseTaskModal(false);
                    setTaskToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteInHouseTask}
                  disabled={isDeletingInHouseTask}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeletingInHouseTask ? (
                    <>
                      <Trash2 size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </PermissionGate>

      {/* Delete Project Modal */}
      <DeleteProjectModal
        open={showDeleteProjectModal}
        projectTitle={project?.projectTitle || ''}
        onCancel={() => setShowDeleteProjectModal(false)}
        onConfirm={handleDeleteProject}
        isDeleting={isDeletingProject}
      />

      {/* Split Schedule Modal */}
      {showSplitModal && scheduleToSplit && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSplitModal(false)} />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4 px-6 pt-6 flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900">Split Payment Schedule</h2>
                <button onClick={() => setShowSplitModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center mx-6 flex-shrink-0">
                <span className="text-xs text-blue-700 font-medium">Splitting: {scheduleToSplit.description}</span>
                <span className="text-sm font-bold text-blue-800">{formatIndianCurrency(scheduleToSplit.amount, true, 0)}</span>
              </div>

              <div className="overflow-y-auto flex-1 px-6 pb-6">
                <div className="space-y-4">
                  {splitParts.map((part, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Milestone {index + 1}</span>
                        {splitParts.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitPart(index)}
                            className="text-xs text-red-500 hover:bg-red-50 rounded px-2 py-0.5"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={part.description}
                          onChange={(e) => {
                            const newParts = [...splitParts];
                            newParts[index].description = e.target.value;
                            setSplitParts(newParts);
                          }}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                          placeholder={`Name ${index + 1}`}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                            <input
                              type="text"
                              value={part.amount ? formatIndianNumber(String(part.amount)) : ""}
                              onChange={(e) => {
                                const numeric = parseIndianNumber(e.target.value);
                                const newParts = [...splitParts];
                                newParts[index].amount = numeric === "" ? 0 : Number(numeric);
                                setSplitParts(newParts);
                              }}
                              className="w-full pl-6 pr-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                          <DatePicker
                            format="DD/MM/YYYY"
                            value={part.dueDate ? dayjs(part.dueDate) : null}
                            onChange={(date) => {
                              const newParts = [...splitParts];
                              newParts[index].dueDate = date ? date.toISOString() : null;
                              setSplitParts(newParts);
                            }}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddSplitPart}
                    className="inline-flex items-center gap-1 text-xs text-primary-dark hover:text-primary font-medium"
                  >
                    <Plus size={12} />
                    Add another milestone
                  </button>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="flex gap-2 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSplitModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSplit}
                  className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-colors text-sm"
                >
                  Confirm Split
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Edit Schedule Modal */}
      {showEditScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Payment Schedule</h3>
                <p className="text-xs text-gray-500">Update schedule details</p>
              </div>
              <button onClick={() => setShowEditScheduleModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editScheduleForm.description}
                  onChange={(e) => setEditScheduleForm({ ...editScheduleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
                  placeholder="e.g., Initial Deposit"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Due Date</label>
                <DatePicker
                  value={editScheduleForm.dueDate ? dayjs(editScheduleForm.dueDate) : null}
                  onChange={(date, dateString) => setEditScheduleForm({ ...editScheduleForm, dueDate: date ? date.format('YYYY-MM-DD') : '' })}
                  className="w-full border-gray-300 rounded-lg hover:border-primary-dark focus:border-primary-dark"
                  style={{ height: "38px" }}
                  placeholder="Select due date"
                  format="DD/MM/YYYY"
                  allowClear={false}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount</label>
                {(() => {
                  const originalAmount = scheduleToEdit?.amount || 0;
                  const newAmount = parseFloat(editScheduleForm.amount) || 0;
                  const diff = newAmount - originalAmount; // only the delta matters
                  const totalAllocatedForValidation = totalPaidHistory + totalScheduledPending;
                  const wouldExceed =
                    project.projectAmount > 0 &&
                    (totalAllocatedForValidation + diff) > project.projectAmount;
                  return (
                    <>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500 text-sm">₹</span>
                        <input
                          type="number"
                          value={editScheduleForm.amount}
                          onChange={(e) => setEditScheduleForm({ ...editScheduleForm, amount: e.target.value })}
                          className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 transition-colors text-sm ${wouldExceed
                              ? 'border-red-400 focus:ring-red-200 focus:border-red-500 bg-red-50'
                              : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
                            }`}
                          placeholder="0.00"
                        />
                      </div>
                      {wouldExceed && (
                        <p className="text-red-500 text-[10px] mt-0.5">
                          Amount exceeds project limit by ₹{(
                            (totalAllocatedForValidation + diff) - project.projectAmount
                          ).toLocaleString('en-IN')}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowEditScheduleModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {(() => {
                const originalAmount = scheduleToEdit?.amount || 0;
                const newAmount = parseFloat(editScheduleForm.amount) || 0;
                const diff = newAmount - originalAmount;
                const totalAllocatedForValidation = totalPaidHistory + totalScheduledPending;
                const wouldExceed =
                  project.projectAmount > 0 &&
                  (totalAllocatedForValidation + diff) > project.projectAmount;
                return (
                  <button
                    onClick={handleSaveEditSchedule}
                    disabled={wouldExceed}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${wouldExceed
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-dark text-white hover:bg-primary'
                      }`}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </>
  );
};