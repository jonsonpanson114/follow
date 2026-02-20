import { GoogleGenAI } from '@google/genai';

export const config = {
    runtime: 'edge', // Vercel Edge Runtime for faster performance
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const { model, contents } = await req.json();

        if (!model || !contents) {
            return new Response(JSON.stringify({ error: 'Missing model or contents' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API key is missing on the server');
            return new Response(JSON.stringify({ error: 'Server Configuration Error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const ai = new GoogleGenAI({ apiKey });

        // Call Gemini API securely from the backend
        const response = await ai.models.generateContent({
            model,
            contents,
        });

        return new Response(JSON.stringify({ text: response.text }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error in /api/chat:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate content', details: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
