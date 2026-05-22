import type { FlowLevel } from "@/lib/dashboard/types";

export const FLOW_OPTIONS: { id: FlowLevel; label: string; color: string }[] = [
  { id: "none", label: "No flow", color: "transparent" },
  { id: "spotting", label: "Spotting", color: "#fde2e4" },
  { id: "light", label: "Light", color: "#f9b3b8" },
  { id: "medium", label: "Medium", color: "#e07a82" },
  { id: "heavy", label: "Heavy", color: "#a83248" },
];

export const MOOD_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: "great", label: "Great", emoji: "✨" },
  { id: "good", label: "Good", emoji: "🙂" },
  { id: "okay", label: "Okay", emoji: "😐" },
  { id: "low", label: "Low", emoji: "😔" },
  { id: "anxious", label: "Anxious", emoji: "😰" },
  { id: "angry", label: "Angry", emoji: "😤" },
  { id: "tired", label: "Tired", emoji: "😴" },
  { id: "tearful", label: "Tearful", emoji: "🥺" },
];

export const SYMPTOM_OPTIONS = [
  "Cramps", "Headache", "Bloating", "Tender breasts", "Back pain", "Acne",
  "Cravings", "Fatigue", "Nausea", "Insomnia", "High energy", "Focused",
];
