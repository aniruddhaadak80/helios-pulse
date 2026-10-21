import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as earthquakes } from "../app/api/earthquakes/route";
import { POST as mcp } from "../app/api/mcp/route";

function stubFetch() {
  const urls: string[] = [];
  vi.stubGlobal("fetch", async (input: unknown) => {
    urls.push(String(input));
    return {
      ok: true,
      status: 200,
      json: async () => ({ features: [] }),
    } as unknown as Response;
  });
  return urls;
}

describe("earthquakes route", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends an exact starttime, not a calendar day", async () => {
    const urls = stubFetch();
    await earthquakes(new Request("http://localhost/api/earthquakes?hours=6"));
    const url = urls[0];
    const start = new URL(url).searchParams.get("starttime")!;
    expect(start).toMatch(/T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const ageHours = (Date.now() - new Date(start).getTime()) / 3_600_000;
    expect(ageHours).toBeGreaterThan(5.9);
    expect(ageHours).toBeLessThan(6.1);
  });

  it("falls back to the default window for an unusable hours value", async () => {
    const urls = stubFetch();
    const response = await earthquakes(new Request("http://localhost/api/earthquakes?hours=abc"));
    expect(response.status).toBe(200);
    const start = new URL(urls[0]).searchParams.get("starttime")!;
    const ageHours = (Date.now() - new Date(start).getTime()) / 3_600_000;
    expect(ageHours).toBeGreaterThan(71.9);
    expect(ageHours).toBeLessThan(72.1);
  });
});

describe("mcp quakes tool", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes the advertised minmag and limit through", async () => {
    const urls = stubFetch();
    await mcp(
      new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ tool: "helios.quakes", args: { minmag: 7, limit: 3 } }),
      })
    );
    const url = new URL(urls[0]);
    expect(url.searchParams.get("minmag")).toBe("7");
    expect(url.searchParams.get("limit")).toBe("3");
  });

  it("uses the defaults when no arguments are given", async () => {
    const urls = stubFetch();
    await mcp(
      new Request("http://localhost/api/mcp", {
        method: "POST",
        body: JSON.stringify({ tool: "helios.quakes" }),
      })
    );
    const url = new URL(urls[0]);
    expect(url.searchParams.get("minmag")).toBe("4.5");
    expect(url.searchParams.get("limit")).toBe("20");
  });
});
