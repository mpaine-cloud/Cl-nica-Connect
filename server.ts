import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload size to handle extensive chat histories
  app.use(express.json({ limit: '10mb' }));

  // AI Route implementation (moved from frontend to protect API keys)
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, systemInstruction, newMessage } = req.body;
      
      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key de Gemini no configurada en el servidor.");
      }
      // Limpiar comillas, saltos de línea o espacios invisibles que suelen colarse al copiar en Render
      apiKey = apiKey.replace(/['"\s]/g, '');

      const ai = new GoogleGenAI({ apiKey });
      
      // Initialize chat with full history to optimize quota usage (1 request instead of N+1)
      const chat = ai.chats.create({
        model: 'gemini-1.5-flash',
        history: messages.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      const response = await chat.sendMessage({ message: newMessage });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Error calling Gemini:', error);
      res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // @ts-ignore
    app.use(vite.middlewares);
  } else {
    // Static serving for production
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
