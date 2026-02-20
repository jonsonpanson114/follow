import { GoogleGenAI } from '@google/genai';

// Vercel Serverless Function (Node.js runtime)
export default async function handler(req: any, res: any) {
    // CORS Preflight behavior (if needed for testing origin)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { model, contents } = req.body;

        if (!model || !contents) {
            return res.status(400).json({ error: 'Missing model or contents' });
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.error('SERVER ERROR: API Key is not set in Vercel Environment Variables');
            return res.status(500).json({ error: 'Server Configuration Error: Missing API Key' });
        }

        // Initialize the Gemini client
        const ai = new GoogleGenAI({ apiKey });

        console.log(`[Backend API] Received request for model: ${model}`);

        // Call Gemini API
        const response = await ai.models.generateContent({
            model,
            contents,
        });

        console.log(`[Backend API] Successfully generated response.`);

        // Return the response as JSON
        return res.status(200).json({ text: response.text });

    } catch (error: any) {
        console.error('[Backend API] Error generating content:', error);
        return res.status(500).json({
            error: 'Failed to generate content',
            details: error.message
        });
    }
}
