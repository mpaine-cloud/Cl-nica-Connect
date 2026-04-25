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
      
      const history = messages.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // --- MECANISMO DE REINTENTO (RETRY LOGIC) ---
      let attempts = 0;
      const maxAttempts = 2;
      let lastError: any;

      while (attempts < maxAttempts) {
        try {
          const chat = ai.chats.create({
            model: 'gemini-2.0-flash',
            history,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });

          const response = await chat.sendMessage({ message: newMessage });
          return res.json({ text: response.text });
        } catch (error: any) {
          lastError = error;
          if (error.message?.includes('429') || error.status === 'RESOURCE_EXHAUSTED') {
            attempts++;
            console.warn(`[AI] Reintento ${attempts}/${maxAttempts} debido a cuota...`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
          } else {
            break; // Si es otro error (404, etc), no reintentar
          }
        }
      }

      throw lastError;
    } catch (error: any) {
      console.error('--- ERROR FINAL LLAMANDO A GEMINI ---');
      console.error('Mensaje:', error.message);
      res.status(error.status === 'RESOURCE_EXHAUSTED' ? 429 : 500).json({ error: error.message || "Error interno" });
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
