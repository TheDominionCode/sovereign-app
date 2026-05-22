import type { SupabaseClient } from "@supabase/supabase-js";

// Default starter content seeded once per user, the first time they open the
// dashboard. Idempotent: gated on the existence of a user_preferences row.

const DEFAULT_AFFIRMATIONS: { text: string; category: string; favorite: boolean }[] = [
  { text: "I am calm, centered, and in charge of my life.", category: "Confidence", favorite: true },
  { text: "I trust myself. I trust my voice. I trust my decisions.", category: "Confidence", favorite: true },
  { text: "I am the woman I have been praying to become.", category: "Confidence", favorite: true },
  { text: "I do not shrink to make anyone comfortable.", category: "Confidence", favorite: false },
  { text: "I am soft and I am strong. Both belong to me.", category: "Confidence", favorite: false },
  { text: "I speak to myself the way I would speak to someone I love.", category: "Self-Worth", favorite: true },
  { text: "I am enough exactly as I am today.", category: "Self-Worth", favorite: true },
  { text: "My worth is not up for negotiation.", category: "Self-Worth", favorite: false },
  { text: "Rest is part of the work, not a reward for it.", category: "Peace", favorite: false },
  { text: "My peace is more valuable than being understood.", category: "Peace", favorite: false },
  { text: "I trust the timing of my own becoming.", category: "Peace", favorite: false },
  { text: "My body is a home, not a project.", category: "Body", favorite: false },
  { text: "My boundaries are an act of love — for me and for them.", category: "Boundaries", favorite: true },
  { text: "I am sovereign over my time, my energy, and my attention.", category: "Boundaries", favorite: true },
  { text: "Nothing meant for me will miss me.", category: "Faith", favorite: true },
  { text: "I am becoming. I do not have to have arrived.", category: "Faith", favorite: false },
];

const DEFAULT_REFLECTION_LISTS: {
  kind: "strengths" | "weaknesses" | "improvements";
  title: string;
  hint: string;
  position: number;
}[] = [
  { kind: "strengths", title: "My strengths", hint: "What you do well. Lean into these.", position: 0 },
  { kind: "weaknesses", title: "My weaknesses", hint: "What trips you up. Awareness is the first step.", position: 1 },
  { kind: "improvements", title: "What I need to improve", hint: "Where you're focusing your growth this season.", position: 2 },
];

const DEFAULT_BOUNDARY_LISTS: {
  kind: "expectations" | "deal_breakers" | "non_negotiables";
  title: string;
  subtitle: string;
  color: string;
  position: number;
}[] = [
  { kind: "expectations", title: "Expectations", subtitle: "What you expect of yourself and others.", color: "#7a9a6e", position: 0 },
  { kind: "deal_breakers", title: "Deal Breakers", subtitle: "Behaviors that end the conversation. Period.", color: "#3f3f46", position: 1 },
  { kind: "non_negotiables", title: "Non-Negotiables", subtitle: "Things you don't compromise on. Ever.", color: "#a16207", position: 2 },
];

export async function ensureUserDefaults(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  // Cheap gate: if a preferences row exists, this user is already seeded.
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return;

  await Promise.all([
    supabase.from("user_preferences").insert({ user_id: userId }),
    supabase.from("routine_settings").insert({ user_id: userId }),
    supabase.from("vision_meta").insert({ user_id: userId }),
    supabase
      .from("reflection_lists")
      .insert(DEFAULT_REFLECTION_LISTS.map((l) => ({ ...l, user_id: userId }))),
    supabase
      .from("boundary_lists")
      .insert(DEFAULT_BOUNDARY_LISTS.map((l) => ({ ...l, user_id: userId }))),
    supabase
      .from("affirmations")
      .insert(
        DEFAULT_AFFIRMATIONS.map((a) => ({ ...a, user_id: userId, custom: false }))
      ),
  ]);
}
