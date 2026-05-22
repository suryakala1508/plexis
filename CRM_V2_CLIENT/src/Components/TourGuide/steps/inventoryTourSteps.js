/**
 * INVENTORY PAGE TOUR STEPS
 * 
 * Guide for the Inventory page.
 */

export const inventoryTourSteps = [
  {
    element: "#inventory-page-header",
    popover: {
      title: "📦 Inventory Management",
      description: `
        Welcome to your <strong>Inventory!</strong> Use this page to track all your 
        <strong>Equipment</strong>,  and <strong>Assets</strong> meticulously.
      `,
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#add-item-button",
    popover: {
      title: "➕ Add New Item",
      description: `
        Click here to add <strong>New Equipment</strong> to your inventory. 
        You can categorize them, set quantities/
      `,
      side: "left",
      align: "center"
    }
  },
  {
    element: "#inventory-search-input",
    popover: {
      title: "🔍 Search Items",
      description: `
        Quickly find items by <strong>Name</strong>. Just type keywords to filter the list 
        instantly and check availability.
      `,
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#category-filter",
    popover: {
      title: "⚡ Filters",
      description: `
        Advanced filtering options! Click here to filter items by <strong>Category</strong> 
        or check their <strong>Availability Status</strong>.
      `,
      side: "bottom",
      align: "end"
    }
  },
  {
    element: "#inventory-table",
    popover: {
      title: "📋 Inventory List",
      description: `
        This table shows all your items. See what's <strong>Available</strong>, 
        what's <strong>Assigned to Projects</strong>, and manage quantities.
      `,
      side: "top",
      align: "center"
    }
  }
];