/**
 * CLIENTS PAGE TOUR STEPS
 * 
 * Guide for the Clients page.
 */

export const clientsTourSteps = [
  {
    element: "#clients-header",
    popover: {
      title: "👥 Client Management",
      description: `
        This is your central database for all <strong>Client Relationships</strong>. 
        Keep track of contacts, status, and project history in one place.
      `,
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#clients-add-btn",
    popover: {
      title: "👤 Add New Client",
      description: `
        Onboard a <strong>New Client</strong> here. You can capture their details 
        and immediately link them to a project or lead.
      `,
      side: "left",
      align: "center"
    }
  },
  {
    element: "#clients-filter-search",
    popover: {
      title: "🔍 Find Clients",
      description: `
        Use the <strong>Search Bar</strong> and <strong>Filters</strong> here to quickly 
        locate specific clients or sort them by their current status.
      `,
      side: "bottom",
      align: "center"
    }
  },
  {
    element: "#clients-list",
    popover: {
      title: "📋 Client Directory",
      description: `
        View your full <strong>Client List</strong> here. Click on any row to open 
        the sidebar for more details and manage their information.
      `,
      side: "top",
      align: "center"
    }
  }
];
