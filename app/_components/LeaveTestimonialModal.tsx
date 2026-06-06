"use client";

import { useActionState, useState } from "react";
import {
  submitTestimonialAction,
  type SubmitTestimonialState,
} from "@/lib/actions/testimonial";

type Lang = "en" | "es";

const COPY = {
  en: {
    open: "Leave a testimonial",
    title: "Leave a testimonial",
    sub: "Share how Sovereign landed for you — your words might inspire the next woman.",
    nameLabel: "Your name",
    namePh: "Sovereign Woman",
    quoteLabel: "Your testimonial",
    quotePh: "How has Sovereign shifted your daily rhythm?",
    photoLabel: "Photo (optional)",
    photoHint: "JPG, PNG, or HEIC · up to 5MB",
    cancel: "Cancel",
    submit: "Send",
    sending: "Sending…",
    successTitle: "Thank you 🤍",
    successBody:
      "I'll read every word. If it lands on the site, you'll be the first to see it.",
    close: "Close",
  },
  es: {
    open: "Dejar un testimonio",
    title: "Dejar un testimonio",
    sub: "Cuenta cómo Sovereign llegó a ti — tus palabras pueden inspirar a la próxima mujer.",
    nameLabel: "Tu nombre",
    namePh: "Mujer Soberana",
    quoteLabel: "Tu testimonio",
    quotePh: "¿Cómo Sovereign cambió tu ritmo diario?",
    photoLabel: "Foto (opcional)",
    photoHint: "JPG, PNG o HEIC · hasta 5MB",
    cancel: "Cancelar",
    submit: "Enviar",
    sending: "Enviando…",
    successTitle: "Gracias 🤍",
    successBody:
      "Voy a leer cada palabra. Si aparece en el sitio, serás la primera en verlo.",
    close: "Cerrar",
  },
};

const initialState: SubmitTestimonialState = { ok: false };

export default function LeaveTestimonialModal({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const c = COPY[lang];
  const [state, formAction, pending] = useActionState(
    submitTestimonialAction,
    initialState
  );

  const showSuccess = state.ok && !pending;

  const reset = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="testi-cta"
      >
        ✦ {c.open}
      </button>

      {open && (
        <div
          className="testi-backdrop"
          onClick={reset}
          role="dialog"
          aria-modal="true"
        >
          <div className="testi-modal" onClick={(e) => e.stopPropagation()}>
            {showSuccess ? (
              <>
                <h3 className="testi-title">{c.successTitle}</h3>
                <p className="testi-sub">{c.successBody}</p>
                <div className="testi-actions">
                  <button
                    type="button"
                    onClick={reset}
                    className="testi-btn-primary"
                  >
                    {c.close}
                  </button>
                </div>
              </>
            ) : (
              <form action={formAction}>
                <h3 className="testi-title">{c.title}</h3>
                <p className="testi-sub">{c.sub}</p>
                <input type="hidden" name="lang" value={lang} />

                <label className="testi-label" htmlFor="t-name">
                  {c.nameLabel}
                </label>
                <input
                  id="t-name"
                  name="name"
                  type="text"
                  required
                  placeholder={c.namePh}
                  className="testi-input"
                />

                <label className="testi-label" htmlFor="t-quote">
                  {c.quoteLabel}
                </label>
                <textarea
                  id="t-quote"
                  name="quote"
                  required
                  minLength={20}
                  maxLength={600}
                  rows={4}
                  placeholder={c.quotePh}
                  className="testi-textarea"
                />

                <label className="testi-label" htmlFor="t-photo">
                  {c.photoLabel}
                </label>
                <input
                  id="t-photo"
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="testi-file"
                />
                <p className="testi-hint">{c.photoHint}</p>

                {state.error && (
                  <p className="testi-error">{state.error}</p>
                )}

                <div className="testi-actions">
                  <button
                    type="button"
                    onClick={reset}
                    className="testi-btn-ghost"
                  >
                    {c.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="testi-btn-primary"
                  >
                    {pending ? c.sending : c.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
