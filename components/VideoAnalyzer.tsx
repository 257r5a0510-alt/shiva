
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Video, 
  Upload, 
  Play, 
  Pause, 
  Activity, 
  Zap, 
  ShieldAlert, 
  Loader2, 
  AlertCircle,
  Camera,
  Layers,
  BarChart2,
  Cpu,
  History as HistoryIcon,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  XCircle,
  Info,
  RefreshCw,
  Clock,
  Share2
} from 'lucide-react';
import { analyzeTrafficVideoFrame, ForensicReport, Incident } from '../services/ai';
import { ViolationRecord, WeatherState, Severity } from '../types';
import { createForensicRecord } from '../services/simulator';

interface VideoAnalyzerProps {
  weather: WeatherState;
  onViolationDetected: (v: ViolationRecord) => void;
}

const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ weather, onViolationDetected }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ForensicReport | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eventLog, setEventLog] = useState<Incident[]>([]);
  const [historySummary, setHistorySummary] = useState<string>('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [analysisInterval, setAnalysisInterval] = useState(8000);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setAnalysisResult(null);
      setEventLog([]);
      setHistorySummary('');
      setProgress(0);
      setIsPlaying(false);
      setIsRateLimited(false);
    }
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing || !isPlaying || isRateLimited) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      setIsAnalyzing(true);
      const result = await analyzeTrafficVideoFrame(base64Image, weather, historySummary);
      
      if (result) {
        if (result.isRateLimited) {
          setIsRateLimited(true);
          setAnalysisInterval(15000);
        } else {
          setAnalysisResult(result);
          setHistorySummary(result.summary);

          if (result.incidents && result.incidents.length > 0) {
            result.incidents.forEach(inc => {
              // Share incident with the global App state
              const forensicRecord = createForensicRecord(
                inc.type.toUpperCase(),
                inc.description,
                inc.severity.toUpperCase() as Severity,
                base64Image
              );
              onViolationDetected(forensicRecord);
            });

            setEventLog(prev => {
              const newIncidents = result.incidents.filter(ni => 
                !prev.some(pi => pi.description === ni.description && (Date.now() - pi.timestamp < 10000))
              ).map(i => ({ ...i, timestamp: Date.now() }));
              return [...newIncidents, ...prev].slice(0, 50);
            });
          }
        }
      }
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isPlaying, weather, historySummary, isRateLimited, onViolationDetected]);

  useEffect(() => {
    let timer: number;
    if (isPlaying && !isAnalyzing && !isRateLimited) {
      timer = window.setInterval(() => {
        captureAndAnalyze();
      }, analysisInterval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isAnalyzing, captureAndAnalyze, analysisInterval, isRateLimited]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const resetQuota = () => {
    setIsRateLimited(false);
    setAnalysisInterval(8000);
    captureAndAnalyze();
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eventLog]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vision Intelligence Unit</h2>
          <p className="text-slate-500 font-medium italic">Autonomous collision detection and erratic motion analysis.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Upload size={18} /> Load Analytics Stream
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleVideoUpload} 
            className="hidden" 
            accept="video/*" 
          />
        </div>
      </header>

      {isRateLimited && (
        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2.5rem] flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
           <div className="flex items-center gap-6">
              <div className="p-4 bg-amber-200 rounded-3xl text-amber-700 animate-pulse">
                <Clock size={28} />
              </div>
              <div>
                <h4 className="text-amber-900 font-black uppercase text-[10px] tracking-[0.2em] mb-1">Quota Warning</h4>
                <p className="text-sm font-bold text-amber-800 italic">"Neural link throttled by Gemini API rate limits. Detection paused to allow link recovery."</p>
              </div>
           </div>
           <button 
            onClick={resetQuota}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
           >
              <RefreshCw size={14} /> Resume Sync
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 rounded-[3rem] overflow-hidden aspect-video relative shadow-2xl border-4 border-white group">
            {videoUrl ? (
              <>
                <video 
                  ref={videoRef} 
                  src={videoUrl} 
                  className="w-full h-full object-contain"
                  onTimeUpdate={(e) => setProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)}
                  loop
                />
                
                <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white font-mono text-[10px] space-y-1">
                         <div className="flex items-center gap-2 text-blue-400">
                            <Camera size={12} className={isPlaying ? "animate-pulse" : ""} /> {isPlaying ? 'LIVE_STREAM_v2.4' : 'STREAM_PAUSED'}
                         </div>
                         <div>FR_RATE: 30 FPS</div>
                         <div className={isAnalyzing ? "text-amber-400" : isRateLimited ? "text-red-400" : "text-green-400"}>
                           {isAnalyzing ? "NEURAL_PROCESSING..." : isRateLimited ? "QUOTA_EXCEEDED_THROTTLED" : "SYS_IDLE_READY"}
                         </div>
                      </div>
                      
                      {analysisResult && analysisResult.riskScore > 50 && (
                        <div className="bg-red-600/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white font-black text-xs animate-pulse flex items-center gap-2">
                          <AlertTriangle size={14} /> HIGH_RISK_DETECTED
                        </div>
                      )}
                   </div>

                   {analysisResult && (
                     <div className="absolute inset-0">
                       {analysisResult.detections.map((d, i) => {
                         const color = d.behavior === 'braking' ? 'border-red-500' : 
                                       d.behavior === 'accelerating' ? 'border-green-500' : 
                                       'border-blue-500';
                         return (
                           <div 
                            key={`${d.id}-${i}`}
                            className={`absolute border-2 ${color} shadow-lg transition-all duration-500`}
                            style={{ left: `${d.box[0]}%`, top: `${d.box[1]}%`, width: `${d.box[2]}%`, height: `${d.box[3]}%` }}
                           >
                              <div className="absolute -top-5 left-0 flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-1.5 rounded-t border-t border-x border-white/20 uppercase tracking-tighter">
                                {d.label} {d.speed ? `• ${d.speed}km/h` : ''}
                              </div>
                           </div>
                         );
                       })}
                     </div>
                   )}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={togglePlay} className="p-4 bg-white rounded-full text-slate-900 shadow-xl hover:scale-110 transition-transform">
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                   </button>
                   <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }}></div>
                   </div>
                   <div className="text-white font-mono text-xs">
                      {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="text-blue-400" />}
                   </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => fileInputRef.current?.click()}>
                 <div className="p-10 rounded-full bg-slate-900 border-2 border-slate-800 border-dashed">
                    <Video size={64} className="text-slate-700" />
                 </div>
                 <p className="font-black uppercase tracking-[0.5em] text-slate-700 text-center">Drag Video Analytics Source<br/>to Start Processing</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-colors">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Cpu size={24}/></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Logic</p>
                   <p className="text-sm font-black text-slate-900">Flash Vision 3.0</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-colors">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl group-hover:bg-amber-600 group-hover:text-white transition-all"><Activity size={24}/></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Cycle</p>
                   <p className="text-sm font-black text-slate-900">{analysisInterval / 1000}s Polling</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-red-200 transition-colors">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all"><Share2 size={24}/></div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Broadcast Status</p>
                   <p className="text-sm font-black text-slate-900">Sharing Active</p>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6 h-[calc(100%-4px)]">
           <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xl font-black flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <BarChart2 className="text-blue-400" size={28} /> Diagnostics
                </div>
                {isAnalyzing && <Loader2 size={18} className="animate-spin text-blue-400" />}
              </h3>

              {!analysisResult ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 animate-pulse">
                      <Layers size={32} />
                   </div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                     Syncing with feed for<br/>temporal analysis...
                   </p>
                </div>
              ) : (
                <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-2">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-2 text-red-400">
                          <AlertTriangle size={14}/>
                          <span className="text-[9px] font-black uppercase">Risk Score</span>
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black">{analysisResult.riskScore}</span>
                          <span className="text-[10px] mb-1 opacity-50">/100</span>
                        </div>
                      </div>
                      <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                          <Activity size={14}/>
                          <span className="text-[9px] font-black uppercase">Aggression</span>
                        </div>
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-black">{analysisResult.aggressionScore}</span>
                          <span className="text-[10px] mb-1 opacity-50">%</span>
                        </div>
                      </div>
                   </div>

                   <div className="p-6 bg-blue-600 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-125 transition-transform">
                        <Zap size={80} />
                      </div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-100 mb-2">Current System Status</h4>
                      <p className="text-sm font-black leading-tight italic">
                        "{analysisResult.summary}"
                      </p>
                   </div>

                   <div className="p-6 bg-slate-800 rounded-[2.5rem] border border-white/5">
                      <div className="flex items-center gap-3 text-green-400 mb-3">
                         <AlertCircle size={18} />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">City Planning Insight</span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">
                        {analysisResult.infrastructureAdvice}
                      </p>
                   </div>

                   <div className="flex-1 flex flex-col space-y-4 pt-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <HistoryIcon size={14} /> Critical Incident Log
                      </h4>
                      <div className="flex-1 bg-black/40 rounded-[2.5rem] p-4 border border-white/5 overflow-y-auto no-scrollbar space-y-2">
                         {eventLog.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase italic">
                               <CheckCircle size={12} className="mr-2 text-green-600" /> No accidents detected
                            </div>
                         ) : (
                            eventLog.map((log, idx) => (
                               <div 
                                key={idx} 
                                className={`p-3 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-right-4 ${
                                  log.severity === 'high' ? 'bg-red-500/20 border-red-500/30' : 
                                  log.severity === 'medium' ? 'bg-amber-500/20 border-amber-500/30' : 
                                  'bg-blue-500/10 border-blue-500/20'
                                }`}
                               >
                                  <div className="shrink-0 mt-0.5">
                                     {log.type === 'accident' ? <XCircle size={14} className="text-red-500" /> : 
                                      log.type === 'near-miss' ? <AlertTriangle size={14} className="text-amber-500" /> : 
                                      <Info size={14} className="text-blue-500" />}
                                  </div>
                                  <div>
                                     <div className="flex justify-between items-center gap-4">
                                        <span className="text-[9px] font-black uppercase tracking-tighter opacity-80">{log.type.replace('_', ' ')}</span>
                                        <span className="text-[8px] font-mono opacity-50">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                     </div>
                                     <p className="text-[10px] font-bold mt-1 leading-tight">{log.description}</p>
                                  </div>
                               </div>
                            ))
                         )}
                         <div ref={logEndRef} />
                      </div>
                   </div>
                </div>
              )}
           </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default VideoAnalyzer;
