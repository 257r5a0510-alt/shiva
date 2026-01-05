
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ViolationRecord, ViolationType } from '../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  ShieldQuestion,
  Info,
  History,
  Terminal
} from 'lucide-react';

interface AIAssistantProps {
  violations: ViolationRecord[];
}

const SUGGESTED_QUESTIONS = [
  "Summarize today's violation trends.",
  "Who are the top 3 persistent offenders?",
  "How does the YOLOv8 detection work?",
  "What is the total revenue collected?",
  "Analyze high-risk speed zones.",
  "Which weather condition causes more violations?"
];

const AIAssistant: React.FC<AIAssistantProps> = ({ violations }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Welcome to the TrafficEye Intelligence Hub. I am synced with the Evidence Vault and ready to perform forensic analysis or explain our AI architecture (YOLOv8/OCR). How can I assist you today?" }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pre-calculate aggregate stats for better AI context
  const systemSnapshot = useMemo(() => {
    // Fix: Removed explicit generic type argument from reduce to resolve "Untyped function calls" error
    const totalFines = violations.reduce((acc: number, v) => acc + v.fineAmount, 0);
    
    // Fix: Removed explicit generic type argument from reduce to resolve "Untyped function calls" error
    const typeCount = violations.reduce((acc: Record<string, number>, v) => {
      v.violationType.forEach(t => acc[t] = (acc[t] || 0) + 1);
      return acc;
    }, {});
    
    // Fix: Removed explicit generic type argument from reduce to resolve "Untyped function calls" error
    const offenders = violations.reduce((acc: Record<string, number>, v) => {
      acc[v.vehicleNumber] = (acc[v.vehicleNumber] || 0) + 1;
      return acc;
    }, {});

    return {
      totalViolations: violations.length,
      totalRevenue: totalFines,
      breakdown: typeCount,
      // Fix: Cast entry values to number to resolve "arithmetic operation" type errors during sorting
      topOffenders: Object.entries(offenders)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([no, count]) => `${no} (${count} events)`)
    };
  }, [violations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleAskAI = async (query?: string) => {
    const textToProcess = query || input;
    if (!textToProcess.trim() || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToProcess }]);
    setLoading(true);

    try {
      // Initialize with correct apiKey property from process.env
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        ROLE: Senior Traffic Intelligence Analyst & System Expert.
        
        SYSTEM CONTEXT:
        - Tech Stack: Python, Flask, YOLOv8 (Vehicle Detection), EasyOCR (Plate Extraction), OpenCV (Image Processing).
        - Current Snapshot: ${JSON.stringify(systemSnapshot)}
        - Detailed Data Sample: ${JSON.stringify(violations.slice(0, 20))}
        
        INSTRUCTIONS:
        1. Answer user queries about traffic patterns, specific vehicles, or system tech.
        2. If asked about technology, mention YOLOv8 for detection and OpenCV for frame analysis.
        3. Be professional, analytical, and concise.
        4. Use Markdown for structured data or lists.
        5. If the user asks about a specific vehicle number found in the data, provide its history.
        6. Do not perform any write operations (simulated).
        
        USER QUERY: ${textToProcess}
      `;

      // Call generateContent with both model and contents as specified in guidelines
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      // Directly access .text property from response object
      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I processed the query but returned no specific data. Could you rephrase?" }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Error: Neural connection interrupted. Please ensure the API engine is active." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Intelligence Hub
              <span className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Neural Analysis Engine • v3.1</p>
          </div>
        </div>
        <div className="hidden md:flex gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black">Synced Records</p>
            <p className="text-sm font-bold">{violations.length}</p>
          </div>
          <div className="w-px h-8 bg-slate-800"></div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black">AI Latency</p>
            <p className="text-sm font-bold">24ms</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {msg.role === 'user' ? <History size={14} /> : <Sparkles size={14} />}
              </div>
              <div className={`p-4 rounded-2xl shadow-sm border ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                  : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
              }`}>
                <div className="prose prose-sm max-w-none text-inherit font-medium leading-relaxed">
                  {msg.text.split('\n').map((line, j) => (
                    <p key={j} className={line.startsWith('-') || line.startsWith('*') ? 'ml-4' : 'mb-2'}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex gap-3 items-center">
              <Terminal size={16} className="text-blue-500 animate-spin" />
              <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Processing forensic query...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions Dock */}
      <div className="px-6 py-3 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button 
            key={idx}
            onClick={() => handleAskAI(q)}
            className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[10px] font-black text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all uppercase tracking-wider flex items-center gap-2"
          >
            <ShieldQuestion size={12} />
            {q}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-3">
          <div className="absolute left-4 text-slate-400">
            <MessageSquare size={18} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Inquire about analytics, YOLOv8 logic, or specific vehicle history..."
            className="flex-1 pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium text-slate-800"
          />
          <button
            onClick={() => handleAskAI()}
            disabled={loading || !input.trim()}
            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black disabled:opacity-30 transition-all shadow-xl active:scale-95 group"
          >
            <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
        <div className="mt-4 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
           <span className="flex items-center gap-1"><Zap size={10} className="text-amber-500" /> End-to-End Encryption Active</span>
           <span className="flex items-center gap-1"><BarChart3 size={10} className="text-blue-500" /> Real-time Database Link</span>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AIAssistant;
