import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeItinerary(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following travel itinerary and extract key information. 
    Categorize items into: Food, Spot, Transportation, or Shopping.
    Identify "Must-eat", "Must-buy", "Booking IDs", and "Spot Stories".
    Return the result as a structured JSON array of days.
    
    Itinerary:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            title: { type: Type.STRING },
            weather: {
              type: Type.OBJECT,
              properties: {
                temp: { type: Type.STRING },
                condition: { type: Type.STRING },
                icon: { type: Type.STRING }
              }
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING, enum: ["Food", "Spot", "Trans", "Shop"] },
                  time: { type: Type.STRING },
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  highlights: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, enum: ["must-eat", "must-buy", "booking", "story", "tip"] },
                        text: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
