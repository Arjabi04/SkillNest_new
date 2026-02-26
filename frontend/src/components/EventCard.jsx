import React from 'react';
import { format, isPast, isSameDay, addDays } from 'date-fns';

// Icon components
const Calendar = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const MapPin = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const Monitor = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Users = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const Tag = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const EventCard = ({ 
  event, 
  onRegister, 
  onUnjoin,
  onDelete,
  onView, 
  currentUserId,
  showActions = true,
  variant = 'default' // 'default', 'compact', 'calendar'
}) => {
  // Add defensive check for event data
  if (!event) {
    return <div className="p-4 border rounded-lg">Error: Event data not available</div>;
  }

  console.log('EventCard - currentUserId:', currentUserId);
  console.log('EventCard - event:', event);

  const isEventPast = isPast(new Date(event.endDate));
  const isEventToday = isSameDay(new Date(event.startDate), new Date());
  const isEventSoon = new Date(event.startDate) <= addDays(new Date(), 7);
  
  const userAttendanceStatus = event.attendees?.find(
    a => a.user?._id === currentUserId || a.user === currentUserId
  )?.status;

  const isOrganizer = event.organizer?._id === currentUserId || event.organizer === currentUserId;
  const attendeeCount = event.attendees?.filter(a => a.status === 'going').length || 0;
  const canRegister = event.allowRegistration && !isEventPast && 
    (!event.capacity || attendeeCount < event.capacity);

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'online':
        return <Monitor className="w-4 h-4" />;
      case 'offline':
        return <MapPin className="w-4 h-4" />;
      case 'hybrid':
        return (
          <div className="flex">
            <Monitor className="w-3 h-3" />
            <MapPin className="w-3 h-3" />
          </div>
        );
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusBadge = () => {
    if (isEventPast) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Past</span>;
    }
    if (isEventToday) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Today</span>;
    }
    if (isEventSoon) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Soon</span>;
    }
    return null;
  };

  const getAttendanceButton = () => {
    if (isOrganizer) {
      return (
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-lg font-medium">
          Organizer
        </span>
      );
    }

    if (!canRegister) {
      return (
        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm rounded-lg">
          {isEventPast ? 'Event Ended' : 'Full'}
        </span>
      );
    }

    switch (userAttendanceStatus) {
      case 'going':
        return (
          <div className="flex gap-2">
            {isOrganizer ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(event._id);
                }}
                className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
              >
                Delete Event
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnjoin?.(event._id);
                }}
                className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
              >
                Leave Event
              </button>
            )}
          </div>
        );
      case 'maybe':
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegister?.(event._id, 'going');
              }}
              className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-lg hover:bg-yellow-200 transition-colors"
            >
              Maybe → Going
            </button>
            {!isOrganizer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnjoin?.(event._id);
                }}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        );
      case 'declined':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRegister?.(event._id, 'going');
            }}
            className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
          >
            Declined → Register
          </button>
        );
      default:
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegister?.(event._id, 'going');
              }}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Register
            </button>
            {isOrganizer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(event._id);
                }}
                className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        );
    }
  };

  if (variant === 'compact') {
    return (
      <div 
        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onView?.(event)}
      >
        {event.coverImage && (
          <img 
            src={event.coverImage} 
            alt={event.title}
            className="w-12 h-12 rounded-lg object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 truncate">{event.title}</h4>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(event.startDate), 'MMM d, h:mm a')}</span>
            {getEventTypeIcon(event.eventType)}
          </div>
        </div>
        {getStatusBadge()}
      </div>
    );
  }

  if (variant === 'calendar') {
    return (
      <div 
        className="p-2 bg-blue-100 border-l-4 border-blue-500 rounded text-xs cursor-pointer hover:bg-blue-200 transition-colors"
        onClick={() => onView?.(event)}
      >
        <div className="font-semibold text-blue-900 truncate">{event.title}</div>
        <div className="text-blue-700">{format(new Date(event.startDate), 'h:mm a')}</div>
      </div>
    );
  }

  // Default card variant
  return (
    <div 
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onView?.(event)}
    >
      {/* Cover Image */}
      {event.coverImage && (
        <div className="h-48 bg-slate-100 overflow-hidden">
          <img 
            src={event.coverImage} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getEventTypeIcon(event.eventType)}
              <span className="text-sm text-slate-600 capitalize">{event.eventType}</span>
              {event.category && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-sm text-slate-600 capitalize">{event.category}</span>
                </>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
              {event.title}
            </h3>
          </div>
          {getStatusBadge()}
        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-4">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              {format(new Date(event.startDate), 'EEEE, MMM d, yyyy')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
            </span>
          </div>

          {/* Location */}
          {event.eventType === 'offline' && event.location?.venue && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm truncate">{event.location.venue}</span>
            </div>
          )}

          {event.eventType === 'online' && event.onlineDetails?.platform && (
            <div className="flex items-center gap-2 text-slate-600">
              <Monitor className="w-4 h-4" />
              <span className="text-sm">{event.onlineDetails.platform}</span>
            </div>
          )}

          {/* Organizer */}
          {event.organizer && (
            <div className="flex items-center gap-2 text-slate-600">
              <img 
                src={event.organizer.profileImage || '/default-avatar.jpg'} 
                alt={event.organizer.username}
                className="w-4 h-4 rounded-full"
              />
              <span className="text-sm">by {event.organizer.username}</span>
            </div>
          )}

          {/* Community */}
          {event.community && (
            <div className="flex items-center gap-2 text-slate-600">
              <img 
                src={event.community.coverImage || '/default-header.jpg'} 
                alt={event.community.name}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">{event.community.name}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-slate-700 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex items-center gap-4">
            {/* Attendee Count */}
            <div className="flex items-center gap-1 text-slate-600">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                {attendeeCount}
                {event.capacity && ` / ${event.capacity}`}
                {' going'}
              </span>
            </div>

            {/* Price */}
            {event.price > 0 && (
              <div className="text-sm text-green-600 font-semibold">
                ${event.price}
              </div>
            )}
            {event.price === 0 && (
              <div className="text-sm text-green-600 font-semibold">
                Free
              </div>
            )}
          </div>

          {/* Action Button */}
          {showActions && (
            <div onClick={(e) => e.stopPropagation()}>
              {getAttendanceButton()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;