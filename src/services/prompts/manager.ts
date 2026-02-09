import { ai, MODELS } from '../gemini';
import type { CharacterProfile, ManagerMessage, ManagerFeedback } from '../../types';

const extractJSON = (text: string): string => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  return text.trim();
};

export const generateCharacter = async (): Promise<CharacterProfile> => {
  const prompt = `
    上司と部下のロールプレイングゲーム用の部下キャラクターを1名作成してください。
    以下の情報をJSON形式で出力してください:
    1. 名前・部署・入社年数 (name, department, years)
    2. 性格タイプ (personality): (例:完璧主義、受動攻撃的、燃え尽き症候群、人間関係に敏感など)
    3. 隠された本音 (hiddenTruth): (例:実は転職活動中、上司の指示に納得がいかない、プライベートの崩壊、自身のミスを隠蔽している等)
    4. 初期信頼度 (initialTrust): 10〜30の間

    注意: ユーザーにはこの情報を直接見せません。
  `;

  const response = await ai.models.generateContent({
    model: MODELS.PRO,
    contents: prompt,
  });

  return JSON.parse(extractJSON(response.text || '{}'));
};

export const getFirstLine = async (profile: CharacterProfile): Promise<string> => {
  const prompt = `
    あなたは以下の設定を持つ部下です:
    名前: ${profile.name}
    部署: ${profile.department}
    入社: ${profile.years}
    性格: ${profile.personality}
    本音: ${profile.hiddenTruth} (今は絶対に秘密にしてください)

    信頼度: ${profile.initialTrust}

    ロールプレイを開始します。極めて曖昧で漠然とした悩み(「最近ちょっと...」「なんとなく今のままでいいのかなって...」など)を第一声として投げかけてください。
    出力の冒頭には必ず [思考: ${profile.initialTrust} / ${profile.personality}としての現在の心理状態] を1行で記述してください。
  `;

  const response = await ai.models.generateContent({
    model: MODELS.PRO,
    contents: prompt,
  });

  return response.text || "";
};

export const chatWithSubordinate = async (
  profile: CharacterProfile,
  history: ManagerMessage[],
  userInput: string,
  currentTrust: number
): Promise<string> => {
  const prompt = `
    あなたは以下の設定を持つ部下です:
    設定: ${JSON.stringify(profile)}
    現在の信頼度: ${currentTrust}

    ルール:
    - ユーザーはあなたの上司です。
    - 出力の冒頭に必ず [思考: 信頼度(0-100) / 現在の部下の心理状態] を1行で記述してください。
    - 信頼度の変動:
      +:感情への共感、事実の整理、受容的な問いかけ、適切な沈黙。
      -:安易なアドバイス、説教、尋問(詰問)、自分の話へのすり替え。
    - 信頼度が80を超えない限り、設定した「隠された本音」は絶対に明かさないでください。
    - 信頼度が80を超えたら、ポツリポツリと本音を打ち明け始めてください。

    これまでの会話:
    ${history.map(m => `${m.role === 'user' ? '上司' : '部下'}: ${m.content}`).join('\n')}

    上司の発言: "${userInput}"

    部下としての返答を生成してください。
  `;

  const response = await ai.models.generateContent({
    model: MODELS.PRO,
    contents: prompt,
  });

  return response.text || "";
};

export const getFeedback = async (
  profile: CharacterProfile,
  history: ManagerMessage[]
): Promise<ManagerFeedback> => {
  const prompt = `
    ロールプレイが終了しました。以下の会話記録を分析し、上司役(ユーザー)へのフィードバックを生成してください。

    部下の設定: ${JSON.stringify(profile)}
    会話記録:
    ${history.map(m => `${m.role === 'user' ? '上司' : '部下'}: ${m.content}`).join('\n')}

    以下のJSON形式で出力してください:
    1. トータルスコア (totalScore): 0-100点
    2. 本音の的中度 (truthAccuracy): ユーザーはどの程度真意を掴めていたか(テキスト)
    3. GoodPoint (goodPoint): 信頼度を上げた最高の質問とその理由
    4. BadPoint (badPoint): 心を閉ざさせた瞬間や改善点
    5. アドバイス (advice): 次回のトレーニングで意識すべき点
  `;

  const response = await ai.models.generateContent({
    model: MODELS.PRO,
    contents: prompt,
  });

  return JSON.parse(extractJSON(response.text || '{}'));
};
