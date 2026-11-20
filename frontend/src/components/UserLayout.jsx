import AppHeader from "./AppHeader";

/** Page shell for the signed-in user pages: shared header + scrollable content area. */
export default function UserLayout({ title, subtitle, actions = null, children, maxWidth = "max-w-6xl" }) {
  return (
    <div className="ff-user min-h-dvh bg-[#090B10] text-[#F8FAFC] flex flex-col overflow-x-hidden pb-safe">
      <AppHeader />
      <main id="main-content" className={`flex-1 w-full ${maxWidth} mx-auto px-4 md:px-6 py-6 md:py-10 min-w-0`}>
        {(title || actions) && (
          <header className="flex flex-wrap items-start justify-between gap-4 mb-6 md:mb-9">
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="text-2xl sm:text-3xl md:text-[2rem] font-extrabold text-[#F8FAFC] tracking-tighter leading-[1.08]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[#94A3B8] text-sm sm:text-base mt-2 leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
