import React from "react";
import { Calendar, Plus, Search } from "lucide-react";
import Sidebar from "../../layouts/Sidebar";
import EventCard from "../EventCard";
import PageHeader from "../PageHeader";

const EventsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 animate-pulse">
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
);

const EventsSummaryList = ({ title, emptyText, events, formatEventDate, onView }) => (
    <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>
        {events.length === 0 ? (
            <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {events.map((event) => (
                    <button
                        key={`${title}-${event._id}`}
                        onClick={() => onView(event)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                        <p className="text-sm font-medium text-slate-800 truncate">
                            {event.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {event.approvalStatus === "pending"
                                ? "Waiting admin approval"
                                : formatEventDate(event.startDate)}
                        </p>
                    </button>
                ))}
            </div>
        )}
    </div>
);

const EventsListView = ({
    mainContentClass,
    loading,
    searchTerm,
    onSearchChange,
    selectedFilters,
    onFilterChange,
    filteredEvents,
    createdEvents,
    joinedEvents,
    userId,
    onOpenCreate,
    onRegister,
    onUnjoin,
    onDelete,
    onView,
    formatEventDate,
}) => (
    <div className="min-h-screen bg-slate-50 font-sans flex">
        <Sidebar />

        <main className={`flex-1 ${mainContentClass}`}>
            <div className="max-w-7xl mx-auto px-6 py-8">
                <PageHeader
                    eyebrow="Events"
                    title="Discover Events"
                    description="Discover upcoming events, workshops, and meetups in your communities."
                    rightContent={
                        <button
                            onClick={onOpenCreate}
                            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                            <Plus className="w-5 h-5" /> Create Event
                        </button>
                    }
                />

                <div className="mb-8 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <select
                            value={selectedFilters.eventType}
                            onChange={(e) =>
                                onFilterChange("eventType", e.target.value)
                            }
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Types</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="hybrid">Hybrid</option>
                        </select>

                        <select
                            value={selectedFilters.category}
                            onChange={(e) =>
                                onFilterChange("category", e.target.value)
                            }
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Categories</option>
                            <option value="workshop">Workshop</option>
                            <option value="seminar">Seminar</option>
                            <option value="networking">Networking</option>
                            <option value="conference">Conference</option>
                            <option value="meetup">Meetup</option>
                            <option value="social">Social</option>
                            <option value="training">Training</option>
                        </select>

                        <select
                            value={selectedFilters.timeFrame}
                            onChange={(e) =>
                                onFilterChange("timeFrame", e.target.value)
                            }
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
                    <div className="xl:col-span-3">
                        {loading ? (
                            <EventsSkeleton />
                        ) : filteredEvents.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Calendar className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">
                                    No Events Found
                                </h3>
                                <p className="text-slate-500 mb-6">
                                    {searchTerm ||
                                    Object.values(selectedFilters).some(
                                        (f) => f !== "all",
                                    )
                                        ? "Try adjusting your search or filters"
                                        : "Be the first to create an event!"}
                                </p>
                                <button
                                    onClick={onOpenCreate}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
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
                                        onRegister={onRegister}
                                        onUnjoin={onUnjoin}
                                        onDelete={onDelete}
                                        onView={onView}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className="xl:col-span-1 bg-white rounded-xl border border-slate-200 p-4 space-y-6 xl:sticky xl:top-6">
                        <EventsSummaryList
                            title="Events Created"
                            emptyText="You haven't created any events yet."
                            events={createdEvents}
                            formatEventDate={formatEventDate}
                            onView={onView}
                        />
                        <EventsSummaryList
                            title="Events Joined"
                            emptyText="You haven't joined any events yet."
                            events={joinedEvents}
                            formatEventDate={formatEventDate}
                            onView={onView}
                        />
                    </aside>
                </div>
            </div>
        </main>
    </div>
);

export default EventsListView;
