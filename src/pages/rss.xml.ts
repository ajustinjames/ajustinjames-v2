import rss from "@astrojs/rss";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
	const posts = Object.values(
		import.meta.glob<{ frontmatter: { title: string; pubDate: string; description: string } }>(
			"./posts/**/*.md",
			{ eager: true }
		)
	).filter((post) => {
		const url = (post as { url?: string }).url;
		return url && !url.includes("_template");
	});

	return rss({
		title: "Aaron James",
		description: "Thoughts on software development, technology, gaming, and more.",
		site: context.site ?? "https://ajustinjames.com",
		items: posts
			.sort((a, b) =>
				new Date(b.frontmatter.pubDate).getTime() -
				new Date(a.frontmatter.pubDate).getTime()
			)
			.map((post) => {
				const url = (post as { url?: string }).url ?? "";
				return {
					title: post.frontmatter.title,
					pubDate: new Date(post.frontmatter.pubDate),
					description: post.frontmatter.description,
					link: url,
				};
			}),
	});
}
