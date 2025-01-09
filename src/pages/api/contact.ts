export const prerender = false;

export async function POST({ request }: { request: Request }) {
    try {
        const formData = await request.formData();
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        if (!name || !email || !message) {
            return new Response('Required field are required.', { status: 400 });
        }

        const webhookUrl = import.meta.env.DISCORD_WEBHOOK_URL;
        const discordPayload = {
            content: `**New Contact Form Submission:**\n\n**Name:** ${name}\n**Email:** ${email}\n**Message:** ${message}`,
        };

        const discordResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload),
        });

        if (!discordResponse.ok) {
            return new Response('Failed to send message to Discord.', { status: 500 });
        }

        return new Response('Message sent successfully!', { status: 200 });
    } catch (error) {
        console.error('Error in API route:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}