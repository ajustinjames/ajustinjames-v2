import { existsSync, readdirSync, readFileSync } from "node:fs";
import lit from "@astrojs/lit";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

// Apps marked `listed: false` in src/apps/<slug>/app.json stay out of the sitemap.
const unlistedAppPaths = readdirSync("./src/apps")
	.filter((slug) => existsSync(`./src/apps/${slug}/app.json`))
	.filter(
		(slug) =>
			!JSON.parse(readFileSync(`./src/apps/${slug}/app.json`, "utf8")).listed,
	)
	.map((slug) => `/apps/${slug}/`);

export default defineConfig({
	site: "https://ajustinjames.com",
	output: "static",
	integrations: [
		icon(),
		lit(),
		sitemap({
			changefreq: "weekly",
			priority: 0.7,
			filter: (page) => !unlistedAppPaths.some((path) => page.endsWith(path)),
			lastmod: new Date(),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
	minify: true,
});
