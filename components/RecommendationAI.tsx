
import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, ChevronRight, Construction, Signal, Info, Share2 } from 'lucide-react';
import { getSmartRecommendations } from '../services/ai';
import { ViolationRecord } from '../types';

interface RecommendationAIProps {
  violations: ViolationRecord[];
}

const RecommendationAI: React.FC<RecommendationAIProps> = ({ violations }) => {
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTips = async () => {
      setLoading(true);
      const res = await getSmartRecommendations(violations.slice(0, 10));
      setTips(res);
      setLoading(false);
    };
    if (violations.length > 0) fetchTips();
  }, [violations]);

  const handleShareTip = (tip: string) => {
    const shareData = {
      title: 'Infrastructure Strategy Insight',
      text: `Proposed Infrastructure Recommendation:\n"${tip}"\n- Generated via TrafficEye AI Core.`,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert('Strategy copied to clipboard.');
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
         <Bot size={120} />
      </div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-200">
           <Bot size={28} />
        </div>
        <div>
           <h3 className="text-2xl font-black text-slate-900">Infrastructure Strategy</h3>
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
             <Sparkles size={12} className="text-amber-500" /> Neural Policy Generator
           </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
             {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : (
          tips.map((tip, idx) => (
            <div key={idx} className="group p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex items-start gap-4">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {idx % 2 === 0 ? <Construction size={18}/> : <Signal size={18}/>}
               </div>
               <div className="flex-1">
                  <p className="text-sm font-bold text-slate-700 leading-snug">{tip}</p>
                  <div className="mt-3 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1">
                      Add to Civil Workplan <ChevronRight size={12}/>
                    </button>
                    <button 
                      onClick={() => handleShareTip(tip)}
                      className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-600"
                    >
                      <Share2 size={12}/> Share Strategy
                    </button>
                  </div>
               </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-6 bg-slate-900 rounded-[2rem] text-white flex items-center gap-6">
         <div className="p-3 bg-white/10 rounded-2xl text-amber-400">
            <Info size={24} />
         </div>
         <p className="text-xs font-bold leading-relaxed text-slate-400">
           Policy recommendations are shared across modules and synced with the <span className="text-white">Command Intelligence Hub</span>.
         </p>
      </div>
    </div>
  );
};

export default RecommendationAI;
