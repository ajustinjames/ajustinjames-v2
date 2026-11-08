// Checks and names for the files the app reads and writes.

export const MAX_LOGO_BYTES = 500 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg"];

/** Returns why a chosen logo file can't be used, or null when it's fine. */
export function logoFileError(file: {
	type: string;
	size: number;
}): string | null {
	if (!LOGO_TYPES.includes(file.type)) {
		return "Only PNG and JPG files are supported.";
	}
	if (file.size > MAX_LOGO_BYTES) {
		return "Logo must be 500 KB or smaller.";
	}
	return null;
}

/** The download name for an item's insert, e.g. `insert_vintage_camera_strap.pdf`. */
export function insertFileName(itemName: string): string {
	return `insert_${itemName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
}

/** Fills the `{platform}` token in a footer line. */
export function replacePlatform(text: string, platform: string): string {
	return text.replaceAll("{platform}", platform);
}
