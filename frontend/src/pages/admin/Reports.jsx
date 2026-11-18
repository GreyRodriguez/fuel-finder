import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart3, MessageSquare } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import ReportsOverview from "./reports/ReportsOverview";
import FeedbackInbox from "./reports/FeedbackInbox";
import useFeedbackSummary from "../../hooks/useFeedbackSummary";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "feedback", label: "User Feedback", icon: MessageSquare },
];

export default function Reports() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "feedback" ? "feedback" : "overview";
  const { summary } = useFeedbackSummary();
  const tabRefs = useRef({});

  const select = (id, focus = false) => {
    setParams(id === "overview" ? {} : { tab: id }, { replace: true });
    if (focus) tabRefs.current[id]?.focus();
  };

  // WAI-ARIA tabs: ←/→ (and Home/End) move between tabs
  const onTabKey = (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = null;
    if (e.key === "ArrowRight") next = TABS[(i + 1) % TABS.length];
    else if (e.key === "ArrowLeft") next = TABS[(i - 1 + TABS.length) % TABS.length];
    else if (e.key === "Home") next = TABS[0];
    else if (e.key === "End") next = TABS[TABS.length - 1];
    if (next) { e.preventDefault(); select(next.id, true); }
  };

  return (
    <div className="h-dvh overflow-hidden bg-dark-900 flex flex-col md:flex-row">
      <AdminNav />
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 min-w-0 overscroll-contain">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-black text-white">Reports</h1>
          <p className="text-sm text-slate-400 mt-1">Price activity, station coverage and what users are telling you.</p>
        </div>

        {/* Tabs — full-width segmented control on phones */}
        <div
          role="tablist"
          aria-label="Report sections"
          onKeyDown={onTabKey}
          className="grid grid-cols-2 sm:inline-grid sm:w-auto gap-1 p-1 mb-5 md:mb-6 rounded-xl bg-dark-800 border border-white/10"
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            const badge = t.id === "feedback" ? summary?.new ?? 0 : 0;
            return (
              <button
                key={t.id}
                ref={(el) => { tabRefs.current[t.id] = el; }}
                id={`reports-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`reports-panel-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => select(t.id)}
                className={`min-h-[44px] px-3 sm:px-5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                  active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-white hover:bg-dark-700"
                }`}
              >
                <t.icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{t.label}</span>
                {badge > 0 && (
                  <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center ${
                    active ? "bg-white text-primary" : "bg-primary text-white"
                  }`}>
                    {badge > 99 ? "99+" : badge}
                    <span className="sr-only"> new</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <section
          id={`reports-panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`reports-tab-${tab}`}
          tabIndex={-1}
          className="outline-none"
        >
          {tab === "overview" ? (
            <ReportsOverview onOpenFeedback={(status) => setParams({ tab: "feedback", ...(status ? { status } : {}) }, { replace: true })} />
          ) : (
            <FeedbackInbox summary={summary} />
          )}
        </section>
      </main>
    </div>
  );
}
