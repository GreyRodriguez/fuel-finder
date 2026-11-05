import AppHeader from "./AppHeader";

/** Page shell for the signed-in user pages: shared header + scrollable content area. */
export default function UserLayout({ title, subtitle, children, maxWidth = "max-w-6xl" }) {
  return (
    <div className="min-h-dvh bg-dark-900 flex flex-col">
      <AppHeader />
      <main id="main-content" className={`flex-1 w-full ${maxWidth} mx-auto px-4 md:px-6 py-6 md:py-8 min-w-0`}>
        {title && (
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-white">{title}</h1>
            {subtitle && <p className="text-slate-400 text-sm md:text-base mt-1.5">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

