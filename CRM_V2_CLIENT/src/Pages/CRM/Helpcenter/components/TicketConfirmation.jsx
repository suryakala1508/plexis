import { useEffect } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle,
  Clock,
  Loader,
  AlertCircle,
  Ticket,
  ArrowRight,
  Mail,
  Sparkles
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/Components/ui/button"
import { getIssueTypeById } from "../constants/ticketConstants"
import { statusConfig, priorityConfig, statusMap } from "../constants/ticketConstants"

const statusIcons = {
  under_review: Clock,
  in_progress: Loader,
  resolved: CheckCircle,
  needs_info: AlertCircle
}

export const TicketConfirmation = ({ ticket }) => {
  const navigate = useNavigate()

  if (!ticket) return null

  const mappedStatus = statusMap[ticket.status] || "under_review"
  const StatusIcon = statusIcons[mappedStatus]
  const config = statusConfig[mappedStatus]
  const priorityStyle = priorityConfig[ticket.priority]

  const issueType = getIssueTypeById(ticket.issueType)
  const createdAt = new Date(ticket.createdAt)

  // Auto-redirect to My Tickets after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/my-tickets")
    }, 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-lg mx-auto"
    >
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">
          Ticket Submitted!
        </h2>
        <p className="text-slate-500">
          We've received your request and will get back to you soon.
        </p>
      </motion.div>

      {/* Ticket Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600/5 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-600/10">
              <Ticket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider">
                Ticket ID
              </p>
              <p className="text-lg font-display font-bold text-primary">
                {ticket._id}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Issue Title
              </p>
              <p className="text-sm font-medium text-slate-900">
                {ticket.title}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Issue Type
              </p>
              <p className="text-sm font-medium text-slate-900">
                {issueType?.label || ticket.issueType}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Priority
              </p>
              <span
                className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${priorityStyle.color}`}
              >
                {priorityStyle.label}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Submitted On
              </p>
              <p className="text-sm font-medium text-slate-900">
                {createdAt.toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}{" "}
                ·{" "}
                {createdAt.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Current Status
            </p>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color}`}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-secondary/30 px-6 py-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Mail className="w-4 h-4" />
            <span>You'll receive updates via dashboard and email.</span>
          </div>
          <Button onClick={() => navigate("/my-tickets")} className="w-full h-10 px-4 py-2">
            Go to My Tickets
          </Button>
          <p className="text-xs text-center text-slate-500 mt-3">
            Redirecting to My Tickets in 5 seconds...
          </p>
        </div>
      </div>
    </motion.div>
  )
}
