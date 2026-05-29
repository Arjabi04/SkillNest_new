import React from "react";
import { X } from "lucide-react";

const InfoBox = ({ label, children }) => (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <div className="text-sm font-medium text-slate-800 mt-1">{children}</div>
    </div>
);

const EventDetailsModal = ({
    event,
    selectedIsOrganizer,
    selectedHasJoined,
    selectedCanRegister,
    selectedIsPast,
    selectedIsFull,
    formatEventDate,
    onClose,
    onRegister,
    onUnjoin,
    onMessageOrganizer,
}) => {
    if (!event) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl flex items-center justify-between">
                    <h3 className="font-bold text-xl text-slate-900">
                        Event Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                        aria-label="Close event details">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <h4 className="text-2xl font-bold text-slate-900">
                            {event.title || "Untitled Event"}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1 capitalize">
                            {event.eventType || "event"} •{" "}
                            {event.category || "general"}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoBox label="Start">
                            {formatEventDate(event.startDate)}
                        </InfoBox>
                        <InfoBox label="End">
                            {formatEventDate(event.endDate)}
                        </InfoBox>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">
                            Description
                        </p>
                        <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">
                            {event.description || "No description available."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoBox label="Organizer">
                            {event.organizer?.username || "Unknown"}
                        </InfoBox>
                        <InfoBox label="Price">
                            {Number(event.price) > 0 ? `$${event.price}` : "Free"}
                        </InfoBox>
                    </div>

                    {(event.location?.venue || event.onlineDetails?.platform) && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">
                                Location / Platform
                            </p>
                            {event.location?.venue && (
                                <p className="text-sm text-slate-700">
                                    Venue: {event.location.venue}
                                </p>
                            )}
                            {event.onlineDetails?.platform && (
                                <p className="text-sm text-slate-700">
                                    Platform: {event.onlineDetails.platform}
                                </p>
                            )}
                        </div>
                    )}

                    {Array.isArray(event.tags) && event.tags.length > 0 && (
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                                Tags
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {event.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
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
                                onClick={() => onUnjoin(event._id)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                                Leave Event
                            </button>
                        ) : (
                            <button
                                onClick={() => onRegister(event._id, "going")}
                                disabled={!selectedCanRegister}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                                Join Event
                            </button>
                        )}

                        {!selectedIsOrganizer && (
                            <button
                                onClick={() => onMessageOrganizer(event)}
                                className="px-4 py-2 bg-white text-blue-700 rounded-lg text-sm font-medium border border-blue-200 hover:bg-blue-50 transition-colors">
                                Message Organizer
                            </button>
                        )}

                        {!selectedIsOrganizer &&
                            !selectedHasJoined &&
                            !selectedCanRegister && (
                                <span className="text-sm text-slate-500">
                                    {selectedIsPast
                                        ? "Event has ended"
                                        : selectedIsFull
                                          ? "Event is full"
                                          : "Registration is not available"}
                                </span>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailsModal;
