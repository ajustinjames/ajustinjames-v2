/**
 * Small single-page apps served at /apps/<slug>/.
 *
 * Apps are found automatically: every `src/apps/<slug>/app.json` is one app, and its
 * folder name is its slug. Its page is `src/pages/apps/<slug>.astro`. Scaffold a new
 * one with `npm run new-app`.
 */
export interface AppMeta {
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

export interface App extends AppMeta {
	/** Lowercase kebab-case. Equals the folder and page name, and the URL path. */
	slug: string;
}

const metaFiles = import.meta.glob<AppMeta>("../apps/*/app.json", {
	eager: true,
	import: "default",
});

export const apps: App[] = Object.entries(metaFiles)
	.map(([path, meta]) => ({ slug: path.split("/").at(-2) as string, ...meta }))
	.sort(
		(a, b) => b.added.localeCompare(a.added) || a.name.localeCompare(b.name),
	);

export function getApp(slug: string): App {
	const app = apps.find((entry) => entry.slug === slug);
	if (!app) {
		throw new Error(`No app "${slug}": add src/apps/${slug}/app.json`);
	}
	return app;
}

export const listedApps = apps.filter((app) => app.listed);
