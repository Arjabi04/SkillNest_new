import React, { useState } from 'react';
import EventCard from './EventCard';
import EventCalendar from './EventCalendar';

const Calendar = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Plus = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Grid = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const List = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

// Placeholder events for demonstration
const placeholderEvents = [
  {
    _id: '1',
    title: 'Web Development Workshop',
    description: 'Learn modern web development with React and Node.js. Perfect for beginners and intermediate developers.',
    eventType: 'online',
    category: 'workshop',
    startDate: new Date(Date.now() + 86400000), // Tomorrow
    endDate: new Date(Date.now() + 90000000),
    organizer: { _id: '1', username: 'DevMaster', profileImage: null },
    community: { _id: '1', name: 'Web Dev Community', coverImage: null },
    attendees: [
      { user: '1', status: 'going' },
      { user: '2', status: 'going' },
      { user: '3', status: 'maybe' }
    ],
    tags: ['react', 'javascript', 'webdev'],
    price: 0,
    capacity: 50,
    allowRegistration: true,
    onlineDetails: { platform: 'Zoom', meetingLink: 'https://zoom.us/j/123456789' },
    coverImage: null
  },
  {
    _id: '2',
    title: 'AI/ML Networking Event',
    description: 'Connect with AI and ML professionals. Share experiences, learn about opportunities, and expand your network.',
    eventType: 'offline',
    category: 'networking',
    startDate: new Date(Date.now() + 172800000), // Day after tomorrow
    endDate: new Date(Date.now() + 176400000),
    organizer: { _id: '2', username: 'AIExpert', profileImage: null },
    community: { _id: '2', name: 'AI/ML Hub', coverImage: null },
    attendees: [
      { user: '2', status: 'going' },
      { user: '3', status: 'going' }
    ],
    tags: ['ai', 'machine-learning', 'networking'],
    price: 25,
    capacity: 30,
    allowRegistration: true,
    location: { 
      venue: 'Tech Innovation Center', 
      address: '123 Tech Street, Silicon Valley, CA',
      city: 'Palo Alto',
      country: 'USA'
    },
    coverImage: null
  },
  {
    _id: '3',
    title: 'Design Systems Masterclass',
    description: 'Deep dive into building scalable design systems. Learn best practices from industry experts.',
    eventType: 'hybrid',
    category: 'seminar',
    startDate: new Date(Date.now() + 259200000), // 3 days from now
    endDate: new Date(Date.now() + 266400000),
    organizer: { _id: '3', username: 'DesignGuru', profileImage: null },
    community: { _id: '3', name: 'UX/UI Designers', coverImage: null },
    attendees: [
      { user: '1', status: 'going' }
    ],
    tags: ['design', 'ui', 'ux', 'systems'],
    price: 49,
    capacity: 100,
    allowRegistration: true,
    location: { venue: 'Design Studio Downtown' },
    onlineDetails: { platform: 'Microsoft Teams' },
    coverImage: null
  }
];

const EventsDashboard = ({ 
  communityId = null, 
  currentUserId,
  className = ""
}) => {
  const [view, setView] = useState('grid'); // 'grid', 'list', 'calendar'
  const [events, setEvents] = useState(placeholderEvents);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter events by community if communityId is provided
  const displayEvents = communityId 
    ? events.filter(event => event.community?._id === communityId)
    : events;

  const handleRegister = (eventId, status) => {
    setEvents(prev => prev.map(event => {
      if (event._id === eventId) {
        const updatedAttendees = event.attendees.filter(a => 
          a.user !== currentUserId && a.user._id !== currentUserId
        );
        if (status !== 'declined') {
          updatedAttendees.push({ user: currentUserId, status });
        }
        return { ...event, attendees: updatedAttendees };
      }
      return event;
    }));
  };

  const handleViewEvent = (event) => {
    console.log('View event:', event);
    // TODO: Navigate to event detail page or open modal
  };

  const handleDateClick = (date) => {
    console.log('Date clicked:', date);
    // TODO: Filter events by date or create new event on this date
  };

  const renderViewToggle = () => (
    <div className="flex items-center bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => setView('grid')}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
          view === 'grid' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Grid className="w-4 h-4" />
        Grid
      </button>
      <button
        onClick={() => setView('list')}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
          view === 'list' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <List className="w-4 h-4" />
        List
      </button>
      <button
        onClick={() => setView('calendar')}
        className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
          view === 'calendar' 
            ? 'bg-white text-slate-900 shadow-sm' 
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <Calendar className="w-4 h-4" />
        Calendar
      </button>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayEvents.map(event => (
        <EventCard
          key={event._id}
          event={event}
          currentUserId={currentUserId}
          onRegister={handleRegister}
          onView={handleViewEvent}
        />
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {displayEvents.map(event => (
        <EventCard
          key={event._id}
          event={event}
          variant="compact"
          currentUserId={currentUserId}
          onRegister={handleRegister}
          onView={handleViewEvent}
        />
      ))}
    </div>
  );

  const renderCalendarView = () => (
    <EventCalendar
      events={displayEvents}
      currentUserId={currentUserId}
      onEventClick={handleViewEvent}
      onDateClick={handleDateClick}
    />
  );

  if (displayEvents.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {communityId ? 'Community Events' : 'Events'}
          </h2>
          {renderViewToggle()}
        </div>

        {/* Empty State */}
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">
            {communityId ? 'No Community Events' : 'No Events Found'}
          </h3>
          <p className="text-slate-500 mb-6">
            {communityId 
              ? 'This community doesn\'t have any events yet.' 
              : 'No events are available at the moment.'}
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        </div>

        {/* Create Event Modal Placeholder */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex justify-center items-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white p-8 rounded-2xl w-full max-w-md">
              <h3 className="font-bold text-xl mb-4 text-center">Create Event</h3>
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-slate-600 mb-6">
                  Event creation coming soon! Full event management system with calendar integration, invitations, and more.
                </p>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {communityId ? 'Community Events' : 'Events'}
          </h2>
          <p className="text-slate-600 mt-1">
            {displayEvents.length} {displayEvents.length === 1 ? 'event' : 'events'}
            {communityId ? ' in this community' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {renderViewToggle()}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
      </div>

      {/* Events Content */}
      <div className="min-h-[400px]">
        {view === 'grid' && renderGridView()}
        {view === 'list' && renderListView()}
        {view === 'calendar' && renderCalendarView()}
      </div>

      {/* Create Event Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white p-8 rounded-2xl w-full max-w-md">
            <h3 className="font-bold text-xl mb-4 text-center">Create Event</h3>
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-slate-600 mb-6">
                Event creation feature coming soon! This will include:
                <br />• Online/Offline event support
                <br />• Calendar integration  
                <br />• Email invitations
                <br />• Location management
                <br />• Reminders & notifications
              </p>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsDashboard;