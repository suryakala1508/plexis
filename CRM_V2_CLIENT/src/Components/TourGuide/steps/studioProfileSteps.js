/**
 * STUDIO PROFILE TOUR STEPS
 * 
 * Guide for the Studio Profile page.
 */

export const studioProfileSteps = [
  {
    element: "#studio-profile-header",
    popover: {
      title: "🏠 Studio Profile",
      description: `
        Welcome to your configured <strong>Studio Profile!</strong> Here you can view and 
        manage all your studio's essential information.
      `,
      side: "bottom",
      align: "start"
    }
  },
  {
    element: "#studio-profile-edit-btn",
    popover: {
      title: "✏️ Edit Profile",
      description: `
        Click here to update your <strong>Personal Info</strong>, <strong>Studio Details</strong>, 
        or manage your portfolio images comfortably.
      `,
      side: "left",
      align: "center"
    }
  },
  {
    element: "#studio-profile-personal-info",
    popover: {
        title: "👤 Personal Information",
        description: `
            Review your <strong>Personal Contact Details</strong> here. Keeping this up-to-date 
            ensures we can reach you for important notifications.
        `,
        side: "top",
        align: "start"
    }
  },
  {
    element: "#studio-profile-storage",
    popover: {
        title: "☁️ Storage & Plan",
        description: `
            Monitor your <strong>Storage Usage</strong> and current plan status. 
            You can request an upgrade here if you need more space.
        `,
        side: "left",
        align: "start"
    }
  },
  {
    element: "#studio-profile-details",
    popover: {
        title: "🏢 Studio Details",
        description: `
            This section contains your public-facing studio information like 
            <strong>Name</strong>, <strong>Tagline</strong>, and <strong>Logo</strong>.
        `,
        side: "top",
        align: "start"
    }
  },
  {
    element: "#studio-profile-gallery",
    popover: {
        title: "🖼️ Portfolio Gallery",
        description: `
            Showcase your best work! Add <strong>High-Quality Images</strong> here to 
            impress potential clients who visit your profile.
        `,
        side: "top",
        align: "start"
    }
  },
  {
    element: "#studio-profile-delete",
    popover: {
        title: "⚠️ Danger Zone",
        description: `
            If you ever need to leave, you can <strong>Delete Your Account</strong> here. 
            Please note this action is permanent.
        `,
        side: "top",
        align: "start"
    }
  }
];
