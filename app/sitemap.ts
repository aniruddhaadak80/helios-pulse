import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://helios-pulse.vercel.app";
  const routes: [string, number][] = [
    ["", 1],
    ["/live", 0.9],
    ["/aurora", 0.9],
    ["/quakes", 0.8],
    ["/oracle", 0.8],
    ["/developers", 0.7],
  ];
  return routes.map(([r, priority]) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority,
  }));
}
