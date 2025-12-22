
import { GoogleGenAI, Type } from "@google/genai";
import { DailyInsights, GroundingSource } from "../types";
import { StorageService } from "./storage";

export const GeminiService = {
  getAIInstance: () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  },

  askKoala: async (question: string, contextData: string): Promise<string> => {
    if (StorageService.isQuotaExceeded()) {
      return "The AI nursery is currently reaching its capacity limit. Please wait a few minutes or use your own API key to continue chatting.";
    }

    try {
      const ai = GeminiService.getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `User Question: ${question}\n\nContext about the user's pregnancy journey:\n${contextData}`,
        config: {
            systemInstruction: `You are "Koala AI", a gentle, supportive, and knowledgeable medical assistant for a pregnant woman named Sumaiya. 
            Her due date is June 1st, 2026. Her pregnancy start date (LMP) was August 28, 2025.
            Provide comforting, concise, and medically sound general advice (always disclaimer that you are an AI).
            Keep tone warm, like a caring nurse or friend. Use emojis occasionally 🐨.`
        }
      });
      return response.text || "I couldn't think of an answer right now.";
    } catch (error: any) {
      console.error("Gemini Error:", error);
      const errorMsg = error?.message || "";
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        StorageService.setQuotaExceeded(60); // 1 minute cooldown
        return "The nursery's AI quota is currently resting (429 Error). Please wait a few minutes or select a personal API key if you have one.";
      }
      return "I'm having trouble connecting to the medical database right now. Please try again later.";
    }
  },

  getDailyInsights: async (week: number, day: number): Promise<DailyInsights | { error: string; status: number; retryAfter?: number } | null> => {
    if (StorageService.isQuotaExceeded()) {
      return { error: 'Quota Exhausted', status: 429 };
    }

    try {
      const ai = GeminiService.getAIInstance();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Today is Week ${week}, Day ${day} of Sumaiya's pregnancy journey.
        Search for the latest medical guidelines and milestones for this stage.
        Provide two detailed items in Tamil (தமிழ்):
        1. A heart-touching message from the baby (Liya) to Sumaiya.
        2. Professional medical advice for the mother's health based on current standards.
        Return strictly in JSON format with "babyMessage" and "doctorAdvice" keys.`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              babyMessage: { type: Type.STRING, description: "A message in Tamil from the baby." },
              doctorAdvice: { type: Type.STRING, description: "Medical advice in Tamil for the week." }
            },
            required: ["babyMessage", "doctorAdvice"]
          }
        }
      });

      if (response.text) {
        const insights = JSON.parse(response.text.trim()) as DailyInsights;
        
        const sources: GroundingSource[] = [];
        const metadata = response.candidates?.[0]?.groundingMetadata;
        const chunks = metadata?.groundingChunks;
        
        if (chunks) {
          chunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
              sources.push({
                title: chunk.web.title,
                uri: chunk.web.uri
              });
            }
          });
        }
        
        const uniqueSources = Array.from(new Set(sources.map(s => s.uri)))
          .map(uri => sources.find(s => s.uri === uri))
          .filter(Boolean) as GroundingSource[];

        return { ...insights, sources: uniqueSources };
      }
      return null;
    } catch (error: any) {
      console.error("Failed to fetch daily insights:", error);
      const errorMsg = error?.message || "";
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        // Parse retry delay from error if possible (some SDKs include it in details)
        let retryAfter = 60;
        try {
          // Look for clues in the stringified error if structure is obscured
          const delayMatch = errorMsg.match(/retry in ([\d\.]+)s/);
          if (delayMatch && delayMatch[1]) {
            retryAfter = Math.ceil(parseFloat(delayMatch[1])) + 2; // buffer
          }
        } catch (e) {}

        StorageService.setQuotaExceeded(retryAfter);
        return { error: 'Quota Exhausted', status: 429, retryAfter };
      }
      return null;
    }
  }
};
