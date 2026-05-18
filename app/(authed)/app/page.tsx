const MODULES = [
  { name: "Daily Summary", description: "A pulse on today — what matters most." },
  { name: "Daily Planner", description: "Plan the day with intention." },
  { name: "Personal Finance", description: "Track money, build wealth." },
  { name: "Goals", description: "Quarterly and yearly horizons." },
  { name: "Growth & Self", description: "Journal, reflect, integrate." },
  { name: "Cycle & Mood", description: "Honor the rhythm of your body." },
  { name: "Vitamins & Supplements", description: "Daily protocol, simple." },
  { name: "Speak Eloquently", description: "Refine voice and language." },
  { name: "Affirmations", description: "The words you live by." },
  { name: "Boundaries", description: "What you protect and why." },
  { name: "Vision Board", description: "Make the future visible." },
  { name: "Notes & Vault", description: "A private place for everything else." },
] as const;

export default function AppDashboardPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-4xl text-forest-deep mb-2">
          You&apos;re in.
        </h1>
        <p className="text-stone text-lg">
          Your modules will come online here. Each one is being rebuilt with
          care.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((module) => (
          <div
            key={module.name}
            className="rounded-lg border border-stone-200 bg-white p-5 hover:border-sage transition-colors"
          >
            <h2 className="font-display text-lg text-ink mb-1">
              {module.name}
            </h2>
            <p className="text-sm text-stone mb-3">{module.description}</p>
            <span className="inline-flex items-center text-xs uppercase tracking-wider text-stone-light">
              Coming soon
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
