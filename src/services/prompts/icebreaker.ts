import { ai, MODELS } from '../gemini';
import type { Scenario, IcebreakerEvaluation } from '../../types';

// Helper to extract JSON from markdown code blocks
const extractJSON = (text: string): string => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
};

export const generateScenario = async (): Promise<Scenario> => {
  try {
    const themes = [
      "来期の昇進や人事異動の噂",
      "新しい福利厚生や社内制度への感想",
      "中途採用の面接の印象",
      "有給休暇の計画やワークライフバランス",
      "オフィスの空調や設備の不具合",
      "新しいチャットツールや経費精算システムの使い勝手",
      "社用PCの入れ替えやITセキュリティ",
      "競合他社の驚くようなニュース",
      "最近の業界トレンドや株価の動き",
      "新規事業のアイデア出し",
      "クライアントからのお褒めの言葉",
      "チームの目標達成や成功事例の共有",
      "社内表彰されたことへの感想",
      "ランチのおすすめのお店",
      "週末の過ごし方や趣味の話(ビジネスライクに)",
      "健康診断の結果や健康管理",
      "社内イベント(忘年会・送別会)の幹事相談",
      "ちょっとした業務の相談"
    ];

    const contexts = [
      "給湯室でコーヒーを淹れている時",
      "エレベーター待ちのホールで",
      "ランチを一緒に食べている時",
      "定例会議が始まる前の数分間",
      "帰りのエレベーターで一緒になった時",
      "デスクにふらっと立ち寄って",
      "タクシーで移動中の車内で",
      "オンライン会議の接続待ちの時間に",
      "残業中に休憩スペースで"
    ];

    const roles = ["上司", "同僚", "部下", "取引先", "他部署の部長", "新入社員", "社長"];

    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const randomSeed = Math.floor(Math.random() * 1000000);

    const prompt = `
      あなたはユーザーの「${randomRole}」です。

      【設定】
      役割: ${randomRole}
      シチュエーション: ${randomContext}
      話題のテーマ: ${randomTheme}
      Seed: ${randomSeed}

      上記のシチュエーションにおいて、ユーザーに話しかける「会話のきっかけとなる一言」を生成してください。

      【重要ルール】
      1. **「プロジェクトの遅延」や「深刻なトラブル」の話は避けてください。**(今回はそれ以外の日常的なビジネス会話を求めています)
      2. シチュエーション(場所・時間)に合ったトーンにしてください。
         - エレベーターや移動中なら短く。
         - ランチや休憩中なら少しリラックスして。
         - 会議前なら少し小声で、など。
      3. 相手(ユーザー)が「それってどういうことですか?」「詳しく聞かせてください」と興味を持ち、フォローアップ質問をしたくなるような内容にしてください。
      4. 出力はJSON形式で、役割(role)、発言内容(text)、シチュエーション(context)を含めてください。
    `;

    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: prompt,
    });

    const data = JSON.parse(extractJSON(response.text || "{}"));

    if (!data.text || data.text.length < 5) {
      return {
        role: "同僚",
        context: "ランチの席で",
        text: "最近、会社の近くにすごく美味しいカレー屋さんができたの知ってる?"
      };
    }

    return {
      role: data.role || randomRole,
      context: data.context || randomContext,
      text: data.text
    };

  } catch (error) {
    console.error("Error generating scenario:", error);
    return {
      role: "システム",
      context: "エラー",
      text: "申し訳ありません、シナリオ生成中にエラーが発生しました。"
    };
  }
};

export const evaluateQuestion = async (
  scenario: Scenario,
  userQuestion: string
): Promise<IcebreakerEvaluation> => {
  try {
    const prompt = `
      あなたはプロのビジネスコミュニケーションコーチです。

      【状況設定】
      相手: ${scenario.role}
      場所・状況: ${scenario.context || 'オフィス内'}

      【会話】
      相手の発言: "${scenario.text}"
      ユーザーの質問: "${userQuestion}"

      【評価タスク】
      この状況におけるユーザーの質問を評価してください。

      評価基準:
      1. **TPO(時・所・場合)**: 「${scenario.context}」という状況に適した長さや深刻度か?(例:エレベーターで長すぎる議論はNG、会議前なら手短に、など)
      2. **関係性**: ${scenario.role}に対する言葉遣いは適切か?
      3. **深掘り**: 会話を広げる、または本質に迫る質問になっているか?

      出力(JSON):
      - score: 1-5の評価点
      - goodPoints: 良かった点(TPOの観点含む)
      - improvementSuggestions: 改善点(TPOや役割への配慮)
      - exampleQuestion: この状況で最適な質問例
    `;

    const response = await ai.models.generateContent({
      model: MODELS.FLASH,
      contents: prompt,
    });

    const result = JSON.parse(extractJSON(response.text || "{}")) as IcebreakerEvaluation;
    return result;

  } catch (error) {
    console.error("Error evaluating question:", error);
    return {
      score: 0,
      goodPoints: "評価エラー",
      improvementSuggestions: "通信エラーが発生しました。",
      exampleQuestion: "状況について詳しく教えていただけますか?",
    };
  }
};
