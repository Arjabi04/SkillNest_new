import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../api/auth";
import { useInbox } from "./useInbox";
import useSidebarLayout from "./useSidebarLayout";

const defaultEventForm = {
    title: "",
    description: "",
    eventType: "online",
    category: "workshop",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    price: 0,
    capacity: "",
    allowRegistration: true,
    tags: [],
    onlinePlatform: "zoom",
    meetingLink: "",
    venue: "",
    address: "",
    city: "",
    country: "",
};

const formatEventDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const useEventsPageController = () => {
    const navigate = useNavigate();
    const { mainContentClass } = useSidebarLayout();
    const { createDirectConversation } = useInbox();

    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId") || localStorage.getItem("userId");
    const todayDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toTimeString().slice(0, 5);

    const [events, setEvents] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilters, setSelectedFilters] = useState({
        eventType: "all",
        category: "all",
        timeFrame: "all",
    });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [eventForm, setEventForm] = useState(defaultEventForm);

    const isCurrentUserOrganizer = useCallback(
        (event) => {
            const organizerId = event?.organizer?._id || event?.organizer;
            return organizerId && String(organizerId) === String(userId);
        },
        [userId],
    );

    const hasCurrentUserJoined = useCallback(
        (event) =>
            event?.attendees?.some((attendee) => {
                const attendeeId = attendee?.user?._id || attendee?.user;
                return (
                    String(attendeeId) === String(userId) &&
                    attendee?.status === "going"
                );
            }),
        [userId],
    );

    const loadEvents = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/events`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data);
                setEvents(data.events || data);
            } else {
                console.error("Failed to load events");
                setEvents([]);
            }
        } catch (err) {
            console.error("Error loading events:", err);
            setEvents([]);
        }
    }, []);

    const loadRecommendedEvents = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_URL}/recommendations/events?limit=24`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                setRecommendedEvents(
                    Array.isArray(data.recommendations)
                        ? data.recommendations
                        : [],
                );
            } else {
                console.error("Failed to load recommended events");
                setRecommendedEvents([]);
            }
        } catch (err) {
            console.error("Error loading recommended events:", err);
            setRecommendedEvents([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const reloadEvents = useCallback(
        () => Promise.all([loadEvents(), loadRecommendedEvents()]),
        [loadEvents, loadRecommendedEvents],
    );

    useEffect(() => {
        reloadEvents();
    }, [reloadEvents]);

    useEffect(() => {
        if (!selectedEvent?._id) return;

        const updatedSelectedEvent = events.find(
            (event) => event._id === selectedEvent._id,
        );
        if (updatedSelectedEvent) {
            setSelectedEvent(updatedSelectedEvent);
        }
    }, [events, selectedEvent?._id]);

    const filteredEvents = useMemo(() => {
        const now = new Date();
        const sourceEvents =
            recommendedEvents.length > 0 ? recommendedEvents : events;

        let filtered = sourceEvents.filter((event) => {
            const eventEndDate = event?.endDate
                ? new Date(event.endDate)
                : null;
            const isEnded = eventEndDate ? eventEndDate < now : false;
            return !isEnded || isCurrentUserOrganizer(event);
        });

        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (event) =>
                    event.title?.toLowerCase().includes(query) ||
                    event.description?.toLowerCase().includes(query) ||
                    event.tags?.some((tag) =>
                        tag.toLowerCase().includes(query),
                    ),
            );
        }

        if (selectedFilters.eventType !== "all") {
            filtered = filtered.filter(
                (event) => event.eventType === selectedFilters.eventType,
            );
        }

        if (selectedFilters.category !== "all") {
            filtered = filtered.filter(
                (event) => event.category === selectedFilters.category,
            );
        }

        if (selectedFilters.timeFrame !== "all") {
            const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            switch (selectedFilters.timeFrame) {
                case "today":
                    filtered = filtered.filter((event) => {
                        const eventDate = new Date(event.startDate);
                        return eventDate.toDateString() === now.toDateString();
                    });
                    break;
                case "week":
                    filtered = filtered.filter(
                        (event) => new Date(event.startDate) <= oneWeek,
                    );
                    break;
                case "month":
                    filtered = filtered.filter(
                        (event) => new Date(event.startDate) <= oneMonth,
                    );
                    break;
                default:
                    break;
            }
        }

        return filtered;
    }, [
        events,
        isCurrentUserOrganizer,
        recommendedEvents,
        searchTerm,
        selectedFilters,
    ]);

    const handleRegister = useCallback(
        async (eventId, status) => {
            try {
                const token = localStorage.getItem("token");
                await fetch(`${API_URL}/events/${eventId}/attend`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status }),
                });

                await reloadEvents();
            } catch (err) {
                console.error("Error updating registration:", err);
            }
        },
        [reloadEvents],
    );

    const handleUnjoinEvent = useCallback(
        async (eventId) => {
            if (!confirm("Are you sure you want to leave this event?")) return;

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${API_URL}/events/${eventId}/attend`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    },
                );

                if (response.ok) {
                    await reloadEvents();
                } else {
                    const error = await response.json();
                    alert(error.msg || "Failed to leave event");
                }
            } catch (err) {
                console.error("Error leaving event:", err);
                alert("Failed to leave event");
            }
        },
        [reloadEvents],
    );

    const handleDeleteEvent = useCallback(async (eventId) => {
        if (
            !confirm(
                "Are you sure you want to delete this event? This action cannot be undone.",
            )
        ) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/events/${eventId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setEvents((prev) =>
                    prev.filter((event) => event._id !== eventId),
                );
                setRecommendedEvents((prev) =>
                    prev.filter((event) => event._id !== eventId),
                );
            } else {
                const error = await response.json();
                alert(error.msg || "Failed to delete event");
            }
        } catch (err) {
            console.error("Error deleting event:", err);
            alert("Failed to delete event");
        }
    }, []);

    const handleFormChange = useCallback((field, value) => {
        setEventForm((prev) => {
            const next = { ...prev, [field]: value };

            if (field === "startDate") {
                if (next.endDate && next.endDate < value) next.endDate = value;
                if (
                    next.endDate === value &&
                    next.startTime &&
                    next.endTime &&
                    next.endTime < next.startTime
                ) {
                    next.endTime = next.startTime;
                }
            }

            if (
                field === "endDate" &&
                next.startDate &&
                value < next.startDate
            ) {
                next.endDate = next.startDate;
            }

            if (
                field === "startTime" &&
                next.startDate &&
                next.endDate &&
                next.startDate === next.endDate &&
                next.endTime &&
                next.endTime < value
            ) {
                next.endTime = value;
            }

            if (
                field === "endTime" &&
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
    }, []);

    const handleCreateEvent = useCallback(
        async (e) => {
            e.preventDefault();

            const startDateTime = new Date(
                `${eventForm.startDate}T${eventForm.startTime}`,
            );
            const endDateTime = new Date(
                `${eventForm.endDate}T${eventForm.endTime}`,
            );

            if (
                Number.isNaN(startDateTime.getTime()) ||
                Number.isNaN(endDateTime.getTime())
            ) {
                alert("Please enter a valid start and end date/time.");
                return;
            }

            if (endDateTime <= startDateTime) {
                alert("End date/time must be after start date/time.");
                return;
            }

            setCreateLoading(true);

            try {
                const token = localStorage.getItem("token");
                const eventData = {
                    title: eventForm.title,
                    description: eventForm.description,
                    eventType: eventForm.eventType,
                    category: eventForm.category,
                    startDate: startDateTime.toISOString(),
                    endDate: endDateTime.toISOString(),
                    price: parseFloat(eventForm.price) || 0,
                    capacity: eventForm.capacity
                        ? parseInt(eventForm.capacity)
                        : null,
                    allowRegistration: eventForm.allowRegistration,
                    tags: eventForm.tags,
                };

                if (
                    eventForm.eventType === "online" ||
                    eventForm.eventType === "hybrid"
                ) {
                    eventData.onlineDetails = {
                        platform: eventForm.onlinePlatform,
                        meetingLink: eventForm.meetingLink,
                    };
                }

                if (
                    eventForm.eventType === "offline" ||
                    eventForm.eventType === "hybrid"
                ) {
                    eventData.location = {
                        venue: eventForm.venue,
                        address: eventForm.address,
                        city: eventForm.city,
                        country: eventForm.country,
                    };
                }

                const response = await fetch(`${API_URL}/events`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(eventData),
                });

                if (response.ok) {
                    const createdPayload = await response.json();
                    const newEvent = createdPayload?.event || createdPayload;
                    if (newEvent?._id) setEvents((prev) => [newEvent, ...prev]);

                    alert(
                        createdPayload?.msg ||
                            "Your event is being reviewed by the admin. Please wait for approval.",
                    );

                    setShowCreateModal(false);
                    setEventForm(defaultEventForm);
                    await reloadEvents();
                } else {
                    const error = await response.json();
                    alert(error?.msg || "Failed to create event");
                }
            } catch (err) {
                console.error("Error creating event:", err);
                alert("Failed to create event");
            } finally {
                setCreateLoading(false);
            }
        },
        [eventForm, reloadEvents],
    );

    const handleMessageOrganizer = useCallback(
        async (event) => {
            const organizerId = event?.organizer?._id || event?.organizer;
            if (!organizerId || String(organizerId) === String(userId)) return;

            try {
                const conversation = await createDirectConversation(
                    String(organizerId),
                );
                if (conversation?._id) {
                    navigate(`/inbox?conversationId=${conversation._id}`);
                }
            } catch (error) {
                console.error("Error starting organizer conversation:", error);
                alert(
                    "Unable to start a conversation with the organizer right now.",
                );
            }
        },
        [createDirectConversation, navigate, userId],
    );

    const handleFilterChange = useCallback((filterType, value) => {
        setSelectedFilters((prev) => ({ ...prev, [filterType]: value }));
    }, []);

    const createdEvents = useMemo(
        () => events.filter(isCurrentUserOrganizer),
        [events, isCurrentUserOrganizer],
    );
    const joinedEvents = useMemo(
        () =>
            events.filter(
                (event) =>
                    !isCurrentUserOrganizer(event) &&
                    hasCurrentUserJoined(event),
            ),
        [events, hasCurrentUserJoined, isCurrentUserOrganizer],
    );

    const selectedIsOrganizer = isCurrentUserOrganizer(selectedEvent);
    const selectedHasJoined = hasCurrentUserJoined(selectedEvent);
    const selectedGoingCount =
        selectedEvent?.attendees?.filter(
            (attendee) => attendee?.status === "going",
        ).length || 0;
    const selectedCapacity = Number(selectedEvent?.capacity) || null;
    const selectedIsFull = Boolean(
        selectedCapacity &&
        selectedGoingCount >= selectedCapacity &&
        !selectedHasJoined,
    );
    const selectedIsPast = Boolean(
        selectedEvent?.endDate && new Date(selectedEvent.endDate) < new Date(),
    );
    const selectedCanRegister = Boolean(
        selectedEvent &&
        selectedEvent.allowRegistration !== false &&
        !selectedIsOrganizer &&
        !selectedHasJoined &&
        !selectedIsPast &&
        !selectedIsFull,
    );

    return {
        mainContentClass,
        userId,
        todayDate,
        currentTime,
        loading,
        searchTerm,
        setSearchTerm,
        selectedFilters,
        filteredEvents,
        createdEvents,
        joinedEvents,
        showCreateModal,
        setShowCreateModal,
        selectedEvent,
        setSelectedEvent,
        createLoading,
        eventForm,
        selectedIsOrganizer,
        selectedHasJoined,
        selectedCanRegister,
        selectedIsPast,
        selectedIsFull,
        formatEventDate,
        handleRegister,
        handleUnjoinEvent,
        handleDeleteEvent,
        handleFormChange,
        handleCreateEvent,
        handleFilterChange,
        handleMessageOrganizer,
    };
};

export default useEventsPageController;
