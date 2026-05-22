import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, Users, Edit2, Trash2, Briefcase, MessageSquare, Tag, Sparkles } from 'lucide-react'
import { EventTooltip } from '@/Components/EventToolTip';

export const EventCard = ({ event, colorClasses, formatTime, formatDateRange, onEdit, onDelete, compact = false, isSpanning = false, spanDays = 1, canEdit = true }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ left: 0, top: 0 });
  const tooltipTimeoutRef = useRef(null);
  const cardRef = useRef(null);
  const navigate = useNavigate();

  const handleMouseEnter = (event) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = 280;
      const tooltipHeight = 200;
      const gap = 8;

      const wouldOverflow = rect.right + gap + tooltipWidth > window.innerWidth;
      const wouldOverflowBottom = rect.top + tooltipHeight > window.innerHeight;

      setTooltipPosition({
        left: wouldOverflow ? rect.left - tooltipWidth - gap : rect.right + gap,
        top: wouldOverflowBottom ? rect.bottom - tooltipHeight : rect.top,
      });
    }
    setShowTooltip(true);
  };

  if (compact) {
    if (event.type === 'holiday') {
      return (
        <>
          <div
            ref={cardRef}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm border border-white/50 ${event.subtype === 'telugu-festival'
              ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
              : 'bg-gradient-to-r from-pink-400 to-pink-500 text-white'
              }`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            onMouseEnter={() => handleMouseEnter(event)}
            onMouseLeave={() => {
              clearTimeout(tooltipTimeoutRef.current);
              tooltipTimeoutRef.current = setTimeout(
                () => setShowTooltip(false),
                100
              );
            }}
          >
            <Sparkles className="w-3 h-3 flex-shrink-0 animate-pulse" />
            <span className="truncate">{event.title}</span>
          </div>

          {showTooltip && (
            <EventTooltip
              event={event}
              position={tooltipPosition}
              formatTime={formatTime}
            />
          )}
        </>
      );
    }

    return (
      <>
        <div
          ref={cardRef}
          className={`${colorClasses} p-1 rounded text-xs mb-1 cursor-pointer relative ${isSpanning ? "absolute left-0 right-0 hover:shadow-md" : "hover:opacity-80"
            } transition-all ${isSpanning ? "h-[32px] flex items-center overflow-hidden" : ""
            }`}
          style={
            isSpanning
              ? {
                width: `calc(${spanDays * 100}% + ${(spanDays - 1) * 2}px)`,
                height: '32px',
                minHeight: '32px',
                maxHeight: '32px',
              }
              : {}
          }
          onClick={(e) => {
            e.stopPropagation();
            onEdit(event);
          }}
          onMouseEnter={() => handleMouseEnter(event)}
          onMouseLeave={() => {
            clearTimeout(tooltipTimeoutRef.current);
            tooltipTimeoutRef.current = setTimeout(
              () => setShowTooltip(false),
              100
            );
          }}
        >
          {isSpanning ? (
            <div className="flex items-center gap-1 w-full min-w-0">
              <span className="font-medium text-xs whitespace-nowrap">
                {formatTime(new Date(event.start))}
              </span>
              <span className="truncate font-semibold text-xs">{event.title}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="font-medium truncate flex-1">
                  {formatTime(new Date(event.start))}
                </span>
              </div>
              <div className="truncate font-medium">{event.title}</div>
            </>
          )}
        </div>

        {showTooltip && (
          <EventTooltip
            event={event}
            position={tooltipPosition}
            formatTime={formatTime}
          />
        )}
      </>
    );
  }

  // Full view for day/week view and sidebar
  return (
    <div
      className={`${colorClasses} p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow relative group`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm line-clamp-2">{event.title}</h3>
        <div className="flex gap-1 flex-wrap justify-end">
          {event.type === "holiday" && (
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 shadow-sm ${event.subtype === 'telugu-festival'
              ? 'bg-orange-500 text-white'
              : 'bg-pink-500 text-white'
              }`}>
              <Sparkles className="w-2.5 h-2.5" />
              Holiday
            </span>
          )}
          {event.type === "project" && (
            <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              Project
            </span>
          )}
          {event.type === "followup" && (
            <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {event.status === "completed" ? "Completed" : "Pending"}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {formatDateRange(
            new Date(event.start),
            event.end
              ? new Date(event.end)
              : new Date(new Date(event.start).getTime() + 60 * 60 * 1000)
          )}
        </div>

        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {event.location}
          </div>
        )}

        {event.attendees && (
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {event.attendees} attendees
          </div>
        )}

        {event.eventType && (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {event.eventType}
          </div>
        )}
      </div>

      {/* Action buttons - show on hover */}
      {canEdit && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(event);
            }}
            className="p-1.5 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(event.id || event._id || event.followUpId);
            }}
            className="p-1.5 bg-white rounded-md shadow-md hover:bg-gray-100 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}