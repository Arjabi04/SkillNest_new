export const AUTO_HIDE_UNIQUE_THRESHOLD = Number.parseInt(
  process.env.AUTO_HIDE_UNIQUE_THRESHOLD || "5",
  10
);

export const AUTO_HIDE_PRIORITY_THRESHOLD = Number.parseInt(
  process.env.AUTO_HIDE_PRIORITY_THRESHOLD || "60",
  10
);

export const RECENT_REPORT_WINDOW_MS = Number.parseInt(
  process.env.RECENT_REPORT_WINDOW_MS || String(15 * 60 * 1000),
  10
);

export const USER_REPORT_RATE_WINDOW_MS = Number.parseInt(
  process.env.USER_REPORT_RATE_WINDOW_MS || String(60 * 60 * 1000),
  10
);

export const USER_REPORT_RATE_LIMIT = Number.parseInt(
  process.env.USER_REPORT_RATE_LIMIT || "20",
  10
);

export const getPriorityLevel = (score) => {
  const value = Number(score || 0);
  if (value >= 80) return "critical";
  if (value >= 50) return "high";
  if (value >= 25) return "medium";
  return "low";
};

export const calculatePriorityScore = ({
  uniqueReports = 0,
  recentReports = 0,
  previousViolations = 0,
  reporterTrustScore = 0.5,
} = {}) => {
  const trustBonus = Math.max(0, reporterTrustScore - 0.5) * 10;

  const score =
    (Number(uniqueReports) * 5) +
    (Number(recentReports) * 3) +
    (Number(previousViolations) * 10) +
    trustBonus;

  return Math.max(0, Math.round(score));
};

export const shouldAutoHidePost = ({ uniqueReportCount = 0, priorityScore = 0 } = {}) => {
  return (
    Number(uniqueReportCount) >= AUTO_HIDE_UNIQUE_THRESHOLD ||
    Number(priorityScore) >= AUTO_HIDE_PRIORITY_THRESHOLD
  );
};

export const getPublicPostQuery = () => {
  return {
    $or: [
      { moderation: { $exists: false } },
      { "moderation.state": "visible", "moderation.isHidden": { $ne: true } },
    ],
  };
};

