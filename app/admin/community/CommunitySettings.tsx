"use client";

import { useState } from "react";
import { COMMUNITY_THEMES, type CommunityThemeName } from "@/lib/affiliate/themes";
import { saveCommunitySettingsAction } from "./settings-actions";

// Admin-only settings card at the top of /admin/community. Edits the heading
// quote and color theme that the public /affiliate/community page reads on
// every render.
//
// Client component on purpose: the theme swatches need controlled state so
// the visual selected ring updates immediately when the admin taps a
// different theme. Earlier version used sr-only radios with defaultChecked
// which left the visual state stuck on the server-rendered initial choice.
export default function CommunitySettings({
  quote,
  theme,
}: {
  quote: string;
  theme: string;
}) {
  const [selectedTheme, setSelectedTheme] = useState<CommunityThemeName>(
    (theme as CommunityThemeName) in COMMUNITY_THEMES
      ? (theme as CommunityThemeName)
      : "sand",
  );

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-display text-xl text-forest-deep">Community settings</h2>
        <div className="text-xs italic text-stone">
          Edits the quote + colors on /affiliate/community.
        </div>
      </div>
      <form action={saveCommunitySettingsAction} className="space-y-5">
        <div>
          <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-2">
            Heading quote
          </label>
          <textarea
            name="quote"
            rows={2}
            defaultValue={quote}
            maxLength={500}
            required
            placeholder="The italic line shown under &quot;Wall of wins&quot;."
            className="block w-full px-3 py-2 border border-stone-200 rounded-lg bg-white text-sm outline-none focus:border-[#7a9a6e] resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.18em] uppercase text-stone-500 font-semibold mb-2">
            Color theme
          </label>
          {/* Hidden field carries the selected theme name into the server action.
              Kept in sync with selectedTheme state above. */}
          <input type="hidden" name="theme" value={selectedTheme} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(COMMUNITY_THEMES) as CommunityThemeName[]).map((name) => {
              const t = COMMUNITY_THEMES[name];
              const isSelected = name === selectedTheme;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedTheme(name)}
                  aria-pressed={isSelected}
                  className="relative cursor-pointer rounded-lg p-3 text-left transition-all"
                  style={{
                    backgroundColor: t.background,
                    color: t.text,
                    border: isSelected ? `3px solid ${t.accent}` : `1px solid ${t.border}`,
                    boxShadow: isSelected ? `0 0 0 3px ${t.accent}33` : "none",
                  }}
                >
                  <div
                    className="text-[10px] tracking-[0.18em] uppercase font-semibold mb-2"
                    style={{ color: t.accent }}
                  >
                    {t.label}
                  </div>
                  <div className="flex gap-1">
                    {[t.background, t.accent, t.card, t.border].map((c) => (
                      <span
                        key={c}
                        aria-hidden
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: c, borderColor: t.border }}
                      />
                    ))}
                  </div>
                  {isSelected && (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: t.accent, color: t.card }}
                    >
                      ✓
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white"
            style={{ backgroundColor: "#5b7351" }}
          >
            Save changes
          </button>
        </div>
      </form>
    </section>
  );
}
