import { useState } from "react"
import { motion } from "framer-motion"
import {
  RefreshCw,
  AlertCircle,
  Shield,
  Trash2,
  Globe,
  List,
  FileText,
  CreditCard,
  XCircle,
  Map,
  ThumbsUp,
  Users,
  Edit,
  Lock,
  Trash,
  BookOpen,
  HelpCircle,
  Briefcase,
  Clock,
  Zap,
  Key,
  Settings,
  Bell,
  Database,
  Mail,
  Headphones,
  ArrowRight,
  Sparkles
} from "lucide-react"
import { QuickActionModal } from "./QuickActionModal"

const iconMap = {
  "refresh-cw": RefreshCw,
  "alert-circle": AlertCircle,
  shield: Shield,
  "trash-2": Trash2,
  globe: Globe,
  list: List,
  "file-text": FileText,
  "credit-card": CreditCard,
  "x-circle": XCircle,
  map: Map,
  "thumbs-up": ThumbsUp,
  users: Users,
  edit: Edit,
  lock: Lock,
  trash: Trash,
  "book-open": BookOpen,
  "help-circle": HelpCircle,
  briefcase: Briefcase,
  key: Key,
  settings: Settings,
  bell: Bell,
  database: Database,
  mail: Mail,
  headphones: Headphones
}

// All quick actions available on page load
const allQuickActions = [
  {
    id: "reset-password",
    title: "Reset Your Password",
    description: "Forgot your password? Reset it in minutes",
    icon: "key",
    content: {
      steps: [
        'Go to the login page and click "Forgot Password"',
        "Enter your email address associated with your account",
        "Check your inbox for the reset link (also check spam folder)",
        "Click the link and create a new strong password",
        "Log in with your new password"
      ],
      tips: [
        "Use a password with at least 12 characters",
        "Mix uppercase, lowercase, numbers and symbols",
        "Reset link expires in 24 hours"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=600&h=300&fit=crop",
      note:
        "If you don't receive the email within 5 minutes, try again or contact support."
    }
  },
  {
    id: "clear-cache",
    title: "Clear Browser Cache",
    description: "Fix loading issues by clearing cached data",
    icon: "refresh-cw",
    content: {
      steps: [
        "Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)",
        'Select "Cached images and files"',
        'Choose time range "All time"',
        'Click "Clear data"',
        "Refresh the page and try again"
      ],
      tips: [
        "This won't delete your passwords or bookmarks",
        "Try incognito/private mode as a quick test"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&h=300&fit=crop"
    }
  },
  {
    id: "two-factor",
    title: "Two-Factor Authentication",
    description: "Set up or troubleshoot 2FA on your account",
    icon: "shield",
    content: {
      steps: [
        "Open your authenticator app (Google Authenticator, Authy, etc.)",
        "Ensure your device time is synced correctly",
        "Try using a backup code if the regular code isn't working",
        "Contact support if you've lost access to your 2FA device"
      ],
      tips: [
        "Save backup codes in a secure location",
        "Consider using multiple devices for 2FA",
        "Keep your authenticator app updated"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=600&h=300&fit=crop"
    }
  },
  {
    id: "view-invoices",
    title: "View Your Invoices",
    description: "Access and download billing history",
    icon: "file-text",
    content: {
      steps: [
        "Go to Settings → Billing",
        'Click on "Invoice History"',
        "Select the invoice you want to view",
        "Download as PDF or print directly"
      ],
      tips: [
        "Invoices are generated on the 1st of each month",
        "You can set up automatic invoice emails"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=300&fit=crop"
    }
  },
  {
    id: "account-settings",
    title: "Update Account Settings",
    description: "Manage your profile and preferences",
    icon: "settings",
    content: {
      steps: [
        "Click on your profile icon in the top right",
        'Select "Account Settings" from the dropdown',
        "Update your name, email, or profile picture",
        'Click "Save Changes" to apply updates'
      ],
      tips: [
        "Keep your email updated to receive important notifications",
        "You can change your timezone in preferences"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=300&fit=crop"
    }
  },
  {
    id: "notifications",
    title: "Manage Notifications",
    description: "Control email and push notification settings",
    icon: "bell",
    content: {
      steps: [
        "Go to Settings → Notifications",
        "Toggle email notifications on/off",
        "Customize which events trigger alerts",
        "Set quiet hours for push notifications"
      ],
      tips: [
        "You can mute notifications temporarily",
        "Critical security alerts cannot be disabled"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1512314889357-e157c22f938d?w=600&h=300&fit=crop"
    }
  },
  {
    id: "data-export",
    title: "Export Your Data",
    description: "Download a copy of all your data",
    icon: "database",
    content: {
      steps: [
        "Navigate to Settings → Privacy",
        'Click "Request Data Export"',
        "Select the data types you want to export",
        "Wait for the download link in your email"
      ],
      tips: [
        "Data exports can take up to 24 hours",
        "Exports are available for download for 7 days"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=300&fit=crop",
      note: "Large exports may be split into multiple files."
    }
  },
  {
    id: "contact-support",
    title: "Contact Support Team",
    description: "Get help from our expert team",
    icon: "headphones",
    content: {
      steps: [
        "Fill out the support form on this page",
        "Provide detailed information about your issue",
        "Attach screenshots if applicable",
        "Submit and wait for our response"
      ],
      tips: [
        "Be as specific as possible in your description",
        "Include error messages and steps to reproduce",
        "Check your spam folder for our response"
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=300&fit=crop",
      note: "Average response time is 2 hours during business hours."
    }
  }
]

export const ContextualHelpPanel = ({ onSolved, onNeedHelp }) => {
  const [selectedAction, setSelectedAction] = useState(null)

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Header */}
      <div className="relative mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6 text-gray-900" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-dark">
              Quick Actions
            </h3>
            <p className="text-xs text-gray-600">Instant self-service solutions</p>
          </div>
        </div>
        <div className="absolute -bottom-3 left-0 right-0 h-px bg-gray-100"></div>
      </div>

      {/* Quick Actions Grid */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 custom-scrollbar">
        {allQuickActions.map((action, index) => {
          const Icon = iconMap[action.icon] || HelpCircle
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedAction(action)}
              className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm transition-all duration-300 text-left"
            >
              <div className="relative flex items-center justify-center w-11 h-11 rounded-lg bg-gray-100 group-hover:bg-primary-dark transition-all duration-300 shrink-0">
                <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 transition-colors mb-0.5">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500 line-clamp-1 leading-relaxed">
                  {action.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
            </motion.button>
          )
        })}
      </div>

      {/* Quick Action Modal */}
      <QuickActionModal
        isOpen={!!selectedAction}
        onClose={() => setSelectedAction(null)}
        title={selectedAction?.title || ""}
        description={selectedAction?.description || ""}
        content={selectedAction?.content || {}}
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e9d5ff;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #c084fc;
        }
      `}</style>
    </div>
  )
}