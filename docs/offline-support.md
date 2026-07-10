# Offline support

The 4Daagse passage-time app is most useful on crowded event days, when mobile
connectivity can be unreliable. Offline support should therefore cover the app
shell and route calculations, while treating map tiles as a separate concern.

This document is a design draft. Route fetching remains unchanged until the
questions below have explicit answers.

## Goals

- Keep route selection and passage-time calculations usable after connectivity
  is lost.
- Make it clear which event edition and route-data version is available offline.
- Avoid silently serving an outdated route after a newer edition is deployed.
- Recover cleanly from interrupted downloads and partially cached days.
- Respect map-provider terms and browser storage limits.

## Suggested direction

Use a small, versioned edition manifest as the source of truth. A service worker
can precache the application shell and runtime-cache immutable route files under
an edition-specific cache key. The UI should expose offline readiness per day,
rather than assuming that a successful app-shell install means every route and
map tile is available.

Map tiles should not automatically be bulk-downloaded. The app can remain useful
with cached route geometry over a limited cached map area, or with a deliberately
designed offline basemap added later.

## Questions

1. Should the app download all four route days on first use, only the selected
   day, or ask the user which days to make available offline?
2. Should route files be precached during service-worker installation or fetched
   by the page and placed in a runtime cache after a successful response?
3. How should the app represent offline readiness: per edition, per day, or per
   individual distance?
4. What is the cache key and invalidation policy when route data changes without
   the edition year changing? A content hash or explicit route-data version would
   avoid relying on filenames alone.
5. When a new edition is deployed, should the previous edition remain available
   until all new route files are cached successfully, or should it be removed
   immediately?
6. What should happen when one route request fails halfway through downloading
   an edition? The UI needs to distinguish current cached data, current network
   data, and unavailable data.
7. Should route requests prefer the cache, the network, or use stale-while-
   revalidate? Event-day correctness may justify a different policy before and
   during the event.
8. Should users get an explicit “Download for offline use” action, including a
   size estimate and progress, instead of background downloads they did not ask
   for?
9. How should updated start times or other small configuration changes be cached
   independently from the larger GeoJSON files?
10. What map experience is acceptable offline? Options include recently viewed
    OpenStreetMap tiles, a small packaged basemap, or a route-only fallback. Tile
    usage policies and storage size need to be checked before choosing.
11. What storage-quota behavior is required on iOS and Android when the browser
    evicts cached assets? Should the app periodically verify cached route files?
12. How will offline behavior be tested for first visit, repeat visit, interrupted
    downloads, upgrades, cache eviction, and a device clock set around day
    transitions?

## Decision needed before changing route fetching

The key product choice is whether offline availability should be automatic or
explicit. Once that is decided, the fetch strategy can be designed around the
same edition manifest and avoid implementing a temporary loading pattern that a
service worker would soon replace.
