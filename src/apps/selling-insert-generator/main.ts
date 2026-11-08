// Registers the hardline Web Components (<hl-btn>, <hl-card>, …) used in the page.
import "@ajustinjames/hardline-components";
import "./style.css";

import {
	COLOR_KEYS,
	type ColorKey,
	getLogoDataUrl,
	HEX_RE,
	type InsertConfig,
	type InsertDetails,
	loadConfig,
	MAX_FOOTER_LINES,
	MAX_TAGLINES,
	needsThermalWarning,
	removeLogo,
	resetConfig,
	saveConfig,
	saveLogoDataUrl,
	validateConfig,
} from "./core/config.ts";
import { insertFileName, logoFileError } from "./core/files.ts";
import { generateInsertPdf } from "./core/pdf.ts";
import { renderPreview } from "./ui/preview.ts";

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
	const node = document.getElementById(id);
	if (!node) throw new Error(`Missing #${id}`);
	return node as T;
}

const root = byId("main-content");
const itemName = byId<HTMLInputElement>("item_name");
const downloadBtn = byId<HTMLButtonElement>("download-btn");
const printBtn = byId<HTMLButtonElement>("print-btn");
const actionError = byId("download-error");
const previewContainer = byId("preview-container");

let config: InsertConfig = loadConfig();
let logoDataUrl = getLogoDataUrl();

// ── Helpers ──────────────────────────────────────────────────────

function getDetails(): InsertDetails {
	const value = (id: string) => byId<HTMLInputElement>(id).value.trim();
	return {
		item_name: value("item_name"),
		order_number: value("order_number"),
		buyer_name: value("buyer_name"),
		custom_note: value("custom_note"),
	};
}

function updatePreview(): void {
	try {
		renderPreview(previewContainer, config, getDetails(), logoDataUrl);
	} catch (err) {
		console.error("Preview render failed:", err);
	}
}

/** Disables a button and its <hl-btn> shell, which styles itself from its own attribute. */
function setButtonDisabled(btn: HTMLButtonElement, disabled: boolean): void {
	btn.disabled = disabled;
	btn.closest("hl-btn")?.toggleAttribute("disabled", disabled);
}

function setButtonLabel(btn: HTMLButtonElement, label: string): void {
	const labelEl = btn.querySelector(".btn-label");
	if (labelEl) labelEl.textContent = label;
}

function updateActionButtons(): void {
	const empty = itemName.value.trim().length === 0;
	setButtonDisabled(downloadBtn, empty);
	setButtonDisabled(printBtn, empty);
}

function showActionError(message: string): void {
	actionError.textContent = message;
	actionError.hidden = false;
}

function triggerDownload(bytes: Uint8Array, filename: string): void {
	const url = URL.createObjectURL(
		new Blob([bytes as BlobPart], { type: "application/pdf" }),
	);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.hidden = true;
	document.body.append(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Runs a PDF action with its button busy, then restores the button. Shows any
 * failure under the buttons.
 */
async function withPdf(
	btn: HTMLButtonElement,
	idleLabel: string,
	action: (bytes: Uint8Array, details: InsertDetails) => void,
): Promise<void> {
	actionError.hidden = true;
	const details = getDetails();
	if (!details.item_name) {
		showActionError("Item name is required.");
		return;
	}

	setButtonDisabled(btn, true);
	setButtonLabel(btn, "GENERATING…");
	try {
		action(await generateInsertPdf(config, details, logoDataUrl), details);
	} catch (err) {
		showActionError(`Error: ${err instanceof Error ? err.message : err}`);
	} finally {
		setButtonLabel(btn, idleLabel);
		updateActionButtons();
	}
}

// ── Views ────────────────────────────────────────────────────────

const tabs = document.querySelectorAll<HTMLButtonElement>(".sig-tab");
for (const tab of tabs) {
	tab.addEventListener("click", () => {
		const view = tab.dataset.view ?? "main";
		root.dataset.view = view;
		for (const other of tabs) {
			other.setAttribute("aria-pressed", String(other === tab));
		}
		if (view === "settings") populateSettingsForm();
	});
}

// ── Generator ────────────────────────────────────────────────────

itemName.addEventListener("input", () => {
	byId("item_name_count").textContent = String(itemName.value.length);
	updateActionButtons();
	updatePreview();
});

for (const id of ["order_number", "buyer_name", "custom_note"]) {
	byId(id).addEventListener("input", updatePreview);
}

downloadBtn.addEventListener("click", () =>
	withPdf(downloadBtn, "DOWNLOAD PDF", (bytes, details) =>
		triggerDownload(bytes, insertFileName(details.item_name)),
	),
);

printBtn.addEventListener("click", () =>
	withPdf(printBtn, "PRINT", (bytes, details) => {
		const url = URL.createObjectURL(
			new Blob([bytes as BlobPart], { type: "application/pdf" }),
		);
		const win = window.open(url);
		if (win) {
			win.addEventListener("load", () => {
				win.print();
				URL.revokeObjectURL(url);
			});
		} else {
			// The pop-up was blocked, so download the PDF instead.
			URL.revokeObjectURL(url);
			triggerDownload(bytes, insertFileName(details.item_name));
		}
	}),
);

// ── Settings: filling the form ───────────────────────────────────

const platformSelect = byId<HTMLSelectElement>("s_platform");
const platformOther = byId<HTMLInputElement>("s_platform_other");

function colorInputs(key: ColorKey) {
	return {
		picker: document.querySelector<HTMLInputElement>(
			`.color-picker[data-color-key="${key}"]`,
		),
		hex: document.querySelector<HTMLInputElement>(
			`.color-hex[data-color-key="${key}"]`,
		),
	};
}

function populateSettingsForm(): void {
	byId<HTMLInputElement>("s_store_name").value = config.store_name;

	const builtIn = Array.from(platformSelect.options, (o) => o.value);
	if (builtIn.includes(config.platform)) {
		platformSelect.value = config.platform;
		platformOther.value = "";
	} else {
		platformSelect.value = "Other";
		platformOther.value = config.platform;
	}
	updatePlatformOther();

	populateList(taglineList, config.taglines);
	populateList(footerList, config.footer_lines);

	for (const key of COLOR_KEYS) {
		const hex = config.colors[key];
		const { picker, hex: hexInput } = colorInputs(key);
		if (picker) picker.value = hex;
		if (hexInput) hexInput.value = hex;
		updateThermalWarning(key, hex);
	}

	byId<HTMLInputElement>("s_width").value = String(config.page.width_inches);
	byId<HTMLInputElement>("s_height").value = String(config.page.height_inches);

	updateLogoUI();
}

// ── Settings: logo ───────────────────────────────────────────────

const logoInput = byId<HTMLInputElement>("logo-input");
const logoError = byId("logo-error");

function updateLogoUI(): void {
	byId<HTMLImageElement>("logo-preview-img").src = logoDataUrl ?? "";
	byId("logo-preview-wrap").hidden = !logoDataUrl;
	byId("logo-upload-area").hidden = Boolean(logoDataUrl);
}

logoInput.addEventListener("change", () => {
	const file = logoInput.files?.[0];
	logoInput.value = "";
	if (!file) return;

	const error = logoFileError(file);
	logoError.textContent = error ?? "";
	logoError.hidden = !error;
	if (error) return;

	const reader = new FileReader();
	reader.addEventListener("load", () => {
		if (typeof reader.result !== "string") return;
		logoDataUrl = reader.result;
		try {
			saveLogoDataUrl(logoDataUrl);
		} catch {
			logoError.textContent =
				"The logo is in use now but couldn't be saved for next time.";
			logoError.hidden = false;
		}
		updateLogoUI();
		updatePreview();
	});
	reader.readAsDataURL(file);
});

byId("logo-remove-btn").addEventListener("click", () => {
	logoDataUrl = null;
	removeLogo();
	updateLogoUI();
	updatePreview();
});

// ── Settings: platform ───────────────────────────────────────────

function updatePlatformOther(): void {
	byId("s_platform_other_field").hidden = platformSelect.value !== "Other";
}

platformSelect.addEventListener("change", updatePlatformOther);

// ── Settings: tagline and footer lists ───────────────────────────

interface EditableList {
	list: HTMLElement;
	addBtn: HTMLButtonElement;
	max: number;
	label: string;
}

const taglineList: EditableList = {
	list: byId("taglines-list"),
	addBtn: byId<HTMLButtonElement>("add-tagline-btn"),
	max: MAX_TAGLINES,
	label: "Tagline",
};
const footerList: EditableList = {
	list: byId("footer-list"),
	addBtn: byId<HTMLButtonElement>("add-footer-btn"),
	max: MAX_FOOTER_LINES,
	label: "Footer line",
};

function updateAddButton({ list, addBtn, max }: EditableList): void {
	const full = list.children.length >= max;
	addBtn.closest("hl-btn")?.toggleAttribute("hidden", full);
}

function addListItem(editable: EditableList, value = ""): void {
	const row = document.createElement("div");
	row.className = "dynamic-list-item";

	const inputShell = document.createElement("hl-input");
	inputShell.setAttribute("density", "compact");
	const input = document.createElement("input");
	input.type = "text";
	input.className = "field-input";
	input.value = value;
	input.maxLength = 100;
	input.setAttribute(
		"aria-label",
		`${editable.label} ${editable.list.children.length + 1}`,
	);
	inputShell.append(input);

	const removeShell = document.createElement("hl-btn");
	removeShell.setAttribute("variant", "ghost");
	removeShell.setAttribute("size", "sm");
	const removeBtn = document.createElement("button");
	removeBtn.type = "button";
	removeBtn.className = "list-remove-btn";
	removeBtn.setAttribute(
		"aria-label",
		`Remove ${editable.label.toLowerCase()}`,
	);
	removeBtn.textContent = "✕";
	removeBtn.addEventListener("click", () => {
		row.remove();
		updateAddButton(editable);
	});
	removeShell.append(removeBtn);

	row.append(inputShell, removeShell);
	editable.list.append(row);
	updateAddButton(editable);
}

function populateList(editable: EditableList, items: string[]): void {
	editable.list.replaceChildren();
	for (const item of items) addListItem(editable, item);
	updateAddButton(editable);
}

function listValues({ list }: EditableList): string[] {
	return Array.from(
		list.querySelectorAll<HTMLInputElement>(".field-input"),
		(input) => input.value.trim(),
	).filter(Boolean);
}

for (const editable of [taglineList, footerList]) {
	editable.addBtn.addEventListener("click", () => {
		addListItem(editable);
		editable.list
			.querySelector<HTMLInputElement>(".dynamic-list-item:last-child input")
			?.focus();
	});
}

// ── Settings: colors ─────────────────────────────────────────────

function updateThermalWarning(key: ColorKey, hex: string): void {
	const warning = document.getElementById(`warn_${key}`);
	if (warning) warning.hidden = !needsThermalWarning(hex);
}

for (const key of COLOR_KEYS) {
	const { picker, hex } = colorInputs(key);
	picker?.addEventListener("input", () => {
		if (hex) hex.value = picker.value;
		updateThermalWarning(key, picker.value);
	});
	hex?.addEventListener("input", () => {
		if (picker && HEX_RE.test(hex.value)) picker.value = hex.value;
		updateThermalWarning(key, hex.value);
	});
}

// ── Settings: save and reset ─────────────────────────────────────

const feedback = byId("save-feedback");
let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

function showFeedback(message: string, tone: "success" | "error"): void {
	clearTimeout(feedbackTimer);
	feedback.textContent = message;
	feedback.setAttribute("tone", tone);
	feedback.hidden = false;
}

byId("save-btn").addEventListener("click", () => {
	feedback.hidden = true;

	const platform =
		platformSelect.value === "Other"
			? platformOther.value.trim() || "Other"
			: platformSelect.value;

	const colors = { ...config.colors };
	for (const key of COLOR_KEYS) {
		const hex = colorInputs(key).hex;
		if (hex) colors[key] = hex.value.trim();
	}

	const candidate: InsertConfig = {
		store_name: byId<HTMLInputElement>("s_store_name").value.trim(),
		platform,
		taglines: listValues(taglineList),
		footer_lines: listValues(footerList),
		colors,
		page: {
			width_inches: Number.parseFloat(byId<HTMLInputElement>("s_width").value),
			height_inches: Number.parseFloat(
				byId<HTMLInputElement>("s_height").value,
			),
		},
	};

	const { valid, errors, warnings } = validateConfig(candidate);
	if (!valid) {
		showFeedback(errors.join(" · "), "error");
		return;
	}

	try {
		config = saveConfig(candidate);
	} catch (err) {
		showFeedback(err instanceof Error ? err.message : String(err), "error");
		return;
	}

	const note = warnings.length ? ` Note: ${warnings.join(" · ")}` : "";
	showFeedback(`Settings saved.${note}`, "success");
	updatePreview();
	feedbackTimer = setTimeout(() => {
		feedback.hidden = true;
	}, 4000);
});

byId("reset-btn").addEventListener("click", () => {
	if (!confirm("Reset all settings to defaults? This can't be undone.")) return;
	config = resetConfig();
	logoDataUrl = null;
	removeLogo();
	populateSettingsForm();
	updatePreview();
	feedback.hidden = true;
});

// ── Start ────────────────────────────────────────────────────────

updatePreview();
updateActionButtons();
