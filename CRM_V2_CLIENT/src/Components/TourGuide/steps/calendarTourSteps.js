
export const calendarTourSteps = [
    {
        element: '#calendar-header-title',
        popover: {
            title: '📅 Calendar',
            description: `
                Manage your <strong>schedule</strong>, <strong>events</strong>, and <strong>tasks</strong> here. 
                Keep track of all your upcoming activities in one place.
            `,
            side: "bottom",
            align: 'start'
        }
    },
    {
        element: '#calendar-add-event-btn',
        popover: {
            title: '➕ Add Event',
            description: `
                Click here to create a new <strong>Event</strong>, <strong>Meeting</strong>, or <strong>Task</strong>. 
                You can assign them to specific projects or leads properly.
            `,
            side: "bottom",
            align: 'start'
        }
    },
    {
        element: '#calendar-controls-bar',
        popover: {
            title: '🕹️ Calendar Controls',
            description: `
                Navigate through <strong>dates</strong> and switch between different views like 
                <strong>Month</strong>, <strong>Week</strong>, or <strong>Day</strong> to see what's important.
            `,
            side: "bottom",
            align: 'start'
        }
    },
    {
        element: '#calendar-month-view',
        popover: {
            title: '🗓️ Calendar View',
            description: `
                Currently viewing all events for the <strong>entire calendar</strong>. 
                Click on any event card to view more details.
            `,
            side: "center",
            align: 'center'
        }
    },
];
