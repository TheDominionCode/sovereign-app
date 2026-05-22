"use client";

import { useState } from "react";

// Reads a file, downscales it on a canvas, and exposes the result as a data
// URL through a hidden input so it submits with the surrounding server-action form.
export function ImagePicker({ name = "img" }: { name?: string }) {
  const [dataUrl, setDataUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setBusy(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 1000;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setError("Could not process that image.");
          setBusy(false);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const url = canvas.toDataURL("image/jpeg", 0.7);
        if (url.length > 700_000) {
          setError("That image is too large even after compression. Try a smaller one.");
          setBusy(false);
          return;
        }
        setDataUrl(url);
        setBusy(false);
      };
      img.onerror = () => {
        setError("Could not load that image.");
        setBusy(false);
      };
      img.src = String(ev.target?.result ?? "");
    };
    reader.onerror = () => {
      setError("Could not read that file.");
      setBusy(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <input type="hidden" name={name} value={dataUrl} />
      {dataUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="preview" className="w-full h-40 object-cover rounded border border-stone-200" />
          <button
            type="button"
            onClick={() => setDataUrl("")}
            className="absolute top-2 right-2 px-2 py-1 bg-white/90 text-xs rounded border border-stone-200 hover:text-rose"
          >
            Remove
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-stone-300 rounded cursor-pointer hover:border-sage hover:bg-cream-bg/50 transition">
          <span className="text-sm text-stone">{busy ? "Compressing…" : "Click to upload an image"}</span>
          <span className="text-[10px] text-stone-light mt-1">Auto-compressed to keep it light</span>
          <input type="file" accept="image/*" className="hidden" onChange={onPick} disabled={busy} />
        </label>
      )}
      {error && <p className="text-xs text-rose mt-1">{error}</p>}
    </div>
  );
}
