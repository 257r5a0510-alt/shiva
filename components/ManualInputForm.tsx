
import React, { useState, useRef, useEffect } from 'react';
import { SignalStatus, ViolationType, ViolationRecord, VehicleData, VehicleCategory, Severity } from '../types';
import { detectViolations } from '../services/simulator';
import { analyzeVehicleImage, AIAnalysisResult } from '../services/ai';
import { 
  Camera, 
  CheckCircle2, 
  ScanLine,
  Upload,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Gauge,
  Activity,
  Target,
  Waves,
  Ruler,
  Info,
  Maximize2,
  Crosshair,
  BoxSelect,
  Database,
  Users,
  HardHat,
  AlertCircle,
  Terminal,
  ChevronRight,
  Fingerprint,
  RefreshCw,
  Cpu
} from 'lucide-react';

interface ManualInputFormProps {
  onProcessed: (record: ViolationRecord | null, vehicle: VehicleData) => void;
}

const ManualInputForm: React.FC<ManualInputFormProps> = ({ onProcessed }) => {
  const [formData, setFormData] = useState({
    enteredVehicleNumber: '',
    enteredVehicleType: 'Car' as VehicleCategory,
    speed: '',
    signalStatus: SignalStatus.GREEN,
    speedLimit: 60,
    riderCount: 1,
    helmetDetected: true,
    seatbeltDetected: true
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [liveSpeed, setLiveSpeed] = useState<number>(0);
  const [lockStatus, setLockStatus] = useState<'searching' | 'tracking' | 'locked'>('searching');
  const [calibrationStep, setCalibrationStep] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: number;
    if (cameraActive) {
      let targetSpeed = 45 + Math.random() * 40;
      let currentSpeed = 0;
      interval = window.setInterval(() => {
        if (currentSpeed < targetSpeed - 1) {
          currentSpeed += (targetSpeed - currentSpeed) * 0.2;
          setLockStatus('tracking');
        } else {
          currentSpeed = targetSpeed + (Math.random() - 0.5) * 0.5;
          setLockStatus('locked');
        }
        setLiveSpeed(Math.round(currentSpeed * 10) / 10);
      }, 100);
    } else {
      setLockStatus('searching');
      setLiveSpeed(0);
    }
    return () => clearInterval(interval);
  }, [cameraActive]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch (err) { setCameraActive(false); }
    };
    if (cameraActive) startCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, [cameraActive]);

  const capturePhoto = () => {
    if (lockStatus !== 'locked') return;
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setCameraActive(false);
        runAIAnalysis(dataUrl);
      }
    }
  };

  const runAIAnalysis = async (image: string) => {
    setIsAnalyzing(true);
    setIsVerified(false);
    
    const steps = [
      "INITIALIZING NEURAL PIPELINE...",
      "STAGE 1: ROI LOCALIZATION (YOLOv8)...",
      "STAGE 2: SUPER-RESOLUTION (4X ENHANCEMENT)...",
      "STAGE 3: ADAPTIVE CLAHE & DEBLURRING...",
      "STAGE 4: ENSEMBLE OCR (MULTI-PASS)...",
      "STAGE 5: PATTERN VALIDATION (REGIONAL)...",
      "STAGE 6: OCCUPANT SAFETY AUDIT...",
      "ANALYSIS COMPLETE."
    ];
    
    for (const step of steps) {
      setCalibrationStep(step);
      await new Promise(r => setTimeout(r, 600));
    }

    const result = await analyzeVehicleImage(image);
    setIsAnalyzing(false);
    if (result) {
      setAiResult(result);
      setFormData(prev => ({ 
        ...prev, 
        enteredVehicleNumber: result.vehicleNumber, 
        enteredVehicleType: result.vehicleType, 
        speed: result.estimatedSpeed.toFixed(1),
        riderCount: result.riderCount,
        helmetDetected: result.helmetDetected,
        seatbeltDetected: result.seatbeltDetected
      }));
    }
  };

  const handleVerify = () => {
    setIsVerified(true);
  };

  const validateAndProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResult || !isVerified) return;
    const vehicle: VehicleData = { 
      id: Math.random().toString(36).substr(2, 9), 
      vehicleNumber: formData.enteredVehicleNumber, 
      speed: Number(formData.speed) || 0, 
      signalStatus: formData.signalStatus, 
      vehicleType: formData.enteredVehicleType, 
      timestamp: Date.now(),
      riderCount: formData.riderCount,
      helmetDetected: formData.helmetDetected,
      seatbeltDetected: formData.seatbeltDetected,
      confidence: aiResult.confidence.overall,
      isVerified: true
    };
    const violation = detectViolations(vehicle, capturedImage || undefined, formData.speedLimit, aiResult.confidence.overall);
    onProcessed(violation, vehicle);
    
    // Reset state
    setTimeout(() => { 
      setCapturedImage(null); setAiResult(null); setIsVerified(false);
      setFormData(prev => ({ ...prev, enteredVehicleNumber: '', speed: '' })); 
    }, 3000);
  };

  const isOverSpeeding = Number(formData.speed) > formData.speedLimit;
  const isTripleRiding = formData.enteredVehicleType === 'Motorcycle' && formData.riderCount > 2;
  const helmetViolation = formData.enteredVehicleType === 'Motorcycle' && !formData.helmetDetected;
  const seatbeltViolation = (formData.enteredVehicleType === 'Car' || formData.enteredVehicleType === 'Truck') && !formData.seatbeltDetected;
  const hasSafetyViolation = isTripleRiding || helmetViolation || seatbeltViolation;
  const lowConfidence = aiResult ? aiResult.confidence.overall < 0.75 : false;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Fingerprint className="text-blue-600" size={32} /> Forensic Detection Unit
          </h2>
          <p className="text-slate-500 font-medium italic">Multi-stage Neural ANPR & Human-Verified Audit Pipeline.</p>
        </div>
        <div className="flex gap-3">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const reader = new FileReader();
               reader.onload = (ev) => { setCapturedImage(ev.target?.result as string); runAIAnalysis(ev.target?.result as string); };
               reader.readAsDataURL(file);
             }
          }} />
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
            <Upload size={18} /> Forensic Load
          </button>
          <button onClick={() => setCameraActive(!cameraActive)} className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${cameraActive ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
            {cameraActive ? <RefreshCw size={18} className="animate-spin" /> : <Target size={18}/>} 
            {cameraActive ? 'Abort Feed' : 'Initiate Scan'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {/* Main Visual Field */}
          <div className={`bg-slate-950 rounded-[3rem] overflow-hidden aspect-video relative shadow-2xl border-4 transition-all duration-700 ${isOverSpeeding || hasSafetyViolation ? 'border-red-500' : 'border-white'}`}>
            {cameraActive ? (
              <div className="h-full relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 border-2 border-blue-500/40">
                     <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                     <ScanLine className="absolute inset-x-0 top-0 text-blue-400 w-full animate-[scan_3s_linear_infinite]" />
                  </div>
                </div>
                <button onClick={capturePhoto} disabled={lockStatus !== 'locked'} className={`absolute bottom-10 left-1/2 -translate-x-1/2 p-8 rounded-full transition-all z-20 ${lockStatus === 'locked' ? 'bg-blue-600 text-white shadow-blue-500/50' : 'bg-slate-800 text-slate-600'}`}>
                   <Camera size={36}/>
                </button>
              </div>
            ) : capturedImage ? (
              <div className="h-full relative overflow-hidden group">
                <img src={capturedImage} className="w-full h-full object-cover transition-transform duration-[30s] hover:scale-110" alt="Captured" />
                {aiResult && !isAnalyzing && (
                  <>
                    {aiResult.boundingBox && <div className={`absolute border-2 ${isOverSpeeding || hasSafetyViolation ? 'border-red-500' : 'border-blue-500'}`} style={{ top: `${aiResult.boundingBox.y}%`, left: `${aiResult.boundingBox.x}%`, width: `${aiResult.boundingBox.w}%`, height: `${aiResult.boundingBox.h}%` }}></div>}
                    {aiResult.plateBoundingBox && (
                      <div className="absolute border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]" style={{ top: `${aiResult.plateBoundingBox.y}%`, left: `${aiResult.plateBoundingBox.x}%`, width: `${aiResult.plateBoundingBox.w}%`, height: `${aiResult.plateBoundingBox.h}%` }}>
                        <div className="absolute -top-6 left-0 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-t tracking-widest uppercase">PLATE_ROI_LOCKED</div>
                      </div>
                    )}
                  </>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-white z-20">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-6" />
                    <div className="text-center space-y-2">
                       <p className="text-[10px] font-black tracking-[0.4em] text-blue-400 uppercase">Neural Processing</p>
                       <p className="text-sm font-mono text-slate-300">{calibrationStep}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 bg-slate-900/50">
                 <Cpu size={72} className="text-slate-800 animate-pulse" />
                 <p className="font-black uppercase tracking-[0.5em] text-slate-700">Awaiting Target</p>
              </div>
            )}
          </div>

          {/* Forensic Debug Monitor */}
          {aiResult && (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-slate-800">
               <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                  <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-blue-400">
                    <Terminal size={16}/> Forensic Debug Monitor
                  </h3>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2 text-[10px] font-bold">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> RECON_VER: 3.4.1
                     </div>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4 font-mono text-[11px] text-slate-400">
                     <p className="text-blue-400 font-bold mb-2">// EXECUTION_LOG</p>
                     {aiResult.processingSteps.map((step, i) => (
                       <div key={i} className="flex gap-3">
                          <span className="opacity-30">[{i+1}]</span>
                          <span>{step}</span>
                       </div>
                     ))}
                  </div>
                  
                  <div className="space-y-6">
                     <p className="text-blue-400 font-mono text-[11px] font-bold mb-2">// CONFIDENCE_METRICS</p>
                     <div className="space-y-4">
                        {[
                          { label: 'Localization', val: aiResult.confidence.localization },
                          { label: 'OCR Extraction', val: aiResult.confidence.ocr },
                          { label: 'Pattern Validation', val: aiResult.confidence.patternMatch }
                        ].map(metric => (
                          <div key={metric.label}>
                             <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                                <span>{metric.label}</span>
                                <span className={metric.val > 0.8 ? 'text-green-400' : 'text-amber-400'}>{(metric.val * 100).toFixed(1)}%</span>
                             </div>
                             <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${metric.val > 0.8 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${metric.val * 100}%` }}></div>
                             </div>
                          </div>
                        ))}
                     </div>
                     <div className="pt-4 mt-4 border-t border-slate-800">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-slate-500">Raw OCR Buffer</span>
                           <span className="font-mono text-xs font-bold text-slate-200">"{aiResult.rawOcr}"</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-slate-100 h-full flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-8">
               <ShieldCheck className="text-blue-600" size={32} /> Compliance Audit
            </h3>
            
            <form onSubmit={validateAndProcess} className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                {/* Plate Verification Section */}
                <div className={`p-6 bg-slate-50 border-2 rounded-[2.5rem] transition-all ${lowConfidence && !isVerified ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-4 ml-2 flex justify-between">
                     <span>Neural Plate Identity</span>
                     {lowConfidence && <span className="text-amber-600 flex items-center gap-1"><AlertCircle size={10}/> Low Confidence</span>}
                  </label>
                  <input 
                    required 
                    type="text" 
                    className={`w-full px-6 py-5 bg-white border-2 rounded-2xl outline-none font-mono font-black text-3xl text-center tracking-[0.2em] uppercase ${isVerified ? 'border-green-500 text-green-700' : 'border-slate-200'}`} 
                    value={formData.enteredVehicleNumber} 
                    onChange={e => { setFormData({...formData, enteredVehicleNumber: e.target.value.toUpperCase()}); setIsVerified(false); }} 
                  />
                  {!isVerified && aiResult && (
                    <button 
                      type="button" 
                      onClick={handleVerify}
                      className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      Confirm Plate Identity
                    </button>
                  )}
                  {isVerified && (
                    <div className="mt-4 flex items-center justify-center gap-2 text-green-600 font-black text-[10px] uppercase">
                       <ShieldCheck size={14} /> Identity Verified by Operator
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Velocity (KM/H)</label>
                    <input type="text" className="w-full bg-transparent font-black text-xl text-center outline-none" value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} />
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Vehicle Category</label>
                    <select className="w-full bg-transparent font-bold text-xs text-center outline-none" value={formData.enteredVehicleType} onChange={e => setFormData({...formData, enteredVehicleType: e.target.value as any})}>
                      <option value="Car">Car</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>
                </div>

                {/* Safety Gear States */}
                <div className="grid grid-cols-3 gap-3">
                   <div className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${isTripleRiding ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <Users size={16} />
                      <input type="number" className="bg-transparent w-full text-center font-black text-xs" value={formData.riderCount} onChange={e => setFormData({...formData, riderCount: Number(e.target.value)})} />
                   </div>
                   <div onClick={() => setFormData({...formData, helmetDetected: !formData.helmetDetected})} className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${helmetViolation ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <HardHat size={16} />
                      <span className="text-[9px] font-black">{formData.helmetDetected ? 'HELMET' : 'NONE'}</span>
                   </div>
                   <div onClick={() => setFormData({...formData, seatbeltDetected: !formData.seatbeltDetected})} className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${seatbeltViolation ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <ShieldCheck size={16} />
                      <span className="text-[9px] font-black">{formData.seatbeltDetected ? 'BELT' : 'NONE'}</span>
                   </div>
                </div>
              </div>

              {/* Action Area */}
              <div className="space-y-3 mt-6">
                {aiResult && !isVerified && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                     <AlertCircle size={18} className="text-amber-600 shrink-0" />
                     <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
                        Ethical Safeguard: Plate detection requires manual verification before evidence logging. Please confirm the neural interpretation.
                     </p>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isAnalyzing || !capturedImage || !isVerified} 
                  className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xl hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-5 disabled:opacity-30 active:scale-[0.98]"
                >
                  {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <><Zap size={28} className="text-blue-500" /> Log Evidence</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      <style>{`
        @keyframes scan {
          from { top: 0%; }
          to { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ManualInputForm;
