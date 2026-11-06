import { Target, Zap, Users, Scale, ShieldCheck } from "lucide-react";
import UserLayout from "../../components/UserLayout";
import { ABOUT_CONTENT } from "../../config/aboutContent";

const ICONS = { Target, Zap, Users, Scale, ShieldCheck };

export default function About() {
  const { mission, pillars, verification } = ABOUT_CONTENT;

  return (
    <UserLayout title="About Us" maxWidth="max-w-5xl">
      {/* Mission */}
      <section aria-labelledby="mission-h" className="glass-card p-5 md:p-8 mb-8 md:mb-10 border-primary/20">
        <h2 id="mission-h" className="text-xl md:text-2xl font-bold text-white mb-3">{mission.title}</h2>
        <p className="text-slate-300 leading-relaxed text-base md:text-lg">{mission.text}</p>
      </section>

      {/* Pillars */}
      <section aria-labelledby="pillars-h" className="mb-8 md:mb-10">
        <h2 id="pillars-h" className="text-xl md:text-2xl font-bold text-white mb-4">Platform Pillars</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pillars.map((p) => {
            const Icon = ICONS[p.icon] ?? ShieldCheck;
            return (
              <li key={p.title} className="glass-card p-5 flex gap-4">
                <span className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-white font-semibold">{p.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{p.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Verification timeline */}
      <section aria-labelledby="verify-h">
        <h2 id="verify-h" className="text-xl md:text-2xl font-bold text-white mb-1">{verification.title}</h2>
        {verification.intro && <p className="text-sm text-slate-400 mb-5">{verification.intro}</p>}
        <ol className="relative ml-5 border-l-2 border-white/10 space-y-6">
          {verification.steps.map((s, i) => (
            <li key={s.title} className="relative pl-7">
              <span
                aria-hidden="true"
                className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center ring-4 ring-dark-900"
              >
                {i + 1}
              </span>
              <div className="glass-card p-4 md:p-5">
                <h3 className="text-white font-semibold">
                  <span className="sr-only">Step {i + 1}: </span>{s.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </UserLayout>
  );
}

