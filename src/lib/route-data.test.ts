import type { FeatureCollection } from "geojson";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRouteData } from "./route-data";

const FILE = "/route.geojson";
const ROUTE_DATA: FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

function responseFor(data: FeatureCollection): Response {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

function setUpBrowser(cachedResponse?: Response, controlled = false) {
  const cache = {
    match: vi.fn(async () => cachedResponse),
    put: vi.fn(async () => undefined),
  };
  const cacheStorage = {
    open: vi.fn(async () => cache),
  };

  vi.stubGlobal("caches", cacheStorage);
  vi.stubGlobal("window", { caches: cacheStorage });
  vi.stubGlobal("navigator", {
    serviceWorker: { controller: controlled ? {} : null },
  });

  return cache;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchRouteData", () => {
  it("caches a successful route on the first uncontrolled visit", async () => {
    const cache = setUpBrowser();
    vi.stubGlobal("fetch", vi.fn(async () => responseFor(ROUTE_DATA)));

    await expect(fetchRouteData(FILE)).resolves.toEqual(ROUTE_DATA);
    expect(cache.put).toHaveBeenCalledWith(FILE, expect.any(Response));
  });

  it("leaves caching to the service worker once it controls the page", async () => {
    const cache = setUpBrowser(undefined, true);
    vi.stubGlobal("fetch", vi.fn(async () => responseFor(ROUTE_DATA)));

    await expect(fetchRouteData(FILE)).resolves.toEqual(ROUTE_DATA);
    expect(cache.put).not.toHaveBeenCalled();
  });

  it("falls back to the newest cached route when fetching fails", async () => {
    setUpBrowser(responseFor(ROUTE_DATA));
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));

    await expect(fetchRouteData(FILE)).resolves.toEqual(ROUTE_DATA);
  });
});
