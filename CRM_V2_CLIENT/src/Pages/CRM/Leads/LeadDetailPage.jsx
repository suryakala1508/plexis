import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Building2,
  Phone,
  Calendar,
  FileText,
  FilePlus,
  Clock,
  Tag,
  Plus,
  Image as ImageIcon,
  Users,
  MessageCircle,
  ExternalLink,
  Briefcase,
  Edit,
  Save,
  X,
  Send,
  Trash2,
  Download,
  Info,
} from "lucide-react";
import { DeleteConfirmationModal } from '../../../Components/DeleteConfirmationModal';
import { FaWhatsapp } from "react-icons/fa";
import { DatePicker, TimePicker } from "antd";
import dayjs from "dayjs";
import { Skeleton } from "../../../Components/Skeleton";
import { LoadingSpinner } from '../../../Components/Loading/LoadingSpinner'
import { LeadBreadcrumb } from "./components/LeadBreadcrumb";
import { getLeadById, updateLead, deleteLead } from "../../../services/leadService";

import {
  exportQuotationToPdf,
  sendQuotation,
  updateQuotation,
  updateQuotationDueDate,
  getQuotationById,
  deleteQuotation,
  getDownloadQuotationUrl,
} from "../../../services/quotationService";
import { exportContractPdf, getContractsByLead } from "../../../services/contractService";
import { createProject } from "../../../services/projectService";
import { findClientByEmail, updateClient } from "../../../services/clientService";
import { openPdfInNewTab, downloadPdf } from "../../../services/pdfService";
import {
  getFollowUps,
  addFollowUp,
  markFollowUpCompleted,
  updateFollowUp,
  deleteFollowUp,
} from "../../../services/followUpService";
import { Error } from "../../../Components/Error";
import { Success } from "../../../Components/Success";
import { SendQuotationModal } from './components/SendQuotationModal'
import { FollowUpModal } from '../../../Components/FollowUpModal'
import { CreateProject } from '../Project/CreateProject'
import { formatDate, formatIndianCurrency, formatIndianNumber, parseIndianNumber } from '../../../utils/formatUtils'
import { checkProjectExists } from '../../../utils/workflowChecks'
import { useCalendar } from "../../../contexts/CalendarContext";
import { PermissionGate } from "@/Pages/utils/permissions";
import { useUser } from "../../../contexts/UserContext";

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
import { TourGuide } from "../../../Components/TourGuide/TourGuide";
import { leadDetailTourSteps } from "../../../Components/TourGuide/steps/leadsTourSteps";

export const LeadDetailPage = () => {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const isRoleBasedUser = user && String(user.role) !== '1';
  const previousLeadIdRef = useRef(null);
  const { events, setEvents, fetchEvents } = useCalendar();
  const isNavigatingBackRef = useRef(false)
  const startTourRef = useRef(null);

  // Check if we're navigating back from quotation/contract pages or breadcrumb
  // Don't check previousLeadIdRef here as it causes false negatives on first render
  const isNavigatingBack = location.state?.fromQuotation ||
    location.state?.fromContract ||
    location.state?.fromNavigation

  // Always refresh when coming back from quotation confirmation pages
  const shouldRefreshFromQuotation = location.state?.fromQuotation

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [contract, setContract] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("Inquiry");
  const [pdfLoadingId, setPdfLoadingId] = useState(null)

  const [isTourMode, setIsTourMode] = useState(false);

  // Handle Tour Mode
  useEffect(() => {
    if (location.state?.continueTour && !loading && lead) {
      setIsTourMode(true);
      const timer = setTimeout(() => {
        if (startTourRef.current) {
          startTourRef.current();
          window.history.replaceState({}, document.title);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.state, loading, lead]);

  // Listen for tour start event from Sidebar
  useEffect(() => {
    const handleStartTour = (event) => {
      if (event.detail?.tourKey === 'leads-tour' && startTourRef.current) {
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


  // Safe error setter that never sets errors during navigation back
  const safeSetErrorMessage = useCallback((error) => {
    // Never set errors if we're navigating back
    if (isNavigatingBack) {
      return;
    }
    setErrorMessage(error);
  }, [isNavigatingBack]);


  const [newFollowUp, setNewFollowUp] = useState({
    reason: "",
    date: new Date().toISOString().split("T")[0],
    time: "09:00",
    notes: "",
    type: "call",
  });

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleFollowUpId, setRescheduleFollowUpId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [showSendModal, setShowSendModal] = useState(false)
  const [selectedQuotationForSend, setSelectedQuotationForSend] = useState(null)
  const [selectedQuotationIdForSend, setSelectedQuotationIdForSend] = useState(null)
  const [editing, setEditing] = useState(false)
  const [deleteConfirmQuotationId, setDeleteConfirmQuotationId] = useState(null)
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null)
  const [showDeleteLeadConfirm, setShowDeleteLeadConfirm] = useState(false)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [projectPrefillData, setProjectPrefillData] = useState({})
  const [budgetDisplay, setBudgetDisplay] = useState('')
  const [deleteFollowUpLoadingId, setDeleteFollowUpLoadingId] = useState(null)
  const [showDeleteFollowUpConfirm, setShowDeleteFollowUpConfirm] = useState(false)
  const [deleteFollowUpId, setDeleteFollowUpId] = useState(null)
  const [editingQuotationDateId, setEditingQuotationDateId] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    budget: "",
    notes: "",
    EventDate: "",
    Location: "",
  })

  // Format number with Indian number system (commas)
  const formatIndianNumber = (value) => {
    try {
      if (!value || value === '' || value === null || value === undefined) return ''

      // Remove all non-digit characters except decimal point
      const numericValue = value.toString().replace(/[^\d.]/g, '')
      if (!numericValue) return ''

      // Split by decimal point
      const parts = numericValue.split('.')
      const integerPart = parts[0] || ''
      const decimalPart = parts[1] || ''

      // Format integer part with Indian number system using Intl.NumberFormat
      let formattedInteger = integerPart
      if (integerPart) {
        const num = parseFloat(integerPart)
        if (!isNaN(num) && num >= 0) {
          formattedInteger = new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
          }).format(num)
        }
      }

      // Combine with decimal part (limit to 2 decimal places)
      const formattedDecimal = decimalPart.slice(0, 2)

      return formattedDecimal ? `${formattedInteger}.${formattedDecimal}` : formattedInteger
    } catch (error) {
      console.error('Error formatting Indian number:', error)
      return value?.toString() || ''
    }
  }

  // Parse formatted number back to numeric value
  const parseIndianNumber = (value) => {
    try {
      if (!value || value === '') return ''
      const numericValue = value.toString().replace(/[^\d.]/g, '')
      return numericValue === '' ? '' : (parseFloat(numericValue) || '')
    } catch (error) {
      console.error('Error parsing Indian number:', error)
      return ''
    }
  }

  // Update the ref IMMEDIATELY when we detect navigation back (before any renders)
  if (isNavigatingBack) {
    isNavigatingBackRef.current = true
  }

  // Clear error messages immediately when navigating back - runs before paint
  React.useLayoutEffect(() => {
    if (isNavigatingBack && lead) {
      setErrorMessage(null)
      setLoading(false)
    }
  }, [isNavigatingBack, lead])

  // Also clear in regular useEffect as backup
  useEffect(() => {
    if (isNavigatingBack && lead) {
      setErrorMessage(null)
      setLoading(false)
    }
  }, [location.state, leadId, isNavigatingBack, lead])

  // Handle auto-scroll to specific sections
  useEffect(() => {
    if (location.state?.scrollTo === 'quotations') {
      const element = document.getElementById('lead-quotation-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        // Clear the state to prevent scrolling again on refresh
        window.history.replaceState({ ...location.state, scrollTo: null }, document.title);
      }
    }
  }, [location.state, loading]);

  // Fetch events on mount ONLY if not already loaded
  useEffect(() => {
    if (events.length === 0) {
      fetchEvents();
    }
  }, [events.length, fetchEvents]);

  useEffect(() => {
    const fetchLeadData = async () => {
      // Check navigation state FIRST before any other operations
      const navigatingBack =
        location.state?.fromQuotation ||
        location.state?.fromContract ||
        location.state?.fromNavigation;

      const isTourNavigation = location.state?.continueTour;

      try {
        // Early return BEFORE any state changes if we have cached data
        if (navigatingBack && lead && lead.id === leadId && !isTourMode) {
          // Clear any previous error messages
          setErrorMessage(null);
          // Sync statusUpdate with current lead status to prevent unwanted status updates
          setStatusUpdate(lead.status)
          // Ensure loading is false
          setLoading(false);
          // Don't call API - keep existing data
          return;
        }

        // Clear error message before making new request
        setErrorMessage(null);

        // Only show loading skeleton if we're not navigating back
        if (!navigatingBack || !lead) {
          setLoading(true);
        } else {
          // If navigating back and we ALREADY have lead data, keep current data visible while fetching fresh data
          setLoading(false);
        }

        if (isTourNavigation || isTourMode) {
          // MOCK DATA FOR TOUR
          await new Promise(resolve => setTimeout(resolve, 500));
          const mockLead = {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sara@gmail.com',
            phone: '+91 9876543210',
            whatsappNumber: '+91 9876543210',
            relation: 'Client',
            source: 'Website',
            status: 'Proposal',
            budget: '250000',
            createdDate: '15-05-2024',
            lastContact: '20-05-2024',
            notes: 'Looking for wedding photography package including pre-wedding shoot.',
            EnquiryType: 'Wedding',
            EventType: 'Wedding',
            EventDate: '15-12-2024',
            EventDateRaw: '2024-12-15',
            Location: 'Udaipur, Rajasthan'
          };
          setLead(mockLead);
          setStatusUpdate(mockLead.status);
          setFormData({
            name: mockLead.name,
            email: mockLead.email,
            phone: mockLead.phone,
            whatsappNumber: mockLead.whatsappNumber,
            budget: mockLead.budget,
            notes: mockLead.notes,
            EventDate: mockLead.EventDateRaw,
            Location: mockLead.Location
          });
          setBudgetDisplay('2,50,000');

          // Mock Quotations
          setQuotations([
            {
              id: 'q1',
              title: 'Quotation #001234',
              amount: '₹ 2,50,000',
              createdOn: '18-05-2024',
              status: 'Sent',
              validUntil: '18-06-2024',
              pdfUrl: '#'
            }
          ]);

          // Mock Contract
          setContract({
            id: 'c1',
            title: 'Wedding Service Agreement',
            createdOn: '20-05-2024',
            status: 'Draft',
            signedOn: '-'
          });

          setLoading(false);
          return;
        }

        const response = await getLeadById(leadId);

        // Backend returns { success: true, data: { lead, followUps, quotations, contract } }
        // API interceptor extracts response.data, so getLeadById receives { success: true, data: {...} }
        // leadService extracts response.data, so we should get { lead, followUps, quotations, contract }
        // Handle both cases: if still nested (response.data) or already extracted (response)
        const responseData = response.data || response;
        const leadData = responseData.lead || responseData;
        const quotationsData = responseData.quotations || [];
        const contractData = responseData.contract || null;
        const mappedLead = {
          id: leadData._id || leadId,
          name: leadData.name || "Unknown",
          email: leadData.email || "",
          phone: leadData.contactNumber || "",
          whatsappNumber: leadData.whatsappNumber || "",
          relation: leadData.Relation || "",
          source: leadData.source || "Unknown",
          status: leadData.status || "Inquiry",
          budget: leadData.budget || "",
          createdDate: formatDate(leadData.createdAt),
          lastContact: formatDate(leadData.updatedAt),
          notes: leadData.remarks || "",
          EnquiryType: leadData.EnquiryType || "",
          EventType: leadData.EventType || "",
          EventDate: formatDate(leadData.EventDate),
          EventEndDate: formatDate(leadData.EventEndDate),
          EventDateRaw: leadData.EventDate, // Store raw date for parsing
          EventEndDateRaw: leadData.EventEndDate,
          Location: leadData.Location || "",
          additionalfields: leadData.additionalfields || {},
        };
        setLead(mappedLead);
        setStatusUpdate(mappedLead.status || "Inquiry");

        // Initialize formData for editing
        const budgetValue = mappedLead.budget || ""
        setFormData({
          name: mappedLead.name || "",
          email: mappedLead.email || "",
          phone: mappedLead.phone || "",
          whatsappNumber: mappedLead.whatsappNumber || "",
          budget: budgetValue,
          notes: mappedLead.notes || "",
          EventDate: leadData.EventDate ? new Date(leadData.EventDate).toISOString().split("T")[0] : "",
          EventEndDate: leadData.EventEndDate ? new Date(leadData.EventEndDate).toISOString().split("T")[0] : "",
          Location: mappedLead.Location || "",
        });
        // Initialize budget display with formatted value
        setBudgetDisplay(budgetValue ? formatIndianNumber(budgetValue.toString()) : '')

        // Clear error message on successful load
        setErrorMessage(null);

        // Map quotations data - filter out deleted quotations
        const mappedQuotations = quotationsData
          .filter(q => !q.isDeleted)
          .map(q => ({
            id: q._id || q.id,
            title: q.quotationNumber || `Quotation #${q._id?.toString().slice(-6) || q.id?.toString().slice(-6) || 'N/A'}`,
            amount: q.grandTotal ? formatIndianCurrency(parseFloat(q.grandTotal)) : formatIndianCurrency(0),
            createdOn: formatDate(q.createdAt),
            status: q.status || 'Draft',
            validUntil: formatDate(q.dueDate),
            validUntilRaw: q.dueDate || q.validUntil, // Store raw date for parsing
            selectedPaymentMethod: q.selectedPaymentMethod || null,
            paymentMethods: q.paymentMethods || {},
            paymentMilestones: q.paymentMilestones || [],
            pdfUrl: q.pdfUrl, // Map pdfUrl
            isPdfOutdated: q.isPdfOutdated
          }))

        setQuotations(mappedQuotations)

        // Auto-update lead status based on quotation count
        let autoStatus = 'Inquiry'
        if (mappedQuotations.length === 1) {
          autoStatus = 'Proposal'
        } else if (mappedQuotations.length >= 2) {
          autoStatus = 'Negotiation'
        }

        // Only auto-update if the current status is still the default or if it's being auto-managed
        // Don't override manually set statuses like 'Confirmed' or 'Rejected'
        const currentStatus = leadData.status || 'Inquiry'
        if (currentStatus === 'Inquiry' || currentStatus === 'Proposal' || currentStatus === 'Negotiation') {
          if (autoStatus !== currentStatus) {
            // Update the status in the backend
            try {
              await updateLead(leadId, { status: autoStatus })
              mappedLead.status = autoStatus
            } catch (error) {
              console.error('Error auto-updating lead status:', error)
              // Continue with existing status if update fails
            }
          }
        }

        // Map contract data - handle both single object and array
        if (contractData) {
          try {
            // If array, take the first non-deleted contract
            const contractToUse = Array.isArray(contractData)
              ? contractData.find(c => !c.isDeleted)
              : (!contractData.isDeleted ? contractData : null);
            console.log(contractToUse);
            if (contractToUse) {
              setContract({
                id: contractToUse._id || contractToUse.id,
                title: contractToUse.contractNumber,
                createdOn: formatDate(contractToUse.createdAt),
                status: contractToUse.status || "Pending",
                signedOn: formatDate(contractToUse.signedAt),
                grandTotal: contractToUse.grandTotal || 0
              });
            }
          } catch (contractError) {
            console.error("Error processing contract data:", contractError);
          }
        }
      } catch (error) {
        // Check if we're navigating back - if so, suppress errors completely
        // Use the navigatingBack variable defined at the top of the function
        if (navigatingBack) {
          // Silently fail when navigating back - keep existing data
          // Don't set error message, don't change loading state
          return;
        }

        // Only log and show error if not navigating back
        console.error("Error fetching lead data:", error);
        setErrorMessage(`Failed to load lead: ${error.message || 'Unknown error'}`)
      } finally {
        // Only update loading state if we're not in a navigation-back scenario
        if (!navigatingBack) {
          setLoading(false);
        }
        // Store the leadId we just loaded
        previousLeadIdRef.current = leadId;
      }
    };

    if (leadId) {
      fetchLeadData();
    }
    // Only depend on leadId - location.state changes should NOT trigger refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, isTourMode]);



  // Fetch follow-ups separately
  // Fetch follow-ups separately
  const fetchFollowUps = useCallback(async () => {
    if (!leadId) return;

    if (isTourMode) { // Use isTourMode state or check location directly inside if needed, but state is safer here if set correctly
      // Double check location state if isTourMode isn't reliable due to closure (though it should be fine with deps)
      // Actually simplest to check location.state inside here too or rely on setIsTourMode effect
      if (location.state?.continueTour) {
        const mockFollowUps = [
          {
            id: 'f1',
            date: '22-05-2024',
            time: '14:00',
            reason: 'Requirements Discussion',
            notes: 'Discussed specific shot list and drone photography requirements.',
            type: 'call',
            status: 'completed',
            completed: true,
            originalDate: '2024-05-22'
          },
          {
            id: 'f2',
            date: '25-05-2024',
            time: '11:00',
            reason: 'Venue Visit',
            notes: 'Visit the venue to check lighting conditions.',
            type: 'meeting',
            status: 'pending',
            completed: false,
            originalDate: '2024-05-25'
          }
        ];
        setFollowUps(mockFollowUps);
        return;
      }
    }

    try {
      const followUpsData = await getFollowUps(leadId);
      const mappedFollowUps = followUpsData.map((fu) => {
        const followUpDate = fu.date
          ? new Date(fu.date)
          : new Date(fu.createdAt);
        const hours = followUpDate.getHours();
        const minutes = followUpDate.getMinutes();
        const timeString = `${String(hours).padStart(2, "0")}:${String(
          minutes
        ).padStart(2, "0")}`;
        return {
          id: fu._id || fu.id,
          date: formatDate(fu.date || fu.createdAt),
          time: timeString,
          reason: fu.reason || fu.type || "",
          notes: fu.notes || fu.description || "",
          type: fu.type || "call",
          status: fu.status || "pending",
          completed: fu.status === "completed",
          originalDate: fu.date || fu.createdAt
        };
      });

      // Sort: Pending first, then by date (newest first). Completed at bottom.
      mappedFollowUps.sort((a, b) => {
        // First sort by completion status (pending first, completed last)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // Then sort by date (newest first)
        const dateA = new Date(a.originalDate).getTime();
        const dateB = new Date(b.originalDate).getTime();
        return dateB - dateA;
      });

      setFollowUps(mappedFollowUps);
    } catch (error) {
      console.error("Error fetching follow-ups:", error);
    }
  }, [leadId, isTourMode, location.state]);

  useEffect(() => {
    if (leadId) {
      fetchFollowUps();
    }
  }, [leadId, fetchFollowUps]);

  // Helper to sync calendar state without API call
  const syncCalendarOptimistically = useCallback((followUpData, action) => {
    if (!setEvents || !events) return;

    if (action === 'delete') {
      const followUpId = followUpData.id || followUpData._id;
      setEvents(events.filter(e => e.followUpId !== followUpId));
      return;
    }

    // Matching logic from calendarService.js for normalization
    // Use originalDate if available (it's the raw ISO string), fallback to date
    const dateToUse = followUpData.originalDate || followUpData.date;
    let startDate = new Date(dateToUse);
    
    // Robust parsing for DD/MM/YYYY format if new Date fails (common for state strings)
    if (isNaN(startDate.getTime()) && typeof dateToUse === 'string' && dateToUse.includes('/')) {
      const parts = dateToUse.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        // month is 0-indexed
        startDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      }
    }

    if (isNaN(startDate.getTime())) {
      console.error("Invalid date for calendar sync:", dateToUse);
      return;
    }

    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

    const targetName = lead?.name || "Unknown";
    const followUpId = followUpData._id || followUpData.id;

    const eventObj = {
      id: followUpId,
      _id: followUpId,
      title: `Follow-up: ${targetName} (${followUpData.reason})`,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      reason: followUpData.reason,
      description: followUpData.notes || "",
      type: "followup",
      status: followUpData.status || "pending",
      leadId: lead?.id,
      leadName: targetName,
      followUpId: followUpId,
      color: followUpData.status === "completed" ? "green" : "orange",
    };

    if (action === 'add') {
      setEvents([...events, eventObj]);
    } else if (action === 'update') {
      setEvents(events.map(e => e.followUpId === followUpId ? eventObj : e));
    }
  }, [events, setEvents, lead]);

  const handleDeleteFollowUp = (followUpId) => {
    setDeleteFollowUpId(followUpId)
    setShowDeleteFollowUpConfirm(true)
  }

  const confirmDeleteFollowUp = async () => {
    if (!deleteFollowUpId) return

    try {
      setDeleteFollowUpLoadingId(deleteFollowUpId)
      await deleteFollowUp(deleteFollowUpId)
      
      // Update local follow-ups
      setFollowUps(prev => prev.filter(f => f.id !== deleteFollowUpId));
      // Update calendar optimistically
      syncCalendarOptimistically({ id: deleteFollowUpId }, 'delete');

      setSuccessMessage("Follow-up deleted successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Error deleting follow-up:", error)
      setErrorMessage(`Failed to delete follow-up: ${error.message}`)
      setTimeout(() => setErrorMessage(null), 3000)
    } finally {
      setDeleteFollowUpLoadingId(null)
      setShowDeleteFollowUpConfirm(false)
      setDeleteFollowUpId(null)
    }
  }

  const handleCloseFollowUp = async (followUpId, isCurrentlyCompleted) => {
    try {
      const updated = await markFollowUpCompleted(followUpId, !isCurrentlyCompleted);
      
      // Update local follow-ups state
      setFollowUps(prev => prev.map(f => f.id === followUpId 
        ? { ...f, status: !isCurrentlyCompleted ? 'completed' : 'pending', completed: !isCurrentlyCompleted } 
        : f
      ));

      // Update calendar optimistically
      const followUpToSync = followUps.find(f => f.id === followUpId);
      if (followUpToSync) {
        syncCalendarOptimistically({
          ...followUpToSync,
          _id: followUpId,
          status: !isCurrentlyCompleted ? 'completed' : 'pending'
        }, 'update');
      }

      setSuccessMessage(isCurrentlyCompleted ? "Follow-up marked as pending" : "Follow-up marked as completed!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating follow-up status:", error);
      setErrorMessage(`Failed to update follow-up status: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const [rescheduleTime, setRescheduleTime] = useState("");

  const handleRescheduleFollowUp = (followUpId, currentDate, currentTime) => {
    setRescheduleFollowUpId(followUpId);
    // Convert DD/MM/YYYY to YYYY-MM-DD for date input
    const dateParts = currentDate.split("/");
    if (dateParts.length === 3) {
      const [day, month, year] = dateParts;
      setRescheduleDate(`${year}-${month}-${day}`);
    } else {
      // If already in YYYY-MM-DD format or other format, try to parse
      const dateObj = new Date(currentDate);
      if (!isNaN(dateObj.getTime())) {
        setRescheduleDate(dateObj.toISOString().split("T")[0]);
      } else {
        setRescheduleDate("");
      }
    }
    setRescheduleTime(currentTime || "");
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleDate || !rescheduleFollowUpId) return;

    if (!rescheduleTime) {
      setErrorMessage("Please select a time for rescheduling");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    try {
      // Convert YYYY-MM-DD to Date object and set time
      const dateObj = new Date(rescheduleDate);
      if (rescheduleTime) {
        const [hours, minutes] = rescheduleTime.split(":");
        dateObj.setHours(parseInt(hours, 10));
        dateObj.setMinutes(parseInt(minutes, 10));
      }

      const updated = await updateFollowUp(rescheduleFollowUpId, {
        date: dateObj.toISOString(),
        status: "pending"
      });

      // Update local follow-ups state
      setFollowUps(prev => prev.map(f => f.id === rescheduleFollowUpId 
        ? { 
            ...f, 
            date: formatDate(dateObj.toISOString()), 
            time: rescheduleTime,
            originalDate: dateObj.toISOString(),
            status: "pending",
            completed: false
          } 
        : f
      ));

      // Update calendar optimistically
      syncCalendarOptimistically({
        ...updated,
        _id: rescheduleFollowUpId,
        date: dateObj.toISOString(),
        status: "pending"
      }, 'update');

      setShowRescheduleModal(false);
      setRescheduleFollowUpId(null);
      setRescheduleDate("");
      setRescheduleTime("");
      setSuccessMessage("Follow-up rescheduled successfully!");
    } catch (error) {
      console.error("Error rescheduling follow-up:", error);
      setErrorMessage(`Failed to reschedule follow-up: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const formatTime = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "call":
        return <Phone size={14} className="text-blue-600" />;
      case "email":
        return <Mail size={14} className="text-green-600" />;
      case "meeting":
        return <Users size={14} className="text-purple-600" />;
      case "whatsapp":
        return <MessageCircle size={14} className="text-green-600" />;
      case "offline":
        return <Building2 size={14} className="text-orange-600" />;
      default:
        return <Phone size={14} className="text-gray-600" />;
    }
  };

  // Modal success/error handlers
  const handleFollowUpSuccess = (message, followUpData, action) => {
    if (action === 'add') {
      // For adding, we need to re-fetch follow-ups to get the correct sorted list comfortably, 
      // but we can also do it optimistically if we want zero API.
      // However, the user specifically mentioned CALENDAR API.
      // So I'll keep fetchFollowUps for the lead list but syncCalendar optimistically.
      
      fetchFollowUps();
    } else {
      // Update or other actions already handled state in their respective functions
      // but let's be safe if they come from the modal
      fetchFollowUps();
    }
    
    if (followUpData) {
      syncCalendarOptimistically(followUpData, action);
    }
    
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleFollowUpError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 3000);
  };

  // Auto-update status when it changes
  useEffect(() => {
    if (statusUpdate && lead && statusUpdate !== lead.status && !isNavigatingBack) {
      const updateStatus = async () => {
        try {
          await updateLead(leadId, { status: statusUpdate });
          setLead((prev) => ({ ...prev, status: statusUpdate }));
          setSuccessMessage("Status updated successfully!");
          setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
          console.error('Error updating status:', error)
          setErrorMessage(`Failed to update status: ${error.message || 'Unknown error'}`)
          setTimeout(() => setErrorMessage(null), 3000)
          // Revert status on error
          setStatusUpdate(lead.status);
        }
      }

      // Debounce the update to avoid too many API calls
      const timeoutId = setTimeout(updateStatus, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [statusUpdate, leadId, isNavigatingBack])

  const handleUpdateStatus = async () => {
    if (!statusUpdate || statusUpdate === lead.status) {
      return;
    }
    try {
      await updateLead(leadId, { status: statusUpdate });
      setLead((prev) => ({ ...prev, status: statusUpdate }));
      setSuccessMessage("Status updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      setErrorMessage(`Failed to update status: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleSave = async () => {
    try {
      // Prepare data to send to backend
      const updateData = {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        budget: formData.budget,
        remarks: formData.notes,
        EventDate: formData.EventDate ? new Date(formData.EventDate).toISOString() : null,
        EventEndDate: formData.EventEndDate ? new Date(formData.EventEndDate).toISOString() : null,
        Location: formData.Location,
      };

      await updateLead(leadId, updateData);

      // Update local lead state with new values
      setLead((prev) => ({
        ...prev,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        budget: formData.budget,
        notes: formData.notes,

        EventDate: formData.EventDate ? formatDate(formData.EventDate) : prev.EventDate,
        EventEndDate: formData.EventEndDate ? formatDate(formData.EventEndDate) : prev.EventEndDate,
        Location: formData.Location,
      }));

      setEditing(false);
      setSuccessMessage("Lead updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error updating lead:", error);
      setErrorMessage(`Failed to update lead: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleViewQuotationPDF = async (quotationId) => {
    try {
      const quotation = quotations.find((q) => q.id === quotationId);
      if (quotation && quotation.pdfUrl && quotation.isPdfOutdated === false) {
        openPdfInNewTab(quotation.pdfUrl);
        setSuccessMessage("PDF opened in new tab");
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }

      setPdfLoadingId(quotationId)
      // Call backend API to get PDF URL
      const pdfUrl = await exportQuotationToPdf(quotationId, { force: true });
      if (pdfUrl) {
        // Update local state to mark as not outdated
        setQuotations(prevQuotations =>
            prevQuotations.map(q =>
                 q.id === quotationId ? { ...q, isPdfOutdated: false, pdfUrl } : q
            )
        );
        openPdfInNewTab(pdfUrl);
        setSuccessMessage("PDF opened in new tab");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage("PDF not available. Please try again later.");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setErrorMessage(`Failed to export PDF: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    } finally {
      setPdfLoadingId(null)
    }
  };

  const handleEditQuotation = (quotationId) => {
    navigate(`/leads/${leadId}/quotation/${quotationId}/edit`);
  };

  const handleUpdateQuotation = async (quotationId) => {
    try {
      // Get the quotation to check current status
      const quotation = quotations.find((q) => q.id === quotationId);
      if (!quotation) return;

      if (quotation.status === 'Sent') {
        // If already sent, navigate to edit page for updates
        navigate(`/leads/${leadId}/quotation/${quotationId}/edit`)
      } else if (quotation.status === 'Draft') {
        // For draft status, open send modal
        await handleSendQuotation(quotationId)
      } else {
        // For other statuses, open send modal
        await handleSendQuotation(quotationId)
      }
    } catch (error) {
      console.error("Error updating quotation:", error);
      setErrorMessage(`Failed to update quotation: ${error.message}`);
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }

  const handleSendQuotation = async (quotationId) => {
    try {
      // Store the quotation ID first
      setSelectedQuotationIdForSend(quotationId)

      // Fetch the full quotation data for sending
      const quotationResponse = await getQuotationById(quotationId)
      const quotationData = quotationResponse.quotation || quotationResponse

      setSelectedQuotationForSend(quotationData)
      setShowSendModal(true)
    } catch (error) {
      console.error('Error fetching quotation for send:', error)
      setErrorMessage(`Failed to load quotation: ${error.message}`)
      setTimeout(() => setErrorMessage(null), 3000)
      setSelectedQuotationIdForSend(null)
    }
  }

  const handleSendQuotationConfirm = async (emailData) => {
    try {
      setErrorMessage(null)

      // Use the stored quotation ID
      const quotationIdToSend = selectedQuotationIdForSend || selectedQuotationForSend?._id || selectedQuotationForSend?.id

      if (!quotationIdToSend) {
        throw new Error('Quotation ID is missing')
      }

      await sendQuotation(quotationIdToSend, emailData)

      // Update the quotation status in local state
      setQuotations(prev => prev.map(q =>
        q.id === quotationIdToSend
          ? { ...q, status: 'Sent' }
          : q
      ))

      setSuccessMessage('Quotation sent to client successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      setShowSendModal(false)
      setSelectedQuotationForSend(null)
      setSelectedQuotationIdForSend(null)
    } catch (error) {
      console.error('Error sending quotation:', error)
      setErrorMessage(`Failed to send quotation: ${error.message}`)
      setTimeout(() => setErrorMessage(null), 3000)
      // Re-throw error so the modal can handle it
      throw error
    }
  }

  const handleEditContract = (contractId) => {
    navigate(`/leads/${leadId}/contract-create`, { state: { contractId } });
  };

  const handleUpdateQuotationDate = async (quotationId, date) => {
    if (!date) return;
    try {
      const formattedDate = date.toISOString();
      await updateQuotationDueDate(quotationId, formattedDate);

      // Update local state immediately
      setQuotations(prevQuotations =>
        prevQuotations.map(q =>
          q.id === quotationId
            ? { ...q, validUntil: date.format('DD/MM/YYYY'), validUntilRaw: formattedDate }
            : q
        )
      );

      setSuccessMessage("Quotation validity updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      setEditingQuotationDateId(null);
    } catch (error) {
      console.error("Error updating quotation date:", error);
      setErrorMessage("Failed to update quotation validity");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDeleteQuotation = async (quotationId) => {
    setDeleteConfirmQuotationId(quotationId)
  }

  const confirmDeleteQuotation = async () => {
    if (!deleteConfirmQuotationId) return

    try {
      setErrorMessage(null)
      await deleteQuotation(deleteConfirmQuotationId)
      setSuccessMessage('Quotation deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
      // Refresh quotations list
      const response = await getLeadById(leadId)
      const responseData = response.data || response
      const quotationsData = responseData.quotations || []
      // Filter out deleted quotations
      const mappedQuotations = quotationsData
        .filter(q => !q.isDeleted)
        .map(q => ({
          id: q._id || q.id,
          title: q.quotationNumber || `Quotation #${q._id?.toString().slice(-6) || q.id?.toString().slice(-6) || 'N/A'}`,
          amount: q.grandTotal ? formatIndianCurrency(parseFloat(q.grandTotal)) : formatIndianCurrency(0),
          createdOn: formatDate(q.createdAt),
          status: q.status || 'Draft',
          validUntil: formatDate(q.dueDate),
          validUntilRaw: q.dueDate || q.validUntil, // Store raw date for parsing
          selectedPaymentMethod: q.selectedPaymentMethod || null,
          paymentMethods: q.paymentMethods || {},
          paymentMilestones: q.paymentMilestones || [],
          pdfUrl: q.pdfUrl, // Map pdfUrl
          isPdfOutdated: q.isPdfOutdated
        }))
      setQuotations(mappedQuotations)
      setDeleteConfirmQuotationId(null)
    } catch (error) {
      console.error('Error deleting quotation:', error)
      setErrorMessage(error.message || 'Failed to delete quotation')
      setTimeout(() => setErrorMessage(null), 3000)
      setDeleteConfirmQuotationId(null)
    }
  }

  const cancelDeleteQuotation = () => {
    setDeleteConfirmQuotationId(null)
  }

  const handleDeleteLead = async () => {
    try {
      setErrorMessage(null)
      // Close the modal first before showing success message
      setShowDeleteLeadConfirm(false)
      await deleteLead(leadId)
      setSuccessMessage('Lead deleted successfully!')
      setTimeout(() => {
        navigate('/leads')
      }, 1000)
    } catch (error) {
      console.error('Error deleting lead:', error)
      setErrorMessage(error.message || 'Failed to delete lead')
      setTimeout(() => setErrorMessage(null), 3000)
      setShowDeleteLeadConfirm(false)
    }
  }

  const handleViewContractPDF = async (contractId) => {
    try {
      setPdfLoadingId(contractId)
      const response = await exportContractPdf(contractId)
      const pdfUrl = response.pdfUrl || response.data?.pdfUrl || response
      if (pdfUrl) {
        window.open(pdfUrl, '_blank')
      } else {
        throw new Error('PDF URL not found')
      }
    } catch (error) {
      console.error('Error viewing contract PDF:', error)
      setErrorMessage('Failed to view contract PDF')
    } finally {
      setPdfLoadingId(null)
    }
  }

  const handleConvertToContract = (quotationId) => {
    navigate(`/leads/${leadId}/quotation/${quotationId}/convert-to-contract`, {
      state: { leadName: lead.name },
    });
  };

  const handleGenerateContract = () => {
    const acceptedQuotation = quotations.find((q) => q.status?.toLowerCase() === "accepted");
    if (acceptedQuotation) {
      handleConvertToContract(acceptedQuotation.id);
    } else {
      navigate(`/leads/${leadId}/contract-create`, {
        state: { leadName: lead.name },
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Inquiry: "bg-blue-100 text-blue-700",
      Proposal: "bg-purple-100 text-purple-700",
      Negotiation: "bg-yellow-100 text-yellow-700",
      Confirmed: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
      Accepted: "bg-green-100 text-green-700",
      accepted: "bg-green-100 text-green-700",  // Add lowercase version
      rejected: "bg-red-100 text-red-700",      // Add lowercase version too
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <Skeleton className="h-6 w-40 mb-2" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80" />
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage && !isNavigatingBack) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          <Error onClose={() => setErrorMessage(null)}>{errorMessage}</Error>
        </div>
      </div>
    );
  }

  if (!lead && !loading && !isNavigatingBack) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          <Error onClose={() => navigate("/leads")}>Lead not found</Error>
        </div>
      </div>
    );
  }

  return (
    <>
      <TourGuide
        steps={leadDetailTourSteps}
        tourKey="lead-detail-tour"
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
      {/* Messages */}
      {successMessage && (
        <Success onClose={() => setSuccessMessage(null)}>{successMessage}</Success>
      )}
      {/* Removed inline error toast - errors only show in full-page view now */}

      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-[1920px] mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <LeadBreadcrumb
              leadId={leadId}
              leadName={lead?.name || "Unknown"}
            />
          </div>

          {/* Header Section */}
          <div id="lead-header-section" className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-primary-dark">
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            name: e.target.value,
                          })
                        }
                        className="border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-3xl font-bold"
                      />
                    ) : (
                      lead?.name
                    )}
                  </h1>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      lead?.status
                    )}`}
                  >
                    {lead?.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                  {lead?.relation && (
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} />
                      {lead?.relation}
                    </div>
                  )}
                  {lead?.source && (
                    <div className="flex items-center gap-1.5">
                      <Tag size={14} />
                      Source: {lead?.source}
                    </div>
                  )}
                  {lead?.EventType && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Event: {lead?.EventType}
                    </div>
                  )}
                  {lead?.createdDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Acquired On: {lead?.createdDate}
                    </div>
                  )}
                  {(lead?.EventDate || lead?.EventEndDate) && (
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      Date : {lead?.EventDate} {lead?.EventEndDate ? ` - ${lead?.EventEndDate}` : ''}
                    </div>
                  )}

                  {editing && (
                    <div className="w-full mt-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative">
                          <span className="text-xs text-gray-500 block mb-1">Start Date</span>
                          <DatePicker
                            value={formData.EventDate ? dayjs(formData.EventDate) : null}
                            onChange={(date) => setFormData(prev => ({ ...prev, EventDate: date ? date.format('YYYY-MM-DD') : '' }))}
                            format='DD/MM/YYYY'
                            className='border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark w-40'
                            placeholder='Start Date'
                          />
                        </div>
                        <div className="relative">
                          <span className="text-xs text-gray-500 block mb-1">End Date</span>
                          <DatePicker
                            value={formData.EventEndDate ? dayjs(formData.EventEndDate) : null}
                            onChange={(date) => setFormData(prev => ({ ...prev, EventEndDate: date ? date.format('YYYY-MM-DD') : '' }))}
                            format='DD/MM/YYYY'
                            className='border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark w-40'
                            placeholder='End Date'
                            minDate={formData.EventDate ? dayjs(formData.EventDate) : null}
                          />
                        </div>
                        <div className="relative">
                          <span className="text-xs text-gray-500 block mb-1">Budget</span>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                            <input
                              type="text"
                              value={budgetDisplay}
                              onChange={(e) => {
                                const formatted = formatIndianNumber(e.target.value)
                                setBudgetDisplay(formatted)
                                const numericValue = parseIndianNumber(e.target.value)
                                setFormData(prev => ({ ...prev, budget: numericValue }))
                              }}
                              onBlur={(e) => {
                                if (!e.target.value || e.target.value === '') {
                                  setBudgetDisplay('')
                                  setFormData(prev => ({ ...prev, budget: '' }))
                                }
                              }}
                              className="border border-gray-300 rounded px-2 pl-6 py-1 h-[30px] text-sm focus:ring-2 focus:ring-primary-dark focus:border-primary-dark w-36"
                              placeholder="Enter budget"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!editing && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">Budget:</span>
                      <div className="flex items-center gap-2">
                        <span>
                          {(() => {
                            if (isRoleBasedUser) return "₹ **,***";
                            const totalBudget = parseFloat(lead?.budget || '0');

                            if (totalBudget === 0) return "Not set";
                            return formatIndianCurrency(totalBudget.toString(), true, 0);
                          })()}
                        </span>
                        {(() => {
                          if (isRoleBasedUser) return null;
                          const totalBudget = parseFloat(lead?.budget || '0');
                          const additionalBudget = parseFloat(lead?.additionalBudget || '0');
                          const originalBudget = totalBudget - additionalBudget;

                          if (additionalBudget > 0) {
                            return (
                              <span className="text-xs text-gray-500">
                                (Original: {formatIndianCurrency(originalBudget.toString(), true, 0)} + Additional: <span className="text-green-600">{formatIndianCurrency(additionalBudget.toString(), true, 0)}</span>)
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className='flex flex-col gap-2'>
                {editing ? (
                  <div className="flex items-center gap-2">
                    <PermissionGate page="3" component="3_1" action="edit">
                      <button
                        onClick={() => {
                          setEditing(false);
                          // Reset form data to lead values
                          const budgetValue = lead.budget || ""
                          setFormData({
                            name: lead.name || "",
                            email: lead.email || "",
                            phone: lead.phone || "",
                            whatsappNumber: lead.whatsappNumber || "",
                            budget: budgetValue,
                            notes: lead.notes || "",
                            EventDate: lead.EventDate ? new Date(lead.EventDate).toISOString().split("T")[0] : "",
                            EventEndDate: lead.EventEndDate ? new Date(lead.EventEndDate).toISOString().split("T")[0] : "",
                            Location: lead.Location || "",
                          });
                          // Reset budget display
                          setBudgetDisplay(budgetValue ? formatIndianNumber(budgetValue.toString()) : '')
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
                    </PermissionGate>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PermissionGate page="3" component="3_1" action="edit">
                      <button
                        onClick={() => {
                          setEditing(true);
                          // Initialize budget display when entering edit mode
                          const budgetValue = lead.budget || "";
                          setBudgetDisplay(budgetValue ? formatIndianNumber(budgetValue.toString()) : '');
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        <Edit size={16} className="inline mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowDeleteLeadConfirm(true)}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                      >
                        <Trash2 size={16} className="inline mr-2" />
                        Delete
                      </button>
                    </PermissionGate>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Email</div>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                      placeholder="Email address"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {isRoleBasedUser ? maskEmail(lead.email) : (lead.email || "N/A")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-400" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Phone</div>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                      placeholder="Phone number"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {isRoleBasedUser ? maskPhone(lead.phone) : (lead.phone || "N/A")}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FaWhatsapp size={16} className="text-gray-400" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">WhatsApp</div>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.whatsappNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsappNumber: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                      placeholder="WhatsApp number"
                    />
                  ) : lead.whatsappNumber ? (
                    isRoleBasedUser ? (
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        {maskPhone(lead.whatsappNumber)}
                      </div>
                    ) : (
                      <a
                        href={`https://api.whatsapp.com/send?phone=${lead.whatsappNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gray-900 hover:text-green-700 flex items-center gap-1"
                      >
                        {lead.whatsappNumber}
                        <ExternalLink size={10} className="text-gray-400" />
                      </a>
                    )
                  ) : (
                    <div className="text-sm font-medium text-gray-900">N/A</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" />
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Location</div>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.Location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          Location: e.target.value,
                        })
                      }
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark"
                      placeholder="Location"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {lead.Location || "N/A"}
                    </div>
                  )}
                </div>
              </div>

              {/* Status (moved here so it doesn’t get pushed down by additional fields) */}
              <div className="flex items-center gap-2">
                 <div style={{ width: 16 }} />
                <div className="flex-1">
                  <div className="text-xs font-extrabold text-primary-dark mt-1.5 mb-1 ">Update Status</div>
                  <PermissionGate page="3" component="3_1" action="edit">
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary-dark focus:border-primary-dark bg-white"
                    >
                      <option value="Inquiry">Inquiry</option>
                      <option value="Proposal">Proposal</option>
                      <option value="Negotiation">Negotiation</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </PermissionGate>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Follow-ups & Notes */}
            <div className="col-span-1 lg:col-span-2 space-y-6">


              {/* Follow-ups */}
              <div id="lead-followup-section" className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary-dark">
                    Follow-ups
                  </h2>
                  <PermissionGate page="3" component="3_1" action="edit">
                    <button
                      onClick={() => setShowFollowUpModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all text-sm font-medium"
                    >
                      <Plus size={16} />
                      Add Follow-up
                    </button>
                  </PermissionGate>
                </div>

                <div className="space-y-3">
                  {followUps.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No follow-ups yet. Add one to get started!
                    </div>
                  ) : (
                    followUps.map((followUp) => (
                      <div
                        key={followUp.id}
                        className="relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* Checkbox on the left middle */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <input
                            type="checkbox"
                            checked={followUp.completed}
                            onChange={() => handleCloseFollowUp(followUp.id, followUp.completed)}
                            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                        </div>

                        {/* Actions top right */}
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          {!followUp.completed && (
                            <PermissionGate page="3" component="3_1" action="edit">
                              <button
                                onClick={() =>
                                  handleRescheduleFollowUp(followUp.id, followUp.date, followUp.time)
                                }
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
                              >
                                Reschedule
                              </button>
                            </PermissionGate>
                          )}
                          <button
                            onClick={() => handleDeleteFollowUp(followUp.id)}
                            disabled={deleteFollowUpLoadingId === followUp.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Follow-up"
                          >
                            {deleteFollowUpLoadingId === followUp.id ? <LoadingSpinner size={14} /> : <Trash2 size={14} />}
                          </button>
                        </div>

                        {/* Content with left padding to account for checkbox */}
                        <div className="pl-10 pr-24">
                          {/* Type icon and reason */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-600">
                              {getTypeIcon(followUp.type)}
                            </span>
                            <span className={`font-semibold ${followUp.completed ? "line-through text-gray-400" : "text-gray-900"}`}>
                              {followUp.reason}
                            </span>
                          </div>

                          {/* Date and time */}
                          <div className={`text-sm mb-2 ${followUp.completed ? "line-through text-gray-400" : "text-gray-600"}`}>
                            {followUp.date}
                            {followUp.time && ` at ${formatTime(followUp.time)}`}
                          </div>

                          {/* Notes */}
                          {followUp.notes && (
                            <div className={`text-sm rounded p-2 mt-2 ${followUp.completed ? "line-through text-gray-400 bg-gray-50" : "text-gray-700 bg-gray-50"}`}>
                              {followUp.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quotations */}
              <div id="lead-quotation-section" className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary-dark">
                    Quotations ({quotations.length})
                  </h2>
                  <PermissionGate page="3" component="3_1" action="edit">
                    <button
                      onClick={() =>
                        navigate(`/leads/${leadId}/quotation-create`, {
                          state: { leadName: lead.name },
                        })
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                    >
                      <FilePlus size={16} />
                      Create Quotation
                    </button>
                  </PermissionGate>
                </div>

                <div className="space-y-3">
                  {quotations.map((quote) => (
                    <div
                      key={quote.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-primary-dark transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-900 mb-1">
                            {quote.title}
                          </h3>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span>
                              Amount:{" "}
                              <span className="font-semibold text-gray-900">
                                {quote.amount}
                              </span>
                            </span>
                            <span>Created: {quote.createdOn}</span>
                            <div className="flex items-center gap-1 group">
                              <span>Valid Until:</span>
                              {editingQuotationDateId === quote.id ? (
                                <DatePicker
                                  autoFocus
                                  open
                                  value={quote.validUntilRaw ? dayjs(quote.validUntilRaw) : (quote.validUntil ? dayjs(quote.validUntil, 'DD/MM/YYYY') : null)}
                                  onChange={(date) => {
                                    handleUpdateQuotationDate(quote.id, date)
                                  }}
                                  onOpenChange={(open) => {
                                    if (!open) setEditingQuotationDateId(null)
                                  }}
                                  format="DD/MM/YYYY"
                                  size="small"
                                  className="border-none bg-white shadow-sm px-1 py-0 cursor-pointer text-xs font-semibold text-gray-900"
                                  suffixIcon={null}
                                  placeholder="Select date"
                                  allowClear={false}
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-gray-900">{quote.validUntil}</span>
                                  <button
                                    onClick={() => setEditingQuotationDateId(quote.id)}
                                    className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Edit validity date"
                                  >
                                    <Edit size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          {/* Add payment method display for accepted status */}
                          {(quote.status === "accepted" || quote.status === "Accepted") && quote.selectedPaymentMethod && (
                            <div className="mt-2 text-xs text-gray-600">
                              <span className="font-medium">Payment: </span>
                              <span className="text-gray-900">{quote.selectedPaymentMethod}</span>
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${quote.status === "Sent"
                            ? "bg-blue-100 text-blue-700"
                            : quote.status === "accepted" || quote.status === "Accepted"
                              ? "bg-green-100 text-green-700"
                              : quote.status === "Draft"
                                ? "bg-gray-100 text-gray-700"
                                : quote.status === "rejected" || quote.status === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {quote.status}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <PermissionGate page="3" component="3_1" action="edit">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditQuotation(quote.id)}
                            disabled={quote.status === "accepted" || quote.status === "Accepted"}
                            className={`text-xs px-3 py-1.5 border border-gray-300 rounded-md font-medium transition-colors ${(quote.status === "accepted" || quote.status === "Accepted")
                              ? "text-gray-400 bg-gray-100 cursor-not-allowed opacity-60"
                              : "text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                              }`}
                            title={(quote.status === "accepted" || quote.status === "Accepted") ? "Cannot edit accepted quotation" : "Edit quotation details"}
                          >
                            Edit
                          </button>

                          {/* View PDF Button */}
                          <button
                            onClick={() => handleViewQuotationPDF(quote.id)}
                            disabled={pdfLoadingId === quote.id}
                            className='text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 font-medium text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
                            title='View PDF in new tab'
                          >
                            {pdfLoadingId === quote.id ? (
                              <>
                                <LoadingSpinner size={12} className="text-primary-dark" />
                                Loading...
                              </>
                            ) : (
                              'View'
                            )}
                          </button>


                          {/* Send to Client Button */}
                          <button
                            onClick={() => handleSendQuotation(quote.id)}
                            disabled={quote.status === "accepted" || quote.status === "Accepted"}
                            className={`text-xs px-3 py-1.5 border rounded-md font-medium transition-colors ${(quote.status === "accepted" || quote.status === "Accepted")
                              ? "text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                              : "border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                              }`}
                            title={(quote.status === "accepted" || quote.status === "Accepted") ? "Cannot send accepted quotation" : "Send quotation to client"}
                          >
                            Send to Client
                          </button>

                          {/* Generate Contract Button - Only show if accepted */}
                          {(quote.status === "accepted" || quote.status === "Accepted") && (
                            <button
                              onClick={() => handleConvertToContract(quote.id)}
                              className="text-xs px-3 py-1.5 border border-green-300 rounded-md hover:bg-green-50 hover:border-green-400 font-medium text-green-700 transition-colors"
                              title="Generate Contract"
                            >
                              Generate Contract
                            </button>
                          )}

                          {/* Delete Button - Only for drafts */}
                          {(quote.status === "Draft" || quote.status === "draft") && (
                            <button
                              onClick={() => handleDeleteQuotation(quote.id)}
                              className="text-xs px-3 py-1.5 border border-red-300 rounded-md hover:bg-red-50 hover:border-red-400 font-medium text-red-700 transition-colors"
                              title="Delete draft quotation"
                            >
                              <Trash2 size={14} />
                            </button>

                          )}
                        </PermissionGate>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contract */}
              <div id="lead-contract-section" className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary-dark">
                    Contract
                  </h2>
                  {!contract && (
                    <PermissionGate page="3" component="3_1" action="edit">
                      <button
                        onClick={() => navigate(`/leads/${leadId}/contract-create`, {
                          state: { leadName: lead.name },
                        })}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary transition-all font-medium text-sm"
                      >
                        <FileText size={16} />
                        Create Contract
                      </button>
                    </PermissionGate>
                  )}
                </div>

                {contract ? (
                  <div className="p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">
                          {contract.title}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>Created: {contract.createdOn}</span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${contract.status?.toLowerCase() === "signed"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                          }`}
                      >
                        {contract.status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <PermissionGate page="3" component="3_1" action="edit">
                        <button
                          onClick={() => handleViewContractPDF(contract.id)}
                          disabled={pdfLoadingId === contract.id}
                          className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-300 font-medium text-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                          title="View PDF in new tab"
                        >
                          {pdfLoadingId === contract.id ? (
                            <>
                              <LoadingSpinner size={12} className="text-primary-dark" />
                              Loading...
                            </>
                          ) : (
                            <div className="flex items-center gap-1">Download <Download size={12} /> </div>
                          )}
                        </button>
                        <button
                          onClick={() => handleEditContract(contract.id)}
                          className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-green-50 hover:border-green-300 font-medium text-green-700 transition-colors"
                          title="Edit contract"
                        >
                          Edit
                        </button>
                      </PermissionGate>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No contract generated yet
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Quick Info & Actions */}
            <div className="space-y-6">
              {/* Additional Information */}
              {Object.keys(lead?.additionalfields || {}).length > 0 && (
                <div id="lead-additional-info-section" className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-bold text-primary-dark mb-4 flex items-center gap-2">
                    <Info size={20} />
                    Additional Information
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(lead.additionalfields)
                      .filter(([, value]) => {
                        if (value === null || value === undefined) return false
                        if (typeof value === "string" && value.trim() === "") return false
                        return true
                      })
                      .map(([key, value]) => (
                        <div key={key} className="flex flex-col pb-3 border-b border-gray-100 last:border-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{key}</span>
                          <span className="text-sm font-semibold text-gray-800 mt-1">{String(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Remarks / Notes Section */}
              <div id="lead-remarks-section" className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-primary-dark">
                    Remarks / Notes
                  </h2>
                  {!editing && formData.notes !== (lead.notes || "") && (
                    <div className="flex gap-2">
                      <PermissionGate page="3" component="3_1" action="edit">
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, notes: lead.notes || "" }))}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Cancel changes"
                        >
                          <X size={18} />
                        </button>
                        <button
                          onClick={handleSave}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Save remarks"
                        >
                          <Save size={18} />
                        </button>
                      </PermissionGate>
                    </div>
                  )}
                </div>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add remarks or notes here..."
                  className="w-full bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap min-h-[120px] focus:ring-2 focus:ring-primary-dark outline-none border border-transparent focus:border-primary-dark transition-all resize-none text-sm"
                />
              </div>

              {/* Status controls moved to Contact Info row */}



              {/* Convert to Project */}
              <div id="lead-convert-section" className=" from-green-50 to-emerald-50 rounded-xl border border-green-200 p-5">
                <h3 className="font-bold text-green-800 mb-2">
                  Ready to Convert?
                </h3>
                <p className="text-xs text-green-700 mb-4">
                  Create a project from this lead. All lead details will be pre-filled.
                </p>
                <PermissionGate page="3" component="3_1" action="edit">
                  <button
                    onClick={async () => {
                      const hasAcceptedQuotation = quotations.some(q => q.status?.toLowerCase() === 'accepted');
                      if (lead.status !== 'Confirmed' && !hasAcceptedQuotation) {
                        setErrorMessage('Only Confirmed leads or leads with an accepted quotation can be converted to projects.')
                        setTimeout(() => setErrorMessage(null), 3000)
                        return
                      }

                      // Check if project already exists for this lead
                      try {
                        const existingProject = await checkProjectExists(leadId)
                        if (existingProject) {
                          setErrorMessage(`Project already exists: "${existingProject.projectTitle}". Navigate to Projects to view it.`)
                          setTimeout(() => setErrorMessage(null), 5000)
                          return
                        }
                      } catch (checkError) {
                        console.error('Error checking for existing project:', checkError)
                        // Continue with project creation if check fails (non-blocking)
                      }

                      try {
                        // Fetch fresh lead data to get raw dates
                        const leadResponse = await getLeadById(leadId)
                        const leadResponseData = leadResponse.data || leadResponse
                        const rawLeadData = leadResponseData.lead || leadResponseData
                        const rawQuotationsData = leadResponseData.quotations || []

                        // Fetch contract data if available
                        let contractData = null
                        let contractBudget = ''
                        let contractPaymentMilestones = []
                        let contractUrl = null

                        if (contract) {
                          const contractsResponse = await getContractsByLead(leadId)
                          const contracts = contractsResponse.contracts || contractsResponse.data?.contracts || []
                          const contractIdStr = contract.id?.toString() || contract._id?.toString()
                          contractData = contracts.find(c => {
                            const cId = (c._id || c.id)?.toString()
                            return cId === contractIdStr
                          })

                          if (contractData) {
                            contractBudget = contractData.grandTotal?.toString() || contractData.subtotal?.toString() || lead.budget || ''
                            contractPaymentMilestones = contractData.paymentMilestones || []
                            contractUrl = contractData.pdfUrl || null
                          }
                        }

                        // Get accepted quotation from raw data
                        const acceptedQuotationRaw = rawQuotationsData.find(q => !q.isDeleted && (q.status?.toLowerCase() === 'accepted'))

                        // Use final amount from accepted quotation if available
                        const finalAmount = acceptedQuotationRaw?.grandTotal || acceptedQuotationRaw?.subtotal || null

                        // Note: Backend will check for existing client and update status to Ongoing automatically

                        // Parse dates safely - use raw dates from lead/quotation data
                        let startDate = ''
                        if (rawLeadData.EventDate) {
                          try {
                            const eventDate = new Date(rawLeadData.EventDate)
                            if (!isNaN(eventDate.getTime())) {
                              startDate = eventDate.toISOString().split('T')[0]
                            }
                          } catch (e) {
                            console.error('Error parsing EventDate:', e)
                          }
                        }
                        if (!startDate) {
                          startDate = new Date().toISOString().split('T')[0]
                        }

                        let endDate = ''
                        // Prioritize EventEndDate from lead
                        if (rawLeadData.EventEndDate) {
                          try {
                            const eventEndDate = new Date(rawLeadData.EventEndDate)
                            if (!isNaN(eventEndDate.getTime())) {
                              endDate = eventEndDate.toISOString().split('T')[0]
                            }
                          } catch (e) {
                            console.error('Error parsing EventEndDate:', e)
                          }
                        }

                        // Fallback to quotation dates if no EventEndDate
                        if (!endDate && (acceptedQuotationRaw?.dueDate || acceptedQuotationRaw?.validUntil)) {
                          try {
                            // Use raw date from quotation data
                            const validUntilDate = new Date(acceptedQuotationRaw.dueDate || acceptedQuotationRaw.validUntil)
                            if (!isNaN(validUntilDate.getTime())) {
                              endDate = validUntilDate.toISOString().split('T')[0]
                            }
                          } catch (e) {
                            console.error('Error parsing validUntil:', e)
                          }
                        }

                        // Prepare prefill data - prioritize accepted quotation amount, then contract, then lead budget
                        const prefillData = {
                          title: `${lead.name || 'Client'} - ${lead.EventType || 'Photography Project'}`,
                          description: lead.notes || '',
                          startDate: startDate,
                          endDate: endDate,
                          projectType: lead.EventType || 'Photography',
                          clientName: lead.name || '',
                          clientEmail: lead.email || '',
                          clientPhone: lead.phone || lead.whatsappNumber || '',
                          budget: lead.budget || '',
                          additionalBudget: lead.additionalBudget || '0',
                          location: lead.Location || '',
                          paymentMilestones: acceptedQuotationRaw?.paymentMilestones || contractPaymentMilestones,
                          projectAmount: acceptedQuotationRaw?.grandTotal || lead.budget || '',
                          sourceLeadId: leadId,
                          sourceQuotationId: acceptedQuotationRaw?._id || acceptedQuotationRaw?.id || null,
                          sourceContractId: contract?.id || contract?._id || null,
                          contractUrl: contractUrl
                        }

                        setProjectPrefillData(prefillData)
                        setShowCreateProjectModal(true)
                      } catch (error) {
                        console.error("Error preparing project data:", error)
                        setErrorMessage('Failed to prepare project data')
                        setTimeout(() => setErrorMessage(null), 3000)
                      }
                    }}
                    disabled={lead.status !== 'Confirmed' && !quotations.some(q => q.status?.toLowerCase() === 'accepted')}
                    className={`w-full px-4 py-2.5 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center justify-center gap-2 transition-all ${(lead.status === 'Confirmed' || quotations.some(q => q.status?.toLowerCase() === 'accepted'))
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-400 cursor-not-allowed opacity-75'
                      }`}
                  >
                    <Briefcase size={16} />
                    Convert to Project
                  </button>
                </PermissionGate>
                {lead.status !== 'Confirmed' && !quotations.some(q => q.status?.toLowerCase() === 'accepted') && (
                  <p className="text-[10px] text-orange-600 mt-2 text-center text-italic">
                    Lead must be "Confirmed" or have an "Accepted" quotation to convert.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Follow-up Modal */}
      <FollowUpModal
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        leadId={leadId}
        onSuccess={handleFollowUpSuccess}
        onError={handleFollowUpError}
      />



      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => {
              setShowRescheduleModal(false);
              setRescheduleFollowUpId(null);
              setRescheduleDate("");
            }}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div
              className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-primary-dark mb-4">
                Reschedule Follow-up
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={rescheduleDate ? dayjs(rescheduleDate) : null}
                    onChange={(date) => setRescheduleDate(date ? date.format("YYYY-MM-DD") : "")}
                    format="DD/MM/YYYY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm"
                    placeholder="Select new date"
                    minDate={dayjs()}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <TimePicker
                      value={rescheduleTime ? dayjs(rescheduleTime, "HH:mm") : null}
                      onChange={(time) => setRescheduleTime(time ? time.format("HH:mm") : "")}
                      format="h:mm A"
                      use12Hours
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-primary-dark text-sm h-[38px]"
                      placeholder="Select new time"
                      needConfirm={false}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <PermissionGate page="3" component="3_1" action="edit">
                  <button
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setRescheduleFollowUpId(null);
                      setRescheduleDate("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={!rescheduleDate || !rescheduleTime}
                    className="flex-1 px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Modal - Placeholder */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setShowQuotationModal(false)}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-2xl font-bold text-primary-dark mb-4">
                Generate Quotation
              </h2>
              <p className="text-gray-600 mb-4">
                Quotation generator coming soon...
              </p>
              <PermissionGate page="3" component="3_1" action="edit">
                <button
                  onClick={() => setShowQuotationModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Close
                </button>
              </PermissionGate>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={showDeleteFollowUpConfirm}
        onClose={() => setShowDeleteFollowUpConfirm(false)}
        onConfirm={confirmDeleteFollowUp}
        title="Delete Follow-up"
        message="Are you sure you want to delete this follow-up? This action cannot be undone."
        itemLabel={followUps.find(f => f.id === deleteFollowUpId)?.reason}
        loading={deleteFollowUpLoadingId === deleteFollowUpId}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteLeadConfirm}
        onClose={() => setShowDeleteLeadConfirm(false)}
        onConfirm={handleDeleteLead}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? Once deleted, lead information cannot be retrieved."
        itemLabel={lead?.name}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteConfirmQuotationId}
        onClose={cancelDeleteQuotation}
        onConfirm={confirmDeleteQuotation}
        title="Delete Quotation Draft"
        message="Are you sure you want to delete this quotation draft? This action cannot be undone."
        itemLabel={quotations.find(q => q.id === deleteConfirmQuotationId)?.title}
      />

      <CreateProject
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        prefillData={projectPrefillData}
      />

      <SendQuotationModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        quotationData={selectedQuotationForSend}
        onSend={handleSendQuotationConfirm}
      />
    </>
  );
};