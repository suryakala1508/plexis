export const expensesTourSteps = [
  {
    element: '#expenses-header',
    popover: {
      title: '💰 All Expenses',
      description: `
        View and manage every <strong>Transaction</strong> in detail. 
        Keep your studio's spending organized and tracked.
      `,
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '#expenses-controls',
    popover: {
      title: '🔍 Filters & Export',
      description: `
        <strong>Search</strong>, <strong>Filter</strong> by category or date, and 
        <strong>Export</strong> your data to CSV for external analysis.
      `,
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '#add-expense-btn',
    popover: {
      title: '➕ Add Expense',
      description: `
        Record a <strong>New Expense</strong> manually here. 
        Capture receipts and categorize immediately.
      `,
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '#expenses-table',
    popover: {
      title: '📋 Expense List',
      description: `
        Review your full <strong>Expense List</strong>. You can 
        <strong>Edit</strong> or <strong>Delete</strong> entries directly from this table.
      `,
      side: 'top',
      align: 'center'
    }
  }
];
