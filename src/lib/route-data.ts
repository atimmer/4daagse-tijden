import type { FeatureCollection } from "geojson";

const ROUTE_CACHE = "route-data";

async function getCachedRoute(file: string): Promise<Response | undefined> {
  if (!("caches" in window)) return undefined;
  return (await caches.open(ROUTE_CACHE)).match(file);
}

export async function fetchRouteData(file: string): Promise<FeatureCollection> {
  const serviceWorkerControlled = Boolean(navigator.serviceWorker?.controller);

  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Failed to fetch route: ${response.status}`);
    const cacheResponse = response.clone();
    const routeData = (await response.json()) as FeatureCollection;

    // The service worker cannot intercept requests from the first page load.
    // Store that first successful response here so one visit is enough.
    if (!serviceWorkerControlled && "caches" in window) {
      const cache = await caches.open(ROUTE_CACHE);
      await cache.put(file, cacheResponse);
    }

    return routeData;
  } catch (error) {
    const cachedResponse = await getCachedRoute(file);
    if (cachedResponse) {
      return cachedResponse.json() as Promise<FeatureCollection>;
    }
    throw error;
  }
}
