// Store settings for the insert: the schema, its validation, and its storage.
// This is the one source of truth for the limits the settings form enforces.

const CONFIG_KEY = "insertgen_config";
const LOGO_KEY = "insertgen_logo";

export const COLOR_KEYS = [
	"store_name",
	"item_label",
	"tagline",
	"footer",
	"border",
	"divider",
] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

/** Colors used for text, which must stay dark enough for a thermal printer. */
const TEXT_COLOR_KEYS: readonly ColorKey[] = [
	"store_name",
	"item_label",
	"tagline",
	"footer",
];

export const MAX_TAGLINES = 4;
export const MAX_FOOTER_LINES = 3;
export const MIN_PAGE_INCHES = 2;
export const MAX_PAGE_INCHES = 8;

export interface InsertConfig {
	store_name: string;
	platform: string;
	taglines: string[];
	/** `{platform}` is replaced with the platform name when the insert is drawn. */
	footer_lines: string[];
	colors: Record<ColorKey, string>;
	page: { width_inches: number; height_inches: number };
}

/** The per-order fields typed on the generator view. */
export interface InsertDetails {
	item_name: string;
	order_number: string;
	buyer_name: string;
	custom_note: string;
}

export const DEFAULT_CONFIG: Readonly<InsertConfig> = Object.freeze({
	store_name: "Your Store Name",
	platform: "eBay",
	taglines: ["Inspected, tested, and packed with care.", "Thank you!"],
	footer_lines: ["Feedback appreciated", "Questions? Message us on {platform}"],
	colors: {
		store_name: "#333333",
		item_label: "#555555",
		tagline: "#444444",
		footer: "#444444",
		border: "#000000",
		divider: "#888888",
	},
	page: { width_inches: 4, height_inches: 6 },
});

export function defaultConfig(): InsertConfig {
	return structuredClone(DEFAULT_CONFIG) as InsertConfig;
}

export const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** True when any channel is lighter than #666666, which prints faintly on thermal paper. */
export function isLightColor(hex: string): boolean {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return r > 0x66 || g > 0x66 || b > 0x66;
}

/** True when `hex` is a valid color too light for thermal printing. */
export function needsThermalWarning(hex: string): boolean {
	return HEX_RE.test(hex) && isLightColor(hex);
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export function validateConfig(config: InsertConfig): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	for (const field of COLOR_KEYS) {
		const val = config.colors?.[field];
		if (!val || !HEX_RE.test(val)) {
			errors.push(`colors.${field} must be a valid hex color (e.g. #333333)`);
		} else if (TEXT_COLOR_KEYS.includes(field) && isLightColor(val)) {
			warnings.push(
				`colors.${field} (${val}) may be too light for thermal printing`,
			);
		}
	}

	const inRange = (value: unknown) =>
		typeof value === "number" &&
		value >= MIN_PAGE_INCHES &&
		value <= MAX_PAGE_INCHES;
	if (!inRange(config.page?.width_inches)) {
		errors.push(
			`page.width_inches must be between ${MIN_PAGE_INCHES} and ${MAX_PAGE_INCHES}`,
		);
	}
	if (!inRange(config.page?.height_inches)) {
		errors.push(
			`page.height_inches must be between ${MIN_PAGE_INCHES} and ${MAX_PAGE_INCHES}`,
		);
	}

	if (
		!Array.isArray(config.taglines) ||
		config.taglines.length > MAX_TAGLINES
	) {
		errors.push(
			`taglines must be an array with at most ${MAX_TAGLINES} entries`,
		);
	}
	if (
		!Array.isArray(config.footer_lines) ||
		config.footer_lines.length > MAX_FOOTER_LINES
	) {
		errors.push(
			`footer_lines must be an array with at most ${MAX_FOOTER_LINES} entries`,
		);
	}
	if (!config.store_name || typeof config.store_name !== "string") {
		errors.push("store_name is required");
	}

	return { valid: errors.length === 0, errors, warnings };
}

/** Loads saved settings over the defaults, or the defaults if nothing valid is saved. */
export function loadConfig(): InsertConfig {
	try {
		const raw = localStorage.getItem(CONFIG_KEY);
		if (!raw) return defaultConfig();
		const saved = JSON.parse(raw) as Partial<InsertConfig>;
		const defaults = defaultConfig();
		// Merge over the defaults so settings saved by an older schema still load.
		const merged: InsertConfig = {
			...defaults,
			...saved,
			colors: { ...defaults.colors, ...saved.colors },
			page: { ...defaults.page, ...saved.page },
		};
		// Validate so hand-edited storage can't break rendering.
		return validateConfig(merged).valid ? merged : defaults;
	} catch {
		return defaultConfig();
	}
}

/** Saves valid settings and returns them. Throws with every error if they're invalid. */
export function saveConfig(config: InsertConfig): InsertConfig {
	const { valid, errors } = validateConfig(config);
	if (!valid) throw new Error(errors.join("\n"));
	localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
	return config;
}

export function resetConfig(): InsertConfig {
	localStorage.removeItem(CONFIG_KEY);
	return defaultConfig();
}

// The logo is a data URL kept apart from the settings JSON, since it can be large.

export function getLogoDataUrl(): string | null {
	return localStorage.getItem(LOGO_KEY) || null;
}

export function saveLogoDataUrl(dataUrl: string): void {
	localStorage.setItem(LOGO_KEY, dataUrl);
}

export function removeLogo(): void {
	localStorage.removeItem(LOGO_KEY);
}
