// crewTourSteps.js - Driver.js Tour Steps for Crew Management

export const crewTourSteps = [
  {
    element: "#crew-header-section",
    popover: {
      title: "👥 Team Management",
      description: `
        Manage your entire workforce from this central hub. View and organize both your internal 
        <strong>Crew</strong> and external <strong>Staff</strong> members.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#add-team-member-button",
    popover: {
      title: "➕ Add New Members",
      description: `
        Click here to invite new people to your team. You can add them as regular Crew or grant 
        them Staff access with specific roles.
      `,
      side: "left",
      align: "start",
    },
  },
  {
    element: "#crew-staff-tabs",
    popover: {
      title: "📑 Switch Views",
      description: `
        Toggle between your <strong>Crew Members</strong> (field workers) and 
        <strong>Staff</strong> (dashboard users) to manage their respective details.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#crew-search-filter",
    popover: {
      title: "🔍 Quick Search",
      description: `
        Easily find specific team members by searching for their name, email address, or job position.
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#crew-filter-dropdown",
    popover: {
      title: "⚡ Advanced Filters",
      description: `
        Refine your list by specific criteria like <strong>Job Position</strong> or 
        <strong>User Role</strong> to quickly find the right people.
      `,
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#crew-table",
    popover: {
      title: "📋 Member List",
      description: `
        View comprehensive details for each member, including their contact info, assigned projects noting, 
        and current status.
        <div style="margin-top: 12px; padding: 10px; background: rgba(255, 255, 255, 0.15); border-radius: 8px; font-size: 13px;">
          💡 <strong>Tip:</strong> Click on any row to view more details or edit member information.
        </div>
      `,
      side: "top",
      align: "center",
    },
  },
];

// Alternative version with more detailed descriptions if you want more guidance
export const crewTourStepsDetailed = [
  {
    element: "#crew-header-section",
    popover: {
      title: "👥 Welcome to Team Management",
      description: `
        <p style="margin-bottom: 8px;">
          This is your central hub for managing your entire workforce. Here you can:
        </p>
        <ul style="margin-left: 20px; margin-bottom: 8px; line-height: 1.6;">
          <li>View all team members at a glance</li>
          <li>Manage both <strong>Crew</strong> (field workers) and <strong>Staff</strong> (dashboard users)</li>
          <li>Track assignments and availability</li>
        </ul>
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#add-team-member-button",
    popover: {
      title: "➕ Add New Team Members",
      description: `
        <p style="margin-bottom: 8px;">
          Click this button to invite new people to your team. You can:
        </p>
        <ul style="margin-left: 20px; line-height: 1.6;">
          <li>Add regular <strong>Crew</strong> members for field work</li>
          <li>Grant <strong>Staff</strong> access with specific dashboard permissions</li>
          <li>Assign roles and positions during creation</li>
        </ul>
      `,
      side: "left",
      align: "start",
    },
  },

  {
    element: "#crew-search-filter",
    popover: {
      title: "🔍 Quick Search",
      description: `
        <p style="margin-bottom: 8px;">
          Use the search bar to instantly filter team members by:
        </p>
        <ul style="margin-left: 20px; line-height: 1.6;">
          <li>Name</li>
          <li>Email address</li>
          <li>Job position</li>
        </ul>
        <p style="margin-top: 8px; font-size: 13px; opacity: 0.9;">
          Search is real-time and case-insensitive.
        </p>
      `,
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#crew-filter-dropdown",
    popover: {
      title: "⚡ Advanced Filtering",
      description: `
        <p style="margin-bottom: 8px;">
          Narrow down your results using advanced filters:
        </p>
        <ul style="margin-left: 20px; line-height: 1.6;">
          <li><strong>Job Position:</strong> Filter by specific roles</li>
          <li><strong>User Role:</strong> Filter staff by their dashboard permissions</li>
        </ul>
        <p style="margin-top: 8px; font-size: 13px; opacity: 0.9;">
          Combine with search for precise results.
        </p>
      `,
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#crew-table",
    popover: {
      title: "📋 Your Team Directory",
      description: `
        <p style="margin-bottom: 8px;">
          This table displays all team members with their key information:
        </p>
        <ul style="margin-left: 20px; margin-bottom: 10px; line-height: 1.6;">
          <li>Contact details (name, email, phone)</li>
          <li>Current assignments and projects</li>
          <li>Availability status</li>
          <li>Role and permissions (for staff)</li>
        </ul>
        <div style="margin-top: 12px; padding: 12px; background: rgba(72, 187, 120, 0.15); border-left: 3px solid #48bb78; border-radius: 6px; font-size: 13px;">
          <strong>💡 Pro Tip:</strong> Click any row to open a detailed sidebar with complete member information, 
          assignment history, and quick actions.
        </div>
      `,
      side: "top",
      align: "center",
    },
  },
];

// Export both versions - use the one that fits your needs
export default crewTourSteps;