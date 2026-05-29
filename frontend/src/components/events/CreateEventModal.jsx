import React from "react";
import TagInput from "../TagInput";

const Field = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
        </label>
        {children}
    </div>
);

const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const CreateEventModal = ({
    open,
    eventForm,
    todayDate,
    currentTime,
    createLoading,
    onClose,
    onChange,
    onSubmit,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xl">Create New Event</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={onSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                            Basic Information
                        </h4>

                        <Field label="Event Title">
                            <input
                                type="text"
                                value={eventForm.title}
                                onChange={(e) => onChange("title", e.target.value)}
                                className={inputClass}
                                placeholder="Enter event title"
                                required
                            />
                        </Field>

                        <Field label="Description">
                            <textarea
                                value={eventForm.description}
                                onChange={(e) =>
                                    onChange("description", e.target.value)
                                }
                                rows={4}
                                className={inputClass}
                                placeholder="Describe your event"
                                required
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Event Type">
                                <select
                                    value={eventForm.eventType}
                                    onChange={(e) =>
                                        onChange("eventType", e.target.value)
                                    }
                                    className={inputClass}>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </Field>

                            <Field label="Category">
                                <select
                                    value={eventForm.category}
                                    onChange={(e) =>
                                        onChange("category", e.target.value)
                                    }
                                    className={inputClass}>
                                    <option value="workshop">Workshop</option>
                                    <option value="seminar">Seminar</option>
                                    <option value="networking">Networking</option>
                                    <option value="competition">Competition</option>
                                    <option value="meetup">Meetup</option>
                                    <option value="conference">Conference</option>
                                </select>
                            </Field>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">Date & Time</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Start Date">
                                <input
                                    type="date"
                                    value={eventForm.startDate}
                                    onChange={(e) =>
                                        onChange("startDate", e.target.value)
                                    }
                                    min={todayDate}
                                    className={inputClass}
                                    required
                                />
                            </Field>

                            <Field label="Start Time">
                                <input
                                    type="time"
                                    value={eventForm.startTime}
                                    onChange={(e) =>
                                        onChange("startTime", e.target.value)
                                    }
                                    min={
                                        eventForm.startDate === todayDate
                                            ? currentTime
                                            : undefined
                                    }
                                    className={inputClass}
                                    required
                                />
                            </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="End Date">
                                <input
                                    type="date"
                                    value={eventForm.endDate}
                                    onChange={(e) =>
                                        onChange("endDate", e.target.value)
                                    }
                                    min={eventForm.startDate || todayDate}
                                    className={inputClass}
                                    required
                                />
                            </Field>

                            <Field label="End Time">
                                <input
                                    type="time"
                                    value={eventForm.endTime}
                                    onChange={(e) =>
                                        onChange("endTime", e.target.value)
                                    }
                                    min={
                                        eventForm.startDate &&
                                        eventForm.endDate &&
                                        eventForm.startDate === eventForm.endDate
                                            ? eventForm.startTime || undefined
                                            : undefined
                                    }
                                    className={inputClass}
                                    required
                                />
                            </Field>
                        </div>
                    </div>

                    {(eventForm.eventType === "online" ||
                        eventForm.eventType === "hybrid") && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">
                                Online Details
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Platform">
                                    <select
                                        value={eventForm.onlinePlatform}
                                        onChange={(e) =>
                                            onChange(
                                                "onlinePlatform",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}>
                                        <option value="zoom">Zoom</option>
                                        <option value="teams">Microsoft Teams</option>
                                        <option value="meet">Google Meet</option>
                                        <option value="discord">Discord</option>
                                        <option value="other">Other</option>
                                    </select>
                                </Field>

                                <Field label="Meeting Link">
                                    <input
                                        type="url"
                                        value={eventForm.meetingLink}
                                        onChange={(e) =>
                                            onChange("meetingLink", e.target.value)
                                        }
                                        className={inputClass}
                                        placeholder="https://"
                                    />
                                </Field>
                            </div>
                        </div>
                    )}

                    {(eventForm.eventType === "offline" ||
                        eventForm.eventType === "hybrid") && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-lg">
                                Location Details
                            </h4>

                            <Field label="Venue Name">
                                <input
                                    type="text"
                                    value={eventForm.venue}
                                    onChange={(e) =>
                                        onChange("venue", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Enter venue name"
                                />
                            </Field>

                            <Field label="Address">
                                <input
                                    type="text"
                                    value={eventForm.address}
                                    onChange={(e) =>
                                        onChange("address", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Street address"
                                />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="City">
                                    <input
                                        type="text"
                                        value={eventForm.city}
                                        onChange={(e) =>
                                            onChange("city", e.target.value)
                                        }
                                        className={inputClass}
                                        placeholder="City"
                                    />
                                </Field>

                                <Field label="Country">
                                    <input
                                        type="text"
                                        value={eventForm.country}
                                        onChange={(e) =>
                                            onChange("country", e.target.value)
                                        }
                                        className={inputClass}
                                        placeholder="Country"
                                    />
                                </Field>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="font-semibold text-lg">
                            Additional Details
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Price ($)">
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={eventForm.price}
                                    onChange={(e) =>
                                        onChange("price", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="0.00"
                                />
                            </Field>

                            <Field label="Capacity (optional)">
                                <input
                                    type="number"
                                    min="1"
                                    value={eventForm.capacity}
                                    onChange={(e) =>
                                        onChange("capacity", e.target.value)
                                    }
                                    className={inputClass}
                                    placeholder="Unlimited"
                                />
                            </Field>
                        </div>

                        <Field label="Tags">
                            <TagInput
                                tags={eventForm.tags}
                                setTags={(newTags) => onChange("tags", newTags)}
                                placeholder="Type tag name and press Enter..."
                            />
                        </Field>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="allowRegistration"
                                checked={eventForm.allowRegistration}
                                onChange={(e) =>
                                    onChange(
                                        "allowRegistration",
                                        e.target.checked,
                                    )
                                }
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                            <label
                                htmlFor="allowRegistration"
                                className="ml-2 text-sm font-medium text-slate-700">
                                Allow public registration
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            disabled={createLoading}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {createLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Event"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
