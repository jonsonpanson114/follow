// Common Types

export type Mode = 'manager' | 'icebreaker' | 'socialite' | 'mirror';

// Manager Mode Types (Mode I)
export interface CharacterProfile {
  name: string;
  department: string;
  years: string;
  personality: string;
  hiddenTruth: string;
  initialTrust: number;
}

export interface ManagerMessage {
  role: 'user' | 'ai';
  content: string;
  thought?: string;
  trustLevel?: number;
}

export interface ManagerFeedback {
  totalScore: number;
  truthAccuracy: string;
  goodPoint: string;
  badPoint: string;
  advice: string;
}

export const ManagerPhase = {
  INITIALIZING: 'INITIALIZING',
  ROLEPLAY: 'ROLEPLAY',
  FEEDBACK: 'FEEDBACK'
} as const;

export type ManagerPhaseType = typeof ManagerPhase[keyof typeof ManagerPhase];

// Icebreaker Mode Types (Mode II)
export interface Scenario {
  text: string;
  role: string;
  context?: string;
}

export interface IcebreakerEvaluation {
  score: number;
  goodPoints: string;
  improvementSuggestions: string;
  exampleQuestion: string;
}

export interface IcebreakerSession {
  id: string;
  scenario: Scenario;
  userQuestion: string;
  evaluation: IcebreakerEvaluation;
  timestamp: number;
}

export const IcebreakerState = {
  IDLE: 'IDLE',
  LOADING_SCENARIO: 'LOADING_SCENARIO',
  WAITING_FOR_INPUT: 'WAITING_FOR_INPUT',
  EVALUATING: 'EVALUATING',
  SHOWING_FEEDBACK: 'SHOWING_FEEDBACK',
} as const;

export type IcebreakerStateType = typeof IcebreakerState[keyof typeof IcebreakerState];

// Socialite Mode Types (Mode III)
export interface SocialiteScenario {
  gender: string;
  relationship: string;
  contactCount: string;
  place: string;
  personality: string;
  firstMessage: string;
}

export interface SocialiteMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface SocialiteFeedback {
  score: number;
  pros: string;
  cons: string;
  nextStep: string;
}

export type SocialiteStatus = 'idle' | 'generating_scenario' | 'active' | 'analyzing' | 'feedback';

// Mirror Mode Types (Mode IV)
export interface Persona {
  id: string;
  name: string;
  gender: '男性' | '女性';
  age: string;
  relation: string;
  personality: string;
  tone: string;
  icon: string;
}

export interface MirrorMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  analysis?: string;
  nextTopic?: string;
}

export const MirrorLoadingState = {
  IDLE: 'IDLE',
  THINKING: 'THINKING',
  ERROR: 'ERROR',
} as const;

export type MirrorLoadingStateType = typeof MirrorLoadingState[keyof typeof MirrorLoadingState];
