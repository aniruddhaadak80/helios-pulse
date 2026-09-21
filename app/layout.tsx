import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HELIOS PULSE — Solar Maximum 2026 Live Planetary Intelligence",
  description:
    "Live space-weather, aurora, earthquake and infrastructure-risk intelligence for Solar Cycle 25 maximum. Real NOAA + USGS data, 3D globe, AI Oracle, open REST + MCP API. Open source.",
  keywords: [
    "solar maximum 2026",
    "space weather",
    "Kp index",
    "aurora forecast",
    "CME",
    "solar flare",
    "earthquake live",
    "planetary defense",
    "NOAA SWPC",
    "USGS",
    "AI agent",
    "MCP server",
    "open source",
  ],
  authors: [{ name: "HELIOS PULSE", url: "https://github.com/aniruddhaadak80/helios-pulse" }],
  openGraph: {
    title: "HELIOS PULSE — Solar Maximum 2026 Live",
    description:
      "The living dashboard for our restless star. Live Kp, solar wind, flares, auroras, quakes + AI risk Oracle.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HELIOS PULSE — Solar Maximum 2026 Live",
    description:
      "Live space weather + planetary intelligence. Open source, open API, MCP-ready.",
  },
  metadataBase: new URL("https://helios-pulse.vercel.app"),
};

export const viewport: Viewport = {
  themeColor: "#030014",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='34' fill='%23fb923c'/%3E%3Ccircle cx='50' cy='50' r='42' fill='none' stroke='%23f43f5e' stroke-width='5' opacity='0.6'/%3E%3C/svg%3E"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="min-h-full flex flex-col cosmos-bg">{children}</body>
    </html>
  );
}
