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
