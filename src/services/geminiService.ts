import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY as string 
});

const translationCache: Record<string, string> = {};

export const translateLocation = async (location: string): Promise<string> => {
  if (translationCache[location]) return translationCache[location];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following location name from a travel itinerary to Korean for searching on Naver Maps. Only return the Korean name, nothing else. Location: "${location}"`,
    });

    const result = (response.text?.trim() || location).replace(/^["']|["']$/g, '');
    translationCache[location] = result;
    return result;
  } catch (error) {
    console.error("Gemini translation error:", error);
    return location;
  }
};

const detailsCache: Record<string, string> = {};

export const getLocationDetails = async (location: string): Promise<string> => {
  if (!location) return '';
  if (detailsCache[location]) return detailsCache[location];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `For the location "${location}" in South Korea, provide exactly the administrative district (Gu) and the nearest Seoul subway station in Traditional Chinese. Format: "[District] · [Subway Station]". For example: "麻浦區 · 弘大入口站". Return only this string, nothing else.`,
    });

    const result = response.text?.trim() || '';
    detailsCache[location] = result;
    return result;
  } catch (error) {
    console.error("Gemini details error:", error);
    return "";
  }
};
