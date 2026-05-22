import React from 'react';
import { Calendar, Briefcase, MessageSquare } from 'lucide-react';

export const EventCountBadge = ({ events }) => {
  const calendarCount = events.filter(e => e.type === 'calendar').length;
  const projectCount = events.filter(e => e.type === 'project').length;
  const followUpCount = events.filter(e => e.type === 'followup').length;

  if (calendarCount === 0 && projectCount === 0 && followUpCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {calendarCount > 0 && (
        <div className="flex items-center gap-0.5 bg-blue-500 text-white px-1 rounded" style={{ fontSize: '9px', height: '16px' }}>
          <Calendar size={8} strokeWidth={2.5} />
          <span>{calendarCount}</span>
        </div>
      )}
      {projectCount > 0 && (
        <div className="flex items-center gap-0.5 bg-green-500 text-white px-1 rounded" style={{ fontSize: '9px', height: '16px' }}>
          <Briefcase size={8} strokeWidth={2.5} />
          <span>{projectCount}</span>
        </div>
      )}
      {followUpCount > 0 && (
        <div className="flex items-center gap-0.5 bg-orange-500 text-white px-1 rounded" style={{ fontSize: '9px', height: '16px' }}>
          <MessageSquare size={8} strokeWidth={2.5} />
          <span>{followUpCount}</span>
        </div>
      )}
    </div>
  );
};