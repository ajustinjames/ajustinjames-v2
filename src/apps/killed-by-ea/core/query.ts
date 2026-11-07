import { comparePartialDates, dateParts } from "./dates.ts";
import { type Entry, KINDS, type Kind, type PartialDate } from "./schema.ts";

export const ALL_KINDS: Kind[] = [...KINDS];

export interface QueryState {
	q: string;
	kinds: Kind[];
	year: string;
}

export interface YearGroup {
	year: string;
	label: string;
	entries: Entry[];
}

export type KindCounts = Record<Kind, number>;

export interface CountTableRow {
	year: string;
	games: number;
	studiosClosed: number;
	studiosMerged: number;
	projects: number;
	total: number;
}

export interface CountTable {
	rows: CountTableRow[];
	totals: CountTableRow;
}

export function defaultQueryState(): QueryState {
	return { q: "", kinds: [...ALL_KINDS], year: "" };
}

function normalizeText(value: string): string {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLocaleLowerCase();
}

function matchesSearch(entry: Entry, query: string): boolean {
	const normalizedQuery = normalizeText(query.trim());
	if (normalizedQuery === "") return true;
	const searchable = [entry.name, entry.series, entry.studio, entry.mergedInto]
		.filter((value): value is string => value !== undefined)
		.map(normalizeText);
	return searchable.some((value) => value.includes(normalizedQuery));
}

function endYear(end: PartialDate): string {
	if (end.precision === "unknown") return "unknown";
	return String(dateParts(end)?.year ?? "unknown");
}

function decadeForYear(year: string): string | undefined {
	if (!/^\d{4}$/.test(year)) return undefined;
	const firstYear = String(Math.floor(Number(year) / 10) * 10).padStart(4, "0");
	return `${firstYear}s`;
}

export function filterEntries(entries: Entry[], state: QueryState): Entry[] {
	return entries.filter((entry) => {
		if (!state.kinds.includes(entry.kind)) return false;
		if (
			state.year !== "" &&
			endYear(entry.end) !== state.year &&
			decadeForYear(endYear(entry.end)) !== state.year
		)
			return false;
		return matchesSearch(entry, state.q);
	});
}

export function groupByYear(entries: Entry[]): YearGroup[] {
	const grouped = new Map<string, Entry[]>();
	for (const entry of entries) {
		const year = endYear(entry.end);
		const group = grouped.get(year);
		if (group === undefined) grouped.set(year, [entry]);
		else group.push(entry);
	}

	const years = [...grouped.keys()].sort((left, right) => {
		if (left === "unknown") return 1;
		if (right === "unknown") return -1;
		return Number(right) - Number(left);
	});

	return years.map((year) => {
		const yearEntries = grouped.get(year) ?? [];
		yearEntries.sort((left, right) => {
			if (
				left.end.precision === "unknown" ||
				right.end.precision === "unknown"
			) {
				if (left.end.precision !== right.end.precision) {
					return left.end.precision === "unknown" ? 1 : -1;
				}
				return left.id.localeCompare(right.id);
			}
			const compared = comparePartialDates(right.end, left.end) ?? 0;
			return compared === 0 ? left.id.localeCompare(right.id) : compared;
		});
		return {
			year,
			label: year === "unknown" ? "Date unknown" : year,
			entries: yearEntries,
		};
	});
}

export function countByKind(entries: Entry[]): KindCounts {
	const counts: KindCounts = { game: 0, studio: 0, project: 0 };
	for (const entry of entries) counts[entry.kind] += 1;
	return counts;
}

export function yearsIn(entries: Entry[]): string[] {
	return [
		...new Set(
			entries
				.map((entry) => endYear(entry.end))
				.filter((year) => year !== "unknown"),
		),
	].sort((left, right) => Number(right) - Number(left));
}

export function decadesIn(entries: Entry[]): string[] {
	return [
		...new Set(
			yearsIn(entries)
				.map(decadeForYear)
				.filter((decade): decade is string => decade !== undefined),
		),
	].sort((left, right) => Number(right.slice(0, 4)) - Number(left.slice(0, 4)));
}

function emptyCountRow(year: string): CountTableRow {
	return {
		year,
		games: 0,
		studiosClosed: 0,
		studiosMerged: 0,
		projects: 0,
		total: 0,
	};
}

export function countTable(entries: Entry[]): CountTable {
	const counts = new Map<string, CountTableRow>();
	for (const year of yearsIn(entries)) counts.set(year, emptyCountRow(year));
	if (entries.some((entry) => entry.end.precision === "unknown")) {
		counts.set("unknown", emptyCountRow("unknown"));
	}

	for (const entry of entries) {
		const year = endYear(entry.end);
		const row = counts.get(year);
		if (row === undefined) continue;
		row.total += 1;
		if (entry.kind === "game") row.games += 1;
		else if (entry.kind === "project") row.projects += 1;
		else if (entry.status === "merged") row.studiosMerged += 1;
		else row.studiosClosed += 1;
	}

	const rows = [...counts.values()];
	const totals = rows.reduce(
		(sum, row) => ({
			year: "total",
			games: sum.games + row.games,
			studiosClosed: sum.studiosClosed + row.studiosClosed,
			studiosMerged: sum.studiosMerged + row.studiosMerged,
			projects: sum.projects + row.projects,
			total: sum.total + row.total,
		}),
		emptyCountRow("total"),
	);
	return { rows, totals };
}

function isKind(value: string): value is Kind {
	return (KINDS as readonly string[]).includes(value);
}

function readSearchParams(search: string | URLSearchParams): URLSearchParams {
	if (search instanceof URLSearchParams) return new URLSearchParams(search);
	return new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
}

export function parseUrlState(
	search: string | URLSearchParams,
	knownYears?: string[],
	knownDecades?: string[],
): QueryState {
	const params = readSearchParams(search);
	const q = params.get("q") ?? "";
	const rawKinds = params.getAll("kind");
	const parsedKinds = rawKinds
		.flatMap((value) => value.split(","))
		.filter(isKind);
	const hasEmptyKind =
		rawKinds.length > 0 && rawKinds.every((value) => value === "");
	const kinds =
		rawKinds.length === 0 || (parsedKinds.length === 0 && !hasEmptyKind)
			? [...ALL_KINDS]
			: parsedKinds;
	const yearValue = params.get("year") ?? "";
	const isYear = /^\d{4}$/.test(yearValue);
	const isDecade = /^\d{3}0s$/.test(yearValue);
	const knownYear =
		isYear && (knownYears === undefined || knownYears.includes(yearValue));
	const knownDecade = isDecade && knownDecades?.includes(yearValue) === true;
	const knownUnknown =
		yearValue === "unknown" &&
		(knownYears === undefined || knownYears.includes(yearValue));
	const year = knownYear || knownDecade || knownUnknown ? yearValue : "";
	return { q, kinds: [...new Set(kinds)], year };
}

export function serializeUrlState(state: QueryState): string {
	// Defaults are left out, so the plain page keeps a plain URL.
	const params = new URLSearchParams();
	const kinds = [...new Set(state.kinds.filter(isKind))];
	if (state.q !== "") params.set("q", state.q);
	if (kinds.length !== ALL_KINDS.length) params.set("kind", kinds.join(","));
	if (
		state.year === "unknown" ||
		/^\d{4}$/.test(state.year) ||
		/^\d{3}0s$/.test(state.year)
	) {
		params.set("year", state.year);
	}
	const query = params.toString();
	return query === "" ? "" : `?${query}`;
}
