import React from "react";
import CreateEventModal from "../components/events/CreateEventModal";
import EventDetailsModal from "../components/events/EventDetailsModal";
import EventsListView from "../components/events/EventsListView";
import useEventsPageController from "../hooks/useEventsPageController";

const EventsPage = () => {
    const {
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
    } = useEventsPageController();

    return (
        <>
            <EventsListView
                mainContentClass={mainContentClass}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                filteredEvents={filteredEvents}
                createdEvents={createdEvents}
                joinedEvents={joinedEvents}
                userId={userId}
                onOpenCreate={() => setShowCreateModal(true)}
                onRegister={handleRegister}
                onUnjoin={handleUnjoinEvent}
                onDelete={handleDeleteEvent}
                onView={setSelectedEvent}
                formatEventDate={formatEventDate}
            />

            <CreateEventModal
                open={showCreateModal}
                eventForm={eventForm}
                todayDate={todayDate}
                currentTime={currentTime}
                createLoading={createLoading}
                onClose={() => setShowCreateModal(false)}
                onChange={handleFormChange}
                onSubmit={handleCreateEvent}
            />

            <EventDetailsModal
                event={selectedEvent}
                selectedIsOrganizer={selectedIsOrganizer}
                selectedHasJoined={selectedHasJoined}
                selectedCanRegister={selectedCanRegister}
                selectedIsPast={selectedIsPast}
                selectedIsFull={selectedIsFull}
                formatEventDate={formatEventDate}
                onClose={() => setSelectedEvent(null)}
                onRegister={handleRegister}
                onUnjoin={handleUnjoinEvent}
                onMessageOrganizer={handleMessageOrganizer}
            />
        </>
    );
};

export default EventsPage;
