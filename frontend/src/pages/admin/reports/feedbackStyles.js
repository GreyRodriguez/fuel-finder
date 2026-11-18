/** Shared colour classes for feedback categories and statuses (admin Reports). */
export const CATEGORY_STYLE = {
  "Price Report": { badge: "bg-primary/10 text-primary border-primary/20", bar: "bg-primary" },
  "System Needs": { badge: "bg-danger/10 text-danger border-danger/20", bar: "bg-danger" },
  Suggestion: { badge: "bg-accent/10 text-accent border-accent/20", bar: "bg-accent" },
  Other: { badge: "bg-slate-500/10 text-slate-300 border-white/10", bar: "bg-slate-400" },
};

export const STATUS_STYLE = {
  new: "bg-warning/10 text-warning border-warning/25",
  reviewed: "bg-accent/10 text-accent border-accent/25",
  resolved: "bg-success/10 text-success border-success/25",
};

export const STATUS_LABEL = { new: "New", reviewed: "Reviewed", resolved: "Resolved" };

export const FEEDBACK_CATEGORIES = ["System Needs", "Suggestion", "Price Report", "Other"];
