// Records what generateInsertPdf draws, by swapping pdf-lib for a stub whose
// Courier is 0.6 em per character.
import { describe, expect, it, vi } from "vitest";
import { defaultConfig } from "./config.ts";

const drawTextCalls: {
	text: string;
	options: { x: number; y: number; size: number };
}[] = [];

vi.mock("pdf-lib", () => {
	const font = {
		widthOfTextAtSize: (text: string, size: number) => text.length * size * 0.6,
	};
	return {
		StandardFonts: { Courier: "Courier", CourierBold: "CourierBold" },
		rgb: (r: number, g: number, b: number) => ({ r, g, b }),
		PDFDocument: {
			create: vi.fn(async () => ({
				embedFont: vi.fn(async () => font),
				addPage: vi.fn(() => ({
					drawRectangle: vi.fn(),
					drawCircle: vi.fn(),
					drawImage: vi.fn(),
					drawLine: vi.fn(),
					drawText: vi.fn(
						(text: string, options: { x: number; y: number; size: number }) => {
							drawTextCalls.push({ text, options });
						},
					),
				})),
				save: vi.fn(async () => new Uint8Array([37, 80, 68, 70])),
			})),
		},
	};
});

const { generateInsertPdf } = await import("./pdf.ts");

describe("generateInsertPdf layout", () => {
	it("puts the order line below a wrapped item name, and taglines below that", async () => {
		drawTextCalls.length = 0;

		await generateInsertPdf(
			defaultConfig(),
			{
				item_name: "Logitech PRO X SUPERLIGHT Wireless Gaming Mouse",
				order_number: "20-14627-62037",
				buyer_name: "oli_31929",
				custom_note: "",
			},
			null,
		);

		const itemNameLines = drawTextCalls.filter(
			(call) =>
				call.options.size === 13 && Math.abs(call.options.x - 21.6) < 0.001,
		);
		expect(itemNameLines.map((call) => call.text)).toEqual([
			"Logitech PRO X SUPERLIGHT",
			"Wireless Gaming Mouse",
		]);

		const y = (text: string) =>
			drawTextCalls.find((call) => call.text === text)?.options.y ?? Number.NaN;
		const lastItemLineY = itemNameLines.at(-1)?.options.y ?? Number.NaN;

		expect(y("ORDER: 20-14627-62037")).toBeLessThan(lastItemLineY);
		expect(y("BUYER: oli_31929")).toBeLessThan(y("ORDER: 20-14627-62037"));
		expect(y(defaultConfig().taglines[0])).toBeLessThan(y("BUYER: oli_31929"));
	});

	it("fills {platform} in the footer lines", async () => {
		drawTextCalls.length = 0;
		await generateInsertPdf(
			{ ...defaultConfig(), platform: "Etsy" },
			{ item_name: "Mug", order_number: "", buyer_name: "", custom_note: "" },
			null,
		);
		const texts = drawTextCalls.map((call) => call.text);
		expect(texts).toContain("Questions? Message us on Etsy");
		expect(texts.some((text) => text.includes("{platform}"))).toBe(false);
	});
});
