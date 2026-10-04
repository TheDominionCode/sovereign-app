// The 12-season, 365-day Sovereign yearly progression (spec §9). Pure
// functions only — no DB/network access — so this same logic can be
// hand-copied into the Deno Edge Function (supabase/functions/
// generate-daily-sovereign-content) without a shared-module build step.

export type Season = { range: string; name: string; startDay: number; endDay: number };

export const SEASONS: Season[] = [
  { range: "1-30",    name: "Identity",                     startDay: 1,   endDay: 30 },
  { range: "31-60",   name: "Mind + Metacognition",          startDay: 31,  endDay: 60 },
  { range: "61-90",   name: "Discipline + Habits",           startDay: 61,  endDay: 90 },
  { range: "91-120",  name: "Confidence + Embodiment",       startDay: 91,  endDay: 120 },
  { range: "121-150", name: "Relationships + Communication", startDay: 121, endDay: 150 },
  { range: "151-180", name: "Money + Stewardship",           startDay: 151, endDay: 180 },
  { range: "181-210", name: "Purpose + Vision",              startDay: 181, endDay: 210 },
  { range: "211-240", name: "Spiritual Maturity",            startDay: 211, endDay: 240 },
  { range: "241-270", name: "Leadership",                    startDay: 241, endDay: 270 },
  { range: "271-300", name: "CEO Identity + Sales",          startDay: 271, endDay: 300 },
  { range: "301-330", name: "Integration + Dominion",        startDay: 301, endDay: 330 },
  { range: "331-365", name: "Mastery + Continuation",        startDay: 331, endDay: 366 }, // covers day 366 on leap years
];

export function seasonForDayOfYear(dayOfYear: number): Season {
  return SEASONS.find((s) => dayOfYear >= s.startDay && dayOfYear <= s.endDay) ?? SEASONS[SEASONS.length - 1];
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// date: "YYYY-MM-DD". Computed from UTC date parts only — never from a
// Date object constructed from a bare "YYYY-MM-DD" string being
// re-interpreted in a local timezone, which is the classic off-by-one
// source of midnight date shifts (spec §30).
export function dayMetaForDate(date: string): { dayOfYear: number; daysRemaining: number; season: Season; year: number } {
  const [y, m, d] = date.split("-").map(Number);
  const year = y;
  const startOfYearUTC = Date.UTC(year, 0, 1);
  const thisDateUTC = Date.UTC(year, m - 1, d);
  const dayOfYear = Math.floor((thisDateUTC - startOfYearUTC) / 86400000) + 1;
  const totalDays = isLeapYear(year) ? 366 : 365;
  const daysRemaining = totalDays - dayOfYear;
  return { dayOfYear, daysRemaining, season: seasonForDayOfYear(dayOfYear), year };
}
