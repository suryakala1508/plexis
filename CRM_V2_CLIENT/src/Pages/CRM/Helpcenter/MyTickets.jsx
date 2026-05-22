import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import {
    Plus, Search, ArrowLeft, ChevronDown,
    Calendar, Tag, Clock, FileText,
    AlertCircle, Hash, Image as ImageIcon,
    ExternalLink, X, Menu
} from "lucide-react"
import { Badge } from "@/Components/ui/badge"
import { getMyTickets } from "@/services/ticketService"
import { statusConfig, priorityConfig } from "./constants/ticketConstants"

/* ─── Status & Priority configs ────────────────────────────────────────────
   Expects statusConfig[status] = { label, icon, className }
   Expects priorityConfig[priority] = { label, className }

   Tailwind classes used below (add to safelist if using JIT purging):
   bg-blue-50 text-blue-700 border-blue-200
   bg-green-50 text-green-700 border-green-200
   bg-slate-50 text-slate-500 border-slate-200
   bg-amber-50 text-amber-700 border-amber-200
   bg-red-100 text-red-600
   bg-amber-100 text-amber-600
   bg-green-100 text-green-600
─────────────────────────────────────────────────────────────────────────── */

// Priority dot colors — tailwind bg classes
const PRIORITY_DOT = {
    high:   "bg-red-500",
    medium: "bg-amber-400",
    low:    "bg-green-500",
}

// Status badge styles  (light-theme semantic colors)
const STATUS_BADGE = {
    under_review: "bg-blue-50 text-blue-700 border border-blue-100",
    resolved:     "bg-green-50 text-green-700 border border-green-100",
    closed:       "bg-slate-100 text-slate-500 border border-slate-200",
    needs_info:   "bg-amber-50 text-amber-700 border border-amber-100",
}

const STATUS_LABEL = {
    under_review: "Under review",
    resolved:     "Resolved",
    closed:       "Closed",
    needs_info:   "Needs info",
}

const PRIORITY_BADGE = {
    high:   "bg-red-50 text-red-600 border border-red-100",
    medium: "bg-amber-50 text-amber-600 border border-amber-100",
    low:    "bg-green-50 text-green-600 border border-green-100",
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000)
    const steps = [
        [31536000, "year"],
        [2592000, "month"],
        [604800, "week"],
        [86400, "day"],
        [3600, "hour"],
        [60, "minute"],
    ]
    for (const [n, unit] of steps) {
        const i = Math.floor(seconds / n)
        if (i >= 1) return `${i} ${unit}${i > 1 ? "s" : ""} ago`
    }
    return "Just now"
}

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function formatDateTime(date) {
    return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    })
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status, className = "" }) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${STATUS_BADGE[status] ?? ""} ${className}`}
        >
            {STATUS_LABEL[status] ?? status}
        </span>
    )
}

function PriorityBadge({ priority, className = "" }) {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${PRIORITY_BADGE[priority] ?? ""} ${className}`}
        >
            {priorityConfig?.[priority]?.label ?? priority}
        </span>
    )
}

function PriorityDot({ priority, title }) {
    return (
        <span
            className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[priority] ?? "bg-slate-300"}`}
            title={title}
        />
    )
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────

function TicketCard({ ticket, index, onClick }) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.045, duration: 0.25 }}
            onClick={onClick}
            className="group relative bg-white rounded-2xl border border-slate-200 p-5 text-left
                       hover:border-primary-dark hover:shadow-lg hover:-translate-y-0.5
                       transition-all duration-200 flex flex-col gap-3 overflow-hidden"
        >
            {/* Top accent bar on hover */}
            <span className="absolute top-0 inset-x-0 h-0.5 bg-primary-dark scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left rounded-t-2xl" />

            {/* Header row */}
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10.5px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md tracking-wide border border-slate-100">
                    #{ticket.id.slice(-8)}
                </span>
                <PriorityDot priority={ticket.priority} title={`${priorityConfig?.[ticket.priority]?.label ?? ticket.priority} priority`} />
            </div>

            {/* Title & description */}
            <div>
                <h3 className="text-sm font-semibold text-slate-800 leading-snug tracking-tight line-clamp-2 group-hover:text-primary-dark transition-colors">
                    {ticket.title}
                </h3>
                {ticket.description && (
                    <p className="mt-1.5 text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {ticket.description}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
                <div className="flex items-center gap-1.5">
                    <StatusBadge status={ticket.status} />
                    {ticket.attachments?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                            <ImageIcon className="w-2.5 h-2.5" />
                            {ticket.attachments.length}
                        </span>
                    )}
                </div>
                <span className="text-[11px] text-slate-400">{timeSince(ticket.updatedAt)}</span>
            </div>
        </motion.button>
    )
}

// ─── Detail View ─────────────────────────────────────────────────────────────

function TicketDetail({ ticket, onBack }) {
    return (
        <motion.div
            key="detail"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.2 }}
        >
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary-dark mb-6 transition-colors font-medium group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to all tickets
            </button>

            <div className="grid lg:grid-cols-[1fr_228px] gap-4">
                {/* Main */}
                <div className="space-y-4">
                    {/* Header card */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <StatusBadge status={ticket.status} />
                                <PriorityBadge priority={ticket.priority} />
                            </div>
                            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight leading-snug mb-3">
                                {ticket.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5" />
                                    {ticket.id.slice(-8).toUpperCase()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Updated {timeSince(ticket.updatedAt)}
                                </span>
                            </div>
                        </div>

                        {ticket.description && (
                            <div className="p-6 sm:p-8">
                                <p className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    Description
                                </p>
                                <p className="text-sm text-slate-600 leading-[1.8] whitespace-pre-wrap">
                                    {ticket.description}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Attachments card */}
                    {ticket.attachments?.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                            <p className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Attachments ({ticket.attachments.length})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {ticket.attachments.map((att, i) => (
                                    <div
                                        key={i}
                                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-primary-dark cursor-pointer transition-all"
                                    >
                                        <img
                                            src={`data:${att.contentType};base64,${att.data}`}
                                            alt={`Attachment ${i + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                            <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-3">
                    {/* Info card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                        <p className="text-[10.5px] font-semibold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5" />
                            Ticket info
                        </p>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Ticket ID</dt>
                                <dd className="font-mono text-xs text-primary-dark bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg inline-block">
                                    #{ticket.id.slice(-12).toUpperCase()}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Status</dt>
                                <dd><StatusBadge status={ticket.status} /></dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Priority</dt>
                                <dd className="flex items-center gap-2">
                                    <PriorityDot priority={ticket.priority} />
                                    <span className="text-sm text-slate-700">{priorityConfig?.[ticket.priority]?.label ?? ticket.priority}</span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Issue type</dt>
                                <dd className="text-sm text-slate-700">{ticket.issueType}</dd>
                            </div>
                            <div className="pt-3 border-t border-slate-100">
                                <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />Created
                                </dt>
                                <dd className="text-sm text-slate-700">{formatDateTime(ticket.createdAt)}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />Updated
                                </dt>
                                <dd className="text-sm text-slate-700">{formatDateTime(ticket.updatedAt)}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Status notice */}
                    {ticket.status === "resolved" && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-semibold text-green-800 mb-0.5">Ticket resolved</p>
                                <p className="text-[11.5px] text-green-700 leading-relaxed">
                                    This ticket has been resolved. For further help, please open a new ticket.
                                </p>
                            </div>
                        </div>
                    )}
                    {ticket.status === "needs_info" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-semibold text-amber-800 mb-0.5">Action required</p>
                                <p className="text-[11.5px] text-amber-700 leading-relaxed">
                                    Our team needs additional information. Please check your email.
                                </p>
                            </div>
                        </div>
                    )}
                    {ticket.status === "under_review" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                            <div>
                                <p className="text-xs font-semibold text-blue-800 mb-0.5">In progress</p>
                                <p className="text-[11.5px] text-blue-700 leading-relaxed">
                                    Our support team is reviewing your ticket. We'll update you soon.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const FILTER_STATUSES = ["all", "under_review", "resolved", "closed"]

export default function MyTickets() {
    const [searchQuery, setSearchQuery]     = useState("")
    const [filterStatus, setFilterStatus]   = useState("all")
    const [tickets, setTickets]             = useState([])
    const [loading, setLoading]             = useState(true)
    const [selectedTicket, setSelectedTicket] = useState(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showFilters, setShowFilters]     = useState(false)

    useEffect(() => {
        getMyTickets()
            .then(res => setTickets(res.tickets || []))
            .catch(err => console.error("Failed to fetch tickets", err))
            .finally(() => setLoading(false))
    }, [])

    const mappedTickets = useMemo(() =>
        tickets.map(t => ({
            id:          t._id,
            title:       t.title,
            description: t.description,
            issueType:   t.issueType,
            status:      t.status === "open" ? "under_review" : t.status,
            priority:    t.priority,
            createdAt:   new Date(t.createdAt),
            updatedAt:   new Date(t.updatedAt),
            attachments: t.attachments || [],
        })),
        [tickets]
    )

    const filteredTickets = useMemo(() =>
        mappedTickets.filter(t => {
            const q = searchQuery.toLowerCase()
            const matchQ =
                t.title.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q) ||
                t.issueType.toLowerCase().includes(q)
            const matchS = filterStatus === "all" || t.status === filterStatus
            return matchQ && matchS
        }),
        [mappedTickets, searchQuery, filterStatus]
    )

    const ticketCounts = useMemo(() => ({
        all:          mappedTickets.length,
        under_review: mappedTickets.filter(t => t.status === "under_review").length,
        resolved:     mappedTickets.filter(t => t.status === "resolved").length,
        closed:       mappedTickets.filter(t => t.status === "closed").length,
    }), [mappedTickets])

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:max-w-none lg:ml-8 lg:mr-6">

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                            Support tickets
                        </h1>
                        <p className="text-[15px] text-slate-500 mt-1">
                            Track and manage your support requests
                        </p>
                    </div>

                    {/* Desktop CTA + Search */}
                    <div className="hidden sm:flex items-center gap-3">
                        {!selectedTicket && (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search tickets…"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-56 pl-9 pr-4 h-9 text-sm bg-white border border-slate-200 rounded-xl
                                               focus:outline-none focus:border-primary-dark focus:ring-2 focus:ring-primary-dark/10
                                               placeholder:text-slate-400 text-slate-800"
                                />
                            </div>
                        )}
                        <Link
                            to="/helpcenter"
                            state={{ fromNewTicket: true }}
                            className="inline-flex items-center gap-2 bg-primary-dark hover:bg-primary-dark/90
                                       text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shadow-sm"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New ticket
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        className="sm:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-600"
                        onClick={() => setMobileMenuOpen(v => !v)}
                    >
                        {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                </motion.div>

                {/* ── Mobile menu ── */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="sm:hidden mb-5 overflow-hidden"
                        >
                            <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2 shadow-sm">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search tickets…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 h-9 text-sm bg-slate-50 border border-slate-200 rounded-xl
                                                   focus:outline-none focus:border-primary-dark placeholder:text-slate-400"
                                    />
                                </div>
                                <Link
                                    to="/helpcenter"
                                    state={{ fromNewTicket: true }}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 bg-primary-dark text-white text-sm font-medium
                                               px-4 py-2.5 rounded-xl w-full"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    New ticket
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Content ── */}
                <AnimatePresence mode="wait">
                    {selectedTicket ? (
                        <TicketDetail
                            key="detail"
                            ticket={selectedTicket}
                            onBack={() => setSelectedTicket(null)}
                        />
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {/* Desktop filters */}
                            <div className="hidden sm:flex flex-wrap gap-2 mb-5">
                                {FILTER_STATUSES.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all
                                            ${filterStatus === status
                                                ? "bg-primary-dark text-white border-primary-dark shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                    >
                                        {status === "all" ? "All" : STATUS_LABEL[status]}
                                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold
                                            ${filterStatus === status
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-100 text-slate-500"
                                            }`}>
                                            {ticketCounts[status]}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Mobile filter toggle */}
                            <div className="sm:hidden mb-4">
                                <button
                                    onClick={() => setShowFilters(v => !v)}
                                    className="flex items-center gap-2 text-sm text-slate-600 font-medium border border-slate-200 bg-white px-3 py-1.5 rounded-lg"
                                >
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                                    {filterStatus === "all" ? "All" : STATUS_LABEL[filterStatus]}
                                </button>
                                <AnimatePresence>
                                    {showFilters && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden mt-2"
                                        >
                                            <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-wrap gap-2">
                                                {FILTER_STATUSES.map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => { setFilterStatus(status); setShowFilters(false) }}
                                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                                                            ${filterStatus === status
                                                                ? "bg-primary-dark text-white"
                                                                : "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {status === "all" ? "All" : STATUS_LABEL[status]}
                                                        {" "}({ticketCounts[status]})
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Ticket grid */}
                            {loading ? (
                                <div className="flex items-center justify-center py-24">
                                    <div className="w-8 h-8 rounded-full border-2 border-primary-dark border-t-transparent animate-spin" />
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                    <h3 className="text-sm font-semibold text-slate-700 mb-1">No tickets found</h3>
                                    <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredTickets.map((ticket, index) => (
                                        <TicketCard
                                            key={ticket.id}
                                            ticket={ticket}
                                            index={index}
                                            onClick={() => setSelectedTicket(ticket)}
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}