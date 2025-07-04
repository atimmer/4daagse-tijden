// Utility to determine the default day for the 4Daagse app based on current date/time and 4Daagse week

export function getDefaultDay(nowArg?: Date) {
  // 4Daagse 2025: Tuesday 15 July - Friday 18 July
  const year = 2025;
  const tuesday = new Date(Date.UTC(year, 6, 15, 16, 0)); // July 15, 18:00 local (16:00 UTC)
  const wednesday = new Date(Date.UTC(year, 6, 16, 16, 0)); // July 16, 18:00 local (16:00 UTC)
  const thursday = new Date(Date.UTC(year, 6, 17, 16, 0)); // July 17, 18:00 local (16:00 UTC)
  const friday_end = new Date(thursday.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days after Thursday 18:00

  const now = nowArg || new Date();

  if (now < tuesday) {
    return "Dinsdag";
  } else if (now >= tuesday && now < wednesday) {
    return "Woensdag";
  } else if (now >= wednesday && now < thursday) {
    return "Donderdag";
  } else if (now >= thursday && now < friday_end) {
    return "Vrijdag";
  } else {
    return "Dinsdag";
  }
}
