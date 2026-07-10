# 4Daagse doorkomsttijden

A map for estimating when 4Daagse walkers pass a selected point. Choose a day
and distance, adjust start times and walking speeds, then point at or tap a route
to see the expected passage-time range.

The estimates assume a constant average speed. They are a planning aid, not
official timing information.

## Development

Requirements:

- Node.js
- pnpm 9

Install dependencies:

```sh
pnpm install
```

The development server is managed through the local Devservers Manager. The
project scripts used for verification are:

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

## Project structure

- `src/App.tsx` loads edition route data and owns the selected day, distances,
  start times, and speed range.
- `src/components/MapView.tsx` renders the Leaflet map and handles selecting a
  route point.
- `src/lib/` contains date, geometry, and passage-time calculations.
- `public/` contains route GeoJSON and application icons.
- `docs/offline-support.md` records the decisions needed before changing route
  fetching or adding a service worker.

## Route data

The current configuration targets the 108th edition, held from 21–24 July 2026.
Its GeoJSON files are converted from the public Google My Maps linked by the
official day pages. The edition year, individual source maps, and snapshot date
are recorded in `src/config/edition.ts`. Official event and route information is
available from [4Daagse](https://www.4daagse.nl/de-4daagseweek/routes).

Route fetching intentionally remains unchanged while the offline strategy is
being designed. See [the offline-support draft](docs/offline-support.md).

## Deployment

The app is a static Vite build. `pnpm build` writes the production files to
`dist/`.
