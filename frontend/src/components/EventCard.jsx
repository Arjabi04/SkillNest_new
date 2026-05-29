import React from "react";
import { format, isPast, isSameDay, addDays } from "date-fns";
import { Calendar, Clock, MapPin, Monitor, Users, Tag } from "lucide-react";
import "./EventCard.css";

const EventCard = ({
    event,
    onRegister,
    onUnjoin,
    onDelete,
    onView,
    currentUserId,
    showActions = true,
    variant = "default", // 'default', 'compact', 'calendar'
}) => {
    // Add defensive check for event data
    if (!event) {
        return (
            <div
                style={{
                    padding: "1rem",
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                }}>
                Error: Event data not available
            </div>
        );
    }

    console.log("EventCard - currentUserId:", currentUserId);
    console.log("EventCard - event:", event);

    const isEventPast = isPast(new Date(event.endDate));
    const isEventToday = isSameDay(new Date(event.startDate), new Date());
    const isEventSoon = new Date(event.startDate) <= addDays(new Date(), 7);

    const userAttendanceStatus = event.attendees?.find(
        (a) => a.user?._id === currentUserId || a.user === currentUserId,
    )?.status;

    const isOrganizer =
        event.organizer?._id === currentUserId ||
        event.organizer === currentUserId;
    const attendeeCount =
        event.attendees?.filter((a) => a.status === "going").length || 0;
    const canRegister =
        event.allowRegistration &&
        !isEventPast &&
        (!event.capacity || attendeeCount < event.capacity);

    const getEventTypeIcon = (type) => {
        switch (type) {
            case "online":
                return (
                    <Monitor
                        className="event-card-detail-icon"
                        style={{ width: "1rem", height: "1rem" }}
                    />
                );
            case "offline":
                return (
                    <MapPin
                        className="event-card-detail-icon"
                        style={{ width: "1rem", height: "1rem" }}
                    />
                );
            case "hybrid":
                return (
                    <div style={{ display: "flex" }}>
                        <Monitor
                            style={{ width: "0.75rem", height: "0.75rem" }}
                        />
                        <MapPin
                            style={{ width: "0.75rem", height: "0.75rem" }}
                        />
                    </div>
                );
            default:
                return (
                    <Calendar
                        className="event-card-detail-icon"
                        style={{ width: "1rem", height: "1rem" }}
                    />
                );
        }
    };

    const getStatusBadge = () => {
        if (isEventPast) {
            return <span className="event-badge event-badge-past">Past</span>;
        }
        if (isEventToday) {
            return <span className="event-badge event-badge-today">Today</span>;
        }
        if (isEventSoon) {
            return <span className="event-badge event-badge-soon">Soon</span>;
        }
        return null;
    };

    const getAttendanceButton = () => {
        if (isOrganizer) {
            return (
                <span className="event-btn event-btn-organizer">Organizer</span>
            );
        }

        if (!canRegister) {
            return (
                <span className="event-btn event-btn-disabled">
                    {isEventPast ? "Event Ended" : "Full"}
                </span>
            );
        }

        switch (userAttendanceStatus) {
            case "going":
                return (
                    <div className="event-btn-group">
                        {isOrganizer ? (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(event._id);
                                }}
                                className="event-btn event-btn-danger">
                                Delete Event
                            </button>
                        ) : (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUnjoin?.(event._id);
                                }}
                                className="event-btn event-btn-danger">
                                Leave Event
                            </button>
                        )}
                    </div>
                );
            case "maybe":
                return (
                    <div className="event-btn-group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRegister?.(event._id, "going");
                            }}
                            className="event-btn event-btn-warning">
                            Maybe → Going
                        </button>
                        {!isOrganizer && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onUnjoin?.(event._id);
                                }}
                                className="event-btn event-btn-ghost"
                                style={{
                                    paddingLeft: "0.5rem",
                                    paddingRight: "0.5rem",
                                }}>
                                ×
                            </button>
                        )}
                    </div>
                );
            case "declined":
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRegister?.(event._id, "going");
                        }}
                        className="event-btn event-btn-danger">
                        Declined → Register
                    </button>
                );
            default:
                return (
                    <div className="event-btn-group">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRegister?.(event._id, "going");
                            }}
                            className="event-btn event-btn-primary">
                            Register
                        </button>
                        {isOrganizer && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(event._id);
                                }}
                                className="event-btn event-btn-danger">
                                Delete
                            </button>
                        )}
                    </div>
                );
        }
    };

    if (variant === "compact") {
        return (
            <div className="event-card-compact" onClick={() => onView?.(event)}>
                {event.coverImage && (
                    <img
                        src={event.coverImage}
                        alt={event.title}
                        className="event-card-compact-img"
                    />
                )}
                <div className="event-card-compact-content">
                    <h4 className="event-card-compact-title">{event.title}</h4>
                    <div className="event-card-compact-details">
                        <Calendar
                            style={{ width: "0.75rem", height: "0.75rem" }}
                        />
                        <span>
                            {format(new Date(event.startDate), "MMM d, h:mm a")}
                        </span>
                        {getEventTypeIcon(event.eventType)}
                    </div>
                </div>
                {getStatusBadge()}
            </div>
        );
    }

    if (variant === "calendar") {
        return (
            <div
                className="event-card-calendar"
                onClick={() => onView?.(event)}>
                <div className="event-card-calendar-title">{event.title}</div>
                <div className="event-card-calendar-time">
                    {format(new Date(event.startDate), "h:mm a")}
                </div>
            </div>
        );
    }

    // Default card variant
    return (
        <div className="event-card" onClick={() => onView?.(event)}>
            {/* Cover Image */}
            {event.coverImage && (
                <div className="event-card-cover">
                    <img
                        src={event.coverImage}
                        alt={event.title}
                        className="event-card-img"
                    />
                </div>
            )}

            <div className="event-card-content">
                {/* Header */}
                <div className="event-card-header">
                    <div style={{ flex: 1 }}>
                        <div className="event-card-type-row">
                            {getEventTypeIcon(event.eventType)}
                            <span className="event-card-type-text">
                                {event.eventType}
                            </span>
                            {event.category && (
                                <>
                                    <span className="event-card-type-dot">
                                        •
                                    </span>
                                    <span className="event-card-type-text">
                                        {event.category}
                                    </span>
                                </>
                            )}
                        </div>
                        <h3 className="event-card-title">{event.title}</h3>
                    </div>
                    {getStatusBadge()}
                </div>

                {/* Event Details */}
                <div className="event-card-details">
                    {/* Date & Time */}
                    <div className="event-card-detail-item">
                        <Calendar style={{ width: "1rem", height: "1rem" }} />
                        <span className="event-card-detail-text">
                            {format(
                                new Date(event.startDate),
                                "EEEE, MMM d, yyyy",
                            )}
                        </span>
                    </div>

                    <div className="event-card-detail-item">
                        <Clock style={{ width: "1rem", height: "1rem" }} />
                        <span className="event-card-detail-text">
                            {format(new Date(event.startDate), "h:mm a")} -{" "}
                            {format(new Date(event.endDate), "h:mm a")}
                        </span>
                    </div>

                    {/* Location */}
                    {event.eventType === "offline" && event.location?.venue && (
                        <div className="event-card-detail-item">
                            <MapPin style={{ width: "1rem", height: "1rem" }} />
                            <span className="event-card-detail-text truncate">
                                {event.location.venue}
                            </span>
                        </div>
                    )}

                    {event.eventType === "online" &&
                        event.onlineDetails?.platform && (
                            <div className="event-card-detail-item">
                                <Monitor
                                    style={{ width: "1rem", height: "1rem" }}
                                />
                                <span className="event-card-detail-text">
                                    {event.onlineDetails.platform}
                                </span>
                            </div>
                        )}

                    {/* Organizer */}
                    {event.organizer && (
                        <div className="event-card-detail-item">
                            <img
                                src={
                                    event.organizer.profileImage ||
                                    "/default-avatar.jpg"
                                }
                                alt={event.organizer.username}
                                className="event-card-avatar"
                            />
                            <span className="event-card-detail-text">
                                by {event.organizer.username}
                            </span>
                        </div>
                    )}

                    {/* Community */}
                    {event.community && (
                        <div className="event-card-detail-item">
                            <img
                                src={
                                    event.community.coverImage ||
                                    "/default-header.jpg"
                                }
                                alt={event.community.name}
                                className="event-card-community-avatar"
                            />
                            <span className="event-card-detail-text">
                                {event.community.name}
                            </span>
                        </div>
                    )}
                </div>

                {/* Description */}
                <p className="event-card-desc">{event.description}</p>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                    <div className="event-card-tags">
                        {event.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="event-card-tag">
                                <Tag
                                    style={{
                                        width: "0.75rem",
                                        height: "0.75rem",
                                    }}
                                />
                                {tag}
                            </span>
                        ))}
                        {event.tags.length > 3 && (
                            <span className="event-card-tag more">
                                +{event.tags.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="event-card-footer">
                    <div className="event-card-stats">
                        {/* Attendee Count */}
                        <div className="event-card-detail-item">
                            <Users style={{ width: "1rem", height: "1rem" }} />
                            <span className="event-card-detail-text">
                                {attendeeCount}
                                {event.capacity && ` / ${event.capacity}`}
                                {" going"}
                            </span>
                        </div>

                        {/* Price */}
                        {event.price > 0 && (
                            <div className="event-card-price">
                                ${event.price}
                            </div>
                        )}
                        {event.price === 0 && (
                            <div className="event-card-price">Free</div>
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
