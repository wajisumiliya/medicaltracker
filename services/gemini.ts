import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ensure this is set in environment

let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

export const GeminiService = {
  askKoala: async (question: string, contextData: string): Promise<string> => {
    if (!aiClient) {
      return "I'm sorry, my brain (API Key) is missing. Please check the configuration.";
    }

    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User Question: ${question}\n\nContext about the user's pregnancy journey:\n${contextData}`,
        config: {
            systemInstruction: `You are "Koala AI", a gentle, supportive, and knowledgeable medical assistant for a pregnant woman named Sumaiya. 
            Her due date is June 1st, 2026. Her pregnancy start date (LMP) was August 28, 2025.
            Provide comforting, concise, and medically sound general advice (always disclaimer that you are an AI).
            Keep tone warm, like a caring nurse or friend. Use emojis occasionally 🐨.`
        }
      });
      return response.text || "I couldn't think of an answer right now.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "I'm having trouble connecting to the medical database right now. Please try again later.";
    }
  }
};