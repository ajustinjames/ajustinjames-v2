// ajj-design tokens are imported in style.css; this registers the hardline components.
import "@ajustinjames/hardline-components";
import "./style.css";

import archive from "./data/entries.json";
import { formatPartialDate, timelineDateDetails } from "./core/dates.ts";
import {
  ALL_KINDS,
  countByKind,
  countTable,
  decadesIn,
  defaultQueryState,
  filterEntries,
  groupByYear,
  parseUrlState,
  type QueryState,
  serializeUrlState,
  yearsIn,
} from "./core/query.ts";
import { gamesOf, studioFateParts, studioOf } from "./core/related.ts";
import { type ArchiveData, type Entry, type Kind, validate } from "./core/schema.ts";

const validationErrors = validate(archive);
if (validationErrors.length > 0) {
  throw new Error(`Invalid Killed by EA archive:\n${validationErrors.join("\n")}`);
}

const entries = (archive as ArchiveData).entries;
const kindNames: Record<Kind, string> = { game: "Game", studio: "Studio", project: "Project" };
const kindPlurals: Record<Kind, string> = { game: "Games", studio: "Studios", project: "Projects" };
const searchInput = requireElement<HTMLInputElement>("#search");
const kindSelect = requireElement<HTMLSelectElement>("#kind-filter");
const yearSelect = requireElement<HTMLSelectElement>("#year-filter");
const timeline = requireElement<HTMLElement>("#timeline");
const resultCount = requireElement<HTMLElement>("#result-count");
const emptyState = requireElement<HTMLElement>("#empty-state");
const clearButton = requireElement<HTMLButtonElement>("#clear-filters");
const countsTable = requireElement<HTMLTableElement>("#counts-table");
const countsCaption = requireElement<HTMLTableCaptionElement>("#counts-caption");
const countsBody = requireElement<HTMLTableSectionElement>("#counts-rows");
const countsFoot = requireElement<HTMLTableSectionElement>("#counts-total");
const containsUnknownDate = entries.some((entry) => entry.end.precision === "unknown");
const knownYears = [...yearsIn(entries), ...(containsUnknownDate ? ["unknown"] : [])];
const knownDecades = decadesIn(entries);
const today = localIsoDay(new Date());
// Read before the first URL rewrite, which drops an entry hash the filters hide. Entry ids are
// kebab-case ASCII, so the hash is compared as is: decoding a malformed one (`#%`) would throw.
const linkedEntryId = window.location.hash.slice(1);
let state: QueryState = readUrlState();

function readUrlState(): QueryState {
  const parsed = parseUrlState(window.location.search, knownYears, knownDecades);
  // The kind select shows one kind or all of them, so any other mix from an old link means all.
  return parsed.kinds.length === 1 ? parsed : { ...parsed, kinds: [...ALL_KINDS] };
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`Killed by EA page is missing ${selector}`);
  return element;
}

function localIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function countText(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className !== undefined) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createSourceLink(label: string, url: string, title: string): HTMLAnchorElement {
  const link = createElement("a", "source-link", label);
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.setAttribute("aria-label", `${label}: ${title}`);
  return link;
}

function createEntryLink(target: Entry): HTMLAnchorElement {
  const link = createElement("a", "entry-link", target.name);
  link.href = `#${target.id}`;
  link.dataset.entry = target.id;
  return link;
}

function updateUrl(): void {
  // Drop an entry hash once the filters hide that entry, so the URL reproduces what's shown.
  const hashId = window.location.hash.slice(1);
  const hidesEntry =
    entries.some((entry) => entry.id === hashId) && document.getElementById(hashId) === null;
  const hash = hidesEntry ? "" : window.location.hash;
  const url = `${window.location.pathname}${serializeUrlState(state)}${hash}`;
  window.history.replaceState(null, "", url);
}

function updateControls(): void {
  searchInput.value = state.q;
  kindSelect.value = state.kinds.length === 1 ? (state.kinds[0] ?? "") : "";
  yearSelect.value = state.year;
}

function statusText(entry: Entry): string {
  if (entry.reported === true) return "Reported cancelled";
  if (entry.announced === true) {
    if (entry.status === "merged") return "Merger announced";
    return entry.status === "closed" ? "Closure announced" : "Shutdown announced";
  }
  if (entry.status === "merged") {
    return entry.mergedInto === undefined ? "Merged" : `Merged into ${entry.mergedInto}`;
  }
  if (entry.status === "cancelled") return "Cancelled";
  if (entry.status === "closed") return "Closed";
  return "Ended";
}

function appendStudioLine(card: HTMLElement, game: Entry): void {
  const studio = studioOf(game, entries);
  if (studio === undefined) {
    if (game.studio !== undefined)
      card.append(createElement("p", "entry-related", `Studio: ${game.studio}.`));
    return;
  }
  const line = createElement("p", "entry-related");
  const [before, after] = studioFateParts(game, studio);
  line.append(before, createEntryLink(studio), after);
  card.append(line);
}

function appendStudioGames(card: HTMLElement, studio: Entry): void {
  const games = gamesOf(studio, entries);
  if (games.length === 0) return;
  const line = createElement("p", "entry-related", "Cancelled games from this studio: ");
  games.forEach((game, index) => {
    if (index > 0) line.append(", ");
    line.append(createEntryLink(game));
  });
  line.append(".");
  card.append(line);
}

function createCard(entry: Entry): HTMLElement {
  const card = createElement("article", `entry kind-${entry.kind}`);
  card.id = entry.id;
  card.tabIndex = -1;

  const label = createElement("p", "entry-label");
  label.append(
    createElement("span", "entry-kind", kindNames[entry.kind]),
    createElement("span", "entry-status", statusText(entry)),
  );
  card.append(label, createElement("h3", "entry-title", entry.name));

  const when = createElement("p", "entry-when");
  const dateDetails = timelineDateDetails(
    entry.dateBasis,
    entry.end,
    entry.start,
    entry.kind !== "game",
    today,
  );
  when.append(createElement("span", undefined, dateDetails.date));
  if (dateDetails.ago !== undefined) when.append(createElement("span", undefined, dateDetails.ago));
  if (dateDetails.age !== undefined) {
    const start = entry.start === undefined ? "" : `from ${formatPartialDate(entry.start)}, `;
    when.append(
      createElement("span", undefined, `${start}${dateDetails.age.toLocaleLowerCase()} old`),
    );
  }
  card.append(when);

  card.append(createElement("p", "entry-summary", entry.summary));
  if (entry.kind === "game") appendStudioLine(card, entry);
  if (entry.kind === "studio") appendStudioGames(card, entry);
  if (entry.note !== undefined) card.append(createElement("p", "entry-note", entry.note));

  const sourceList = createElement("ul", "source-links");
  sourceList.setAttribute("aria-label", "Sources");
  for (const source of entry.sources) {
    const sourceItem = createElement("li");
    sourceItem.append(
      createSourceLink(source.publisher, source.url, source.title),
      createSourceLink("archived", source.archive, source.title),
    );
    sourceList.append(sourceItem);
  }
  card.append(sourceList);
  return card;
}

function renderTimeline(filtered: Entry[]): void {
  timeline.replaceChildren();
  for (const group of groupByYear(filtered)) {
    const section = createElement("section", "year-group");
    const heading = createElement("h2", "year-heading");
    heading.id = `year-${group.year}`;
    heading.append(
      createElement("span", "year-label", group.label),
      createElement("span", "year-count", countText(group.entries.length, "entry", "entries")),
    );
    section.setAttribute("aria-labelledby", heading.id);
    section.append(heading);

    const list = createElement("div", "entry-list");
    for (const entry of group.entries) list.append(createCard(entry));
    section.append(list);
    timeline.append(section);
  }
}

function render(): void {
  const available = filterEntries(entries, { ...state, kinds: [...ALL_KINDS] });
  const visible = filterEntries(entries, state);
  const counts = countByKind(available);
  for (const option of kindSelect.options) {
    const kind = option.value as Kind | "";
    option.textContent =
      kind === ""
        ? `All kinds (${countText(available.length, "entry", "entries")})`
        : `${kindPlurals[kind]} (${countText(counts[kind], "entry", "entries")})`;
  }

  resultCount.textContent = countText(visible.length, "entry", "entries");
  emptyState.hidden = visible.length !== 0;
  timeline.hidden = visible.length === 0;
  renderTimeline(visible);
  updateCountLinks();
}

// Each year link carries the current search and kind, so a new tab opens the same view a click gives.
function updateCountLinks(): void {
  for (const link of countsBody.querySelectorAll<HTMLAnchorElement>("a[data-year]")) {
    const year = link.dataset.year;
    if (year !== undefined) link.href = serializeUrlState({ ...state, year });
  }
}

function renderCounts(): void {
  const table = countTable(entries);
  countsCaption.textContent = `All ${table.totals.total} entries, by the year of their timeline date. A year's count includes entries dated by an announcement or report, so it counts entries, not events completed that year. Counts follow each entry's status label.`;
  countsBody.replaceChildren();

  for (const row of table.rows) {
    const tableRow = createElement("tr");
    const yearCell = createElement(
      "th",
      undefined,
      row.year === "unknown" ? "Date unknown" : row.year,
    );
    yearCell.scope = "row";
    const yearLink = createElement("a", "count-year-link", yearCell.textContent ?? "");
    yearLink.href = `?year=${row.year}`;
    yearLink.dataset.year = row.year;
    yearCell.replaceChildren(yearLink);
    tableRow.append(
      yearCell,
      createElement("td", undefined, String(row.games)),
      createElement("td", undefined, String(row.studiosClosed)),
      createElement("td", undefined, String(row.studiosMerged)),
      createElement("td", undefined, String(row.projects)),
      createElement("td", "count-row-total", String(row.total)),
    );
    countsBody.append(tableRow);
  }

  countsFoot.replaceChildren();
  const totalRow = createElement("tr");
  const totalHeading = createElement("th", undefined, "Total");
  totalHeading.scope = "row";
  totalRow.append(
    totalHeading,
    createElement("td", undefined, String(table.totals.games)),
    createElement("td", undefined, String(table.totals.studiosClosed)),
    createElement("td", undefined, String(table.totals.studiosMerged)),
    createElement("td", undefined, String(table.totals.projects)),
    createElement("td", "count-row-total", String(table.totals.total)),
  );
  countsFoot.append(totalRow);
}

function applyState(nextState: QueryState, writeUrl = true): void {
  state = nextState;
  updateControls();
  render();
  if (writeUrl) updateUrl();
}

function populateYearSelect(): void {
  const decadeGroup = createElement("optgroup");
  decadeGroup.label = "Decades";
  for (const decade of knownDecades) {
    const option = createElement("option", undefined, decade);
    option.value = decade;
    decadeGroup.append(option);
  }
  if (decadeGroup.childElementCount > 0) yearSelect.append(decadeGroup);

  const yearGroup = createElement("optgroup");
  yearGroup.label = "Years";
  for (const year of yearsIn(entries)) {
    const option = createElement("option", undefined, year);
    option.value = year;
    yearGroup.append(option);
  }
  if (yearGroup.childElementCount > 0) yearSelect.append(yearGroup);
  if (containsUnknownDate) {
    const option = createElement("option", undefined, "Date unknown");
    option.value = "unknown";
    yearSelect.append(option);
  }
}

populateYearSelect();
renderCounts();
updateControls();
render();
// Rewrite the URL so values the page ignored (an unknown year, say) don't stay in the address bar.
updateUrl();

// In-page links such as "Counts" add history entries, so Back can land on a URL with other filters.
window.addEventListener("popstate", () => {
  state = readUrlState();
  updateControls();
  render();
});

// A sticky year heading can cover the link that just took keyboard focus; scroll it clear so focus
// stays visible. Mouse focus is left alone: scrolling between mouse-down and mouse-up loses the click.
timeline.addEventListener("focusin", (event) => {
  const focused = event.target as Element;
  if (!focused.matches(":focus-visible")) return;
  const heading = focused.closest(".year-group")?.querySelector(".year-heading");
  if (heading === null || heading === undefined) return;
  const covered = heading.getBoundingClientRect().bottom - focused.getBoundingClientRect().top;
  if (covered > 0) window.scrollBy(0, -(covered + 8));
});

searchInput.addEventListener("input", () => {
  applyState({ ...state, q: searchInput.value });
});

kindSelect.addEventListener("change", () => {
  const kind = kindSelect.value;
  applyState({
    ...state,
    kinds: ALL_KINDS.includes(kind as Kind) ? [kind as Kind] : [...ALL_KINDS],
  });
});

yearSelect.addEventListener("change", () => {
  applyState({ ...state, year: yearSelect.value });
});

/** Shows one entry: clears the filters if they hide it, then scrolls to it and focuses it. */
function jumpTo(id: string): void {
  if (!entries.some((entry) => entry.id === id)) return;
  if (document.getElementById(id) === null) applyState(defaultQueryState());
  const target = document.getElementById(id);
  if (target === null) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${serializeUrlState(state)}#${id}`,
  );
  for (const marked of timeline.querySelectorAll(".is-target")) {
    marked.classList.remove("is-target");
  }
  target.classList.add("is-target");
  target.scrollIntoView({ block: "start" });
  target.focus({ preventScroll: true });
}

timeline.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-entry]");
  const id = link?.dataset.entry;
  if (link === null || id === undefined) return;
  // A modified click opens a new tab or window as usual; the hash handling on load does the rest.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  jumpTo(id);
});

countsTable.addEventListener("click", (event) => {
  const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-year]");
  const year = link?.dataset.year;
  if (link === null || year === undefined) return;
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  event.preventDefault();
  applyState({ ...state, year });
  resultCount.focus();
});

// A link opened in a new tab, or shared, arrives with the entry in the hash and maybe a filter that hides it.
jumpTo(linkedEntryId);

clearButton.addEventListener("click", () => {
  applyState(defaultQueryState());
  searchInput.focus();
});
