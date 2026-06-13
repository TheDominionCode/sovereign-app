import type { Metadata, Viewport } from "next";
import "./globals.css";

// metadataBase ensures Next.js builds ABSOLUTE URLs for the og:image and
// other social-preview tags. Without this, iMessage / Instagram / Twitter
// get a relative path they can't resolve, so the preview falls back to
// scraping a random screenshot from the page.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sovereign-life.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Sovereign — Build the Life",
  description:
    "An operating system for the woman behind everything. Goals, money, body, vision, language — all in one place.",
  manifest: "/manifest.json",
  applicationName: "Sovereign",
  appleWebApp: {
    capable: true,
    title: "Sovereign",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Open Graph — what iMessage, WhatsApp, Slack, Facebook, LinkedIn,
  // Instagram DMs etc. all read when someone pastes a Sovereign link.
  // We use the flatlay (phone + Sovereign coffee + lip tint) because it
  // feels like a real morning ritual — much warmer than a raw screenshot.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Sovereign",
    title: "Sovereign — Build the Life",
    description:
      "An operating system for the woman behind everything. Goals, money, body, vision, language — all in one place.",
    images: [
      {
        url: "/images/landing/lifestyle-flatlay.png",
        width: 1206,
        height: 1608,
        alt: "Sovereign — calm, centered, in charge",
      },
    ],
    locale: "en_US",
  },
  // Twitter / X uses its own card spec but reads many of the same fields.
  twitter: {
    card: "summary_large_image",
    title: "Sovereign — Build the Life",
    description:
      "An operating system for the woman behind everything. Goals, money, body, vision, language — all in one place.",
    images: ["/images/landing/lifestyle-flatlay.png"],
  },
};

export const viewport: Viewport = {
  // Ivory — matches the cream landing background so iOS rubber-band scroll
  // and the Safari address-bar tint blend in with the page instead of showing
  // a sage band at the edges. The inner Sovereign app overrides this back to
  // sage at app/(authed)/app/layout.tsx so the interior chrome still feels
  // forest-deep.
  themeColor: "#f5efe6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
