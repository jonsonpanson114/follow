import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client with API key from environment
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
export const ai = new GoogleGenAI({ apiKey });

// Model configurations
export const MODELS = {
  PRO: 'gemini-2.5-flash',
  FLASH: 'gemini-2.5-flash',
} as const;

export default ai;
