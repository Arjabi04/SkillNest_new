import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../layouts/Sidebar';
import EventCard from '../components/EventCard';
import TagInput from '../components/TagInput';
import PageHeader from '../components/PageHeader';
import useSidebarLayout from '../hooks/useSidebarLayout';
import { useInbox } from '../hooks/useInbox';
import { clearAuth } from '../utils/tokenUtils';
import { API_URL } from '../api/auth';

// Icon components
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

const Search = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const Filter = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
  </svg>
);

const Zap = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const X = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    eventType: 'all',
    category: 'all',
    timeFrame: 'all'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: 'online',
    category: 'workshop',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    price: 0,
    capacity: '',
    allowRegistration: true,
    tags: [],
    // Online event fields
    onlinePlatform: 'zoom',
    meetingLink: '',
    // Offline event fields
    venue: '',
    address: '',
    city: '',
    country: ''
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { mainContentClass } = useSidebarLayout();
  const { createDirectConversation } = useInbox();

  const API_BASE = `${API_URL}`;
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId') || localStorage.getItem('userId');
  const todayDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // Placeholder data - Replace with actual API calls


  useEffect(() => {
    Promise.all([loadEvents(), loadRecommendedEvents()]);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, recommendedEvents, searchTerm, selectedFilters]);

  useEffect(() => {
    if (!selectedEvent?._id) return;

    const updatedSelectedEvent = events.find((event) => event._id === selectedEvent._id);
    if (updatedSelectedEvent) {
      setSelectedEvent(updatedSelectedEvent);
    }
  }, [events, selectedEvent?._id]);

  async function loadEvents() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Events data loaded:', data);
        setEvents(data.events || data);
      } else {
        console.error('Failed to load events');
        setEvents([]);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setEvents([]);
    }
  }

  async function loadRecommendedEvents() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recommendations/events?limit=24`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendedEvents(Array.isArray(data.recommendations) ? data.recommendations : []);
      } else {
        console.error('Failed to load recommended events');
        setRecommendedEvents([]);
      }
    } catch (err) {
      console.error('Error loading recommended events:', err);
      setRecommendedEvents([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    const now = new Date();
    const sourceEvents = recommendedEvents.length > 0 ? recommendedEvents : events;
    let filtered = sourceEvents.filter((event) => {
      const eventEndDate = event?.endDate ? new Date(event.endDate) : null;
      const isEnded = eventEndDate ? eventEndDate < now : false;
      return !isEnded || isCurrentUserOrganizer(event);
    });

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Event type filter
    if (selectedFilters.eventType !== 'all') {
      filtered = filtered.filter(event => event.eventType === selectedFilters.eventType);
    }

    // Category filter
    if (selectedFilters.category !== 'all') {
      filtered = filtered.filter(event => event.category === selectedFilters.category);
    }

    // Time frame filter
    if (selectedFilters.timeFrame !== 'all') {
      const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      switch (selectedFilters.timeFrame) {
        case 'today':
          filtered = filtered.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          filtered = filtered.filter(event => new Date(event.startDate) <= oneWeek);
          break;
        case 'month':
          filtered = filtered.filter(event => new Date(event.startDate) <= oneMonth);
          break;
      }
    }

    setFilteredEvents(filtered);
  }

  const handleRegister = async (eventId, status) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/events/${eventId}/attend`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status })
      });

      // Reload events to get updated data
      await Promise.all([loadEvents(), loadRecommendedEvents()]);
      console.log(`${status} for event ${eventId}`);
    } catch (err) {
      console.error('Error updating registration:', err);
    }
  };

  const handleUnjoinEvent = async (eventId) => {
    if (!confirm('Are you sure you want to leave this event?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/events/${eventId}/attend`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        // Reload events to get updated data
        await Promise.all([loadEvents(), loadRecommendedEvents()]);
        console.log(`Successfully left event ${eventId}`);
      } else {
        const error = await response.json();
        alert(error.msg || 'Failed to leave event');
      }
    } catch (err) {
      console.error('Error leaving event:', err);
      alert('Failed to leave event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        // Remove event from local state
        setEvents(prev => prev.filter(event => event._id !== eventId));
        setRecommendedEvents(prev => prev.filter(event => event._id !== eventId));
        console.log(`Successfully deleted event ${eventId}`);
      } else {
        const error = await response.json();
        alert(error.msg || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event');
    }
  };

  const handleFormChange = (field, value) => {
    setEventForm((prev) => {
      const next = {
        ...prev,
        [field]: value
      };

      // Keep the end date/time aligned when start moves forward.
      if (field === 'startDate') {
        if (next.endDate && next.endDate < value) {
          next.endDate = value;
        }

        if (
          next.endDate === value &&
          next.startTime &&
          next.endTime &&
          next.endTime < next.startTime
        ) {
          next.endTime = next.startTime;
        }
      }

      if (field === 'endDate' && next.startDate && value < next.startDate) {
        next.endDate = next.startDate;
      }

      if (
        field === 'startTime' &&
        next.startDate &&
        next.endDate &&
        next.startDate === next.endDate &&
        next.endTime &&
        next.endTime < value
      ) {
        next.endTime = value;
      }

      if (
        field === 'endTime' &&
        next.startDate &&
        next.endDate &&
        next.startDate === next.endDate &&
        next.startTime &&
        value &&
        value < next.startTime
      ) {
        next.endTime = next.startTime;
      }

      return next;
    });
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    const startDateTime = new Date(`${eventForm.startDate}T${eventForm.startTime}`);
    const endDateTime = new Date(`${eventForm.endDate}T${eventForm.endTime}`);

    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
      alert('Please enter a valid start and end date/time.');
      return;
    }

    if (endDateTime <= startDateTime) {
      alert('End date/time must be after start date/time.');
      return;
    }

    setCreateLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare event data
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        eventType: eventForm.eventType,
        category: eventForm.category,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        price: parseFloat(eventForm.price) || 0,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity) : null,
        allowRegistration: eventForm.allowRegistration,
        tags: eventForm.tags
      };

      // Add online/offline specific fields
      if (eventForm.eventType === 'online' || eventForm.eventType === 'hybrid') {
        eventData.onlineDetails = {
          platform: eventForm.onlinePlatform,
          meetingLink: eventForm.meetingLink
        };
      }
      
      if (eventForm.eventType === 'offline' || eventForm.eventType === 'hybrid') {
        eventData.location = {
          venue: eventForm.venue,
          address: eventForm.address,
          city: eventForm.city,
          country: eventForm.country
        };
      }

      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const createdPayload = await response.json();
        const newEvent = createdPayload?.event || createdPayload;
        if (newEvent?._id) {
          setEvents(prev => [newEvent, ...prev]);
        }

        alert(
          createdPayload?.msg ||
          'Your event is being reviewed by the admin. Please wait for approval.'
        );

        setShowCreateModal(false);
        // Reset form
        setEventForm({
          title: '',
          description: '',
          eventType: 'online',
          category: 'workshop',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: '',
          price: 0,
          capacity: '',
          allowRegistration: true,
          tags: [],
          onlinePlatform: 'zoom',
          meetingLink: '',
          venue: '',
          address: '',
          city: '',
          country: ''
        });
        await Promise.all([loadEvents(), loadRecommendedEvents()]);
      } else {
        const error = await response.json();
        alert(error?.msg || 'Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event');
    }
    
    setCreateLoading(false);
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event || null);
  };

  const handleMessageOrganizer = async (event) => {
    const organizerId = event?.organizer?._id || event?.organizer;
    if (!organizerId || String(organizerId) === String(userId)) return;

    try {
      const conversation = await createDirectConversation(String(organizerId));
      if (conversation?._id) {
        navigate(`/inbox?conversationId=${conversation._id}`);
      }
    } catch (error) {
      console.error('Error starting organizer conversation:', error);
      alert('Unable to start a conversation with the organizer right now.');
    }
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const isCurrentUserOrganizer = (event) => {
    const organizerId = event?.organizer?._id || event?.organizer;
    return organizerId && String(organizerId) === String(userId);
  };

  const hasCurrentUserJoined = (event) => {
    return event?.attendees?.some((attendee) => {
      const attendeeId = attendee?.user?._id || attendee?.user;
      return String(attendeeId) === String(userId) && attendee?.status === 'going';
    });
  };

  const createdEvents = events.filter(isCurrentUserOrganizer);
  const joinedEvents = events.filter((event) => !isCurrentUserOrganizer(event) && hasCurrentUserJoined(event));

  const selectedIsOrganizer = isCurrentUserOrganizer(selectedEvent);
  const selectedHasJoined = hasCurrentUserJoined(selectedEvent);
  const selectedGoingCount = selectedEvent?.attendees?.filter((attendee) => attendee?.status === 'going').length || 0;
  const selectedCapacity = Number(selectedEvent?.capacity) || null;
  const selectedIsFull = Boolean(selectedCapacity && selectedGoingCount >= selectedCapacity && !selectedHasJoined);
  const selectedIsPast = Boolean(selectedEvent?.endDate && new Date(selectedEvent.endDate) < new Date());
  const selectedCanRegister = Boolean(
    selectedEvent &&
    selectedEvent.allowRegistration !== false &&
    !selectedIsOrganizer &&
    !selectedHasJoined &&
    !selectedIsPast &&
    !selectedIsFull
  );

  const formatEventDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';

    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* Left Sidebar */}
      <Sidebar 
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`flex-1 ${mainContentClass}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          <PageHeader
            eyebrow="Events"
            title="Discover Events"
            description="Discover upcoming events, workshops, and meetups in your communities."
            rightContent={(
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="w-5 h-5" /> Create Event
              </button>
            )}
          />

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Event Type Filter */}
              <select 
                value={selectedFilters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>

              {/* Category Filter */}
              <select 
                value={selectedFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="workshop">Workshop</option>
                <option value="seminar">Seminar</option>
                <option value="networking">Networking</option>
                <option value="conference">Conference</option>
                <option value="meetup">Meetup</option>
                <option value="social">Social</option>
                <option value="training">Training</option>
              </select>

              {/* Time Frame Filter */}
              <select 
                value={selectedFilters.timeFrame}
                onChange={(e) => handleFilterChange('timeFrame', e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Events Content */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
            <div className="xl:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 animate-pulse">
                      <div className="h-48 bg-slate-200 rounded-t-xl"></div>
                      <div className="p-6 space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-100 rounded"></div>
                          <div className="h-3 bg-slate-100 rounded w-4/5"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-700 mb-2">No Events Found</h3>
                  <p className="text-slate-500 mb-6">
                    {searchTerm || Object.values(selectedFilters).some(f => f !== 'all')
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to create an event!'}
                  </p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard 
                      key={event._id}
                      event={event}
                      currentUserId={userId}
                      onRegister={handleRegister}
                      onUnjoin={handleUnjoinEvent}
                      onDelete={handleDeleteEvent}
                      onView={handleViewEvent}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="xl:col-span-1 bg-white rounded-xl border border-slate-200 p-4 space-y-6 xl:sticky xl:top-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Events Created</h3>
                {createdEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">You haven't created any events yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {createdEvents.map((event) => (
                      <button
                        key={`created-${event._id}`}
                        onClick={() => handleViewEvent(event)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {event.approvalStatus === 'pending'
                            ? 'Waiting admin approval'
                            : formatEventDate(event.startDate)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Events Joined</h3>
                {joinedEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">You haven't joined any events yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {joinedEvents.map((event) => (
                      <button
                        key={`joined-${event._id}`}
                        onClick={() => handleViewEvent(event)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-800 truncate">{event.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{formatEventDate(event.startDate)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>


        </div>
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl">Create New Event</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Basic Information</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your event"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
                    <select
                      value={eventForm.eventType}
                      onChange={(e) => handleFormChange('eventType', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => handleFormChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="networking">Networking</option>
                      <option value="competition">Competition</option>
                      <option value="meetup">Meetup</option>
                      <option value="conference">Conference</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Date & Time</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => handleFormChange('startDate', e.target.value)}
                      min={todayDate}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => handleFormChange('startTime', e.target.value)}
                      min={eventForm.startDate === todayDate ? currentTime : undefined}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) => handleFormChange('endDate', e.target.value)}
                      min={eventForm.startDate || todayDate}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => handleFormChange('endTime', e.target.value)}
                      min={
                        eventForm.startDate &&
                        eventForm.endDate &&
                        eventForm.startDate === eventForm.endDate
                          ? eventForm.startTime || undefined
                          : undefined
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Online Details */}
              {(eventForm.eventType === 'online' || eventForm.eventType === 'hybrid') && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Online Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Platform</label>
                      <select
                        value={eventForm.onlinePlatform}
                        onChange={(e) => handleFormChange('onlinePlatform', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="zoom">Zoom</option>
                        <option value="teams">Microsoft Teams</option>
                        <option value="meet">Google Meet</option>
                        <option value="discord">Discord</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Link</label>
                      <input
                        type="url"
                        value={eventForm.meetingLink}
                        onChange={(e) => handleFormChange('meetingLink', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Location Details */}
              {(eventForm.eventType === 'offline' || eventForm.eventType === 'hybrid') && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Location Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Venue Name</label>
                    <input
                      type="text"
                      value={eventForm.venue}
                      onChange={(e) => handleFormChange('venue', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter venue name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                    <input
                      type="text"
                      value={eventForm.address}
                      onChange={(e) => handleFormChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">City</label>
                      <input
                        type="text"
                        value={eventForm.city}
                        onChange={(e) => handleFormChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={eventForm.country}
                        onChange={(e) => handleFormChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Additional Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={eventForm.price}
                      onChange={(e) => handleFormChange('price', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Capacity (optional)</label>
                    <input
                      type="number"
                      min="1"
                      value={eventForm.capacity}
                      onChange={(e) => handleFormChange('capacity', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
                  <TagInput 
                    tags={eventForm.tags}
                    setTags={(newTags) => handleFormChange('tags', newTags)}
                    placeholder="Type tag name and press Enter..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    checked={eventForm.allowRegistration}
                    onChange={(e) => handleFormChange('allowRegistration', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="allowRegistration" className="ml-2 text-sm font-medium text-slate-700">
                    Allow public registration
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {createLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl flex items-center justify-between">
              <h3 className="font-bold text-xl text-slate-900">Event Details</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Close event details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-2xl font-bold text-slate-900">{selectedEvent.title || 'Untitled Event'}</h4>
                <p className="text-sm text-slate-500 mt-1 capitalize">
                  {(selectedEvent.eventType || 'event')} • {(selectedEvent.category || 'general')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Start</p>
                  <p className="text-sm font-medium text-slate-800 mt-1">{formatEventDate(selectedEvent.startDate)}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">End</p>
                  <p className="text-sm font-medium text-slate-800 mt-1">{formatEventDate(selectedEvent.endDate)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Description</p>
                <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{selectedEvent.description || 'No description available.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Organizer</p>
                  <p className="text-sm font-medium text-slate-800 mt-1">{selectedEvent.organizer?.username || 'Unknown'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Price</p>
                  <p className="text-sm font-medium text-slate-800 mt-1">
                    {Number(selectedEvent.price) > 0 ? `$${selectedEvent.price}` : 'Free'}
                  </p>
                </div>
              </div>

              {(selectedEvent.location?.venue || selectedEvent.onlineDetails?.platform) && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Location / Platform</p>
                  {selectedEvent.location?.venue && (
                    <p className="text-sm text-slate-700">Venue: {selectedEvent.location.venue}</p>
                  )}
                  {selectedEvent.onlineDetails?.platform && (
                    <p className="text-sm text-slate-700">Platform: {selectedEvent.onlineDetails.platform}</p>
                  )}
                </div>
              )}

              {Array.isArray(selectedEvent.tags) && selectedEvent.tags.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                {selectedIsOrganizer ? (
                  <span className="px-3 py-2 bg-purple-100 text-purple-700 text-sm rounded-lg font-medium">
                    You are the organizer
                  </span>
                ) : selectedHasJoined ? (
                  <button
                    onClick={() => handleUnjoinEvent(selectedEvent._id)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Leave Event
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegister(selectedEvent._id, 'going')}
                    disabled={!selectedCanRegister}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Join Event
                  </button>
                )}

                {!selectedIsOrganizer && (
                  <button
                    onClick={() => handleMessageOrganizer(selectedEvent)}
                    className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-colors"
                  >
                    Message Organizer
                  </button>
                )}

                {!selectedIsOrganizer && !selectedHasJoined && !selectedCanRegister && (
                  <span className="text-sm text-slate-500">
                    {selectedIsPast
                      ? 'Event has ended'
                      : selectedIsFull
                        ? 'Event is full'
                        : 'Registration is not available'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
