import React, { useState, useEffect } from "react";
import {
    format,
    isToday,
    isTomorrow,
    addMinutes,
    differenceInMinutes,
} from "date-fns";
import "./NotificationCenter.css";
import {
    BellRing as Bell,
    Calendar,
    Clock,
    X,
    Check,
    Settings,
} from "lucide-react";

// Notification types
const NOTIFICATION_TYPES = {
    EVENT_REMINDER: "event_reminder",
    EVENT_STARTING: "event_starting",
    EVENT_INVITATION: "event_invitation",
    CALENDAR_SYNC: "calendar_sync",
    SYSTEM: "system",
};

// Placeholder notifications
const placeholderNotifications = [
    {
        id: "1",
        type: NOTIFICATION_TYPES.EVENT_REMINDER,
        title: "Event Reminder",
        message: "Web Development Workshop starts in 1 hour",
        eventId: "1",
        eventTitle: "Web Development Workshop",
        eventStartTime: new Date(Date.now() + 3600000), // 1 hour from now
        isRead: false,
        createdAt: new Date(Date.now() - 300000), // 5 minutes ago
        actions: [
            { label: "Join Event", action: "join", primary: true },
            { label: "Remind Later", action: "snooze" },
        ],
    },
    {
        id: "2",
        type: NOTIFICATION_TYPES.EVENT_STARTING,
        title: "Event Starting Soon",
        message: "AI/ML Networking Event starts in 15 minutes",
        eventId: "2",
        eventTitle: "AI/ML Networking Event",
        eventStartTime: new Date(Date.now() + 900000), // 15 minutes from now
        isRead: false,
        createdAt: new Date(Date.now() - 60000), // 1 minute ago
        actions: [
            { label: "View Location", action: "location", primary: true },
            { label: "Dismiss", action: "dismiss" },
        ],
    },
    {
        id: "3",
        type: NOTIFICATION_TYPES.EVENT_INVITATION,
        title: "Event Invitation",
        message: "You've been invited to Design Systems Masterclass",
        eventId: "3",
        eventTitle: "Design Systems Masterclass",
        eventStartTime: new Date(Date.now() + 172800000), // 2 days from now
        isRead: true,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        actions: [
            { label: "Accept", action: "accept", primary: true },
            { label: "Decline", action: "decline" },
        ],
    },
];

const NotificationCenter = ({ className = "", onNotificationAction }) => {
    const [notifications, setNotifications] = useState(
        placeholderNotifications,
    );
    const [showSettings, setShowSettings] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        emailReminders: true,
        pushNotifications: true,
        reminderTiming: {
            "1_hour": true,
            "15_minutes": true,
            "5_minutes": false,
        },
        quietHours: {
            enabled: false,
            start: "22:00",
            end: "08:00",
        },
    });

    // Auto-refresh notifications
    useEffect(() => {
        const interval = setInterval(() => {
            // In a real app, this would fetch new notifications from the server
            console.log("Checking for new notifications...");
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Request notification permission on mount
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then((permission) => {
                console.log("Notification permission:", permission);
            });
        }
    }, []);

    const handleNotificationAction = (notificationId, action, eventId) => {
        console.log(
            `Action ${action} for notification ${notificationId}, event ${eventId}`,
        );

        // Mark notification as read when action is taken
        setNotifications((prev) =>
            prev.map((notif) =>
                notif.id === notificationId
                    ? { ...notif, isRead: true }
                    : notif,
            ),
        );

        // Handle different actions
        switch (action) {
            case "join":
                // Navigate to event or open meeting link
                onNotificationAction?.("join", eventId);
                break;
            case "snooze":
                // Reschedule reminder for later
                handleSnoozeNotification(notificationId);
                break;
            case "location":
                // Show event location details
                onNotificationAction?.("location", eventId);
                break;
            case "accept":
                // Accept event invitation
                onNotificationAction?.("accept", eventId);
                removeNotification(notificationId);
                break;
            case "decline":
                // Decline event invitation
                onNotificationAction?.("decline", eventId);
                removeNotification(notificationId);
                break;
            case "dismiss":
                // Simply remove notification
                removeNotification(notificationId);
                break;
            default:
                console.log("Unknown action:", action);
        }
    };

    const handleSnoozeNotification = (notificationId) => {
        // Remove current notification and create a new one for later
        setNotifications((prev) => {
            const notification = prev.find((n) => n.id === notificationId);
            if (!notification) return prev;

            // Create new notification for 15 minutes later
            const snoozeTime = addMinutes(new Date(), 15);
            const newNotification = {
                ...notification,
                id: `${notificationId}_snooze_${Date.now()}`,
                message: `${notification.message} (Snoozed)`,
                createdAt: snoozeTime,
                isRead: false,
            };

            return prev
                .filter((n) => n.id !== notificationId)
                .concat(newNotification);
        });
    };

    const removeNotification = (notificationId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    };

    const markAsRead = (notificationId) => {
        setNotifications((prev) =>
            prev.map((notif) =>
                notif.id === notificationId
                    ? { ...notif, isRead: true }
                    : notif,
            ),
        );
    };

    const markAllAsRead = () => {
        setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, isRead: true })),
        );
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.EVENT_REMINDER:
            case NOTIFICATION_TYPES.EVENT_STARTING:
                return <Clock className="notification-item-icon blue" />;
            case NOTIFICATION_TYPES.EVENT_INVITATION:
                return <Calendar className="notification-item-icon green" />;
            case NOTIFICATION_TYPES.CALENDAR_SYNC:
                return <Calendar className="notification-item-icon purple" />;
            default:
                return <Bell className="notification-item-icon slate" />;
        }
    };

    const getTimeDisplay = (date) => {
        if (isToday(date)) {
            return format(date, "HH:mm");
        } else if (isTomorrow(date)) {
            return `Tomorrow ${format(date, "HH:mm")}`;
        } else {
            return format(date, "MMM d, HH:mm");
        }
    };

    const getTimeUntilEvent = (eventTime) => {
        const now = new Date();
        const minutes = differenceInMinutes(eventTime, now);

        if (minutes <= 0) return "Starting now";
        if (minutes < 60) return `${minutes}m`;
        if (minutes < 1440)
            return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
        return `${Math.floor(minutes / 1440)}d`;
    };

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className={`notification-center ${className}`}>
            {/* Header */}
            <div className="notification-header">
                <div className="notification-header-left">
                    <div className="notification-bell-container">
                        <Bell className="notification-bell-icon" />
                        {unreadCount > 0 && (
                            <span className="notification-badge">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="notification-title">Notifications</h3>
                        <p className="notification-subtitle">
                            {unreadCount} unread
                        </p>
                    </div>
                </div>

                <div className="notification-header-actions">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="notification-mark-read-btn">
                            Mark all read
                        </button>
                    )}
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="notification-settings-btn">
                        <Settings style={{ width: "1rem", height: "1rem" }} />
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="notification-settings-panel">
                    <h4 className="notification-settings-title">
                        Notification Settings
                    </h4>
                    <div className="notification-settings-group">
                        <label className="notification-setting-item">
                            <input
                                type="checkbox"
                                checked={notificationSettings.emailReminders}
                                onChange={(e) =>
                                    setNotificationSettings((prev) => ({
                                        ...prev,
                                        emailReminders: e.target.checked,
                                    }))
                                }
                                className="notification-setting-checkbox"
                            />
                            <span className="notification-setting-label">
                                Email reminders
                            </span>
                        </label>

                        <label className="notification-setting-item">
                            <input
                                type="checkbox"
                                checked={notificationSettings.pushNotifications}
                                onChange={(e) =>
                                    setNotificationSettings((prev) => ({
                                        ...prev,
                                        pushNotifications: e.target.checked,
                                    }))
                                }
                                className="notification-setting-checkbox"
                            />
                            <span className="notification-setting-label">
                                Push notifications
                            </span>
                        </label>

                        <div style={{ marginTop: "1rem" }}>
                            <p className="notification-timing-title">
                                Reminder timing:
                            </p>
                            <div className="notification-timing-group">
                                {Object.entries(
                                    notificationSettings.reminderTiming,
                                ).map(([key, enabled]) => (
                                    <label
                                        key={key}
                                        className="notification-setting-item">
                                        <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) =>
                                                setNotificationSettings(
                                                    (prev) => ({
                                                        ...prev,
                                                        reminderTiming: {
                                                            ...prev.reminderTiming,
                                                            [key]: e.target
                                                                .checked,
                                                        },
                                                    }),
                                                )
                                            }
                                            className="notification-setting-checkbox"
                                        />
                                        <span className="notification-setting-label">
                                            {key.replace("_", " ")} before
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications List */}
            <div className="notification-list-container">
                {notifications.length === 0 ? (
                    <div className="notification-empty">
                        <Bell className="notification-empty-icon" />
                        <p className="notification-empty-text">
                            No notifications
                        </p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item ${!notification.isRead ? "unread" : ""}`}>
                                <div className="notification-item-content">
                                    <div className="notification-item-icon-wrapper">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    <div className="notification-item-body">
                                        <div className="notification-item-header">
                                            <div className="notification-item-text">
                                                <h4 className="notification-item-title">
                                                    {notification.title}
                                                </h4>
                                                <p className="notification-item-desc">
                                                    {notification.message}
                                                </p>

                                                {notification.eventStartTime && (
                                                    <div className="notification-item-meta">
                                                        <Clock
                                                            style={{
                                                                width: "0.75rem",
                                                                height: "0.75rem",
                                                            }}
                                                        />
                                                        <span>
                                                            {getTimeDisplay(
                                                                notification.eventStartTime,
                                                            )}
                                                            {" • "}
                                                            {getTimeUntilEvent(
                                                                notification.eventStartTime,
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="notification-item-actions">
                                                <span className="notification-item-time">
                                                    {getTimeDisplay(
                                                        notification.createdAt,
                                                    )}
                                                </span>
                                                {!notification.isRead && (
                                                    <button
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification.id,
                                                            )
                                                        }
                                                        className="notification-icon-btn">
                                                        <Check className="notification-icon-btn-icon" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() =>
                                                        removeNotification(
                                                            notification.id,
                                                        )
                                                    }
                                                    className="notification-icon-btn">
                                                    <X className="notification-icon-btn-icon" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {notification.actions &&
                                            notification.actions.length > 0 && (
                                                <div className="notification-action-buttons">
                                                    {notification.actions.map(
                                                        (actionBtn, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() =>
                                                                    handleNotificationAction(
                                                                        notification.id,
                                                                        actionBtn.action,
                                                                        notification.eventId,
                                                                    )
                                                                }
                                                                className={`notification-action-btn ${actionBtn.primary ? "primary" : "secondary"}`}>
                                                                {
                                                                    actionBtn.label
                                                                }
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="notification-footer">
                <p className="notification-footer-text">
                    💡 <strong>Coming Soon:</strong> Calendar sync, SMS
                    reminders, and advanced notification scheduling
                </p>
            </div>
        </div>
    );
};

export default NotificationCenter;
