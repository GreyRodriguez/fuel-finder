// Main navigation items shown in the header (desktop) and the slide-in drawer (mobile).
// `match` decides when an item is highlighted (so /dashboard/station/3 still lights up "Dashboard").
export const MAIN_NAV = [
  {
    to: "/dashboard",
    label: "Dashboard",
    match: (p) => p === "/dashboard" || (p.startsWith("/dashboard/") && !p.startsWith("/dashboard/profile")),
  },
  {
    to: "/updates",
    label: "Latest Updates & Price Trends",
    shortLabel: "Updates & Trends", // used between 768px and 1024px where the full label doesn't fit
    match: (p) => p === "/updates",
  },
  { to: "/feedback", label: "Feedback", match: (p) => p === "/feedback" },
  { to: "/about", label: "About Us", match: (p) => p === "/about" },
];

