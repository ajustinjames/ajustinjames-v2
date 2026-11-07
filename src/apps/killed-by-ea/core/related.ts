import { formatPartialDate } from "./dates.ts";
import type { Entry, PartialDate } from "./schema.ts";

function sharedPeriod(left: PartialDate, right: PartialDate): "day" | "month" | "year" | undefined {
  if (left.precision === "unknown" || right.precision === "unknown") return undefined;
  if (left.precision === "day" && right.precision === "day" && left.value === right.value)
    return "day";
  const coarser = left.precision === "year" || right.precision === "year" ? 4 : 7;
  if (left.value.slice(0, coarser) !== right.value.slice(0, coarser)) return undefined;
  return coarser === 7 ? "month" : "year";
}

/** The studio entry a game was made at, when the archive has one. */
export function studioOf(game: Entry, entries: Entry[]): Entry | undefined {
  if (game.kind !== "game" || game.studio === undefined) return undefined;
  return entries.find((entry) => entry.kind === "studio" && entry.name === game.studio);
}

/** Cancelled games in the archive that were made at a studio. */
export function gamesOf(studio: Entry, entries: Entry[]): Entry[] {
  if (studio.kind !== "studio") return [];
  return entries.filter((entry) => entry.kind === "game" && entry.studio === studio.name);
}

/**
 * The text before and after the studio's name in a game's studio line. A shared date is used only
 * when both dates have event basis; announcement and report dates cannot imply simultaneous events.
 */
export function studioFateParts(game: Entry, studio: Entry): [string, string] {
  let dates: string;
  const bothAreEventDates = game.dateBasis === "event" && studio.dateBasis === "event";
  const period = bothAreEventDates ? sharedPeriod(game.end, studio.end) : undefined;
  if (studio.end.precision === "unknown") {
    dates = "its date is unknown";
  } else if (period === undefined) {
    const basis =
      studio.dateBasis === "report"
        ? "uses a report date, "
        : studio.dateBasis === "announcement"
          ? "uses an announcement date, "
          : "is dated ";
    dates = `its entry ${basis}${formatPartialDate(studio.end)}`;
  } else {
    const shared: PartialDate =
      period === "day"
        ? studio.end
        : { value: studio.end.value.slice(0, period === "month" ? 7 : 4), precision: period };
    dates = `both entries are dated ${formatPartialDate(shared)}`;
  }

  if (studio.announced === true) {
    if (studio.status === "merged") {
      return [
        "EA announced that its studio, ",
        `, would join ${studio.mergedInto ?? "its successor"}; completion is not established.`,
      ];
    }
    return ["EA announced the closure of its studio, ", "; completion is not established."];
  }
  const verb =
    studio.status === "merged"
      ? `was merged into ${studio.mergedInto ?? "another studio"}`
      : "was closed too";
  return ["Its studio, ", `, ${verb}; ${dates}.`];
}
