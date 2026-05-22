/**
 * Client Module Constants
 */

export const CLIENT_STATUS = {
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
} as const;

export const CLIENT_CONSTANTS = {
  DEFAULT_STATUS: CLIENT_STATUS.ONGOING,
  RESERVED_IDS: ["stats"],
  DEFAULT_STUDIO_NAME: "Studio",
  WELCOME_EMAIL_SUBJECT: "New Client Added",
  DASHBOARD_PATH: "/dashboard",
  MIN_FUZZY_NAME_LENGTH: 2,
};

export const TIME_CONSTANTS = {
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH_VIEW: 28,
  HOURS_IN_DAY: 23,
  MINUTES_IN_HOUR: 59,
  SECONDS_IN_MINUTE: 59,
  MILLISECONDS_IN_SECOND: 999,
};

export const DATE_CONSTANTS = {
  DAY_NAMES: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  MONTH_NAMES: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
};
