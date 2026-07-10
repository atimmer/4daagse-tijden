# Offline support

Offline support is automatic and has no dedicated UI. After one successful
online visit, the application shell and downloaded route files remain available
when the site is revisited in the same browser.

## Behavior

- The application shell is precached by a service worker.
- All four route days are requested in parallel when the app loads.
- Route requests prefer the network and update the cached response after a
  successful download.
- When the network is unavailable, the newest successfully cached response for
  that route URL is used.
- A failed request for one day does not prevent other available days from
  loading.
- The first page load stores successful route responses directly because a new
  service worker cannot control the page that installs it.

## Not included in v1

Map tiles are not deliberately cached. Previously viewed tiles may be present in
the browser's HTTP cache, but only the route geometry is guaranteed by this
feature. A purpose-built offline background map can be considered separately.
