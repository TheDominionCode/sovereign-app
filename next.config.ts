import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // Force-disable caching for the Sovereign single-page app HTML. Without this,
  // iOS Safari hangs onto its first download of os.html forever and never sees
  // design edits — even after dev hot reloads. The HTML is tiny, so disabling
  // cache costs nothing and saves a lot of "is it deployed?" confusion.
  async headers() {
    return [
      {
        source: "/os.html",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
