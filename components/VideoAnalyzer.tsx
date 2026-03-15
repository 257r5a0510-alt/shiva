
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Video, 
  Upload, 
  Play, 
  Pause, 
  Activity, 
  Zap, 
  Loader2, 
  AlertCircle,
  Camera,
  Layers,
  BarChart2,
  Cpu,
  History as HistoryIcon,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Clock,
  Sparkles,
  FileText,
  ShieldAlert,
  RotateCcw,
  RotateCw
} from 'lucide-react';
import { analyzeTrafficVideoFrame, analyzeVideoUnderstanding } from '../services/ai';
import { ViolationRecord, WeatherState, Severity, AdvancedAIResponse, AdvancedAIVehicle } from '../types';
import { createForensicRecord } from '../services/simulator';

interface VideoAnalyzerProps {
  weather: WeatherState;
  onViolationDetected: (v: ViolationRecord) => void;
}

const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ weather, onViolationDetected }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeepAnalyzing, setIsDeepAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AdvancedAIResponse | null>(null);
  const [deepNarrative, setDeepNarrative] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [frameBuffer, setFrameBuffer] = useState<string[]>([]);
  const [trackingHistory, setTrackingHistory] = useState<Record<string, any[]>>({});
  const [collisionCounter, setCollisionCounter] = useState<number>(0);

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
      setDeepNarrative(null);
      setEventLog([]);
      setFrameBuffer([]);
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
      // Performance Optimization: Resize frames for faster inference
      const targetWidth = 640;
      const targetHeight = 360;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const base64Image = canvas.toDataURL('image/jpeg', 0.7); // Lower quality for speed

      setFrameBuffer(prev => [...prev.slice(-4), base64Image]);

      setIsAnalyzing(true);
      const result = await analyzeTrafficVideoFrame(base64Image, weather);
      
      if (result) {
        // Temporal Motion Analysis Logic
        const newTrackingHistory = { ...trackingHistory };
        let confirmedCollision = false;

        result.vehicles?.forEach(v => {
          if (!newTrackingHistory[v.id]) newTrackingHistory[v.id] = [];
          newTrackingHistory[v.id].push({ speed: v.speed_estimated_kmph, bbox: v.bbox, timestamp: Date.now() });
          if (newTrackingHistory[v.id].length > 5) newTrackingHistory[v.id].shift();

          // Detect sudden deceleration (>50% drop)
          const history = newTrackingHistory[v.id];
          if (history.length >= 2) {
            const prev = history[history.length - 2];
            const curr = v;
            
            // Deceleration check
            if (prev.speed > 20 && curr.speed_estimated_kmph < prev.speed * 0.5) {
              v.status = 'abnormal';
            }

            // Direction change check (centroid movement)
            const prevCenter = { x: (prev.bbox[0] + prev.bbox[2]) / 2, y: (prev.bbox[1] + prev.bbox[3]) / 2 };
            const currCenter = { x: (curr.bbox[0] + curr.bbox[2]) / 2, y: (curr.bbox[1] + curr.bbox[3]) / 2 };
            const dx = currCenter.x - prevCenter.x;
            const dy = currCenter.y - prevCenter.y;
            
            if (history.length >= 3) {
              const pprev = history[history.length - 3];
              const pprevCenter = { x: (pprev.bbox[0] + pprev.bbox[2]) / 2, y: (pprev.bbox[1] + pprev.bbox[3]) / 2 };
              const pdx = prevCenter.x - pprevCenter.x;
              const pdy = prevCenter.y - pprevCenter.y;
              
              const dot = dx * pdx + dy * pdy;
              const mag1 = Math.sqrt(dx*dx + dy*dy);
              const mag2 = Math.sqrt(pdx*pdx + pdy*pdy);
              if (mag1 > 1 && mag2 > 1) {
                const cosTheta = dot / (mag1 * mag2);
                if (cosTheta < 0.5) { // > 60 degree turn
                  v.status = 'abnormal';
                }
              }
            }
          }
        });

        const vehicles = result.vehicles || [];
        for (let i = 0; i < vehicles.length; i++) {
          for (let j = i + 1; j < vehicles.length; j++) {
            const v1 = vehicles[i];
            const v2 = vehicles[j];
            const isOverlapping = !(v1.bbox[2] < v2.bbox[0] || v1.bbox[0] > v2.bbox[2] || v1.bbox[3] < v2.bbox[1] || v1.bbox[1] > v2.bbox[3]);
            if (isOverlapping) {
              // Potential collision
            }
          }
        }

        setTrackingHistory(newTrackingHistory);

        // Confirm collision only if overlap persists for 3+ frames (simulated via AI result + counter)
        if (result.collision_detected) {
          setCollisionCounter(prev => prev + 1);
          if (collisionCounter >= 2) { // 3rd frame
            confirmedCollision = true;
          }
        } else {
          setCollisionCounter(0);
        }

        setAnalysisResult({ ...result, collision_detected: confirmedCollision });

        if (confirmedCollision) {
          result.vehicles_involved?.forEach(vehId => {
            const forensicRecord = createForensicRecord(
              'ACCIDENT_INVOLVED',
              `Collision confirmed involving tracked ID ${vehId}. Confidence: ${((result.collision_confidence || 0) * 100).toFixed(1)}%.`,
              Severity.HIGH,
              base64Image
            );
            onViolationDetected(forensicRecord);
          });

          setEventLog(prev => [
            { 
              type: 'accident', 
              description: result.warning_message || `⚠ ACCIDENT CONFIRMED (${((result.collision_confidence || 0) * 100).toFixed(1)}%)`, 
              severity: 'high', 
              timestamp: Date.now() 
            }, 
            ...prev
          ].slice(0, 50));
        }
      }
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, isPlaying, weather, isRateLimited, onViolationDetected, trackingHistory, collisionCounter]);

  const handleDeepAudit = async () => {
    if (frameBuffer.length === 0) return;
    setIsDeepAnalyzing(true);
    const narrative = await analyzeVideoUnderstanding(frameBuffer);
    setDeepNarrative(narrative);
    setIsDeepAnalyzing(false);
  };

  useEffect(() => {
    let timer: number;
    if (isPlaying && !isAnalyzing && !isRateLimited) {
      // Real-time optimization: Process every 2 seconds
      timer = window.setInterval(captureAndAnalyze, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isAnalyzing, captureAndAnalyze, isRateLimited]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vision Intelligence Unit</h2>
          <p className="text-slate-500 font-medium italic">Advanced collision detection and tracking IDs.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Upload size={18} /> Load Analytics Stream
          </button>
          <input type="file" ref={fileInputRef} onChange={handleVideoUpload} className="hidden" accept="video/*" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 rounded-[3rem] overflow-hidden aspect-video relative shadow-2xl border-4 border-white group">
            {videoUrl ? (
              <>
                <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" onTimeUpdate={(e) => setProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)} loop />
                
                <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white font-mono text-[10px] space-y-1">
                         <div className="flex items-center gap-2 text-blue-400">
                            <Camera size={12} className={isPlaying ? "animate-pulse" : ""} /> {isPlaying ? 'LIVE_STREAM_v3.0' : 'STREAM_PAUSED'}
                         </div>
                         <div>FR_RATE: 30 FPS</div>
                         <div className="flex items-center gap-1.5 text-blue-300">
                            <Cpu size={10} /> CPU_OPTIMIZED_MODE
                         </div>
                         <div className={isAnalyzing ? "text-amber-400" : "text-green-400"}>{isAnalyzing ? "NEURAL_PROCESSING..." : "SYS_IDLE_READY"}</div>
                      </div>
                      
                      {analysisResult?.collision_detected && (
                        <div className="bg-red-600/90 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-white/20 text-white font-black text-xs animate-pulse flex flex-col items-center gap-1 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                          <div className="flex items-center gap-3">
                            <ShieldAlert size={20} /> ⚠ ACCIDENT DETECTED
                          </div>
                          <div className="text-[10px] opacity-80 uppercase tracking-widest">Collision Confirmed</div>
                        </div>
                      )}
                   </div>

                   {/* Collision Zone Box - User requested RED for accidents */}
                   {analysisResult?.collision_detected && analysisResult.collision_zone_coordinates?.length === 4 && (
                     <div 
                       className="absolute border-4 border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse"
                       style={{ 
                         left: `${analysisResult.collision_zone_coordinates[0]}%`, 
                         top: `${analysisResult.collision_zone_coordinates[1]}%`, 
                         width: `${analysisResult.collision_zone_coordinates[2] - analysisResult.collision_zone_coordinates[0]}%`, 
                         height: `${analysisResult.collision_zone_coordinates[3] - analysisResult.collision_zone_coordinates[1]}%` 
                       }}
                     >
                        <div className="absolute -top-6 left-0 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-t uppercase tracking-tighter">
                          ACCIDENT DETECTED
                        </div>
                     </div>
                   )}

                   {analysisResult?.vehicles?.map((v: AdvancedAIVehicle) => {
                      if (!v.bbox || v.bbox.length !== 4) return null;
                      const isInvolved = analysisResult.collision_detected && analysisResult.vehicles_involved?.includes(v.id);
                      // User requested BLUE for vehicles
                      return (
                        <div 
                          key={v.id}
                          className={`absolute border-2 ${isInvolved ? 'border-red-600 border-4 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'border-blue-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]'}`}
                          style={{ left: `${v.bbox[0]}%`, top: `${v.bbox[1]}%`, width: `${v.bbox[2] - v.bbox[0]}%`, height: `${v.bbox[3] - v.bbox[1]}%` }}
                        >
                           <div className={`absolute -top-6 left-0 flex items-center gap-1 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-t border-t border-x border-white/20 uppercase tracking-tighter ${isInvolved ? 'bg-red-600/80' : 'bg-blue-600/80'}`}>
                             {v.type} {v.plate ? `| ${v.plate}` : ''}
                           </div>
                        </div>
                      );
                   })}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex items-center gap-2">
                     <button onClick={() => seek(-10)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <RotateCcw size={18} />
                     </button>
                     <button onClick={togglePlay} className="p-4 bg-white rounded-full text-slate-900 shadow-xl hover:scale-110 transition-transform">
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                     </button>
                     <button onClick={() => seek(10)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <RotateCw size={18} />
                     </button>
                   </div>
                   <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress}%` }}></div>
                   </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => fileInputRef.current?.click()}>
                 <div className="p-10 rounded-full bg-slate-900 border-2 border-slate-800 border-dashed"><Video size={64} className="text-slate-700" /></div>
                 <p className="font-black uppercase tracking-[0.5em] text-slate-700 text-center">Load Video Stream</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl flex-1 flex flex-col overflow-hidden">
              <h3 className="text-xl font-black flex items-center justify-between mb-8">
                <div className="flex items-center gap-3"><BarChart2 className="text-blue-400" size={28} /> Diagnostics</div>
                {(isAnalyzing || isDeepAnalyzing) && <Loader2 size={18} className="animate-spin text-blue-400" />}
              </h3>

              {analysisResult ? (
                <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-2">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                          <Activity size={14}/><span className="text-[9px] font-black uppercase">Alert Level</span>
                        </div>
                        <span className={`text-xl font-black ${analysisResult.alert_level === 'HIGH' ? 'text-red-500' : analysisResult.alert_level === 'MEDIUM' ? 'text-amber-500' : 'text-green-500'}`}>{analysisResult.alert_level || 'LOW'}</span>
                      </div>
                      <div className="p-5 bg-white/5 border border-white/10 rounded-[2rem]">
                        <div className="flex items-center gap-2 mb-2 text-amber-400">
                          <Layers size={14}/><span className="text-[9px] font-black uppercase">Targets</span>
                        </div>
                        <span className="text-xl font-black">{analysisResult.vehicles?.length || 0}</span>
                      </div>
                   </div>

                   <button onClick={handleDeepAudit} disabled={isDeepAnalyzing || frameBuffer.length === 0} className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] shadow-xl text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                     {isDeepAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Deep Narrative Audit
                   </button>

                   {deepNarrative && (
                     <div className="p-6 bg-indigo-950/40 rounded-[2.5rem] border border-indigo-500/30 animate-in zoom-in duration-500">
                        <div className="flex items-center gap-3 text-indigo-400 mb-3"><FileText size={18} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">High-Level Narrative</span></div>
                        <p className="text-xs font-medium text-indigo-100 leading-relaxed">{deepNarrative}</p>
                     </div>
                   )}

                   <div className="flex-1 flex flex-col space-y-4 pt-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><HistoryIcon size={14} /> Incident Log</h4>
                      <div className="flex-1 bg-black/40 rounded-[2.5rem] p-4 border border-white/5 overflow-y-auto no-scrollbar space-y-2">
                         {eventLog.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase italic">No critical events</div>
                         ) : (
                            eventLog.map((log, idx) => (
                               <div key={idx} className="p-3 rounded-2xl border bg-red-500/10 border-red-500/20 flex items-start gap-3 animate-in slide-in-from-right-4">
                                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                  <div>
                                     <span className="text-[8px] font-mono opacity-50">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                     <p className="text-[10px] font-bold mt-1 leading-tight">{log.description}</p>
                                  </div>
                               </div>
                            ))
                         )}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                   <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 animate-pulse"><Layers size={32} /></div>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting Video Input...</p>
                </div>
              )}
           </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoAnalyzer;
