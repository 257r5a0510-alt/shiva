
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
  Terminal,
  TrendingUp,
  AlertTriangle,
  Brain,
  Fingerprint,
  GanttChartSquare,
  Download,
  BellRing,
  Eye,
  MapPin,
  Clock,
  Activity
} from 'lucide-react';

interface AIAssistantProps {
  violations: ViolationRecord[];
}

const SUGGESTED_QUESTIONS = [
  "Summarize today's Hyderabad violation trends",
  "Which area is highest risk right now?",
  "Predict evening peak violation zones",
  "Show repeat offenders in Madhapur",
  "Explain why vehicle HR52G4940 was flagged",
  "What violation type is increasing this week?",
  "Generate enforcement strategy for LB Nagar",
  "Compare this week vs last week violations",
  "Which time slot has highest signal jumping?",
  "Detect anomaly in last 2 hours"
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
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] bg-slate-50 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col border-r border-slate-200">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                Intelligence Hub
                <span className="bg-green-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>
              </h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Neural Analysis Engine • v3.5</p>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase font-black">Synced Records</p>
              <p className="text-xs font-bold">{violations.length}</p>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase font-black">AI Latency</p>
              <p className="text-xs font-bold">18ms</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {msg.role === 'user' ? <History size={12} /> : <Sparkles size={12} />}
                </div>
                <div className={`p-3 rounded-xl shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' 
                    : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  <div className="prose prose-sm max-w-none text-inherit font-medium leading-relaxed text-[13px]">
                    {msg.text.split('\n').map((line, j) => (
                      <p key={j} className={line.startsWith('-') || line.startsWith('*') ? 'ml-3' : 'mb-1'}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-slate-200 p-3 rounded-xl rounded-tl-none flex gap-2 items-center">
                <Terminal size={14} className="text-blue-500 animate-spin" />
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Processing forensic query...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Questions Dock */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button 
              key={idx}
              onClick={() => handleAskAI(q)}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-[9px] font-black text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all uppercase tracking-wider flex items-center gap-1.5"
            >
              <ShieldQuestion size={10} />
              {q}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center gap-2">
            <div className="absolute left-3.5 text-slate-400">
              <MessageSquare size={16} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              placeholder="Inquire about Hyderabad traffic trends..."
              className="flex-1 pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm text-slate-800"
            />
            <button
              onClick={() => handleAskAI()}
              disabled={loading || !input.trim()}
              className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black disabled:opacity-30 transition-all shadow-lg active:scale-95 group"
            >
              <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Modules Sidebar */}
      <div className="w-full lg:w-[320px] bg-white overflow-y-auto no-scrollbar p-4 space-y-5">
        {/* A. Real-Time Violation Insights */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <TrendingUp size={16} className="text-blue-600" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Insights</h4>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Live Trend</p>
              <p className="text-xs font-bold text-slate-700">12% increase in signal jumps</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Top Zones</p>
              <div className="flex flex-wrap gap-1.5">
                {['Madhapur', 'Gachibowli'].map(zone => (
                  <span key={zone} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[8px] font-black uppercase">{zone}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* B. Predictive Risk Analysis */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <AlertTriangle size={16} className="text-amber-500" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Predictive</h4>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-amber-700 uppercase">6hr Forecast</span>
              <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-md text-[8px] font-black">HIGH</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-amber-600" />
                <p className="text-[10px] font-bold text-amber-900">Peak: 18:30 - 20:00</p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-amber-600" />
                <p className="text-[10px] font-bold text-amber-900">Hotspot: Mehdipatnam</p>
              </div>
            </div>
          </div>
        </section>

        {/* C. AI Explainability Panel */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Brain size={16} className="text-indigo-600" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Explain</h4>
          </div>
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
            <p className="text-[10px] font-medium text-indigo-900 leading-relaxed italic">"Violation flagged due to lane boundary overlap &gt;40%."</p>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-black text-indigo-700 uppercase">
                <span>OCR</span>
                <span>98.2%</span>
              </div>
              <div className="w-full h-1 bg-indigo-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-[98%]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* D. Pattern Intelligence */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-slate-900">
            <Fingerprint size={16} className="text-emerald-600" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Patterns</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-[8px] font-black text-emerald-800 uppercase">Repeaters</p>
              <p className="text-base font-black text-emerald-900">24</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-[8px] font-black text-emerald-800 uppercase">Clusters</p>
              <p className="text-base font-black text-emerald-900">08</p>
            </div>
          </div>
        </section>

        {/* E. Quick Action Controls */}
        <section className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-900">
            <Zap size={16} className="text-blue-600" />
            <h4 className="text-[10px] font-black uppercase tracking-widest">Actions</h4>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all group">
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><BellRing size={12} /> Alert</span>
              <Zap size={12} className="group-hover:scale-110 transition-transform" />
            </button>
            <button className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl hover:bg-slate-50 transition-all group">
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><Download size={12} /> Export</span>
              <Download size={12} className="group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>
        </section>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AIAssistant;
