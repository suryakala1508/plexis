// dashboardTourSteps.js - Driver.js Tour Steps for Dashboard

export const dashboardTourSteps = [
  {
    element: "#dashboard-header-section",
    popover: {
      title: "📊 Dashboard Overview",
      description: `
        Welcome to your <strong>Dashboard</strong>! This is your command center where you can see 
        all your key metrics, project statistics, recent activities, and quick actions at a glance.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#dashboard-stats-grid",
    popover: {
      title: "📈 Key Metrics Cards",
      description: `
        These cards show your most important metrics: <strong>Total Leads</strong>, 
        <strong>Total Projects</strong>, <strong>Total Clients</strong>, and <strong>Revenue</strong>. 
        Click on any card to view detailed trends and analytics.
      `,
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#dashboard-count-graph",
    popover: {
      title: "📊 Count Graph",
      description: `
        This graph displays trends for your <strong>Leads</strong>, <strong>Projects</strong>, 
        or <strong>Clients</strong> based on which card you click above. You can filter by 
        week, month, or year to see different time ranges.
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: "#dashboard-project-types-section",
    popover: {
      title: "📋 Project Types Distribution",
      description: `
        This pie chart shows the distribution of your projects by type. 
        You can see how many projects fall into each category and filter by time range.
      `,
      side: "left",
      align: "center",
    },
  },
  {
    element: "#dashboard-recent-activities",
    popover: {
      title: "🕐 Recent Activities",
      description: `
        Stay updated with your <strong>Recent Activities</strong>. This section shows 
        the latest actions across leads, projects, expenses, crew, inventory, and clients. 
        Click any activity to navigate directly to that item.
      `,
      side: "left",
      align: "start",
    },
  },
  {
    element: "#dashboard-quick-actions",
    popover: {
      title: "⚡ Quick Actions",
      description: `
        Use these <strong>Quick Actions</strong> to quickly create new leads, projects, 
        or add expenses without navigating away from the dashboard. Everything you need 
        is just one click away!
      `,
      side: "left",
      align: "start",
    },
  },
];

export default dashboardTourSteps;
