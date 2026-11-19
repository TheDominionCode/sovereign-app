import type { Viewport } from "next";

// Restore the navy theme-color for the interior Sovereign experience —
// the marketing/auth pages use ivory (set at app/layout.tsx) so iOS
// rubber-band scroll matches the cream landing, but once you're INSIDE
// the app the chrome should pick up the navy tone again.
export const viewport: Viewport = {
  themeColor: "#0A2245",
};

// The exact Sovereign app (served at /os.html) brings its own full-screen
// chrome and navigation, so this layout adds none. Login + active-subscription
// gating is handled by the parent app/(authed)/layout.tsx.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
