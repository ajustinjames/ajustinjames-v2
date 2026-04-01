export interface Project {
	name: string;
	description: string;
	technologies: string[];
	repoUrl?: string;
	siteUrl?: string;
}

export const projects: Project[] = [
	{
		name: "Simple WoL",
		description: "Wake-on-LAN web UI for remotely waking machines on a local network. Built with Go and vanilla JS.",
		technologies: ["Go", "SQLite", "JavaScript"],
		repoUrl: "https://github.com/ajustinjames/simple-wol",
	},
	{
		name: "Selling Insert Generator",
		description: "Client-side web app for generating thermal-printable 4×6 package insert PDFs for online seller storefronts. Fully configurable — runs entirely in the browser, no server required.",
		technologies: ["Vite", "JavaScript", "pdf-lib", "CSS"],
		repoUrl: "https://github.com/ajustinjames/selling-insert-generator",
	},
];
