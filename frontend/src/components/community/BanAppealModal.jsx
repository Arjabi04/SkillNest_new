import React from "react";

const BanAppealModal = ({
    open,
    modal,
    draft,
    submitting,
    onDraftChange,
    onClose,
    onSubmit,
}) => {
    if (!open) return null;

    const banEntry = modal?.banEntry;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center px-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white p-6 rounded-2xl w-full max-w-lg shadow-xl border border-slate-200">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-black text-lg text-slate-900">
                            Banned from community
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                            You are banned from{" "}
                            <span className="font-bold text-slate-900">
                                {modal?.community?.name || "this community"}
                            </span>
                            .
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
                        Close
                    </button>
                </div>

                <div className="mt-4 space-y-3">
                    {banEntry?.sourcePostId && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                            <span className="font-bold">Related post:</span>{" "}
                            {String(banEntry.sourcePostId)}
                        </div>
                    )}

                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <span className="font-bold">Reason:</span>{" "}
                        {banEntry?.reason ||
                            "The community staff removed you from this community."}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-sm font-bold text-slate-900">
                            Plead your case
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Explain what happened and why you should be allowed
                            back. Community staff will review your appeal.
                        </p>
                        <textarea
                            value={draft}
                            onChange={(e) => onDraftChange(e.target.value)}
                            rows={4}
                            disabled={
                                submitting || banEntry?.appealStatus === "pending"
                            }
                            placeholder="Write your appeal to the community staff..."
                            className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm disabled:bg-slate-50"
                        />

                        {banEntry?.appealStatus === "pending" && (
                            <p className="mt-3 text-sm font-medium text-amber-700">
                                Your appeal is pending review.
                            </p>
                        )}

                        {banEntry?.appealStatus === "rejected" &&
                            banEntry?.appealReviewNote && (
                                <p className="mt-3 text-sm text-slate-600">
                                    Last staff note: {banEntry.appealReviewNote}
                                </p>
                            )}

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200">
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={onSubmit}
                                disabled={
                                    submitting ||
                                    banEntry?.appealStatus === "pending"
                                }
                                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
                                {submitting ? "Submitting..." : "Submit appeal"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BanAppealModal;
