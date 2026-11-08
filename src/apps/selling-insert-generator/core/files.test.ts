import { describe, expect, it } from "vitest";
import {
	insertFileName,
	logoFileError,
	MAX_LOGO_BYTES,
	replacePlatform,
} from "./files.ts";

describe("logoFileError", () => {
	it("accepts PNG and JPG files up to 500 KB", () => {
		expect(logoFileError({ type: "image/png", size: 1024 })).toBeNull();
		expect(
			logoFileError({ type: "image/jpeg", size: MAX_LOGO_BYTES }),
		).toBeNull();
	});

	it("rejects other image types", () => {
		expect(logoFileError({ type: "image/gif", size: 1024 })).toMatch(
			/PNG and JPG/,
		);
	});

	it("rejects files over 500 KB", () => {
		expect(
			logoFileError({ type: "image/png", size: MAX_LOGO_BYTES + 1 }),
		).toMatch(/500 KB/);
	});
});

describe("insertFileName", () => {
	it("lowercases the item name and replaces everything but letters and digits", () => {
		expect(insertFileName("Vintage Camera Strap!")).toBe(
			"insert_vintage_camera_strap_.pdf",
		);
	});
});

describe("replacePlatform", () => {
	it("fills every {platform} token", () => {
		expect(replacePlatform("{platform} and {platform}", "Etsy")).toBe(
			"Etsy and Etsy",
		);
	});

	it("leaves text without the token alone", () => {
		expect(replacePlatform("Thank you!", "eBay")).toBe("Thank you!");
	});
});
