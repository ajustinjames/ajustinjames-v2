import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEFAULT_CONFIG,
	defaultConfig,
	getLogoDataUrl,
	type InsertConfig,
	loadConfig,
	needsThermalWarning,
	removeLogo,
	resetConfig,
	saveConfig,
	saveLogoDataUrl,
	validateConfig,
} from "./config.ts";

const store: Record<string, string> = {};

beforeEach(() => {
	for (const key of Object.keys(store)) delete store[key];
	vi.stubGlobal("localStorage", {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = String(value);
		},
		removeItem: (key: string) => {
			delete store[key];
		},
	});
});

function withChanges(changes: Partial<InsertConfig>): InsertConfig {
	return { ...defaultConfig(), ...changes };
}

describe("DEFAULT_CONFIG", () => {
	it("has the expected shape", () => {
		expect(DEFAULT_CONFIG.store_name).toBe("Your Store Name");
		expect(DEFAULT_CONFIG.platform).toBe("eBay");
		expect(DEFAULT_CONFIG.taglines).toHaveLength(2);
		expect(DEFAULT_CONFIG.footer_lines).toHaveLength(2);
		expect(DEFAULT_CONFIG.page).toEqual({ width_inches: 4, height_inches: 6 });
		expect(Object.keys(DEFAULT_CONFIG.colors)).toHaveLength(6);
	});

	it("hands out copies that don't share arrays with the defaults", () => {
		const copy = defaultConfig();
		copy.taglines.push("extra");
		expect(DEFAULT_CONFIG.taglines).toHaveLength(2);
	});
});

describe("validateConfig", () => {
	it("accepts the defaults", () => {
		const { valid, errors } = validateConfig(defaultConfig());
		expect(valid).toBe(true);
		expect(errors).toHaveLength(0);
	});

	it("rejects an invalid hex color", () => {
		const bad = withChanges({
			colors: { ...DEFAULT_CONFIG.colors, border: "red" },
		});
		const { valid, errors } = validateConfig(bad);
		expect(valid).toBe(false);
		expect(errors.some((e) => e.includes("colors.border"))).toBe(true);
	});

	it("rejects a page width below 2 inches", () => {
		const bad = withChanges({ page: { width_inches: 1, height_inches: 6 } });
		expect(validateConfig(bad).valid).toBe(false);
	});

	it("rejects a page height above 8 inches", () => {
		const bad = withChanges({ page: { width_inches: 4, height_inches: 9 } });
		expect(validateConfig(bad).valid).toBe(false);
	});

	it("rejects a non-numeric page size", () => {
		const bad = withChanges({
			page: { width_inches: Number.NaN, height_inches: 6 },
		});
		expect(validateConfig(bad).valid).toBe(false);
	});

	it("rejects more than 4 taglines", () => {
		const bad = withChanges({ taglines: ["a", "b", "c", "d", "e"] });
		expect(validateConfig(bad).valid).toBe(false);
	});

	it("rejects more than 3 footer lines", () => {
		const bad = withChanges({ footer_lines: ["a", "b", "c", "d"] });
		expect(validateConfig(bad).valid).toBe(false);
	});

	it("requires a store name", () => {
		expect(validateConfig(withChanges({ store_name: "" })).valid).toBe(false);
	});

	it("warns, but doesn't fail, on a light text color", () => {
		const light = withChanges({
			colors: { ...DEFAULT_CONFIG.colors, store_name: "#aaaaaa" },
		});
		const { valid, warnings } = validateConfig(light);
		expect(valid).toBe(true);
		expect(warnings.some((w) => w.includes("store_name"))).toBe(true);
	});

	it("doesn't warn on a dark text color", () => {
		const { warnings } = validateConfig(defaultConfig());
		expect(warnings).toHaveLength(0);
	});

	it("doesn't warn on a light border, which isn't text", () => {
		const light = withChanges({
			colors: { ...DEFAULT_CONFIG.colors, border: "#aaaaaa" },
		});
		expect(validateConfig(light).warnings).toHaveLength(0);
	});
});

describe("needsThermalWarning", () => {
	it("flags light colors only", () => {
		expect(needsThermalWarning("#aaaaaa")).toBe(true);
		expect(needsThermalWarning("#670000")).toBe(true);
		expect(needsThermalWarning("#666666")).toBe(false);
		expect(needsThermalWarning("#000000")).toBe(false);
	});

	it("ignores text that isn't a full hex color yet", () => {
		expect(needsThermalWarning("#fff")).toBe(false);
		expect(needsThermalWarning("white")).toBe(false);
	});
});

describe("loadConfig", () => {
	it("returns the defaults when nothing is saved", () => {
		expect(loadConfig()).toEqual(defaultConfig());
	});

	it("merges saved settings over the defaults", () => {
		store.insertgen_config = JSON.stringify({
			store_name: "My Shop",
			platform: "Etsy",
		});
		const config = loadConfig();
		expect(config.store_name).toBe("My Shop");
		expect(config.platform).toBe("Etsy");
		expect(config.colors.border).toBe(DEFAULT_CONFIG.colors.border);
	});

	it("returns the defaults when the saved JSON doesn't parse", () => {
		store.insertgen_config = "not json {{{";
		expect(loadConfig().store_name).toBe(DEFAULT_CONFIG.store_name);
	});

	it("returns the defaults when the saved settings are invalid", () => {
		store.insertgen_config = JSON.stringify({
			store_name: "Shop",
			taglines: 5,
		});
		expect(loadConfig()).toEqual(defaultConfig());
	});
});

describe("saveConfig", () => {
	it("round-trips", () => {
		saveConfig(withChanges({ store_name: "Round Trip Store" }));
		expect(loadConfig().store_name).toBe("Round Trip Store");
	});

	it("throws on invalid settings", () => {
		const bad = withChanges({ page: { width_inches: 0, height_inches: 6 } });
		expect(() => saveConfig(bad)).toThrow();
	});
});

describe("resetConfig", () => {
	it("clears saved settings and returns the defaults", () => {
		store.insertgen_config = JSON.stringify({ store_name: "Custom" });
		expect(resetConfig().store_name).toBe(DEFAULT_CONFIG.store_name);
		expect(store.insertgen_config).toBeUndefined();
	});
});

describe("logo storage", () => {
	it("returns null when no logo is stored", () => {
		expect(getLogoDataUrl()).toBeNull();
	});

	it("saves, reads, and removes a logo", () => {
		saveLogoDataUrl("data:image/png;base64,abc123");
		expect(getLogoDataUrl()).toBe("data:image/png;base64,abc123");
		removeLogo();
		expect(getLogoDataUrl()).toBeNull();
	});
});
