export const prerender = false;

export async function POST({ request }: { request: Request }) {
    try {
        const formData = await request.formData();
        let name = sanitizeString(formData.get('name') as string);
        let email = sanitizeEmail(formData.get('email') as string);
        let message = sanitizeString(formData.get('message') as string);
        const turnstileToken = formData.get('cf-turnstile-response') as string;

        if (!name || !email || !message) {
            return new Response('Missing required field(s).', { status: 400 });
        }

        name = name.length > 100 ? name.substring(0, 100) : name;
        email = email.length > 100 ? email.substring(0, 100) : email;
        message = message.length > 500 ? message.substring(0, 500) : message;

        const secretKey = import.meta.env.TURNSTILE_SECRET_TOKEN;
        const turnstileValidationResponse = await fetch(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    secret: secretKey,
                    response: turnstileToken,
                }),
            }
        );

        const turnstileValidation = await turnstileValidationResponse.json();
        if (!turnstileValidation.success) {
            console.error('Turnstile validation failed:', turnstileValidation);
            return new Response(`Turnstile validation failed: ${turnstileValidation['error-codes']}`, { status: 403 });
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

export function sanitizeString(str: string): string {
    if (!str) return '';
    
    // Remove HTML tags
    str = str.replace(/<[^>]*>/g, '');
    
    // Remove special characters and scripts
    str = str.replace(/[<>{}()]/g, '');
    str = str.replace(/javascript:/gi, '');
    str = str.replace(/on\w+=/gi, '');
    
    // Trim whitespace
    return str.trim();
}

export function sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Basic email sanitization
    email = email.toLowerCase().trim();
    email = email.replace(/[<>{}()]/g, '');
    
    return email;
}