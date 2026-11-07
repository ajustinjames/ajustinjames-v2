/**
 * Small single-page apps served at /apps/<slug>/.
 *
 * Each app has its code in `src/apps/<slug>/` and its page in
 * `src/pages/apps/<slug>.astro`. Scaffold a new one with `npm run new-app`.
 */
export interface App {
	/** Lowercase kebab-case. Equals the directory and page name, and the URL path. */
	slug: string;
	name: string;
	/** One public sentence, used for the meta description and the /apps index. */
	description: string;
	/** YYYY-MM-DD the app was added. */
	added: string;
	/**
	 * `false` keeps the app off the /apps index and the sitemap and marks it
	 * noindex. The page is still reachable by URL, which is handy while it's in progress.
	 */
	listed: boolean;
	/** Pins the page to light mode, for apps whose styles don't support dark mode yet. */
	lightOnly?: boolean;
}

export const apps: App[] = [
	{
		slug: "giving-to-scale",
		name: "Giving to Scale",
		description:
			"Type a gift, a fortune, and your net worth to see the same share in your money and the fortune drawn to scale.",
		added: "2026-10-22",
		listed: true,
		lightOnly: true,
	},
	{
		slug: "killed-by-ea",
		name: "Killed by EA",
		description:
			"A dated, sourced archive of what Electronic Arts killed: games cancelled in development, studios closed or merged, and projects it ended.",
		added: "2026-10-22",
		listed: false,
	},
	// new-app: entries are inserted above this line
];

export function getApp(slug: string): App {
	const app = apps.find((entry) => entry.slug === slug);
	if (!app) {
		throw new Error(`No app "${slug}" in src/data/apps.ts`);
	}
	return app;
}

export const listedApps = apps.filter((app) => app.listed);
