import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Headphones, ArrowRight, BookOpen, Ticket, Menu, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Textarea } from "@/Components/ui/textarea"
import { Label } from "@/Components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/Components/ui/select"
import { Success } from '../../../Components/Success'
import { Error } from '../../../Components/Error'

import { IssueTypeSelector } from "./components/IssueTypeSelector"
import { AttachmentUpload } from "./components/AttachmentUpload"
import { ContextualHelpPanel } from "./components/ContextualHelpPanel"
import { TicketConfirmation } from "./components/TicketConfirmation"
import { getIssueTypeById } from "./constants/ticketConstants"
import { LoadingSpinner } from "../../../Components/Loading"
import { createTicket } from "@/services/helpcenterService"
import { fileToBase64 } from "@/services/helpcenterService"
import { getMyTickets } from "@/services/ticketService"
import { priorityConfig } from "./constants/ticketConstants"


export const HelpCentre = () => {
  const { toast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [createdTicket, setCreatedTicket] = useState(null)
  const [fileError, setFileError] = useState("")
  const [successMessage, setSuccessMessage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const MAX_FILE_SIZE_MB = 10
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

  const [formData, setFormData] = useState({
    issueType: "",
    title: "",
    description: "",
    priority: "medium",
    files: []
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect to My Tickets if user has existing tickets
  useEffect(() => {
    const fromNewTicket = location.state?.fromNewTicket

    const checkExistingTickets = async () => {
      // Don't redirect if explicitly coming from "New Ticket"
      if (fromNewTicket) return

      try {
        const res = await getMyTickets()
        if (res.tickets && res.tickets.length > 0 && !isSubmitted) {
          navigate("/my-tickets", { replace: true })
        }
      } catch (err) {
        // console.error("Failed to check existing tickets", err)
      }
    }

    checkExistingTickets()
  }, [navigate, isSubmitted, location.state])

  const selectedIssueType = useMemo(
    () => (formData.issueType ? getIssueTypeById(formData.issueType) : null),
    [formData.issueType]
  )

  const handleIssueTypeChange = value => {
    const issueType = getIssueTypeById(value)
    setFormData(prev => ({
      ...prev,
      issueType: value,
      priority: issueType?.defaultPriority || "medium"
    }))
  }

  const isDisabled =
    isSubmitting ||
    !formData.issueType ||
    !formData.title ||
    !formData.description

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isDisabled) {
      return
    }

    setIsSubmitting(true)

    try {
      const attachments = await Promise.all(
        formData.files.map(async (file) => ({
          data: await fileToBase64(file),
          contentType: file.type,
        }))
      )

      const payload = {
        title: formData.title,
        issueType: formData.issueType,
        description: formData.description,
        priority: formData.priority,
        attachments,
      }

      const newTicket = await createTicket(payload)
      // Robustly handle response structure (e.g. { ticket: {...} } vs {...})
      setCreatedTicket(newTicket.ticket || newTicket.data || newTicket)

      toast({
        title: "Ticket Submitted",
        description: "Your ticket has been created successfully",
      })

      setIsSubmitted(true)
    } catch (err) {
      console.error("Error creating ticket:", err)

      setErrorMessage(err.message || "Failed to submit ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted && selectedIssueType) {
    return (
      <div className="bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <TicketConfirmation ticket={createdTicket} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 sm:mb-10"
        >
          {/* Logo & Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-dark leading-tight">
              Support Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              We're here to help you succeed
            </p>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-2">
            <Link
              to="/my-tickets"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2 text-gray-700 hover:text-primary-dark hover:bg-gray-100 px-4 py-2 h-auto"
            >
              <Ticket className="w-4 h-4" />
              <span>My Tickets</span>
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden hover:bg-purple-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-700" />
            ) : (
              <Menu className="w-5 h-5 text-gray-700" />
            )}
          </Button>
        </motion.div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden mb-6 overflow-hidden"
            >
              <div className="bg-white rounded-xl border border-purple-100 p-2 shadow-sm">
                <Link
                  to="/my-tickets"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-700 hover:text-[#9916b1] hover:bg-purple-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Ticket className="w-4 h-4" />
                  <span>My Tickets</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            How can we help you today?
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Select an issue type below and provide details so we can assist you quickly
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Panel - Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Issue Title */}
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-sm font-semibold text-gray-900 flex items-center gap-1"
                  >
                    Issue Title
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Brief summary of your issue"
                    required
                    className="h-12 bg-gray-50 border-gray-200 focus:border-primary-dark focus:ring-primary-dark focus:ring-1 transition-all rounded-lg text-base"
                  />
                </div>

                {/* Issue Type Selector */}
                <div className="space-y-2 mb-6 pt-4">
                  <IssueTypeSelector
                    value={formData.issueType}
                    onChange={handleIssueTypeChange}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label
                    htmlFor="description"
                    className="text-sm font-semibold text-gray-900 flex items-center gap-1"
                  >
                    Description
                    <span className="text-[#9916b1]">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value
                      }))
                    }
                    placeholder={
                      selectedIssueType?.descriptionPlaceholder ||
                      "Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant context..."
                    }
                    required
                    className="min-h-[140px] sm:min-h-[160px] resize-none bg-gray-50 border-gray-200 focus:border-primary-dark focus:ring-primary-dark focus:ring-1 transition-all rounded-lg text-base leading-relaxed"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Providing detailed information helps us resolve your issue faster
                  </p>
                </div>

                {/* Priority Selector */}
                <div className="space-y-2">
                  <Label
                    htmlFor="priority"
                    className="text-sm font-semibold text-gray-900"
                  >
                    Priority Level
                  </Label>

                  <Select
                    value={formData.priority}
                    onValueChange={value =>
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="h-12 bg-white border-gray-200 focus:border-primary-dark focus:ring-primary-dark focus:ring-1 transition-all rounded-lg">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>

                    <SelectContent className="rounded-lg">
                      {Object.entries(priorityConfig).map(([key, config]) => {
                        const badgeClasses = {
                          critical: "bg-red-100 text-red-700 border-red-200",
                          high: "bg-orange-100 text-orange-700 border-orange-200",
                          medium: "bg-[#9916b1]/10 text-[#9916b1] border-[#9916b1]/20",
                          low: "bg-blue-100 text-blue-700 border-blue-200"
                        }[key]

                        return (
                          <SelectItem key={key} value={key} className="cursor-pointer">
                            <div className="flex items-center gap-2 py-1">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeClasses}`}
                              >
                                {config.label}
                              </span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                  <AttachmentUpload
                    hint={
                      selectedIssueType?.attachmentHint ||
                      "Screenshots help us resolve issues 40% faster"
                    }
                    files={formData.files}
                    onFilesChange={(files) => {
                      const oversized = files.find(file => file.size > MAX_FILE_SIZE_BYTES)

                      if (oversized) {
                        setFileError(
                          `"${oversized.name}" is too large. Please upload files smaller than 10 MB.`
                        )
                        return
                      }

                      setFileError("")
                      setFormData(prev => ({ ...prev, files }))
                    }}
                  />

                  {fileError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                      <span className="text-red-600 text-lg">⚠️</span>
                      <p className="text-sm text-red-700 flex-1">{fileError}</p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span>📎</span>
                    Max file size: <span className="font-semibold text-gray-700">10 MB per file</span>
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={
                      isSubmitting ||
                      !formData.issueType ||
                      !formData.title ||
                      !formData.description ||
                      !!fileError
                    }
                    className={`
                      w-full h-14 flex items-center justify-center gap-3
                      text-base font-semibold transition-all duration-300 rounded-xl
                      ${!isSubmitting &&
                        formData.issueType &&
                        formData.title &&
                        formData.description &&
                        !fileError
                        ? `bg-primary-dark hover:bg-primary-dark/90
                           text-white shadow-sm hover:shadow-md 
                           active:scale-[0.98]
                           transform transition-all`
                        : `bg-gray-300 text-gray-500 cursor-not-allowed opacity-60`
                      }
                    `}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-3">
                        <LoadingSpinner size="sm" />
                        <span>Submitting...</span>
                      </span>
                    ) : (
                      <>
                        <span>{fileError ? "Fix attachment to submit" : "Submit Ticket"}</span>
                        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Right Panel - Contextual Help */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden">
              <ContextualHelpPanel />
            </div>
          </div>
        </div>
      </div >
      {/* Toast Notifications */}
      {
        successMessage && (
          <Success onClose={() => setSuccessMessage(null)} autoClose={true}>
            {successMessage}
          </Success>
        )
      }
      {
        errorMessage && (
          <Error onClose={() => setErrorMessage(null)} autoClose={true}>
            {errorMessage}
          </Error>
        )
      }
    </div >
  )
}