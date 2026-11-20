import { Target, Zap, Users, Scale, ShieldCheck } from "lucide-react";
import UserLayout from "../../components/UserLayout";
import { ABOUT_CONTENT } from "../../config/aboutContent";

const ICONS = { Target, Zap, Users, Scale, ShieldCheck };

export default function About() {
  const { mission, pillars, verification } = ABOUT_CONTENT;

  return (
    <UserLayout title="About Us" subtitle="Built for everyday drivers across Taguig City." maxWidth="max-w-5xl">
      {/* Mission — subtle surface shift with editorial typography */}
      <section
        aria-labelledby="mission-h"
        className="rounded-2xl bg-[#111520] border border-white/[0.07] p-6 sm:p-8 md:p-10 mb-12 md:mb-16"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">
          {mission.title}
        </p>
        <h2
          id="mission-h"
          className="text-xl sm:text-2xl md:text-[1.75rem] font-bold tracking-tight text-[#F8FAFC] leading-snug max-w-3xl"
        >
          {mission.text}
        </h2>
      </section>

      {/* Platform Pillars — borderless typographic grid (collapses cleanly below 768px md:) */}
      <section aria-labelledby="pillars-h" className="mb-12 md:mb-16">
        <div className="mb-6 md:mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-2">
            What Guides Us
          </p>
          <h2 id="pillars-h" className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-[#F8FAFC]">
            Platform Pillars
          </h2>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {pillars.map((p) => {
            const Icon = ICONS[p.icon] ?? ShieldCheck;
            return (
              <li key={p.title} className="border-t border-white/[0.08] pt-5 flex items-start gap-3.5 min-w-0">
                <Icon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="text-[#F8FAFC] font-bold tracking-tight text-base sm:text-lg">{p.title}</h3>
                  <p className="text-sm text-[#94A3B8] mt-1.5 leading-relaxed">{p.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Verification workflow — clean divided editorial list inside one elevated surface */}
      <section aria-labelledby="verify-h">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-2">
            Data Integrity
          </p>
          <h2 id="verify-h" className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-[#F8FAFC]">
            {verification.title}
          </h2>
          {verification.intro && (
            <p className="text-sm sm:text-base text-[#94A3B8] mt-2 max-w-2xl leading-relaxed">
              {verification.intro}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-[#111520] border border-white/[0.07] px-5 sm:px-8 py-2">
          <ol className="divide-y divide-white/[0.06]">
            {verification.steps.map((s, i) => (
              <li key={s.title} className="py-5 sm:py-6 flex items-start gap-4 sm:gap-6">
                <span
                  aria-hidden="true"
                  className="text-xs sm:text-sm font-mono font-semibold text-orange-400 pt-0.5 flex-shrink-0 w-6"
                >
                  0{i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[#F8FAFC] font-semibold text-base">
                    <span className="sr-only">Step {i + 1}: </span>{s.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8] mt-1 leading-relaxed">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </UserLayout>
  );
}
