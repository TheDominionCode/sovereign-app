import Link from "next/link";
import { headers } from "next/headers";
import { Crown } from "lucide-react";

// A quiet, aesthetic farewell — not a sales pitch. Lands here after every
// sign-out. The marketing /landing stays for visitors who arrive fresh.
export default async function SignedOutPage() {
  // Match the user's browser language; Sovereign's clients are bilingual.
  const accept = (await headers()).get("accept-language") || "";
  const isES = /^es\b|,\s*es\b/i.test(accept);

  const copy = isES
    ? {
        eyebrow: "Hasta pronto",
        title: "Tu sesión está cerrada",
        tagline: "Calma, centrada, en control.",
        body:
          "Sovereign guarda lo que has construido — exactamente donde lo dejaste. Vuelve cuando estés lista.",
        primary: "Iniciar sesión",
        secondary: "Ir a Sovereign",
      }
    : {
        eyebrow: "Until next time",
        title: "You're signed out",
        tagline: "Calm, centered, in charge.",
        body:
          "Sovereign is holding what you've built — exactly where you left it. Come back when you're ready.",
        primary: "Sign back in",
        secondary: "Visit Sovereign",
      };

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-sage-pale/60 flex items-center justify-center mx-auto mb-6">
        <Crown className="w-7 h-7 text-forest-deep" />
      </div>

      <div className="text-[11px] tracking-[0.32em] uppercase text-sage mb-3">
        {copy.eyebrow}
      </div>

      <h1 className="font-display text-3xl sm:text-4xl text-forest-deep leading-tight mb-3">
        {copy.title}
      </h1>

      <p className="font-cormorant italic text-base sm:text-lg text-stone mb-6">
        &ldquo;{copy.tagline}&rdquo;
      </p>

      <p className="text-sm text-stone leading-relaxed max-w-sm mx-auto mb-8">
        {copy.body}
      </p>

      <Link
        href="/login"
        className="inline-block w-full sm:w-auto sm:px-8 rounded-md bg-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-forest-deep transition-colors"
      >
        {copy.primary}
      </Link>

      <p className="mt-6">
        <Link
          href="/"
          className="text-xs tracking-[0.22em] uppercase text-stone-light hover:text-forest transition-colors"
        >
          {copy.secondary} →
        </Link>
      </p>
    </div>
  );
}
