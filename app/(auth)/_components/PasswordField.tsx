"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Password input with a show/hide eye toggle inside the field. The eye
// button is tabIndex=-1 so it doesn't disrupt keyboard tab order.
export default function PasswordField({
  id,
  name,
  autoComplete = "current-password",
  minLength,
  required = true,
  placeholder,
}: {
  id: string;
  name: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-forest transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
