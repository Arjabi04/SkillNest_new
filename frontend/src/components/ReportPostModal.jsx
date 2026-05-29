import { useEffect, useMemo, useState } from "react";
import { reportPost } from "../api/reports";
import { toast } from "../utils/toast";

const REASONS = [
  "Spam",
  "Harassment",
  "Hate Speech",
  "NSFW Content",
  "Misinformation",
  "Violence",
  "Copyright Issue",
  "Other",
];

const ReportPostModal = ({ open, postId, onClose, onSubmitted }) => {
  const [reason, setReason] = useState("Spam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => Boolean(postId && reason && !submitting), [postId, reason, submitting]);

  useEffect(() => {
    if (!open) return;
    setReason("Spam");
    setDescription("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.warning("Please login to report posts.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await reportPost(postId, { reason, description });
      toast.success(data?.msg || "Thank you. Your report has been submitted for review.");
      onSubmitted?.(data);
      onClose?.();
    } catch (err) {
      if (err?.status === 409) {
        toast.info("You already reported this post.");
        onClose?.();
        return;
      }
      toast.error(err?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close report dialog"
      />

      <div className="relative w-[92vw] max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Report Post</h2>
            <p className="text-sm text-slate-500 mt-1">
              Reports are anonymous to other users. Our team will review this post.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            >
              {REASONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Add any context that might help reviewers..."
            />
            <div className="mt-1 text-xs text-slate-400 text-right">
              {description.length}/500
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canSubmit}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPostModal;

