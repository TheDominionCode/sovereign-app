// The Sovereign app itself is the exact self-contained build shipped at
// sovereignincharge.netlify.app, served as a static asset from /os.html.
// Access is gated upstream by app/(authed)/layout.tsx, which enforces login
// and an active subscription before this page ever renders.
export default function AppHome() {
  return (
    <iframe
      src="/os.html"
      title="Sovereign"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: 0,
      }}
    />
  );
}
