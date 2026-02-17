import { GoogleGenAI, type GenerateContentResponse, type Chat } from "@google/genai";
import type { GroundingSource } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this environment, we assume API_KEY is always present.
  console.error("API_KEY is not set. Gemini Service will not function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Maintain a single chat instance for the support bot
let supportChat: Chat | null = null;

const initializeChat = () => {
    if (!supportChat) {
        supportChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a friendly and helpful customer support agent for FortinXchange, a cryptocurrency exchange platform. Your goal is to assist users with their questions about trading, account security, deposits, withdrawals, and using the platform. Keep your answers concise and easy to understand. Do not provide financial advice.",
            }
        });
    }
}

export const fetchMarketAnalysis = async (
  cryptoName: string
): Promise<{ analysis: string; sources: GroundingSource[] }> => {
  if (!API_KEY) {
    return {
      analysis: "Gemini API key not configured. Please set the API_KEY environment variable.",
      sources: [],
    };
  }

  const prompt = `Provide a brief market analysis and sentiment for ${cryptoName}. Include recent news, price trends, and potential factors affecting its value. Be concise and informative for a trader.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const analysis = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks?.filter(
      (chunk): chunk is GroundingSource => !!chunk.web
    ) ?? [];
    
    return { analysis: analysis ?? '', sources };
  } catch (error) {
    console.error("Error fetching market analysis from Gemini:", error);
    return {
      analysis: "Could not fetch AI analysis. The service may be temporarily unavailable.",
      sources: [],
    };
  }
};

export const fetchLivePrice = async (base: string, quote: string): Promise<number | null> => {
  if (!API_KEY) return null;

  const prompt = `What is the current price of ${base} in ${quote}? Respond with only the numerical price, without any symbols, text, or formatting. For example: 65123.45`;

  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const priceText = (response.text ?? '').trim().replace(/,/g, '');
    const price = parseFloat(priceText);

    if (!isNaN(price) && price > 0) {
      return price;
    }
    console.warn("Could not parse price from Gemini response:", response.text);
    return null;

  } catch (error) {
    console.error("Error fetching live price from Gemini:", error);
    return null;
  }
};

export const sendChatMessage = async (message: string): Promise<string> => {
    if (!API_KEY) {
        return "Chat support is currently unavailable. API key is not configured.";
    }
    
    initializeChat();

    if (!supportChat) {
         return "Could not initialize chat session.";
    }

    try {
        const response: GenerateContentResponse = await supportChat.sendMessage({ message });
        return response.text ?? '';
    } catch (error) {
        console.error("Error sending chat message:", error);
        return "Sorry, I'm having trouble connecting. Please try again in a moment.";
    }
}