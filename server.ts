import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('SERVER ERROR: GEMINI_API_KEY is not set in .env');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

app.post('/api/chat', async (req, res) => {
    try {
        const { model, contents } = req.body;

        if (!model || !contents) {
            return res.status(400).json({ error: 'Missing model or contents' });
        }

        console.log(`[API Proxy] Received request for model: ${model}`);

        const response = await ai.models.generateContent({
            model,
            contents,
        });

        console.log(`[API Proxy] Successfully generated response`);
        res.json({ text: response.text });
    } catch (error: any) {
        console.error('[API Proxy] Error generating content:', error);
        res.status(500).json({ error: 'Failed to generate content', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Local API Proxy running at http://localhost:${port}`);
    console.log(`API Key detected: ${apiKey.substring(0, 8)}...`);
});
