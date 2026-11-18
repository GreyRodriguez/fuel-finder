import AppHeader from "./AppHeader";

/** Page shell for the signed-in user pages: shared header + scrollable content area. */
export default function UserLayout({ title, subtitle, actions = null, children, maxWidth = "max-w-6xl" }) {
  return (
    <div className="min-h-dvh bg-dark-900 flex flex-col">
      <AppHeader />
      <main id="main-content" className={`flex-1 w-full ${maxWidth} mx-auto px-4 md:px-6 py-5 md:py-8 min-w-0`}>
        {(title || actions) && (
          <header className="flex flex-wrap items-start justify-between gap-3 mb-5 md:mb-7">
            <div className="min-w-0 flex-1">
              {title && <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h1>}
              {subtitle && <p className="text-slate-400 text-xs sm:text-sm md:text-base mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}

