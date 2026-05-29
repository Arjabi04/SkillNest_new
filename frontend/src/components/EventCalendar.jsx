import React, { useState } from "react";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    getDay,
    isSameMonth,
    isToday,
    isSameDay,
} from "date-fns";
import EventCard from "./EventCard";
import "./EventCalendar.css";

import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
} from "lucide-react";

const EventCalendar = ({
    events = [],
    onEventClick,
    onDateClick,
    currentUserId,
    className = "",
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState("month"); // 'month', 'week', 'day'

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarDays = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
    });

    // Add empty cells for days before the month starts
    const startPadding = getDay(monthStart);
    const paddedDays = [...Array(startPadding).fill(null), ...calendarDays];

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const getEventsForDate = (date) => {
        if (!date) return [];
        return events.filter((event) =>
            isSameDay(new Date(event.startDate), date),
        );
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        onDateClick?.(date);
    };

    const renderMonthView = () => (
        <div className="event-calendar-month-view">
            {/* Calendar Header */}
            <div className="event-calendar-month-header">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="event-calendar-nav-btn">
                    <ChevronLeft className="event-calendar-nav-icon" />
                </button>

                <h3 className="event-calendar-month-title">
                    {format(currentDate, "MMMM yyyy")}
                </h3>

                <button
                    onClick={() => navigateMonth(1)}
                    className="event-calendar-nav-btn">
                    <ChevronRight className="event-calendar-nav-icon" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="event-calendar-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                        <div key={day} className="event-calendar-weekday">
                            {day}
                        </div>
                    ),
                )}
            </div>

            {/* Calendar Grid */}
            <div className="event-calendar-days-grid">
                {paddedDays.map((date, index) => {
                    if (!date) {
                        return (
                            <div
                                key={index}
                                className="event-calendar-day-cell empty"
                            />
                        );
                    }

                    const dayEvents = getEventsForDate(date);
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isTodayDate = isToday(date);
                    const isSelected =
                        selectedDate && isSameDay(date, selectedDate);

                    return (
                        <div
                            key={date.toISOString()}
                            className={`event-calendar-day-cell ${
                                !isCurrentMonth ? "other-month" : ""
                            } ${isSelected ? "selected" : ""}`}
                            onClick={() => handleDateClick(date)}>
                            <div
                                className={`event-calendar-day-number ${
                                    isTodayDate
                                        ? "today"
                                        : isCurrentMonth
                                          ? "current-month"
                                          : "other-month"
                                }`}>
                                {format(date, "d")}
                            </div>

                            {/* Event indicators */}
                            <div className="event-calendar-day-events">
                                {dayEvents.slice(0, 2).map((event) => (
                                    <div
                                        key={event._id}
                                        className="event-calendar-event-pill"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick?.(event);
                                        }}>
                                        {format(
                                            new Date(event.startDate),
                                            "HH:mm",
                                        )}{" "}
                                        {event.title}
                                    </div>
                                ))}
                                {dayEvents.length > 2 && (
                                    <div className="event-calendar-event-more">
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
        <div className="event-calendar-upcoming-container">
            <h3 className="event-calendar-upcoming-title">
                <CalendarIcon className="w-5 h-5" />
                Upcoming Events
            </h3>

            {events.length === 0 ? (
                <div className="event-calendar-empty-state">
                    <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="event-calendar-empty-text">
                        No upcoming events
                    </p>
                </div>
            ) : (
                <div className="event-calendar-upcoming-list">
                    {events
                        .filter(
                            (event) => new Date(event.startDate) >= new Date(),
                        )
                        .sort(
                            (a, b) =>
                                new Date(a.startDate) - new Date(b.startDate),
                        )
                        .slice(0, 5)
                        .map((event) => (
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
        <div className={`event-calendar-container ${className}`}>
            {/* View Toggle */}
            <div className="event-calendar-header">
                <h2 className="event-calendar-title">Calendar</h2>
                <div className="event-calendar-view-toggle">
                    <button
                        onClick={() => setView("month")}
                        className={`event-calendar-toggle-btn ${
                            view === "month" ? "active" : "inactive"
                        }`}>
                        Month
                    </button>
                    <button
                        onClick={() => setView("list")}
                        className={`event-calendar-toggle-btn ${
                            view === "list" ? "active" : "inactive"
                        }`}>
                        List
                    </button>
                </div>
            </div>

            {/* Calendar Content */}
            {view === "month" ? (
                <div className="event-calendar-grid-container">
                    <div className="event-calendar-month-col">
                        {renderMonthView()}
                    </div>
                    <div className="event-calendar-upcoming-col">
                        {renderUpcomingEvents()}
                    </div>
                </div>
            ) : (
                renderUpcomingEvents()
            )}

            {/* Selected Date Events */}
            {selectedDate && (
                <div className="event-calendar-selected-events">
                    <h3 className="event-calendar-selected-title">
                        Events on {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </h3>

                    {getEventsForDate(selectedDate).length === 0 ? (
                        <div className="event-calendar-selected-empty">
                            <p
                                style={{
                                    color: "var(--color-slate-500)",
                                    margin: 0,
                                }}>
                                No events on this date
                            </p>
                        </div>
                    ) : (
                        <div className="event-calendar-selected-grid">
                            {getEventsForDate(selectedDate).map((event) => (
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
