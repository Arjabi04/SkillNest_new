import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay } from 'date-fns';
import EventCard from './EventCard';

const ChevronLeft = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRight = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const Calendar = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const EventCalendar = ({ 
  events = [], 
  onEventClick,
  onDateClick,
  currentUserId,
  className = ""
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month'); // 'month', 'week', 'day'

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add empty cells for days before the month starts
  const startPadding = getDay(monthStart);
  const paddedDays = [
    ...Array(startPadding).fill(null),
    ...calendarDays
  ];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => 
      isSameDay(new Date(event.startDate), date)
    );
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const renderMonthView = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        
        <h3 className="text-lg font-semibold text-slate-900">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-slate-600 bg-slate-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {paddedDays.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-24 border-b border-r border-slate-100" />;
          }

          const dayEvents = getEventsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);

          return (
            <div 
              key={date.toISOString()}
              className={`h-24 border-b border-r border-slate-100 p-1 cursor-pointer hover:bg-slate-50 transition-colors ${
                !isCurrentMonth ? 'bg-slate-50 text-slate-400' : ''
              } ${isSelected ? 'bg-blue-50' : ''}`}
              onClick={() => handleDateClick(date)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isTodayDate ? 'text-blue-600' : isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {format(date, 'd')}
              </div>
              
              {/* Event indicators */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event, eventIndex) => (
                  <div
                    key={event._id}
                    className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded truncate hover:bg-blue-200 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    {format(new Date(event.startDate), 'HH:mm')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-slate-600">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUpcomingEvents = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Upcoming Events
      </h3>
      
      {events.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events
            .filter(event => new Date(event.startDate) >= new Date())
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 5)
            .map(event => (
              <EventCard
                key={event._id}
                event={event}
                variant="compact"
                currentUserId={currentUserId}
                onView={onEventClick}
                showActions={false}
              />
            ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Calendar</h2>
        <div className="bg-slate-100 rounded-lg p-1 flex">
          <button
            onClick={() => setView('month')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === 'month' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              view === 'list' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {view === 'month' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {renderMonthView()}
          </div>
          <div className="lg:col-span-1">
            {renderUpcomingEvents()}
          </div>
        </div>
      ) : (
        renderUpcomingEvents()
      )}

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Events on {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          
          {getEventsForDate(selectedDate).length === 0 ? (
            <div className="text-center py-6 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500">No events on this date</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getEventsForDate(selectedDate).map(event => (
                <EventCard
                  key={event._id}
                  event={event}
                  currentUserId={currentUserId}
                  onView={onEventClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCalendar;