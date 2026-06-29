"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { period: string; from?: string; to?: string };

export default function RevenueFilters({ period, from, to }: Props) {
  const router = useRouter();
  const [showCustom, setShowCustom] = useState(period === "custom");
  const [fromVal, setFromVal] = useState(from ?? "");
  const [toVal, setToVal] = useState(to ?? "");

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams({ period: "custom" });
    if (fromVal) p.set("from", fromVal);
    if (toVal) p.set("to", toVal);
    router.push(`/admin/revenue?${p.toString()}`);
  }

  const pill = (active: boolean, extra?: string) =>
    `px-3 py-1.5 text-xs rounded-full border transition cursor-pointer ${
      active
        ? extra ?? "bg-forest text-cream-bg border-forest"
        : "border-stone-200 text-stone-600 hover:border-forest hover:text-forest bg-white"
    }`;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => { setShowCustom(false); router.push("/admin/revenue"); }} className={pill(!period || period === "all")}>
          All time
        </button>
        <button onClick={() => { setShowCustom(false); router.push("/admin/revenue?period=mtd"); }} className={pill(period === "mtd")}>
          This month
        </button>
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={pill(period === "custom" || showCustom, period === "custom" || showCustom ? "bg-sage-pale text-forest-deep border-sage" : undefined)}
        >
          Custom range
        </button>
        <button onClick={() => { setShowCustom(false); router.push("/admin/revenue?period=lost"); }}
          className={pill(period === "lost", period === "lost" ? "bg-rose-600 text-white border-rose-600" : "border-stone-200 text-stone-600 hover:border-rose-500 hover:text-rose-600 bg-white")}>
          1-month &amp; done
        </button>
      </div>

      {showCustom && (
        <form onSubmit={handleCustomSubmit} className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-500">From</span>
          <input
            type="date"
            value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
            className="px-2 py-1.5 text-xs rounded-lg border border-stone-200 focus:border-sage outline-none bg-white"
          />
          <span className="text-xs text-stone-500">to</span>
          <input
            type="date"
            value={toVal}
            onChange={(e) => setToVal(e.target.value)}
            className="px-2 py-1.5 text-xs rounded-lg border border-stone-200 focus:border-sage outline-none bg-white"
          />
          <button type="submit" className="px-3 py-1.5 text-xs bg-forest text-white rounded-full hover:bg-forest-deep transition">
            Filter
          </button>
          {(fromVal || toVal) && (
            <button type="button" onClick={() => { setFromVal(""); setToVal(""); router.push("/admin/revenue"); }} className="text-xs text-stone-400 hover:text-rose-600 underline">
              clear
            </button>
          )}
        </form>
      )}
    </div>
  );
}
