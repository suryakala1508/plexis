import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, MapPin, Users, Tag, MessageSquare, Briefcase, Calendar } from 'lucide-react';

export const EventTooltip = ({ event, position, formatTime }) => {
  if (!event) return null;

  const getEventIcon = () => {
    switch (event.type) {
      case 'calendar':
        return <Calendar size={16} className="text-blue-400" />;
      case 'project':
        return <Briefcase size={16} className="text-green-400" />;
      case 'followup':
        return <MessageSquare size={16} className="text-orange-400" />;
      default:
        return <Calendar size={16} className="text-blue-400" />;
    }
  };

  const getEventTypeLabel = () => {
    switch (event.type) {
      case 'calendar':
        return 'Calendar Event';
      case 'project':
        return 'Project Event';
      case 'followup':
        return 'Follow-Up';
      default:
        return 'Event';
    }
  };

  return createPortal(
    <div
      className="fixed bg-gray-900 text-white rounded-lg shadow-2xl p-4 min-w-[280px] max-w-[320px] z-[99999] pointer-events-none"
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
      }}
    >
      <div className="space-y-3">
        {/* Header with Icon and Type */}
        <div className="flex items-center gap-2 border-b border-gray-700 pb-2">
          {getEventIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-bold text-base">
                {event.reason || event.title}
              </div>
              <div className="text-xs text-gray-400">• {getEventTypeLabel()}</div>
            </div>
          </div>
        </div>

        {/* Grid Layout - 2 items per row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Time */}
          <div className="flex items-start gap-2">
            <Clock size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">Time</div>
              <div className="text-sm">{formatTime(new Date(event.start))}</div>
            </div>
          </div>

          {/* Lead Name (Follow-ups only) */}
          {event.type === 'followup' && (
            <div className="flex items-start gap-2">
              <Users size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Lead</div>
                <div className="text-sm font-medium">{event.leadName || 'Unknown'}</div>
              </div>
            </div>
          )}

          {/* Location (Calendar & Project events) */}
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Location</div>
                <div className="text-sm">{event.location}</div>
              </div>
            </div>
          )}

          {/* Attendees (Calendar events) */}
          {event.attendees && (
            <div className="flex items-start gap-2">
              <Users size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Attendees</div>
                <div className="text-sm">{event.attendees} people</div>
              </div>
            </div>
          )}

          {/* Event Type (Calendar events) */}
          {event.eventType && (
            <div className="flex items-start gap-2">
              <Tag size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Category</div>
                <div className="text-sm">{event.eventType}</div>
              </div>
            </div>
          )}

          {/* Status (Follow-ups only) */}
          {event.type === 'followup' && event.status && (
            <div className="flex items-start gap-2">
              <Tag size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Status</div>
                <div className="text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${event.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'bg-orange-500 text-white'
                    }`}>
                    {event.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Project ID (Project events only) */}
          {event.type === 'project' && event.projectId && (
            <div className="flex items-start gap-2">
              <Briefcase size={14} className="mt-0.5 flex-shrink-0 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">Project</div>
                <div className="text-sm font-mono text-gray-300">{event.projectId}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};