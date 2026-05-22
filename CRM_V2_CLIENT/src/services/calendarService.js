import { get, post } from "./api";
import Holidays from "date-holidays";
import { getTeluguFestivals } from "./teluguFestivals";


/**
 * Calendar/Events Service
 * Handles all calendar and event-related API calls
 * Backend returns both calenderEvents (standalone) and events (project-related)
 */

const hd = new Holidays("IN"); // Default to India

/**
 * Get holidays for a specific year
 * @param {number} year 
 * @returns {Array} List of holiday events
 */
const getHolidays = (year) => {
  const holidays = hd.getHolidays(year);
  return holidays.map(h => ({
    id: `holiday-${h.date}-${h.name}`,
    title: h.name,
    start: h.start,
    end: h.end,
    type: "holiday",
    color: "orange", // Unified orange for all holidays
    description: h.type + " holiday",
    allDay: true
  }));
};


/**
 * Get all events for the user (both calendar events, project events, and follow-ups)
 * @returns {Promise<Object>} Object with events array and followUps array
 */
export const getAllEvents = async () => {
  try {
    const response = await get("/events/calendar/");

    // Backend returns { success: true, calenderEvents: [...], events: [...], followUps: [...] }
    // Handle case where response might be wrapped
    const data =
      response.success !== undefined
        ? response
        : { success: true, ...response };

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch events");
    }

    // Merge both types and normalize the structure
    const calendarEvents = (data.calenderEvents || []).map((event) => ({
      ...event,
      id: event._id || event.id,
      _id: event._id || event.id,
      type: "calendar", // Tag as calendar event
      color: event.color || "blue",
      location: event.location || "",
      attendees: event.attendees || 0,
    }));
    const projectEvents = (data.events || []).map((event) => ({
      id: event._id || event.id,
      _id: event._id || event.id,
      title: event.projectTitle,
      start: event.startDate,
      end: event.endDate || event.startDate,
      description: event.projectDescription || event.description || "",
      location: event.location || "",
      clientName: event.clientName,
      projectId: event.Project || event.projectId,
      type: "project", // Tag as project event
      color: "green", // Default color for project events
    }));

    // Normalize follow-ups to event-like structure for calendar display
    const followUpEvents = (data.followUps || []).map((followUp) => {
      const startDate = new Date(followUp.date);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

      // Handle populated leadId or clientId
      const leadObj = followUp.leadId && typeof followUp.leadId === 'object' ? followUp.leadId : null;
      const clientObj = followUp.clientId && typeof followUp.clientId === 'object' ? followUp.clientId : null;

      const targetId = leadObj ? (leadObj._id || leadObj.id) : (clientObj ? (clientObj._id || clientObj.id) : (followUp.leadId || followUp.clientId));
      const targetName = leadObj ? leadObj.name : (clientObj ? clientObj.clientName : (followUp.leadName || "Unknown"));

      return {
        id: followUp._id || followUp.id,
        _id: followUp._id || followUp.id,
        title: `Follow-up: ${targetName} (${followUp.reason})`,
        start: startDate.toISOString(),
        end: endDate.toISOString(), // +1 hour
        reason: followUp.reason,
        description: followUp.notes || "",
        type: "followup",
        status: followUp.status || "pending",
        leadId: leadObj ? targetId : null,
        clientId: clientObj ? targetId : null,
        leadName: targetName,
        followUpId: followUp._id || followUp.id,
        color: followUp.status === "completed" ? "green" : "orange",
      };
    });

    // Add holidays for current, previous and next year to cover edges
    const currentYear = new Date().getFullYear();
    const holidays = [
      ...getHolidays(currentYear - 1),
      ...getHolidays(currentYear),
      ...getHolidays(currentYear + 1)
    ];

    const teluguHolidays = [
      ...getTeluguFestivals(currentYear - 1),
      ...getTeluguFestivals(currentYear),
      ...getTeluguFestivals(currentYear + 1)
    ];

    return {
      events: [...calendarEvents, ...projectEvents, ...followUpEvents, ...holidays, ...teluguHolidays],
    };

  } catch (error) {
    console.error("Error fetching events:", error);
    // Return empty arrays on error to prevent UI breakage
    return {
      events: [],
      followUps: [],
    };
  }
};

/**
 * Get events within a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of events (filtered client-side)
 */
export const getEventsByDateRange = async (startDate, endDate) => {
  const { events } = await getAllEvents();

  // Filter events by date range client-side
  return events.filter((event) => {
    const eventStart = new Date(event.start);
    return eventStart >= startDate && eventStart <= endDate;
  });
};

/**
 * Create a new calendar event
 * @param {Object} eventData - Event data
 * @param {string} eventData.title - Event title
 * @param {Date} eventData.start - Start date/time
 * @param {Date} eventData.end - End date/time
 * @param {string} eventData.color - Event color
 * @param {string} eventData.description - Event description
 * @param {string} eventData.location - Event location
 * @param {number} eventData.attendees - Number of attendees
 * @returns {Promise<Object>} Created event
 */


export const createEvent = async (eventData) => {
  try {
    // Convert Date objects to local ISO strings (preserves local time without UTC conversion)
    const payload = {
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      color: eventData.color || "blue",
      description: eventData.description || "",
      location: eventData.location || "",
      attendees: eventData.attendees || 0,
      eventType: eventData.eventType || "",
    };
    const response = await post("/events/calendar/addCalendarEvent", payload);
    // Backend returns the created event directly, normalize it
    return {
      ...response,
      id: response._id || response.id,
      type: "calendar",
    };
  } catch (error) {
    console.error("Error creating event:", error);
    throw new Error(error.message || "Failed to create event");
  }
};

/**
 * Update an existing calendar event
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Updated event data
 * @returns {Promise<Object>} Updated event
 */
export const updateEvent = async (eventId, eventData) => {
  try {
    // Convert Date objects to local ISO strings (preserves local time without UTC conversion)
    const payload = {
      title: eventData.title,
      start: eventData.start,
      end: eventData.end,
      color: eventData.color || "blue",
      description: eventData.description || "",
      location: eventData.location || "",
      attendees: eventData.attendees || 0,
      eventType: eventData.eventType || "",
    };
    const response = await post(
      `/events/calendar/updateCalendarEvent/${eventId}`,
      payload
    );
    // Backend returns the updated event directly, normalize it
    return {
      ...response,
      id: response._id || response.id || eventId,
      type: "calendar",
    };
  } catch (error) {
    console.error("Error updating event:", error);
    throw new Error(error.message || "Failed to update event");
  }
};

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Success response
 */
export const deleteEvent = async (eventId) => {
  try {
    const response = await post(
      `/events/calendar/deleteCalendarEvent/${eventId}`
    );
    return response;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw new Error(error.message || "Failed to delete event");
  }
};

/**
 * Get a single event by ID (searches calendar, project events, and follow-ups)
 * @param {string} eventId - Event ID
 * @returns {Promise<Object>} Event data
 */
export const getEventById = async (eventId) => {
  const { events } = await getAllEvents();
  const event = events.find((e) => e._id === eventId || e.id === eventId);

  if (!event) {
    throw new Error("Event not found");
  }

  return event;
};
