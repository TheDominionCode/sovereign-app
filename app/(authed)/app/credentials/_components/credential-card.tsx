"use client";

import { useState } from "react";
import type { CredentialRow } from "@/lib/dashboard/types";
import { CRED_CATEGORIES } from "../constants";

type Props = {
  cred: CredentialRow;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
};

export function CredentialCard({ cred, updateAction, deleteAction }: Props) {
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);

  const copy = (text: string | null) => {
    if (text) navigator.clipboard?.writeText(text);
  };

  const initial = (cred.site || "?").charAt(0).toUpperCase();

  return (
    <div className="p-4 rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sage-light to-forest flex items-center justify-center text-white font-bold flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-ink truncate">{cred.site}</div>
          {cred.url && (
            <a
              href={cred.url.startsWith("http") ? cred.url : `https://${cred.url}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-stone-light truncate hover:text-forest block"
            >
              {cred.url}
            </a>
          )}
        </div>
        <span className="text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-cream-bg text-forest flex-shrink-0">
          {cred.category}
        </span>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 p-2 rounded bg-stone-50 border border-stone-200">
          <span className="text-[10px] tracking-wider text-stone-light w-16 flex-shrink-0">
            USER
          </span>
          <span className="flex-1 text-sm font-mono truncate">{cred.username || "—"}</span>
          <button
            type="button"
            onClick={() => copy(cred.username)}
            className="text-[10px] tracking-wider text-stone hover:text-forest"
          >
            COPY
          </button>
        </div>
        <div className="flex items-center gap-2 p-2 rounded bg-stone-50 border border-stone-200">
          <span className="text-[10px] tracking-wider text-stone-light w-16 flex-shrink-0">
            PASS
          </span>
          <span className="flex-1 text-sm font-mono truncate">
            {show ? cred.password || "—" : "•".repeat(Math.min(16, (cred.password || "").length)) || "—"}
          </span>
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-[10px] tracking-wider text-stone hover:text-forest"
          >
            {show ? "HIDE" : "SHOW"}
          </button>
          <button
            type="button"
            onClick={() => copy(cred.password)}
            className="text-[10px] tracking-wider text-stone hover:text-forest"
          >
            COPY
          </button>
        </div>
      </div>

      {cred.notes && <div className="text-xs text-stone italic mb-3">&ldquo;{cred.notes}&rdquo;</div>}

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded hover:border-sage text-stone"
        >
          {editing ? "Close" : "Edit"}
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={cred.id} />
          <button
            type="submit"
            className="px-2 py-1 text-xs border border-stone-200 rounded hover:border-rose hover:text-rose text-stone"
          >
            Delete
          </button>
        </form>
      </div>

      {editing && (
        <form action={updateAction} className="mt-3 grid gap-2 pt-3 border-t border-stone-100">
          <input type="hidden" name="id" value={cred.id} />
          <input name="site" defaultValue={cred.site} placeholder="Site" className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="url" defaultValue={cred.url ?? ""} placeholder="URL" className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="username" defaultValue={cred.username ?? ""} placeholder="Username" className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <input name="password" defaultValue={cred.password ?? ""} placeholder="Password" className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white font-mono" />
          <select name="category" defaultValue={cred.category} className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white">
            {CRED_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <textarea name="notes" defaultValue={cred.notes ?? ""} rows={2} placeholder="Notes" className="px-3 py-1.5 rounded border border-stone-200 focus:border-sage outline-none text-sm bg-white" />
          <button type="submit" className="px-3 py-1.5 bg-forest text-white text-xs rounded hover:bg-forest-deep">
            Save changes
          </button>
        </form>
      )}
    </div>
  );
}
