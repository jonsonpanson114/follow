import { ai, MODELS } from '../gemini';
import { Type } from '@google/genai';
import type { SocialiteScenario, SocialiteMessage, SocialiteFeedback } from '../../types';

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error?.message?.includes('429')) {
      console.warn(`Rate limit reached. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateScenario = async (): Promise<SocialiteScenario> => {
  return withRetry(async () => {
    const prompt = `
      会話スキルトレーニングのためのランダムなロールプレイシナリオを生成してください。
      出力はJSON形式で、以下の要素を含めてください(値はすべて日本語で記述すること)。

      - gender: 相手の性別(男性 / 女性 / その他)
      - relationship: 関係性(例:初対面、顔見知り、上司と部下、店員と客、敵対関係など)
      - contactCount: 接触回数(例:今回が初めて、2回目、数年ぶりなど)
      - place: 場所(例:カフェ、エレベーター、居酒屋、公園のベンチ、取引先など)
      - personality: 相手の性格(例:人当たりが良い、無口で不愛想、陽気でおしゃべり、皮肉屋など)
      - firstMessage: その設定に基づいた、会話を始めるための最初の一言(日本語)。
    `;

    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            gender: { type: Type.STRING },
            relationship: { type: Type.STRING },
            contactCount: { type: Type.STRING },
            place: { type: Type.STRING },
            personality: { type: Type.STRING },
            firstMessage: { type: Type.STRING },
          },
          required: ["gender", "relationship", "contactCount", "place", "personality", "firstMessage"],
        },
      },
    });

    const text = response.text || "";
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as SocialiteScenario;
  });
};

export const sendChatMessage = async (
  scenario: SocialiteScenario,
  history: SocialiteMessage[],
  newMessage: string
): Promise<string> => {
  return withRetry(async () => {
    const systemInstruction = `
      あなたは以下の設定を持つキャラクターを演じてください(日本語で会話すること)。

      【設定】
      - 性別: ${scenario.gender}
      - 関係性: ${scenario.relationship}
      - 接触頻度: ${scenario.contactCount}
      - 場所: ${scenario.place}
      - 性格: ${scenario.personality}

      **ロールプレイルール:**
      1. 100%そのキャラクターになりきること。AIやコーチとして振る舞わないでください。
      2. リアクションの法則:
         - ユーザーが良い質問(オープンクエスチョン、感情に触れる質問)をしたら、設定に基づき好意的に反応する。
         - 退屈な質問(事実確認、尋問のような質問)には、素っ気なく対応する。
      3. 会話が自然に進むよう、回答は簡潔に(1〜3文程度)。
    `;

    const contents = history.map((msg) => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    contents.push({
      role: 'user',
      parts: [{ text: newMessage }],
    });

    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
      },
    });

    return response.text || "...";
  });
};

export const generateFeedback = async (
  scenario: SocialiteScenario,
  history: SocialiteMessage[]
): Promise<SocialiteFeedback> => {
  return withRetry(async () => {
    const conversationText = history
      .map((m) => `${m.role === 'user' ? 'ユーザー' : '相手'}: ${m.text}`)
      .join("\n");

    const prompt = `
      プロの会話コーチとして振る舞ってください。以下の会話ログを分析してください。

      **シナリオ設定:**
      - 関係性: ${scenario.relationship}
      - 性格: ${scenario.personality}
      - シチュエーション: ${scenario.place}

      **会話ログ:**
      ${conversationText}

      **タスク:**
      「ユーザー」の会話スキルを厳しく評価し、日本語でJSON形式の結果を返してください。

      - score: 100点満点中の点数(整数)
      - pros: 具体的に相手の心を動かした点(日本語)
      - cons: もっとこうすれば話が弾んだ、という改善点(日本語)
      - nextStep: 次に試すべき具体的なアクションや質問例(日本語)
    `;

    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Score out of 100" },
            pros: { type: Type.STRING, description: "Good points in Japanese" },
            cons: { type: Type.STRING, description: "Improvements in Japanese" },
            nextStep: { type: Type.STRING, description: "Next action in Japanese" },
          },
          required: ["score", "pros", "cons", "nextStep"],
        },
      },
    });

    const text = response.text || "";
    if (!text) throw new Error("No feedback generated");
    return JSON.parse(text) as SocialiteFeedback;
  });
};
