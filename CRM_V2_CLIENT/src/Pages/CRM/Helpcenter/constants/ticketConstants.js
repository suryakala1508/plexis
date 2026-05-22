import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  XCircle
} from "lucide-react"


export const statusConfig = {
  under_review: {
    label: "Awaiting Review",
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    color: "bg-status-review/10 text-status-review border-status-review/30",
    iconString: "clock"
  },
  in_progress: {
    label: "In Progress",
    icon: Loader2,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    color: "bg-status-progress/10 text-status-progress border-status-progress/30",
    iconString: "loader"
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    color: "bg-status-resolved/10 text-status-resolved border-status-resolved/30",
    iconString: "check-circle"
  },
  needs_info: {
    label: "Needs Info",
    icon: AlertCircle,
    className: "bg-orange-50 text-orange-700 border-orange-200",
    color: "bg-status-needsInfo/10 text-status-needsInfo border-status-needsInfo/30",
    iconString: "alert-circle"
  },
  closed: {
    label: "Closed",
    icon: XCircle,
    className: "bg-gray-50 text-gray-700 border-gray-200",
    color: "bg-status-closed/10 text-status-closed border-status-closed/30",
    iconString: "x-circle"
  }
}

export const priorityConfig = {
  critical: {
    label: "Critical",
    className: "bg-red-50 text-red-700 border-red-200",
    color: "bg-priority-critical/10 text-priority-critical border-priority-critical/30"
  },
  high: {
    label: "High",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    color: "bg-priority-high/10 text-priority-high border-priority-high/30"
  },
  medium: {
    label: "Medium",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    color: "bg-priority-medium/10 text-priority-medium border-priority-medium/30"
  },
  low: {
    label: "Low",
    className: "bg-slate-50 text-slate-600 border-slate-200",
    color: "bg-priority-low/10 text-priority-low border-priority-low/30"
  }
}


export const statusMap = {
  open: "under_review",
  in_progress: "in_progress",
  resolved: "resolved",
  needs_info: "needs_info"
}


export const issueTypes = [
  {
    id: "login",
    label: "Login Issue",
    description: "Problems signing in or accessing your account",
    icon: "key",
    helperText:
      "If this is an OTP or password issue, a screenshot helps us resolve it faster.",
    descriptionPlaceholder: "Tell us what happens when you try to log in...",
    additionalFields: [
      {
        name: "affected_email",
        label: "Affected Email / Username",
        type: "email",
        placeholder: "Enter the email or username you use to log in",
        required: true
      }
    ],
    helpArticles: [
      {
        title: "Reset Your Password",
        description: "Step-by-step guide to recover your account",
        icon: "refresh-cw"
      },
      {
        title: "Known Login Outages",
        description: "Check if there are any ongoing issues",
        icon: "alert-circle"
      },
      {
        title: "Two-Factor Authentication Help",
        description: "Troubleshoot 2FA issues",
        icon: "shield"
      }
    ],
    attachmentHint: "Screenshots of error messages are especially helpful",
    defaultPriority: "high"
  },
  {
    id: "bug",
    label: "Bug Report",
    description: "Something isn't working as expected",
    icon: "bug",
    helperText:
      "The more details you provide, the faster we can fix the issue.",
    descriptionPlaceholder:
      "Describe what went wrong and what you expected to happen...",
    additionalFields: [
      {
        name: "steps_to_reproduce",
        label: "Steps to Reproduce",
        type: "textarea",
        placeholder: "1. Go to...\n2. Click on...\n3. See error",
        required: true
      },
      {
        name: "browser",
        label: "Browser / Device",
        type: "text",
        placeholder: "e.g., Chrome on Windows, Safari on iPhone"
      }
    ],
    helpArticles: [
      {
        title: "Clear Browser Cache",
        description: "Often fixes display issues",
        icon: "trash-2"
      },
      {
        title: "Supported Browsers",
        description: "Check if your browser is supported",
        icon: "globe"
      },
      {
        title: "Known Issues",
        description: "See issues we're already working on",
        icon: "list"
      }
    ],
    attachmentHint:
      "Screenshots, screen recordings, or console logs help a lot",
    defaultPriority: "high"
  },
  {
    id: "billing",
    label: "Billing Issue",
    description: "Questions about payments, invoices, or subscriptions",
    icon: "credit-card",
    helperText:
      "Never share your full card number. Transaction IDs are safe to share.",
    descriptionPlaceholder: "Describe the billing issue you're experiencing...",
    additionalFields: [
      {
        name: "transaction_id",
        label: "Transaction ID",
        type: "text",
        placeholder: "e.g., TXN-12345678"
      },
      {
        name: "billing_email",
        label: "Billing Email",
        type: "email",
        placeholder: "Email associated with your billing",
        required: true
      }
    ],
    helpArticles: [
      {
        title: "View Your Invoices",
        description: "Access all past invoices",
        icon: "file-text"
      },
      {
        title: "Update Payment Method",
        description: "Change your card or billing info",
        icon: "credit-card"
      },
      {
        title: "Cancel Subscription",
        description: "How to manage your plan",
        icon: "x-circle"
      }
    ],
    attachmentHint: "Attach invoice screenshots or receipts if relevant",
    defaultPriority: "high"
  },
  {
    id: "feature",
    label: "Feature Request",
    description: "Suggest a new feature or improvement",
    icon: "lightbulb",
    helperText: "We love hearing your ideas! The more context, the better.",
    descriptionPlaceholder: "Describe the feature you'd like to see...",
    additionalFields: [
      {
        name: "expected_outcome",
        label: "Expected Outcome",
        type: "textarea",
        placeholder: "What would this feature help you accomplish?",
        required: true
      },
      {
        name: "use_case",
        label: "Use Case",
        type: "text",
        placeholder: "How would you use this feature?"
      }
    ],
    helpArticles: [
      {
        title: "Product Roadmap",
        description: "See what's coming next",
        icon: "map"
      },
      {
        title: "Vote on Features",
        description: "Support features you want",
        icon: "thumbs-up"
      },
      {
        title: "Community Forum",
        description: "Discuss ideas with others",
        icon: "users"
      }
    ],
    attachmentHint: "Mockups or examples are welcome",
    defaultPriority: "low"
  },
  {
    id: "account",
    label: "Account & Settings",
    description: "Profile changes, security, or account management",
    icon: "user",
    helperText: "For security changes, we may ask for additional verification.",
    descriptionPlaceholder: "What would you like to change or update?",
    additionalFields: [
      {
        name: "account_email",
        label: "Account Email",
        type: "email",
        placeholder: "Email associated with your account",
        required: true
      }
    ],
    helpArticles: [
      {
        title: "Update Profile",
        description: "Change name, email, or photo",
        icon: "edit"
      },
      {
        title: "Security Settings",
        description: "Manage passwords and 2FA",
        icon: "lock"
      },
      {
        title: "Delete Account",
        description: "Request account deletion",
        icon: "trash"
      }
    ],
    attachmentHint: "Screenshots of settings pages can help",
    defaultPriority: "medium"
  },
  {
    id: "other",
    label: "Other",
    description: "Something else not listed above",
    icon: "help-circle",
    helperText: "We're here to help with anything!",
    descriptionPlaceholder: "Please describe your issue or question...",
    additionalFields: [],
    helpArticles: [
      {
        title: "Getting Started Guide",
        description: "New to Plexis? Start here",
        icon: "book-open"
      },
      {
        title: "FAQ",
        description: "Common questions answered",
        icon: "help-circle"
      },
      {
        title: "Contact Sales",
        description: "For enterprise inquiries",
        icon: "briefcase"
      }
    ],
    attachmentHint: "Any relevant files or screenshots",
    defaultPriority: "medium"
  }
]

/**
 * Get issue type by ID
 * @param {string} id - Issue type ID
 * @returns {Object|undefined} Issue type configuration
 */
export const getIssueTypeById = id => {
  return issueTypes.find(type => type.id === id)
}
