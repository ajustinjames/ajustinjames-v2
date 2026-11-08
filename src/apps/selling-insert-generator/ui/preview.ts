// Draws a live HTML preview of the insert. It mirrors core/pdf.ts: the same
// measurements in PDF points (4×6 in at 72 pt/in, origin bottom left),
// converted here to CSS percentages from the top left. A layout change in one
// needs the same change in the other. The PDF is the authoritative output.

import type { InsertConfig, InsertDetails } from "../core/config.ts";
import { replacePlatform } from "../core/files.ts";

const PAGE_W = 288; // 4in * 72pt
const PAGE_H = 432; // 6in * 72pt
const MARGIN = 21.6;
const BORDER_INSET = 10.8;
const CIRCLE_R = 46.8; // 0.65in * 72
const RULE_Y = BORDER_INSET + 0.55 * 72; // 50.4

function pct(pt: number, dimension: number): string {
	return `${(pt / dimension) * 100}%`;
}

function cqh(pt: number): string {
	return `${(pt / PAGE_H) * 100}cqh`;
}

/**
 * Converts a PDF y (up from the bottom) to a CSS top percentage (down from the
 * top). `heightPt` is roughly how tall the element is, in points.
 */
function topFromPdfY(pdfY: number, heightPt = 0): string {
	return pct(PAGE_H - pdfY - heightPt, PAGE_H);
}

function el(
	tag: string,
	className: string,
	styles: Partial<CSSStyleDeclaration> = {},
	text = "",
): HTMLElement {
	const node = document.createElement(tag);
	node.className = className;
	Object.assign(node.style, styles);
	if (text) node.textContent = text;
	return node;
}

export function renderPreview(
	container: HTMLElement,
	config: InsertConfig,
	details: InsertDetails,
	logoDataUrl: string | null,
): void {
	container.replaceChildren();

	container.append(
		el("div", "pi-border", {
			left: pct(BORDER_INSET, PAGE_W),
			top: pct(BORDER_INSET, PAGE_H),
			right: pct(BORDER_INSET, PAGE_W),
			bottom: pct(BORDER_INSET, PAGE_H),
			border: `1.5px solid ${config.colors.border}`,
		}),
	);

	let contentStartY: number; // PDF y of the store name baseline

	if (logoDataUrl) {
		const circleCx = PAGE_W / 2;
		const circleCy = PAGE_H - 0.45 * 72 - CIRCLE_R; // 352.8

		const circle = el("div", "pi-circle", {
			left: pct(circleCx - CIRCLE_R, PAGE_W),
			top: topFromPdfY(circleCy - CIRCLE_R, CIRCLE_R * 2),
			width: pct(CIRCLE_R * 2, PAGE_W),
			aspectRatio: "1",
			border: `1.5px solid ${config.colors.border}`,
		});
		const img = document.createElement("img");
		// A data URL the browser made from the chosen file with FileReader.
		img.src = logoDataUrl;
		img.alt = "";
		circle.append(img);
		container.append(circle);

		contentStartY = circleCy - CIRCLE_R - 0.24 * 72; // 288.72
	} else {
		contentStartY = PAGE_H - BORDER_INSET - 0.45 * 72;
	}

	container.append(
		el(
			"div",
			"pi-text",
			{
				left: "6%",
				right: "6%",
				top: topFromPdfY(contentStartY, 11),
				textAlign: "center",
				fontSize: cqh(11),
				fontWeight: "400",
				color: config.colors.store_name,
			},
			config.store_name,
		),
	);

	// From the ITEM label to the taglines, a flex column lets wrapped text push
	// the lines after it down, as the PDF does.
	const itemY = contentStartY - 0.48 * 72;
	const content = el("div", "pi-content", {
		top: topFromPdfY(itemY),
		bottom: pct(RULE_Y + 8, PAGE_H),
		left: pct(MARGIN, PAGE_W),
		right: pct(MARGIN, PAGE_W),
	});

	content.append(
		el(
			"div",
			"pi-flow-text",
			{
				fontSize: cqh(10),
				fontWeight: "700",
				color: config.colors.item_label,
			},
			"ITEM",
		),
		el(
			"div",
			"pi-flow-text pi-item-name",
			{
				fontSize: cqh(13),
				fontWeight: "700",
				color: details.item_name ? "#1a1410" : "#bbbbbb",
			},
			details.item_name || "Item name…",
		),
	);

	const optionalLines = [
		details.order_number && `ORDER: ${details.order_number}`,
		details.buyer_name && `BUYER: ${details.buyer_name}`,
		details.custom_note,
	].filter(Boolean);
	for (const line of optionalLines) {
		content.append(
			el(
				"div",
				"pi-flow-text",
				{ fontSize: cqh(9), color: config.colors.item_label },
				line,
			),
		);
	}

	for (const tagline of config.taglines) {
		content.append(
			el(
				"div",
				"pi-flow-text pi-tagline",
				{
					fontSize: cqh(10),
					fontWeight: "700",
					color: config.colors.tagline,
				},
				tagline,
			),
		);
	}
	container.append(content);

	container.append(
		el("div", "pi-line", {
			top: topFromPdfY(RULE_Y),
			borderTopWidth: "1px",
			borderTopColor: config.colors.divider,
		}),
	);

	const footerBaseY = BORDER_INSET + 0.38 * 72; // 38.16
	const footerSpacing = 11.52;
	config.footer_lines.forEach((line, i) => {
		container.append(
			el(
				"div",
				"pi-text",
				{
					left: "6%",
					right: "6%",
					top: topFromPdfY(footerBaseY - i * footerSpacing, 8.5),
					textAlign: "center",
					fontSize: cqh(8.5),
					color: config.colors.footer,
				},
				replacePlatform(line, config.platform),
			),
		);
	});
}
