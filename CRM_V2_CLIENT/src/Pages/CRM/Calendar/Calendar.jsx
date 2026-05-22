import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { CalendarHeader } from './CalendarHeader'
import { CalendarControls } from './CalendarControls'
import { EventModal } from './EventModal'
import { EventCard } from './EventCard'
import { Clock, Calendar as CalendarIcon, Briefcase, MessageSquare, Sparkles } from 'lucide-react'
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../../../services/calendarService'
import { Success } from '../../../Components/Success'
import { Error } from '../../../Components/Error'
import { useNavigate, useLocation } from 'react-router-dom'
import { EventCountBadge } from '@/Components/EventCountBadge'
import { useCalendar } from '../../../contexts/CalendarContext'
import { TourGuide } from '../../../Components/TourGuide/TourGuide'
import { calendarTourSteps } from '../../../Components/TourGuide/steps/calendarTourSteps'
import { canEdit } from "@/Pages/utils/permissions";
import { useSession } from "@/contexts/SessionContext";
import { DeleteConfirmationModal } from '../../../Components/DeleteConfirmationModal';



export const Calendar = () => {
  const { session } = useSession();
  const location = useLocation();
  const editCalendar = canEdit(session, "2", "2_1"); // your calendar ids
  const [viewMode, setViewMode] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const startTourRef = React.useRef(null)

  const handleViewModeChange = (mode) => {
    setViewMode(mode);

    // Dispatch event to advance tour
    // We use a timeout to let the new view render
    // Increasing timeout slightly to be safe, relying on React's render cycle
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('plexis-tour-next'));
    }, 400);
  };


  // Use global calendar context
  const { events, loading, fetchEvents } = useCalendar();

  const [tooltipEvent, setTooltipEvent] = useState(null)
  const [allDayExpanded, setAllDayExpanded] = useState(false);

  const navigate = useNavigate();

  // Fetch events on mount and handle navigation state
  useEffect(() => {
    fetchEvents()
    
    // Handle navigation from Dashboard or other pages
    if (location.state?.view && location.state?.date) {
      setViewMode(location.state.view);
      const targetDate = new Date(location.state.date);
      setCurrentDate(targetDate);
      setSelectedDate(targetDate);
      
      // Clear state to prevent re-opening on back/forward
      const newState = { ...location.state };
      delete newState.view;
      delete newState.date;
      navigate(location.pathname, { replace: true, state: newState });
    }
  }, [location.state, fetchEvents, navigate, location.pathname])

  // CRUD Operations
  const handleCreateEvent = async (eventData) => {
    try {
      const newEvent = await createEvent(eventData)
      await fetchEvents() // Refresh events list
      toast.success('Event created successfully!')

    } catch (error) {
      console.error('Error creating event:', error)
      setErrorMessage('Failed to create event')
    }
  }

  const handleUpdateEvent = async (eventData) => {
    try {
      await updateEvent(eventData._id || eventData.id, eventData)
      await fetchEvents() // Refresh events list
      toast.success('Event updated successfully!')
    } catch (error) {
      console.error('Error updating event:', error)
      setErrorMessage('Failed to update event')
    }
  }

  const handleDeleteEvent = (eventId) => {
    const event = events.find(e => (e.id || e._id || e.followUpId) === eventId);
    setEventToDelete(event);
    setDeleteModalOpen(true);
  }

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    const eventId = eventToDelete.id || eventToDelete._id || eventToDelete.followUpId;
    setIsDeleting(true);
    try {
      await deleteEvent(eventId)
      await fetchEvents() // Refresh events list
      toast.success('Event deleted successfully!')
      setDeleteModalOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event')
    } finally {
      setIsDeleting(false);
    }
  }

  const handleSaveEvent = (eventData) => {
    if (editingEvent) {
      handleUpdateEvent(eventData)
    } else {
      handleCreateEvent(eventData)
    }
    handleCloseModal()
  }

  const handleEditEvent = (event) => {
    // For follow-up and project events, handle navigation or view change
    if (!editCalendar) return;  // 🔥 BLOCK VIEWERS

    // Prevent editing holidays
    if (event.type === 'holiday') return;

    if (event.type === 'followup') {
      if (event.clientId) {
        // Navigate to clients page and pass the client ID to auto-select
        navigate('/clients', { state: { selectedClientId: event.clientId } });
        return;
      } else if (event.leadId) {
        // Navigate to lead detail page
        navigate(`/leads/${event.leadId}`);
        return;
      }
    }

    if (event.type === 'project') {
      const eventDate = new Date(event.start);
      setCurrentDate(eventDate);
      setSelectedDate(eventDate);
      setViewMode('day');
      return;
    }

    // For calendar events, open the edit modal
    setEditingEvent(event);
    setShowEventModal(true);
  }

  const handleCloseModal = () => {
    setShowEventModal(false)
    setEditingEvent(null)
    setSelectedTimeSlot(null)
  }


  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === date.toDateString()
    }).sort((a, b) => {
      const dateA = new Date(a.start)
      const dateB = new Date(b.start)
      return dateA - dateB
    })
  }

  const getEventsOverlappingDate = (date) => {
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    return events.filter(event => {
      const eventStart = new Date(event.start)
      const eventEnd = event.end ? new Date(event.end) : new Date(eventStart.getTime() + 60 * 60 * 1000)

      return eventStart <= dateEnd && eventEnd >= dateStart
    }).sort((a, b) => {
      const dateA = new Date(a.start)
      const dateB = new Date(b.start)
      return dateA - dateB
    })
  }
  const handleClick = (event) => {
    if (event.clientId) {
      navigate('/clients', { state: { selectedClientId: event.clientId } });
    } else if (event.leadId) {
      navigate(`/leads/${event.leadId}`);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDateRange = (start, end) => {
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (date) => {
    if (!selectedDate) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  // Navigation
  const goToPrevious = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setDate(1)
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setDate(newDate.getDate() - 1)
    }
    setCurrentDate(newDate)
  }

  // Add this function before renderWeekView
  const isMultiDayEvent = (event) => {
    const start = new Date(event.start)
    const end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000)

    const startDay = new Date(start)
    startDay.setHours(0, 0, 0, 0)
    const endDay = new Date(end)
    endDay.setHours(0, 0, 0, 0)

    return endDay > startDay
  }

  const isAllDayEvent = (event) => {
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);

    // Calculate duration in hours
    const durationHours = (end - start) / (1000 * 60 * 60);

    // Consider all-day if:
    // 1. Starts at midnight (00:00) and ends at midnight on a different day
    const startAtMidnight = start.getHours() === 0 && start.getMinutes() === 0;
    const endAtMidnight = end.getHours() === 0 && end.getMinutes() === 0;

    if (startAtMidnight && endAtMidnight && end > start) return true;

    // 2. Duration is 24 hours or more (full day or multi-day)
    if (durationHours >= 24) return true;

    return false;
  };
  // Check if event continues from previous day
  const continuesFromPrevious = (event, currentDate) => {
    const eventStart = new Date(event.start);
    const dayStart = new Date(currentDate);
    dayStart.setHours(0, 0, 0, 0);

    return eventStart < dayStart;
  };

  // Check if event continues to next day
  const continuesToNext = (event, currentDate) => {
    const eventEnd = event.end ? new Date(event.end) : new Date(event.start);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    return eventEnd > dayEnd;
  };
  const goToNext = () => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setDate(1)
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (date) => {
    setCurrentDate(date)
    setSelectedDate(date)
    setViewMode('day') // Switch to day view
  }

  const handleTimeSlotClick = (date, hour) => {
    // Create date using local time to avoid timezone conversion issues
    if (!editCalendar) return;   // 🔥 BLOCK VIEWERS
    const slotDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      0,
      0,
      0
    )
    setSelectedTimeSlot(slotDate)
    setShowEventModal(true)
  }

  const getColorClasses = (color, includeBorder = true) => {
    const colors = {
      blue: includeBorder
        ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
        : 'bg-blue-100 text-blue-800',
      purple: includeBorder
        ? 'bg-purple-100 text-purple-800 border-l-4 border-purple-500'
        : 'bg-purple-100 text-purple-800',
      green: includeBorder
        ? 'bg-green-100 text-green-800 border-l-4 border-green-500'
        : 'bg-green-100 text-green-800',
      orange: includeBorder
        ? 'bg-orange-100 text-orange-800 border-l-4 border-orange-500'
        : 'bg-orange-100 text-orange-800',
      red: includeBorder
        ? 'bg-red-100 text-red-800 border-l-4 border-red-500'
        : 'bg-red-100 text-red-800',
      indigo: includeBorder
        ? 'bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500'
        : 'bg-indigo-100 text-indigo-800',
      pink: includeBorder
        ? 'bg-pink-100 text-pink-800 border-l-4 border-pink-500'
        : 'bg-pink-100 text-pink-800',
      yellow: includeBorder
        ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500'
        : 'bg-yellow-100 text-yellow-800'
    }
    return colors[color] || colors.blue
  }

  const getViewTitle = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      startOfWeek.setDate(startOfWeek.getDate() - day)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)


      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  }


  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const maxVisibleEvents = 4; // Show max 4 events per day

    // Helper to check if this is the first day of the event in the month view
    const isFirstDayInView = (event, date) => {
      const eventStart = new Date(event.start);
      eventStart.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);

      // It's the first day if the event starts on this date
      if (eventStart.getTime() === checkDate.getTime()) return true;

      // Or if the event started before the month and this is day 1
      if (checkDate.getDate() === 1 && eventStart < checkDate) return true;

      // Or if this is Sunday (start of week) and event started before
      if (checkDate.getDay() === 0 && eventStart < checkDate) return true;

      return false;
    };

    // Calculate how many days to span from current date (respecting week boundaries)
    const getSpanDaysFromDate = (event, currentDate) => {
      const eventStart = new Date(event.start);
      const eventEnd = event.end ? new Date(event.end) : new Date(event.start);

      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(0, 0, 0, 0);

      const current = new Date(currentDate);
      current.setHours(0, 0, 0, 0);

      // Calculate days from current to end
      const diffTime = eventEnd - current;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Limit to remaining days in the week (Saturday is end of week)
      const dayOfWeek = current.getDay();
      const daysLeftInWeek = 6 - dayOfWeek + 1; // Until Saturday

      return Math.min(diffDays, daysLeftInWeek);
    };

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[130px] bg-gray-50 border border-gray-200"
        ></div>
      );
    }

    // Generate calendar grid with proper event positioning
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dayEvents = getEventsOverlappingDate(date);
      const isTodayDate = isToday(date);
      const isSelected = isSelectedDate(date);

      // Track which rows are occupied by continuing events
      const occupiedRows = new Set();
      const eventsToRender = [];

      // Separate holidays from other events
      const holidays = dayEvents.filter(e => e.type === 'holiday');
      const nonHolidayEvents = dayEvents.filter(e => e.type !== 'holiday');
      const hasHoliday = holidays.length > 0;
      const primaryHoliday = holidays[0]; // Take the first one for the circle/label

      // Specific check for holiday label (only on the absolute start date)
      const isHolidayStart = hasHoliday && (() => {
        const start = new Date(primaryHoliday.start);
        start.setHours(0, 0, 0, 0);
        const check = new Date(date);
        check.setHours(0, 0, 0, 0);
        return start.getTime() === check.getTime();
      })();

      // First pass: identify continuing events and their rows
      nonHolidayEvents.forEach((event) => {
        const eventId = event.id || event._id || event.followUpId;
        const isFirstDay = isFirstDayInView(event, date);

        if (!isFirstDay) {
          // This is a continuing event - find which row it should be in
          // by checking previous days
          const prevDate = new Date(date);
          prevDate.setDate(prevDate.getDate() - 1);

          // Look back to find the row this event is in
          let foundRow = -1;
          for (let lookback = 1; lookback <= 7 && foundRow === -1; lookback++) {
            const checkDate = new Date(date);
            checkDate.setDate(checkDate.getDate() - lookback);

            if (checkDate.getMonth() !== date.getMonth()) break;

            const checkEvents = getEventsOverlappingDate(checkDate);
            checkEvents.forEach((e, idx) => {
              const eId = e.id || e._id || e.followUpId;
              if (eId === eventId && isFirstDayInView(e, checkDate)) {
                // Found where this event started - count its position
                const firstDayEvents = getEventsOverlappingDate(checkDate);
                const startingEvents = firstDayEvents.filter((ev) =>
                  isFirstDayInView(ev, checkDate)
                );
                foundRow = startingEvents.findIndex(
                  (ev) => (ev.id || ev._id || ev.followUpId) === eventId
                );
              }
            });
          }

          if (foundRow >= 0 && foundRow < maxVisibleEvents) {
            occupiedRows.add(foundRow);
            eventsToRender.push({ event, row: foundRow, isContinuing: true });
          }
        }
      });

      // Second pass: place events starting today in available rows
      const startingEvents = nonHolidayEvents.filter((event) =>
        isFirstDayInView(event, date)
      );

      startingEvents.forEach((event) => {
        // Find first available row
        let assignedRow = -1;
        for (let row = 0; row < maxVisibleEvents; row++) {
          if (!occupiedRows.has(row)) {
            assignedRow = row;
            occupiedRows.add(row);
            break;
          }
        }

        if (assignedRow >= 0) {
          eventsToRender.push({ event, row: assignedRow, isContinuing: false });
        }
      });

      // Sort by row number for rendering
      eventsToRender.sort((a, b) => a.row - b.row);

      // Count hidden events
      const totalEvents = nonHolidayEvents.length;
      const visibleEvents = eventsToRender.filter(
        (e) => e.row < maxVisibleEvents
      ).length;
      const hiddenCount = totalEvents - visibleEvents;

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`min-h-[100px] sm:min-h-[130px] border border-gray-200 p-1.5 sm:p-2.5 cursor-pointer transition-all duration-200 relative ${isTodayDate
            ? "bg-blue-50 hover:bg-blue-100"
            : "bg-white hover:bg-gray-50"
            } ${isSelected ? "ring-2 ring-primary-dark shadow-lg" : "hover:shadow-md"
            }`}
        >
          <div
            className={`flex items-center justify-between mb-1 sm:mb-2 ${isTodayDate ? "text-primary-dark" : "text-gray-700"
              }`}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span
                className={`text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full transition-all ${isTodayDate
                    ? "bg-primary-dark text-white"
                    : isHolidayStart
                      ? "text-orange-600"
                      : "text-gray-700"
                  }`}
              >
                {day}
              </span>
              {hasHoliday && (
                <div className="flex flex-col flex-1 min-w-0">
                  {holidays.map((h, i) => {
                    const start = new Date(h.start || h.date);
                    start.setHours(0, 0, 0, 0);
                    const check = new Date(date);
                    check.setHours(0, 0, 0, 0);
                    if (start.getTime() !== check.getTime()) return null;

                    return (
                      <span key={i} className="text-[9px] sm:text-[10px] font-bold truncate leading-tight text-orange-600">
                        {h.title}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <EventCountBadge events={nonHolidayEvents} />
          </div>

          <div className="space-y-1 relative">
            {eventsToRender.map(({ event, row, isContinuing }) => {
              if (row >= maxVisibleEvents) return null;

              const spanDays = getSpanDaysFromDate(event, date);
              const isMultiDay = spanDays > 1;
              const isFirstDay = !isContinuing;

              // Render continuing placeholder (invisible but maintains space)
              if (isContinuing) {
                return (
                  <div
                    key={`continuing-${event.id || event._id || event.followUpId
                      }-${day}`}
                    className="h-[28px]"
                    style={{ zIndex: 10 + row }}
                  >
                    {/* Empty spacer for continuing events */}
                  </div>
                );
              }

              // Render full event card for starting events
              return (
                <div
                  key={event.id || event._id || event.followUpId}
                  className="relative"
                  style={{
                    zIndex: 10 + row,
                  }}
                >
                  <EventCard
                    event={event}
                    colorClasses={getColorClasses(event.color || "blue")}
                    formatTime={formatTime}
                    formatDateRange={formatDateRange}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    compact={true}
                    isSpanning={isMultiDay}
                    spanDays={spanDays}
                    canEdit={editCalendar}
                  />
                </div>
              );
            })}

            {hiddenCount > 0 && (
              <div className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded-md font-medium">
                +{hiddenCount} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div id="calendar-month-view" className="grid grid-cols-7 gap-0 min-w-[280px]">
        {[
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].map((day) => (
          <div
            key={day}
            className="bg-gray-100 border border-gray-200 py-2 sm:py-3 text-center text-xs sm:text-sm font-bold text-primary-dark tracking-wide"
          >
            <span className="hidden sm:inline">{day.slice(0, 3).toUpperCase()}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
        {days}
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    startOfWeek.setDate(startOfWeek.getDate() - day)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      weekDays.push(date)
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const allDayEventsByDate = weekDays.map((date) => {
      return getEventsOverlappingDate(date).filter((e) => isAllDayEvent(e));
    });



    return (
      <div id="calendar-week-view-container" className="flex flex-col">
        {/* Week header */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          <div className="w-20 flex-shrink-0 border-r border-gray-200 flex items-center justify-center">
            <button
              onClick={() => setAllDayExpanded(!allDayExpanded)}
              className="text-xs font-semibold text-gray-600 hover:bg-gray-200 px-2 py-1 rounded"
            >
              {allDayExpanded ? "▼" : "▶"} All-Day
            </button>
          </div>
          <div className="flex flex-1">
            {weekDays.map((date, i) => {
              const isTodayDate = isToday(date);
              return (
                <div
                  key={i}
                  className={`flex-1 py-3 text-center border-r border-gray-200 last:border-r-0`}
                >
                  <div
                    className={`text-xs font-semibold ${isTodayDate ? "text-primary-dark" : "text-gray-600"
                      }`}
                  >
                    {date
                      .toLocaleDateString("en-US", { weekday: "short" })
                      .toUpperCase()}
                  </div>
                  <div
                    className={`text-lg font-bold flex items-center justify-center mx-auto transition-all ${isTodayDate
                      ? "w-8 h-8 rounded-full bg-primary-dark text-white"
                      : (() => {
                        const holidays = getEventsOverlappingDate(date).filter(e => {
                          if (e.type !== 'holiday') return false;
                          const start = new Date(e.start);
                          start.setHours(0, 0, 0, 0);
                          const check = new Date(date);
                          check.setHours(0, 0, 0, 0);
                          return start.getTime() === check.getTime();
                        });
                        if (holidays.length > 0) {
                          return "text-orange-600";
                        }
                        return "text-gray-900";
                      })()
                      }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* All-day events section */}
        <div
          className={`flex border-b border-gray-200 overflow-hidden transition-all ${allDayExpanded ? "max-h-96" : "max-h-20"
            }`}
        >
          <div className="w-20 flex-shrink-0 border-r border-gray-200"></div>
          <div className="flex flex-1">
            {weekDays.map((date, i) => {
              const allDayEvents = allDayEventsByDate[i];
              const displayEvents = allDayExpanded
                ? allDayEvents
                : allDayEvents.slice(0, 2);
              const hiddenCount = allDayEvents.length - displayEvents.length;

              return (
                <div
                  key={i}
                  className="flex-1 border-r border-gray-200 last:border-r-0 p-1 space-y-1"
                >
                  {displayEvents.map((event) => {
                    // Only show holiday on its start date
                    if (event.type === 'holiday' && continuesFromPrevious(event, date)) return null;

                    return (
                      <div
                        key={event.id || event._id || event.followUpId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        className={`text-[10px] px-2 py-1 rounded-full cursor-pointer hover:shadow-md transition-all border border-white/50 flex items-center gap-1.5 font-bold ${event.type === 'holiday'
                            ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                            : getColorClasses(event.color || "blue", false)
                          }`}
                      >
                        {event.type === 'holiday' && <Sparkles className="w-2.5 h-2.5 flex-shrink-0 animate-pulse" />}
                        <div className="truncate font-bold">
                          {event.title}
                        </div>
                      </div>
                    );
                  })}
                  {hiddenCount > 0 && !allDayExpanded && (
                    <div className="text-xs text-gray-500 px-2">
                      +{hiddenCount} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Time grid */}
        <div className="overflow-y-auto max-h-[600px]">
          <div className="flex">
            {/* Time column */}
            <div className="w-20 flex-shrink-0 border-r border-gray-200">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-gray-200 pr-2 text-right text-xs text-gray-500 pt-1"
                >
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Day columns container */}
            <div className="flex flex-1">
              {weekDays.map((date, i) => {
                // Get events that overlap with this date (for multi-day events)
                const dayEvents = getEventsOverlappingDate(date).filter(
                  (e) => !isAllDayEvent(e)
                );

                return (
                  <div
                    key={i}
                    className="flex-1 relative border-r border-gray-200 last:border-r-0"
                  >
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        onClick={() => handleTimeSlotClick(date, hour)}
                        className="h-16 border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors"
                      ></div>
                    ))}

                    {/* Events overlay */}
                    {(() => {
                      const eventColumns = layoutEvents(dayEvents);

                      return eventColumns.map(({ event, column, totalColumns }) => {
                        const eventStart = new Date(event.start);
                        const eventEnd = event.end
                          ? new Date(event.end)
                          : new Date(eventStart.getTime() + 60 * 60 * 1000);

                        const dayStart = new Date(date);
                        dayStart.setHours(0, 0, 0, 0);
                        const dayEnd = new Date(date);
                        dayEnd.setHours(23, 59, 59, 999);

                        const displayStart = eventStart > dayStart ? eventStart : dayStart;
                        const displayEnd = eventEnd < dayEnd ? eventEnd : dayEnd;

                        if (displayStart >= displayEnd) return null;

                        const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
                        const duration = (displayEnd - displayStart) / (1000 * 60 * 60);

                        // Calculate width and position
                        const width = 100 / totalColumns;
                        const left = column * width;

                        return (
                          <div
                            key={`${event.id || event.followUpId}-${i}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            className={`absolute px-2 py-1 rounded text-xs ${getColorClasses(
                              event.color || "orange"
                            )} overflow-hidden cursor-pointer hover:shadow-md transition-all z-10`}
                            style={{
                              top: `${startHour * 64}px`,
                              height: `${Math.max(duration * 64 - 4, 20)}px`,
                              left: `${left}%`,
                              width: `${width}%`,
                              border: '1px solid white'
                            }}
                          >
                            <div
                              className="font-semibold truncate cursor-pointer"
                              onMouseEnter={() => setTooltipEvent(event)}
                              onMouseLeave={() => setTooltipEvent(null)}
                            >
                              {event.title}
                            </div>
                            {tooltipEvent && tooltipEvent.id === event.id && (
                              <div className="absolute z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 mt-1 whitespace-nowrap left-0 top-full">
                                {event.title} - {formatTime(new Date(event.start))}
                              </div>
                            )}
                            <div className="text-xs flex items-center gap-1">
                              <Clock size={10} />
                              {formatTime(displayStart)}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to calculate column positions for overlapping events
  const layoutEvents = (events) => {
    if (!events || events.length === 0) return [];

    // 1. Sort events
    const sortedEvents = [...events].sort((a, b) => {
      const startA = new Date(a.start).getTime();
      const startB = new Date(b.start).getTime();
      if (startA !== startB) return startA - startB;

      const endA = a.end ? new Date(a.end).getTime() : startA + 3600000;
      const endB = b.end ? new Date(b.end).getTime() : startB + 3600000;
      return (endB - startB) - (endA - startA); // Longer events first
    });

    const positionedEvents = [];
    const clusters = [];
    let currentCluster = [];
    let clusterEnd = -1;

    // 2. Group into clusters (independent sets of overlapping events)
    sortedEvents.forEach(event => {
      const eventStart = new Date(event.start).getTime();
      const eventEnd = event.end ? new Date(event.end).getTime() : eventStart + 3600000;

      if (currentCluster.length === 0) {
        currentCluster.push(event);
        clusterEnd = eventEnd;
      } else {
        // If overlaps with the span of the current cluster
        if (eventStart < clusterEnd) {
          currentCluster.push(event);
          clusterEnd = Math.max(clusterEnd, eventEnd);
        } else {
          clusters.push(currentCluster);
          currentCluster = [event];
          clusterEnd = eventEnd;
        }
      }
    });
    if (currentCluster.length > 0) clusters.push(currentCluster);

    // 3. Assign columns within each cluster
    clusters.forEach(cluster => {
      // temporary tracking of end times for each column
      const columns = [];
      const clusterEventsWithCol = [];

      cluster.forEach(event => {
        const eventStart = new Date(event.start).getTime();
        const eventEnd = event.end ? new Date(event.end).getTime() : eventStart + 3600000;

        let placed = false;
        let colIndex = -1;

        // Try to place in existing column
        for (let i = 0; i < columns.length; i++) {
          if (columns[i] <= eventStart) {
            columns[i] = eventEnd;
            colIndex = i;
            placed = true;
            break;
          }
        }

        // If not placed, create new column
        if (!placed) {
          columns.push(eventEnd);
          colIndex = columns.length - 1;
        }

        clusterEventsWithCol.push({ event, column: colIndex });
      });

      // Apply totalColumns to all events in this cluster
      const totalColumns = columns.length;
      clusterEventsWithCol.forEach(item => {
        positionedEvents.push({
          event: item.event,
          column: item.column,
          totalColumns
        });
      });
    });

    return positionedEvents;
  };

  // Render Day View
  const renderDayView = () => {
    // Use getEventsOverlappingDate to include events that span multiple days
    const allEvents = getEventsOverlappingDate(currentDate);
    const allDayEvents = allEvents.filter((e) => isAllDayEvent(e));
    const timedEvents = allEvents.filter((e) => !isAllDayEvent(e));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Time grid */}
        <div id="calendar-day-view-time-grid" className="flex-1 flex flex-col min-w-0 border border-gray-200 rounded-lg bg-white">

          {/* Header / All Day Section */}
          <div className="flex-shrink-0 border-b border-gray-200 bg-white z-20 shadow-sm">
            <div className="flex items-center bg-gray-50 border-b border-gray-200">
              <div className="w-20 pr-4 text-right border-r border-gray-200 sticky left-0 z-10 bg-gray-50">
                {allDayEvents.length > 0 && (
                  <button
                    onClick={() => setAllDayExpanded(!allDayExpanded)}
                    className="text-xs font-semibold text-gray-600 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    {allDayExpanded ? "▼" : "▶"}
                  </button>
                )}
              </div>
              <div className="text-left py-3 px-3">
                <span className="text-xs font-semibold text-gray-600">ALL-DAY</span>
              </div>
            </div>
            {allDayEvents.length > 0 ? (
              <div
                className={`transition-all overflow-hidden ${allDayExpanded ? "max-h-96 overflow-y-auto" : "max-h-24"
                  }`}
              >
                <div className="flex">
                  <div className="w-20 border-r border-gray-200 sticky left-0 z-10 bg-white"></div>
                  <div className="flex-1 p-2 space-y-2">
                    {(allDayExpanded
                      ? allDayEvents
                      : allDayEvents.slice(0, 3)
                    ).map((event) => {
                      // Only show holiday on its start date
                      if (event.type === 'holiday' && continuesFromPrevious(event, currentDate)) return null;

                      const continuesPrev = continuesFromPrevious(event, currentDate);
                      const continuesNext = continuesToNext(event, currentDate);
                      return (
                        <div
                          key={event.id || event._id || event.followUpId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditEvent(event);
                          }}
                          className={`px-3 py-2 rounded-lg cursor-pointer hover:shadow-md transition-all relative ${event.type === 'holiday'
                              ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                              : getColorClasses(event.color || "blue")
                            }`}
                        >
                          {/* Multi-day edge indicators */}
                          {continuesPrev && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/20 rounded-l-lg"></div>
                          )}
                          {continuesNext && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-black/20 rounded-r-lg"></div>
                          )}
                          <div className="font-semibold flex items-center gap-2">
                            {event.type === 'holiday' && <Sparkles className="w-4 h-4 text-white animate-pulse" />}
                            {event.title}
                          </div>
                          {event.description && (
                            <div className="text-xs mt-1 opacity-90">
                              {event.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {!allDayExpanded && allDayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-3">
                        +{allDayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex">
                <div className="w-20 border-r border-gray-200 sticky left-0 z-10 bg-white"></div>
                <div className="flex-1 p-2">
                  <div className="text-xs text-gray-400 px-3 py-2">
                    No all-day events
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Time Grid - flows with page scroll */}
          <div className="flex-1 relative">
            <div className="relative min-h-[1536px]"> {/* 24h * 64px */}

              {/* Grid Lines */}
              {hours.map((hour) => (
                <div key={hour} className="flex h-16 border-b border-gray-100 last:border-b-0">
                  <div className="w-20 pr-4 text-right pt-2 border-r border-gray-200 bg-gray-50 sticky left-0 z-10">
                    <span className="text-xs text-gray-500 font-medium">
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </span>
                  </div>
                  <div
                    className="flex-1 hover:bg-gray-50 transition-colors"
                    onClick={() => handleTimeSlotClick(currentDate, hour)}
                  ></div>
                </div>
              ))}

              {/* Events Overlay */}
              <div className="absolute top-0 right-0 bottom-0 left-20 pointer-events-none">
                {(() => {
                  const eventColumns = layoutEvents(timedEvents);

                  return eventColumns.map(({ event, column, totalColumns }, i) => {
                    const eventStart = new Date(event.start);
                    const eventEnd = event.end
                      ? new Date(event.end)
                      : new Date(eventStart.getTime() + 60 * 60 * 1000);

                    const dayStart = new Date(currentDate);
                    dayStart.setHours(0, 0, 0, 0);
                    const dayEnd = new Date(currentDate);
                    dayEnd.setHours(23, 59, 59, 999);

                    const isClippedStart = eventStart < dayStart;
                    const isClippedEnd = eventEnd > dayEnd;
                    const displayStart = eventStart > dayStart ? eventStart : dayStart;
                    const displayEnd = eventEnd < dayEnd ? eventEnd : dayEnd;

                    if (displayStart >= displayEnd) return null;

                    const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
                    const duration = (displayEnd - displayStart) / (1000 * 60 * 60);

                    // Calculate width and position
                    const width = 100 / totalColumns;
                    const left = column * width;
                    const isMultiDay = isClippedStart || isClippedEnd;

                    return (
                      <div
                        key={`${event.id || event.followUpId || event._id}-${i}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditEvent(event);
                        }}
                        className={`absolute px-3 py-2 rounded-lg shadow-sm ${getColorClasses(
                          event.color || "orange"
                        )} overflow-hidden cursor-pointer hover:shadow-md transition-all z-10 pointer-events-auto border border-white/50 ${isMultiDay ? 'border-2 border-dashed border-black/20' : ''
                          }`}
                        style={{
                          top: `${startHour * 64}px`,
                          height: `${Math.max(duration * 64, 30)}px`,
                          left: `${left}%`,
                          width: `${width}%`
                        }}
                      >
                        {isClippedStart && <div className="absolute left-0 top-0 text-xs font-bold opacity-60">↑</div>}
                        {isClippedEnd && <div className="absolute right-0 bottom-0 text-xs font-bold opacity-60">↓</div>}

                        <div
                          className="font-semibold truncate text-xs sm:text-sm"
                          onMouseEnter={() => setTooltipEvent(event)}
                          onMouseLeave={() => setTooltipEvent(null)}
                        >
                          {event.title}
                        </div>
                        {event.location && (
                          <div className="text-[10px] truncate opacity-90">📍 {event.location}</div>
                        )}
                        {tooltipEvent && (tooltipEvent.id === event.id || tooltipEvent._id === event._id || tooltipEvent.followUpId === event.followUpId) && (
                          <div className="absolute z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 mt-1 whitespace-nowrap shadow-xl" style={{ top: '100%', left: 0 }}>
                            <div className="font-bold">{event.title}</div>
                            <div>
                              {isMultiDay
                                ? `Full: ${formatTime(eventStart)} - ${formatTime(eventEnd)}`
                                : `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end || event.start))}`
                              }
                            </div>
                          </div>
                        )}
                        <div className="text-[10px] flex items-center gap-1 mt-0.5 opacity-90">
                          {formatDateRange(displayStart, displayEnd)}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          </div>
        </div>

        {/* Event list sidebar - Separated by type */}
        <div id="calendar-day-view-event-sidebar" className="hidden lg:block w-80 flex-shrink-0 pr-2">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 text-center py-8">
                Loading events...
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {/* Holidays Section */}
              {allEvents.filter((e) => e.type === "holiday").length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-pink-600 animate-pulse" />
                    <h3 className="font-bold text-gray-900 text-sm">
                      Holidays
                    </h3>
                    <span className="ml-auto bg-pink-100 text-pink-800 text-xs font-medium px-2 py-0.5 rounded-full">{allEvents.filter((e) => e.type === "holiday").length}</span>
                  </div>
                  <div className="space-y-2">
                    {allEvents
                      .filter((e) => e.type === "holiday")
                      .map((event) => (
                        <div
                          key={event.id || event._id}
                          className={`p-3 rounded-lg border border-white/50 shadow-sm text-white flex items-center gap-2 transform transition-transform hover:scale-105 ${event.subtype === 'telugu-festival'
                            ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                            : 'bg-gradient-to-r from-pink-400 to-pink-500'
                            }`}
                        >
                          <Sparkles size={14} className="flex-shrink-0" />
                          <div>
                            <div className="font-bold text-sm leading-tight">
                              {event.title}
                            </div>
                            <div className="text-[10px] opacity-90 uppercase tracking-tighter">
                              {event.subtype === 'telugu-festival' ? 'Telugu Festival' : 'Holiday'}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Calendar Events Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon size={16} className="text-blue-600" />
                  <h3 className="font-bold text-gray-900 text-sm">
                    Calendar Events
                  </h3>
                  <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">{allEvents.filter((e) => e.type === "calendar").length}</span>
                </div>
                <div className="space-y-2">
                  {allEvents.filter((e) => e.type === "calendar").length ===
                    0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                      No calendar events today
                    </p>
                  ) : (
                    allEvents
                      .filter((e) => e.type === "calendar")
                      .map((event) => (
                        <EventCard
                          key={event._id || event.id}
                          event={event}
                          colorClasses={getColorClasses(event.color)}
                          formatTime={formatTime}
                          formatDateRange={formatDateRange}
                          onEdit={handleEditEvent}
                          onDelete={handleDeleteEvent}
                          canEdit={editCalendar}
                        />
                      ))
                  )}
                </div>
              </div>

              {/* Project Events Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase size={16} className="text-green-600" />
                  <h3 className="font-bold text-gray-900 text-sm">
                    Project Events
                  </h3>
                  <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">{allEvents.filter((e) => e.type === "project").length}</span>
                </div>
                <div className="space-y-2">
                  {allEvents.filter((e) => e.type === "project").length ===
                    0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                      No project events today
                    </p>
                  ) : (
                    allEvents
                      .filter((e) => e.type === "project")
                      .map((event) => (
                        <div
                          key={event.id}
                          onClick={() => navigate(`/project/${event._id}`)}
                          className="p-3 rounded-lg bg-green-50 border-l-4 border-green-500 text-green-800 cursor-pointer hover:shadow-md transition-all"
                        >
                          <div className="font-semibold text-sm mb-1">
                            {event.title}
                          </div>
                          <div className="text-xs flex items-center gap-1 opacity-80">
                            <Clock size={12} />
                            {formatTime(new Date(event.start))}
                          </div>
                          {event.location && (
                            <div className="text-xs mt-1 flex items-center gap-1">
                              <span>📍</span> {event.location}
                            </div>
                          )}
                          {event.description && (
                            <div className="text-xs mt-1 text-gray-600">
                              {event.description}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Follow-Up Events Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={16} className="text-orange-600" />
                  <h3 className="font-bold text-gray-900 text-sm">
                    Follow-Ups
                  </h3>
                  <span className="ml-auto bg-orange-100 text-orange-800 text-xs font-medium px-2 py-0.5 rounded-full">{allEvents.filter((e) => e.type === "followup").length}</span>
                </div>
                <div className="space-y-2">
                  {allEvents.filter((e) => e.type === "followup").length ===
                    0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                      No follow-ups today
                    </p>
                  ) : (
                    allEvents
                      .filter((e) => e.type === "followup")
                      .map((followUp) => (
                        <div
                          key={followUp.id || followUp.followUpId}
                          className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${followUp.status === "completed"
                            ? "bg-green-50 border-green-500 text-green-800"
                            : "bg-orange-50 border-orange-500 text-orange-800"
                            }`}
                          onClick={() => handleClick(followUp)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="font-semibold text-sm flex-1">
                              {followUp.title.replace("Follow-up: ", "")}
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${followUp.status === "completed"
                                ? "bg-green-200 text-green-800"
                                : "bg-orange-200 text-orange-800"
                                }`}
                            >
                              {followUp.status === "completed"
                                ? "Completed"
                                : "Pending"}
                            </span>
                          </div>
                          <div className="text-xs flex items-center gap-1 mt-1">
                            <Clock size={12} />
                            {formatTime(new Date(followUp.start))}
                          </div>
                          {followUp.description && (
                            <div className="text-xs mt-2 text-gray-600">
                              {followUp.description}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  }


  return (
    <>
      <div className='p-3 sm:p-4 md:p-6 lg:pl-4 bg-gray-50 min-h-screen'>
        <TourGuide
          steps={calendarTourSteps}
          tourKey="calendar-tour"
          onStartTour={(startFn) => { startTourRef.current = startFn; }}
        />
        <div className='max-w-[1600px] mx-auto'>
          <CalendarHeader
            onAddEvent={() => setShowEventModal(true)}
          />

          <CalendarControls
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            onPrevious={goToPrevious}
            onNext={goToNext}
            viewTitle={getViewTitle()}
            onGoToToday={goToToday}
          />

          {/* Calendar Views */}
          <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto'>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={showEventModal}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        selectedTimeSlot={selectedTimeSlot}
        editEvent={editingEvent}
      />
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDeleteEvent}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        itemLabel={eventToDelete?.title}
        loading={isDeleting}
      />
    </>
  )
}
