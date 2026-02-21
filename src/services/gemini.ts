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
        console.log('[Prod Mode] Calling backend API at /api/chat');
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Backend Error]', response.status, errorText);

          // もし405エラー（ルーティング失敗）なら、Vercelの設定ミスである旨をコンソールに表示
          if (response.status === 405) {
            throw new Error('本番環境のAPI設定（Vercel Functions）が有効になっていません。Vercelのデプロイログを確認してください。');
          }

          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return { text: data.text };
      } catch (error: any) {
        console.error('Error calling backend API:', error);
        throw error;
      }
    }
  }
};

export default ai;
