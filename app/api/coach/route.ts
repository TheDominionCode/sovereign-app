import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface CoachPayload {
  date: string;
  alignmentPct: number;
  doneCount: number;
  totalHabits: number;
  completedHabits: string[];
  dominionHabits: string[];
  todayIdentity: string | null;
  doneTasks: string[];
  totalTasks: number;
  reflectionFilled: number;
  reflectionAnswers: string[];
  gratitude: string;
  onePromise: string;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "coach_unavailable" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: CoachPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const {
    alignmentPct, doneCount, totalHabits, completedHabits,
    dominionHabits, todayIdentity, doneTasks, totalTasks,
    reflectionFilled, reflectionAnswers, gratitude, onePromise,
  } = payload;

  const dominionLine = dominionHabits.length >= 2
    ? `She completed spiritual/identity habits including: ${dominionHabits.join(", ")}. This is what we call strengthening her Dominion.`
    : "";

  const identityLine = todayIdentity
    ? `Today she chose the identity word: "${todayIdentity}".`
    : "";

  const reflectionLine = reflectionAnswers.filter(Boolean).length > 0
    ? `Her reflection answers today included: "${reflectionAnswers.filter(Boolean).slice(0, 3).join('" / "')}".`
    : "";

  const gratitudeLine = gratitude ? `Her gratitude note: "${gratitude}".` : "";
  const promiseLine = onePromise ? `Her one promise for today was: "${onePromise}".` : "";

  const prompt = `You are Sovereign, a deeply personal AI life coach for a woman building a purposeful life. You speak with warmth, directness, and spiritual grounding. You reference her day's actual data.

Today's summary:
- Alignment score: ${alignmentPct}% (${doneCount} of ${totalHabits} habits completed)
- Completed habits: ${completedHabits.length > 0 ? completedHabits.join(", ") : "none"}
- Tasks: ${doneTasks.length} of ${totalTasks} completed
- Reflection prompts answered: ${reflectionFilled}
${identityLine}
${dominionLine}
${reflectionLine}
${gratitudeLine}
${promiseLine}

Write a personal evening debrief in 3–4 sentences. Be specific to her data. ${dominionHabits.length >= 2 ? 'Use the word "Dominion" naturally — she strengthened it today.' : ''} End with one forward-looking insight or gentle challenge for tomorrow. Never be generic. Speak directly to her ("you", not "she").`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "coach_unavailable" }, { status: 503 });
    }

    const json = await res.json();
    const message = json.content?.[0]?.text ?? "";
    return NextResponse.json({ message });
  } catch (e) {
    console.error("Coach route error:", e);
    return NextResponse.json({ error: "coach_unavailable" }, { status: 503 });
  }
}
