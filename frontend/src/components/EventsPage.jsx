import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import EventCard from './EventCard';
import TagInput from './TagInput';
import useSidebarLayout from '../hooks/useSidebarLayout';
import { clearAuth } from '../utils/tokenUtils';

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

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    eventType: 'all',
    category: 'all',
    timeFrame: 'all'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const API_BASE = 'http://localhost:4000/api';
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId') || localStorage.getItem('userId');

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  // Placeholder data - Replace with actual API calls


  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, selectedFilters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/events', {
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
      setLoading(false);
    } catch (err) {
      console.error('Error loading events:', err);
      setEvents([]);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = events;

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
      const now = new Date();
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
  };

  const handleRegister = async (eventId, status) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/events/${eventId}/attend`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status })
      });

      // Reload events to get updated data
      loadEvents();
      console.log(`${status} for event ${eventId}`);
    } catch (err) {
      console.error('Error updating registration:', err);
    }
  };

  const handleUnjoinEvent = async (eventId) => {
    if (!confirm('Are you sure you want to leave this event?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/events/${eventId}/attend`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        // Reload events to get updated data
        loadEvents();
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
      const response = await fetch(`http://localhost:4000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });

      if (response.ok) {
        // Remove event from local state
        setEvents(prev => prev.filter(event => event._id !== eventId));
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
    setEventForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Prepare event data
      const eventData = {
        title: eventForm.title,
        description: eventForm.description,
        eventType: eventForm.eventType,
        category: eventForm.category,
        startDate: new Date(`${eventForm.startDate}T${eventForm.startTime}`),
        endDate: new Date(`${eventForm.endDate}T${eventForm.endTime}`),
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

      const response = await fetch('http://localhost:4000/api/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const newEvent = await response.json();
        setEvents(prev => [newEvent, ...prev]);
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
        console.log('Event created successfully!');
      } else {
        console.error('Failed to create event');
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
    
    setCreateLoading(false);
  };

  const handleViewEvent = (event) => {
    // TODO: Navigate to event detail page
    console.log('View event:', event);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
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
          
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-12 bg-blue-600 rounded-full" />
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
                    Events
                  </h1>
                </div>
                <p className="text-slate-600 font-medium text-lg max-w-2xl leading-relaxed">
                  Discover upcoming events, workshops, and meetups in your communities.
                </p>
              </div>
              
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create Event
              </button>
            </div>
          </header>

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

          {/* Events Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="text-center py-16">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Quick Actions Sidebar - Placeholder */}


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
    </div>
  );
};

export default EventsPage;