import { describe, expect, it } from "vitest";
import { defaultConfig, type InsertDetails } from "./config.ts";
import { generateInsertPdf, wrapTextLines } from "./pdf.ts";

const BASE_DETAILS: InsertDetails = {
	item_name: "Test Item",
	order_number: "",
	buyer_name: "",
	custom_note: "",
};

// A 1×1 transparent PNG.
const PNG_DATA_URL =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

describe("generateInsertPdf", () => {
	it("returns PDF bytes", async () => {
		const bytes = await generateInsertPdf(defaultConfig(), BASE_DETAILS, null);
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("%PDF");
	});

	it("works with every optional field filled in", async () => {
		const bytes = await generateInsertPdf(
			defaultConfig(),
			{
				item_name: "Vintage Camera Strap",
				order_number: "12345",
				buyer_name: "Jane Smith",
				custom_note: "Please handle with care",
			},
			null,
		);
		expect(bytes.length).toBeGreaterThan(100);
	});

	it("works with no taglines or footer lines", async () => {
		const config = { ...defaultConfig(), taglines: [], footer_lines: [] };
		const bytes = await generateInsertPdf(config, BASE_DETAILS, null);
		expect(bytes).toBeInstanceOf(Uint8Array);
	});

	it("handles a custom page size", async () => {
		const config = {
			...defaultConfig(),
			page: { width_inches: 4, height_inches: 5 },
		};
		const bytes = await generateInsertPdf(config, BASE_DETAILS, null);
		expect(bytes).toBeInstanceOf(Uint8Array);
	});

	it("embeds a PNG logo", async () => {
		const withLogo = await generateInsertPdf(
			defaultConfig(),
			BASE_DETAILS,
			PNG_DATA_URL,
		);
		const without = await generateInsertPdf(
			defaultConfig(),
			BASE_DETAILS,
			null,
		);
		expect(withLogo.length).toBeGreaterThan(without.length);
	});

	it("still draws the insert when the logo can't be embedded", async () => {
		const bytes = await generateInsertPdf(
			defaultConfig(),
			BASE_DETAILS,
			"data:image/gif;base64,R0lGODlh",
		);
		expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("%PDF");
	});
});

describe("wrapTextLines", () => {
	// Every character is 0.6 em wide, like Courier.
	const font = {
		widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.6,
	};
	const contentWidth = 288 - 21.6 * 2;

	it("wraps a long item name inside the printable width", () => {
		const lines = wrapTextLines(
			"Logitech PRO X SUPERLIGHT Wireless Gaming Mouse",
			font,
			13,
			contentWidth,
		);
		expect(lines).toEqual([
			"Logitech PRO X SUPERLIGHT",
			"Wireless Gaming Mouse",
		]);
		for (const line of lines) {
			expect(font.widthOfTextAtSize(line, 13)).toBeLessThanOrEqual(
				contentWidth,
			);
		}
	});

	it("breaks a word too long for one line by character", () => {
		const lines = wrapTextLines("A".repeat(40), font, 13, contentWidth);
		expect(lines.length).toBeGreaterThan(1);
		expect(lines.join("")).toBe("A".repeat(40));
	});

	it("returns one empty line for empty text", () => {
		expect(wrapTextLines("", font, 13, contentWidth)).toEqual([""]);
		expect(wrapTextLines("   ", font, 13, contentWidth)).toEqual([""]);
	});
});
