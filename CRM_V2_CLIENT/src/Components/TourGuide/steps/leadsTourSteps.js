// leadsTourSteps.js - Driver.js Tour Steps for Leads

export const leadsTourSteps = [
  {
    element: "#leads-header-section",
    popover: {
      title: "📋 Leads",
      description: `
        Welcome to your <strong>Leads</strong> page. Here you can view, filter, and manage 
        all your inquiries and potential clients in one place.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#leads-action-bar",
    popover: {
      title: "🔧 Filters & Actions",
      description: `
        Use these filters to narrow down by <strong>Status</strong>, <strong>Date range</strong>, 
        and <strong>Source</strong>. You can also manage columns, export to CSV, and create new leads.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#leads-create-button",
    popover: {
      title: "➕ Create Lead",
      description: `
        Click here to add a new <strong>Lead</strong>. You can capture name, contact, 
        event details, budget, and notes in one form.
      `,
      side: "left",
      align: "center",
    },
  },
  {
    element: "#leads-search",
    popover: {
      title: "🔍 Search Leads",
      description: `
        Search by name, email, or company. Results update as you type so you can 
        find the right lead quickly.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#leads-view-toggle",
    popover: {
      title: "📊 List & Kanban",
      description: `
        Switch between <strong>List</strong> view (table) and <strong>Kanban</strong> view 
        (cards by status). Your choice is saved for next time.
      `,
      side: "left",
      align: "center",
    },
  },
  {
    element: "#leads-content",
    popover: {
      title: "📑 Your Leads",
      description: `
        Your leads appear here. Click a row (or card in Kanban) to open the lead 
        detail. Use pagination at the bottom to browse through pages.
      `,
      side: "top",
      align: "start",
    },
  },
];

export const leadDetailTourSteps = [
  {
    element: "#lead-header-section",
    popover: {
      title: "👤 Lead Overview",
      description: "Fast access to key lead details like Name, Status, Budget, and Event Date.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#lead-followup-section",
    popover: {
      title: "📞 Follow-ups",
      description: "Track calls, meetings, and tasks. Schedule reminders so you never miss a beat.",
      side: "top",
      align: "center"
    }
  },
  {
    element: "#lead-quotation-section",
    popover: {
      title: "📄 Quotations",
      description: "Create and manage quotations. You can generate PDFs or send them directly via email.",
      side: "top",
      align: "center"
    }
  },
  {
    element: "#lead-contract-section",
    popover: {
      title: "📜 Contracts",
      description: "Manage contracts and agreements here. Keep track of signed documents.",
      side: "top",
      align: "center"
    }
  },
];

