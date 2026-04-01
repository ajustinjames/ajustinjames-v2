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
];
