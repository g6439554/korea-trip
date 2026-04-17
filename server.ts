import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Gemini with the official SDK
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

  app.use(express.json());

  // API Route: Translation
  app.post("/api/translate", async (req, res) => {
    const { location } = req.body;
    if (!location) return res.status(400).json({ error: "Location is required" });

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `Translate the following location name from a travel itinerary to Korean for searching on Naver Maps. Only return the Korean name, nothing else. Location: "${location}"`;
      
      const result = await model.generateContent(prompt);
      const translated = (result.response.text() || location).replace(/^["']|["']$/g, '').trim();
      
      res.json({ translated });
    } catch (error) {
      console.error("Gemini translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // API Route: Location Details
  app.post("/api/location-details", async (req, res) => {
    const { location } = req.body;
    if (!location) return res.status(400).json({ error: "Location is required" });

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const prompt = `For the location "${location}" in South Korea, provide exactly the administrative district (Gu) and the nearest Seoul subway station in Traditional Chinese. Format: "[District] · [Subway Station]". For example: "麻浦區 · 弘大入口站". Return only this string, nothing else.`;
      
      const result = await model.generateContent(prompt);
      const details = (result.response.text() || "").trim();
      
      res.json({ details });
    } catch (error) {
      console.error("Gemini details error:", error);
      res.status(500).json({ error: "Failed to fetch details" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
