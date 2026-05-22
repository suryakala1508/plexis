import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { getAllEvents } from '../services/calendarService';

const CalendarContext = createContext();

export const CalendarProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { events: fetchedEvents } = await getAllEvents();
            setEvents(fetchedEvents);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err);
            toast.error('Failed to sync calendar');
        } finally {
            setLoading(false);
        }
    }, []);

    // Function to optimistically update events (for create/update/delete)
    const setEventsOptimistic = (newEvents) => {
        setEvents(newEvents);
    };

    return (
        <CalendarContext.Provider
            value={{
                events,
                loading,
                error,
                fetchEvents,
                setEvents: setEventsOptimistic
            }}
        >
            {children}
        </CalendarContext.Provider>
    );
};

export const useCalendar = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendar must be used within a CalendarProvider');
    }
    return context;
};
