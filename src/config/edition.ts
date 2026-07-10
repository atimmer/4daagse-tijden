export type EventDay = "Dinsdag" | "Woensdag" | "Donderdag" | "Vrijdag";
export type RouteDistance = "30km" | "40km" | "40km MIL" | "40km ML" | "50km";
type StartTime = `${number}:${number}`;

export interface RouteFileMetadata {
  day: EventDay;
  date: `${number}-${number}-${number}`;
  file: `/${string}.geojson`;
  sourceUrl: `https://${string}`;
}

export interface EditionConfig {
  year: number;
  edition: number;
  routes: readonly RouteFileMetadata[];
  source: {
    name: string;
    url: `https://${string}`;
    lastUpdated: `${number}-${number}-${number}`;
  };
  startTimes: {
    default: Record<RouteDistance, StartTime>;
    overrides: Partial<
      Record<EventDay, Partial<Record<RouteDistance, StartTime>>>
    >;
    sourceUrl: `https://${string}`;
  };
}

const START_TIME_OVERRIDES: EditionConfig["startTimes"]["overrides"] = {
  Vrijdag: {
    "40km MIL": "03:30",
    "40km ML": "03:30",
  },
};

export const EDITION = {
  year: 2026,
  edition: 108,
  routes: [
    {
      day: "Dinsdag",
      date: "2026-07-21",
      file: "/4Daagse_dinsdag_2026_complete.geojson",
      sourceUrl:
        "https://www.google.com/maps/d/viewer?mid=1ad7LeXribyPlnBW-zNsayomVfI-8nuM",
    },
    {
      day: "Woensdag",
      date: "2026-07-22",
      file: "/4Daagse_woensdag_2026_complete.geojson",
      sourceUrl:
        "https://www.google.com/maps/d/viewer?mid=1q4CDnWbyXGFB7-U_e7y5yoMxgax9JLI",
    },
    {
      day: "Donderdag",
      date: "2026-07-23",
      file: "/4Daagse_donderdag_2026_complete.geojson",
      sourceUrl:
        "https://www.google.com/maps/d/viewer?mid=12b8RmaJj0Qr53DKmojn0Vg2jblSPzDQ",
    },
    {
      day: "Vrijdag",
      date: "2026-07-24",
      file: "/4Daagse_vrijdag_2026_complete.geojson",
      sourceUrl:
        "https://www.google.com/maps/d/viewer?mid=1dwx3631l85gWXUv707lh7LoOR2sQL7c",
    },
  ],
  source: {
    name: "Stichting DE 4DAAGSE",
    url: "https://www.4daagse.nl/de-4daagseweek/routes",
    lastUpdated: "2026-07-10",
  },
  startTimes: {
    default: {
      "50km": "04:00",
      "40km MIL": "04:30",
      "40km ML": "04:30",
      "40km": "05:00",
      "30km": "07:00",
    },
    overrides: START_TIME_OVERRIDES,
    sourceUrl: "https://www.4daagse.nl/de-4daagseweek/startfinish",
  },
} as const satisfies EditionConfig;

export const EVENT_DAYS = EDITION.routes.map(({ day }) => day);

export function getDefaultStartTime(day: EventDay, distance: string): StartTime {
  if (!(distance in EDITION.startTimes.default)) return "07:00";

  const knownDistance = distance as RouteDistance;
  return (
    EDITION.startTimes.overrides[day]?.[knownDistance] ??
    EDITION.startTimes.default[knownDistance]
  );
}
