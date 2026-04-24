import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY?.replace(/['"\s]/g, '');
  if (!apiKey) {
    console.error('No API Key found in environment');
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const models = await ai.models.list();
    console.log('--- AVAILABLE MODELS ---');
    models.forEach(m => {
      console.log(`${m.name} (Methods: ${m.supportedMethods.join(', ')})`);
    });
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
