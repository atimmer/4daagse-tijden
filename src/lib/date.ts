import { EDITION } from "../config/edition";

export function getDefaultDay(nowArg?: Date) {
  const now = nowArg || new Date();
  const dayCutoffs = EDITION.routes.slice(0, -1).map(({ date }) =>
    // The event is in July (CEST), so 18:00 in Nijmegen is 16:00 UTC.
    new Date(`${date}T16:00:00Z`)
  );
  const fridayEnd = new Date(
    dayCutoffs[dayCutoffs.length - 1].getTime() + 14 * 24 * 60 * 60 * 1000
  );

  for (const [index, cutoff] of dayCutoffs.entries()) {
    if (now < cutoff) return EDITION.routes[index].day;
  }

  return now < fridayEnd ? "Vrijdag" : "Dinsdag";
}
