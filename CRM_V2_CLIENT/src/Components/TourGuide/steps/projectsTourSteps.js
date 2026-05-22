/**
 * PROJECTS PAGE TOUR STEPS
 * 
 * Guide for the Projects page.
 */

export const projectsTourSteps = [
  {
    element: "#projects-header",
    popover: {
      title: "🚀 Projects Hub",
      description: "Welcome to your Projects Dashboard! Here you can oversee all your creative works in one place.",
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#projects-add-btn",
    popover: {
      title: "✨ Create New Project",
      description: "Ready to start something new? Click here to kick off a new project and assign it to a client.",
      side: "left",
      align: "center"
    }
  },
  {
    element: "#projects-filter-search",
    popover: {
      title: "🔍 Search & Filter",
      description: "Find exactly what you need. Search by title or client, and filter projects by their current status (In Progress, Completed, etc.).",
      side: "bottom",
      align: "center"
    }
  },
  {
    element: "#projects-list",
    popover: {
      title: "📂 Project List",
      description: "Browse your projects here. Click on any project card to view its full details, timeline, and gallery.",
      side: "top",
      align: "center"
    }
  },
  {
    element: "#project-item-0",
    popover: {
      title: "📂 Detailed Project View",
      description: "Click on a project to see the magic happen! We'll take you to the project details page to show you more.",
      side: "right",
      align: "center"
    }
  }
];

export const projectDetailTourSteps = [
  {
    element: "#project-header-section",
    popover: {
      title: "📋 Project Overview",
      description: `
        Your <strong>Project Header</strong> — view <strong>title</strong>, <strong>status</strong>,
        <strong>budget</strong>, <strong>dates</strong>, and <strong>client info</strong> at a glance. Hit <strong>Edit</strong> to update.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#project-timeline-section",
    popover: {
      title: "⏱️ Progress Timeline",
      description: `
        <strong>Add, edit, or delete</strong> timeline entries to document project progress
        and keep your client and team <strong>aligned at all times</strong>.
      `,
      side: "top",
      align: "center",
    },
  },
  {
    element: "#project-equipment-section",
    popover: {
      title: "🎥 Equipment",
      description: `
        Manage <strong>equipment assigned</strong> to this project. Use <strong>Add / Edit</strong>
        to assign gear from inventory, and <strong>Release</strong> to return it when done.
      `,
      side: "left",
      align: "center",
    },
  },
  {
    element: "#project-crew-section",
    popover: {
      title: "👥 Crew Management",
      description: `
        View and manage <strong>crew members</strong> for this project. Use the
        <strong>WhatsApp icon</strong> to contact them directly.
      `,
      side: "right",
      align: "center",
    },
  },
  {
    element: "#project-inhouse-crew-section",
    popover: {
      title: "🗂️ InHouse Crew Timeline",
      description: `
        Assign internal <strong>tasks</strong> to crew with a <strong>due date</strong> and
        <strong>status</strong> (Pending, In Progress, Review, Completed). Edit or delete as needed.
      `,
      side: "left",
      align: "center",
    },
  },
  {
    element: "#project-quotation-section",
    popover: {
      title: "📄 Project Quotation",
      description: `
        View the <strong>quotation PDF</strong> linked to this project. It's <strong>auto-linked</strong>
        when the project is converted from a lead.
      `,
      side: "right",
      align: "center",
    },
  },
  {
    element: "#project-service-contract-section",
    popover: {
      title: "📜 Service Contract",
      description: `
        View the <strong>service contract</strong> inline. Create it from the <strong>Lead page</strong>
        and it will <strong>auto-link</strong> here.
      `,
      side: "left",
      align: "center",
    },
  },
  {
    element: "#project-budget-expenses-section",
    popover: {
      title: "💰 Budget & Expenses",
      description: `
        Track <strong>budget</strong>, <strong>payments</strong>, <strong>expenses</strong>, and
        <strong>remaining balance</strong> — all in one place. Add expenses or set up payment schedules here.
      `,
      side: "top",
      align: "center",
    },
  },
];
