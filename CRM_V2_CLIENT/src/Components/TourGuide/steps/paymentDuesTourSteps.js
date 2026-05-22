// paymentDuesTourSteps.js - Driver.js Tour Steps for Payment Dues

export const paymentDuesTourSteps = [
  {
    element: "#payment-dues-header",
    popover: {
      title: "💰 Payment Dues",
      description: `
        Welcome to <strong>Payment Dues</strong>. This page gives you a real-time view 
        of all outstanding and upcoming payments across every project.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#payment-dues-stats",
    popover: {
      title: "📊 At a Glance",
      description: `
        These cards summarise your <strong>Total Outstanding</strong> amount, 
        the number of <strong>Overdue</strong> entries, and how many are still 
        <strong>Pending</strong> but not past their due date.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#payment-dues-filters",
    popover: {
      title: "🔧 Filters",
      description: `
        Narrow down dues by <strong>Project</strong>, <strong>Date Range</strong>, 
        or <strong>Status</strong>. Tick <em>Crossed Due Only</em> to instantly 
        surface everything that's past its deadline. Use <strong>Clear Filters</strong> 
        to reset the view.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#payment-dues-table",
    popover: {
      title: "📋 Dues Table",
      description: `
        Every unpaid payment schedule appears here. Rows highlighted in 
        <strong style="color:#7c3aed">purple</strong> are <em>Remaining Payment</em> entries — 
        amounts from a project's total budget that haven't been scheduled yet.
        Click <strong>View Project</strong> on any row to jump straight to that project.
      `,
      side: "top",
      align: "start",
    },
  },
];
