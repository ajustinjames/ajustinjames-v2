export interface SocialLink {
	href: string;
	label: string;
	iconName: string;
}

export const socialLinks: SocialLink[] = [
	{
		href: "https://github.com/ajustinjames",
		label: "Visit my GitHub profile",
		iconName: "fa6-brands:github",
	},
	{
		href: "https://www.linkedin.com/in/ajustinjames/",
		label: "Connect with me on LinkedIn",
		iconName: "fa6-brands:linkedin",
	},
	{
		href: "https://www.youtube.com/@ajustinjames",
		label: "Subscribe to my YouTube channel",
		iconName: "fa6-brands:youtube",
	},
	{
		href: "https://bsky.app/profile/ajustinjames.com",
		label: "Follow me on Bluesky",
		iconName: "fa6-brands:square-bluesky",
	},
];
