export const cx = (...values) => {
  const classes = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string") {
      classes.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      classes.push(cx(...value));
      continue;
    }
    if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) classes.push(key);
      }
    }
  }
  return classes.filter(Boolean).join(" ");
};

