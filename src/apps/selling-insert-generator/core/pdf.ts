// Draws the insert as a one-page PDF with pdf-lib. Coordinates are PDF points
// (72 per inch) with the origin at the bottom left. ui/preview.ts mirrors this
// layout in HTML, so a change to one needs the same change in the other.
//
// Courier and line weights of at least 1.2 pt keep the output thermal-printable.

import {
	PDFDocument,
	type PDFFont,
	type PDFImage,
	rgb,
	StandardFonts,
} from "pdf-lib";
import type { InsertConfig, InsertDetails } from "./config.ts";
import { replacePlatform } from "./files.ts";

function hexToRgb(hex: string) {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
	return rgb(r, g, b);
}

/** Splits text into lines no wider than `maxWidth`, breaking long words by character. */
export function wrapTextLines(
	text: string,
	font: Pick<PDFFont, "widthOfTextAtSize">,
	size: number,
	maxWidth: number,
): string[] {
	if (!text) return [""];

	const lines: string[] = [];
	const words = text.split(/\s+/).filter(Boolean);

	for (const word of words) {
		const current = lines.at(-1);

		if (
			current &&
			font.widthOfTextAtSize(`${current} ${word}`, size) <= maxWidth
		) {
			lines[lines.length - 1] = `${current} ${word}`;
			continue;
		}

		if (font.widthOfTextAtSize(word, size) <= maxWidth) {
			lines.push(word);
			continue;
		}

		let segment = "";
		for (const char of word) {
			const nextSegment = `${segment}${char}`;
			if (segment && font.widthOfTextAtSize(nextSegment, size) > maxWidth) {
				lines.push(segment);
				segment = char;
			} else {
				segment = nextSegment;
			}
		}
		if (segment) lines.push(segment);
	}

	return lines.length ? lines : [""];
}

async function embedLogoImage(
	pdfDoc: PDFDocument,
	dataUrl: string,
): Promise<PDFImage> {
	const [header, base64] = dataUrl.split(",");
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

	if (header.includes("image/png")) {
		return pdfDoc.embedPng(bytes);
	}
	if (header.includes("image/jpeg") || header.includes("image/jpg")) {
		return pdfDoc.embedJpg(bytes);
	}
	throw new Error("Unsupported logo format. Use PNG or JPG.");
}

export async function generateInsertPdf(
	config: InsertConfig,
	details: InsertDetails,
	logoDataUrl: string | null,
): Promise<Uint8Array> {
	const PT = 72; // points per inch
	const PAGE_W = config.page.width_inches * PT;
	const PAGE_H = config.page.height_inches * PT;
	const MARGIN = 0.3 * PT; // 21.6
	const BORDER_INSET = 0.15 * PT; // 10.8

	const pdfDoc = await PDFDocument.create();
	const courier = await pdfDoc.embedFont(StandardFonts.Courier);
	const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

	const page = pdfDoc.addPage([PAGE_W, PAGE_H]);

	// 1. Border
	page.drawRectangle({
		x: BORDER_INSET,
		y: BORDER_INSET,
		width: PAGE_W - 2 * BORDER_INSET,
		height: PAGE_H - 2 * BORDER_INSET,
		borderColor: hexToRgb(config.colors.border),
		borderWidth: 2.5,
	});

	const CIRCLE_R = 0.65 * PT; // 46.8
	let contentStartY: number;

	// 2. Logo circle and image
	if (logoDataUrl) {
		const circleCx = PAGE_W / 2;
		const circleCy = PAGE_H - 0.45 * PT - CIRCLE_R;

		page.drawCircle({
			x: circleCx,
			y: circleCy,
			size: CIRCLE_R,
			borderColor: hexToRgb(config.colors.border),
			borderWidth: 2.0,
			color: rgb(1, 1, 1),
		});

		try {
			const logoImage = await embedLogoImage(pdfDoc, logoDataUrl);
			const LOGO_SIZE = 0.82 * PT; // 59.04
			const { width: imgW, height: imgH } = logoImage.scale(1);
			const scale = LOGO_SIZE / Math.max(imgW, imgH);
			const scaledW = imgW * scale;
			const scaledH = imgH * scale;
			page.drawImage(logoImage, {
				x: circleCx - scaledW / 2,
				y: circleCy - scaledH / 2 - 0.02 * PT,
				width: scaledW,
				height: scaledH,
			});
		} catch {
			// The logo couldn't be embedded; draw the rest of the insert without it.
		}

		contentStartY = circleCy - CIRCLE_R - 0.24 * PT;
	} else {
		// No logo: the store name moves up to the top of the content area.
		contentStartY = PAGE_H - BORDER_INSET - 0.45 * PT;
	}

	// 3. Store name (Courier 11pt, centered)
	const storeY = contentStartY;
	const storeNameWidth = courier.widthOfTextAtSize(config.store_name, 11);
	page.drawText(config.store_name, {
		x: PAGE_W / 2 - storeNameWidth / 2,
		y: storeY,
		size: 11,
		font: courier,
		color: hexToRgb(config.colors.store_name),
	});

	// 4. ITEM label (Courier-Bold 10pt, left)
	const itemY = storeY - 0.48 * PT;
	page.drawText("ITEM", {
		x: MARGIN,
		y: itemY,
		size: 10,
		font: courierBold,
		color: hexToRgb(config.colors.item_label),
	});

	// 5. Item name (Courier-Bold 13pt, left, wrapped)
	const itemNameY = itemY - 0.27 * PT;
	const itemNameSize = 13;
	const itemNameLineHeight = itemNameSize * 1.3;
	const itemNameLines = wrapTextLines(
		details.item_name || "",
		courierBold,
		itemNameSize,
		PAGE_W - 2 * MARGIN,
	);

	for (let i = 0; i < itemNameLines.length; i++) {
		page.drawText(itemNameLines[i], {
			x: MARGIN,
			y: itemNameY - i * itemNameLineHeight,
			size: itemNameSize,
			font: courierBold,
			color: rgb(0, 0, 0),
		});
	}

	// 6. Optional fields (Courier 9pt, left)
	const itemNameLastLineY =
		itemNameY - (itemNameLines.length - 1) * itemNameLineHeight;
	const optSpacing = 14.4;
	const optionalLines = [
		details.order_number && `ORDER: ${details.order_number}`,
		details.buyer_name && `BUYER: ${details.buyer_name}`,
		details.custom_note,
	].filter((line): line is string => Boolean(line));

	optionalLines.forEach((line, i) => {
		page.drawText(line, {
			x: MARGIN,
			y: itemNameLastLineY - optSpacing - i * optSpacing,
			size: 9,
			font: courier,
			color: hexToRgb(config.colors.item_label),
		});
	});

	// 7. Taglines (Courier-Bold 10pt, left), below the optional fields
	const tagSpacing = 12.96;
	let tagY = itemNameLastLineY - 0.27 * PT - optionalLines.length * optSpacing;

	for (const tagline of config.taglines) {
		page.drawText(tagline, {
			x: MARGIN,
			y: tagY,
			size: 10,
			font: courierBold,
			color: hexToRgb(config.colors.tagline),
		});
		tagY -= tagSpacing;
	}

	// 8. Divider rule, anchored to the bottom
	const ruleY = BORDER_INSET + 0.55 * PT; // 50.4
	page.drawLine({
		start: { x: MARGIN, y: ruleY },
		end: { x: PAGE_W - MARGIN, y: ruleY },
		thickness: 1.2,
		color: hexToRgb(config.colors.divider),
	});

	// 9. Footer lines (Courier 8.5pt, centered, anchored to the bottom)
	const footerSpacing = 11.52;
	const footerBaseY = BORDER_INSET + 0.38 * PT; // 38.16 for the first line
	const footerLines = config.footer_lines.map((line) =>
		replacePlatform(line, config.platform),
	);

	for (let i = 0; i < footerLines.length; i++) {
		const lineWidth = courier.widthOfTextAtSize(footerLines[i], 8.5);
		page.drawText(footerLines[i], {
			x: PAGE_W / 2 - lineWidth / 2,
			y: footerBaseY - i * footerSpacing,
			size: 8.5,
			font: courier,
			color: hexToRgb(config.colors.footer),
		});
	}

	return pdfDoc.save();
}
