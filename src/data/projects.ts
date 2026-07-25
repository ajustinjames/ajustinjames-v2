export type ProjectStatus = "active" | "stable";

export interface Project {
	name: string;
	description: string;
	technologies: string[];
	/** `active` = under ongoing development, `stable` = shipped and holding steady. */
	status: ProjectStatus;
	repoUrl?: string;
	siteUrl?: string;
	/** Image from `src/assets/projects/`, imported so astro:assets can optimize it. */
	screenshot?: ImageMetadata;
}

export const projects: Project[] = [
	{
		name: "ajj-design",
		description:
			"Industrial-material design system platform. The current system, hardline, is framework-agnostic Lit web components fed by Style Dictionary tokens compiled from a single source of truth — 0px radii, hard-cast shadows, no gradients. It's what this site is built on.",
		technologies: ["Lit", "TypeScript", "Style Dictionary", "Storybook"],
		status: "active",
		repoUrl: "https://github.com/ajustinjames/ajj-design",
		siteUrl: "https://ajustinjames.github.io/ajj-design/",
	},
	{
		name: "Aaron Intelligence",
		description:
			"Claude Code plugin marketplace hosting my own plugins — a shell-usage guard, a compressed-output mode, a cross-model delegation skill — plus a curated index of good third-party ones. Also ships launchers that discover every repo in a workspace and start a remote-control session per project.",
		technologies: ["Claude Code", "Bash", "Markdown"],
		status: "active",
		repoUrl: "https://github.com/ajustinjames/aaron-intelligence",
	},
	{
		name: "Decky Portal",
		description:
			"Decky Loader plugin that puts a web portal inside the Steam Deck's Quick Access Menu for streaming, browsing, and media playback without leaving a game. Forked from decky-pip and rebuilt around the quality-of-life features I kept wanting.",
		technologies: ["TypeScript", "React", "Decky Loader", "Rollup"],
		status: "active",
		repoUrl: "https://github.com/ajustinjames/decky-portal",
	},
	{
		name: "Selling Insert Generator",
		description:
			"Client-side web app for generating thermal-printable 4×6 package insert PDFs for online seller storefronts. Fully configurable — runs entirely in the browser, no server required.",
		technologies: ["Vite", "JavaScript", "pdf-lib", "CSS"],
		status: "stable",
		repoUrl: "https://github.com/ajustinjames/selling-insert-generator",
	},
];
