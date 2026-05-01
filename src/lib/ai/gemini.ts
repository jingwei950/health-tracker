import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import app from '@/lib/firebase/config';

const ai = getAI(app, { backend: new GoogleAIBackend() });

export function getGeminiModel(modelName = 'gemini-2.5-flash-lite') {
  return getGenerativeModel(ai, { model: modelName });
}

export async function generateText(prompt: string, modelName?: string): Promise<string> {
  const model  = getGeminiModel(modelName);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateWithTools(prompt: string, tools: object[], modelName?: string) {
  const model = getGeminiModel(modelName);
  return model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    tools:    tools as any,
  });
}
