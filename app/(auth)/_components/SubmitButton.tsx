"use client";

import { useFormStatus } from "react-dom";

// Submit button that flips to a lighter color + spinner + "pending text"
// while the form's server action is in flight, so the user sees the
// click was received and isn't left wondering whether the page is hung.
export default function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`w-full rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
        pending
          ? "bg-sage-light cursor-wait"
          : "bg-forest hover:bg-forest-deep"
      }`}
    >
      {pending && (
        <svg
          className="animate-spin w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="4" />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
      <span>{pending ? (pendingLabel || `${label}…`) : label}</span>
    </button>
  );
}
