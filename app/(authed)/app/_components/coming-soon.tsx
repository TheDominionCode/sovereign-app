type Props = {
  title: string;
  intent: string;
  tables: string[];
};

export function ComingSoon({ title, intent, tables }: Props) {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="text-sm text-stone mt-2">{intent}</p>

      <div className="mt-8 rounded-lg border border-dashed border-sage-light bg-white p-6">
        <div className="text-[10px] tracking-[0.2em] text-sage font-semibold mb-2">
          NEXT
        </div>
        <p className="text-sm text-stone leading-relaxed">
          The schema is live for this module. The UI ports over against{" "}
          {tables.map((t, i) => (
            <span key={t}>
              <code className="px-1.5 py-0.5 rounded bg-cream-bg text-forest text-xs font-mono">
                {t}
              </code>
              {i < tables.length - 1 ? ", " : ""}
            </span>
          ))}
          {" "}— same pattern as <code className="text-xs">/app/goals</code> and{" "}
          <code className="text-xs">/app/planner</code>: page.tsx + actions.ts +
          RLS-protected queries.
        </p>
      </div>
    </div>
  );
}
