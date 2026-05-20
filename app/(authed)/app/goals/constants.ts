export const GOAL_CATEGORIES = [
  "Health",
  "Personal Growth",
  "Financial",
  "Spiritual",
  "Family",
  "Relationship",
  "Fitness",
  "Reading",
  "Hobbies",
  "Travel",
  "Personal",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export function normalizeGoalCategory(input: string): GoalCategory {
  const v = (input || "").trim();
  return (GOAL_CATEGORIES as readonly string[]).includes(v)
    ? (v as GoalCategory)
    : "Personal";
}
