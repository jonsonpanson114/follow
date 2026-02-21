import { GoogleGenAI } from '@google/genai';

// Model configurations
export const MODELS = {
  PRO: 'gemini-2.5-flash',
  FLASH: 'gemini-2.5-flash',
} as const;

// Create a unified interface that matches the existing GoogleGenAI usage
export const ai = {
  models: {
    generateContent: async (params: { model: string; contents: string | any[]; config?: any;[key: string]: any }) => {

      // 1. ローカル開発環境の場合は直接APIを叩く (Viteサーバーのみで完結させるため)
      const localApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (import.meta.env.DEV && localApiKey) {
        console.log('[Dev Mode] Calling Gemini API directly');
        const localAi = new GoogleGenAI({ apiKey: localApiKey });
        const response = await localAi.models.generateContent(params);
        return { text: response.text };
      }

      // 2. 本番環境（Vercel等）の場合は秘匿化されたバックエンドAPIを叩く
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        return { text: data.text };
      } catch (error) {
        console.error('Error calling backend API:', error);
        throw error;
      }
    }
  }
};

export default ai;
