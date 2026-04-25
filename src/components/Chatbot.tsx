import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Send, Bot, User, Loader2, Sparkles, Copy, Check } from 'lucide-react';
import { cn } from '../utils/cn';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const Chatbot: React.FC = () => {
  const { data, filteredData, metrics, filteredMetrics, selectedMonth, selectedYear } = useData();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Soy tu Especialista en Marketing Digital y Control de Gestión. ¿Qué campaña o métrica te gustaría que analicemos hoy para escalar tus resultados?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // --- ALTERNATIVA 3: RESUMEN INTELIGENTE (Cálculos en código) ---
      const sortedByRoas = [...filteredData]
        .filter(c => c.montoInvertido > 0)
        .sort((a, b) => (b.ingresos / b.montoInvertido) - (a.ingresos / a.montoInvertido));
      
      const best = sortedByRoas[0];
      const worst = sortedByRoas[sortedByRoas.length - 1];

      // --- ALTERNATIVA 1: DIETA DE TOKENS (CSV Compacto) ---
      // Formato: Campaña|Leads|Conv|ROAS
      const csvData = filteredData.map(c => 
        `${c.campaign.substring(0, 15)}|${c.leadsIngresados}|${c.leadsConvierten}|${c.montoInvertido > 0 ? (c.ingresos / c.montoInvertido).toFixed(1) : 0}`
      ).join('\n');

      const systemInstruction = `
        Contexto Clínico ${selectedMonth} ${selectedYear}:
        Métricas: ROAS ${metrics.roas.toFixed(1)}, CAC $${metrics.costoPromedioPorCliente.toFixed(0)}, Ingresos $${metrics.totalIngresos.toLocaleString()}.
        Top: ${best ? `${best.campaign} (${(best.ingresos/best.montoInvertido).toFixed(1)}x)` : 'N/A'}.
        Bajo: ${worst ? `${worst.campaign} (${(worst.ingresos/worst.montoInvertido).toFixed(1)}x)` : 'N/A'}.
        
        Datos (Camp|Leads|Conv|ROAS):
        ${csvData}

        Reglas: Eres un experto en marketing. Sé breve, estratégico y usa Markdown.
      `;

      // --- VENTANA DE HISTORIAL (Últimos 6 mensajes para ahorrar tokens) ---
      const historyWindow = messages.slice(-6);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyWindow,
          systemInstruction,
          newMessage: userMessage
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData = await response.json();
      
      setMessages(prev => [...prev, { role: 'model', content: responseData.text || 'Lo siento, no pude generar una respuesta.' }]);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      setMessages(prev => [...prev, { role: 'model', content: 'Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-120px)] md:h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="p-4 bg-indigo-600 text-white flex items-center gap-3 shrink-0">
        <Sparkles className="w-6 h-6" />
        <div>
          <h2 className="font-semibold">Asistente de Gestión (IA)</h2>
          <p className="text-indigo-100 text-sm">Analiza tus métricas con Gemini</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={cn("flex gap-4 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-sm shadow-sm relative group",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-white text-slate-800 border border-slate-100 rounded-tl-none w-full"
            )}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <>
                  <button 
                    onClick={() => handleCopy(msg.content, idx)}
                    className="absolute top-2 right-2 p-1.5 bg-slate-50 text-slate-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200"
                    title="Copiar respuesta"
                  >
                    {copiedIndex === idx ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:text-slate-800 pr-8">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="text-sm text-slate-500">Analizando datos...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre tus métricas (ej. ¿Qué campaña tiene mejor conversión?)"
            className="flex-1 pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-shadow"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
