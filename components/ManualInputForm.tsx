
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
  // Fix: Removed TallyMarks as it does not exist in the lucide-react package
  AlertCircle
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
  const [liveSpeed, setLiveSpeed] = useState<number>(0);
  const [lockStatus, setLockStatus] = useState<'searching' | 'tracking' | 'locked'>('searching');
  const [signalStrength, setSignalStrength] = useState(0);
  const [calibrationStep, setCalibrationStep] = useState<string>('');
  const [validationStatus, setValidationStatus] = useState<{
    type: 'success' | 'error' | 'idle';
    message: string;
  }>({ type: 'idle', message: '' });

  useEffect(() => {
    let interval: number;
    if (cameraActive) {
      let targetSpeed = 45 + Math.random() * 40;
      let currentSpeed = 0;
      interval = window.setInterval(() => {
        setSignalStrength(prev => Math.min(100, prev + 5));
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
      setSignalStrength(0);
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setValidationStatus({ type: 'idle', message: '' });
    const steps = [
      "ISOLATING TARGET...",
      "ACQUIRING PLATE OCR...",
      "COUNTING OCCUPANTS...",
      "AUDITING SAFETY GEAR...",
      "FINALIZING REPORT..."
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
      setValidationStatus({ type: 'success', message: 'Safety Audit Complete' });
    } else {
      setValidationStatus({ type: 'error', message: 'Sensor Calibration Failed' });
    }
  };

  const validateAndProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiResult) return;
    const vehicle: VehicleData = { 
      id: Math.random().toString(36).substr(2, 9), 
      vehicleNumber: formData.enteredVehicleNumber, 
      speed: Number(formData.speed) || 0, 
      signalStatus: formData.signalStatus, 
      vehicleType: formData.enteredVehicleType, 
      timestamp: Date.now(),
      riderCount: formData.riderCount,
      helmetDetected: formData.helmetDetected,
      seatbeltDetected: formData.seatbeltDetected
    };
    const violation = detectViolations(vehicle, capturedImage || undefined, formData.speedLimit, aiResult.overallConfidence);
    onProcessed(violation, vehicle);
    setTimeout(() => { 
      setCapturedImage(null); setAiResult(null); 
      setFormData(prev => ({ ...prev, enteredVehicleNumber: '', speed: '' })); 
      setValidationStatus({ type: 'idle', message: '' }); 
    }, 5000);
  };

  const isOverSpeeding = Number(formData.speed) > formData.speedLimit;
  const isTripleRiding = formData.enteredVehicleType === 'Motorcycle' && formData.riderCount > 2;
  const helmetViolation = formData.enteredVehicleType === 'Motorcycle' && !formData.helmetDetected;
  const seatbeltViolation = (formData.enteredVehicleType === 'Car' || formData.enteredVehicleType === 'Truck') && !formData.seatbeltDetected;
  const hasSafetyViolation = isTripleRiding || helmetViolation || seatbeltViolation;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Detection Unit</h2>
          <p className="text-slate-500 font-medium italic">Forensic Person Counting & Safety Gear Compliance.</p>
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
            <Upload size={18} /> Load Frame
          </button>
          <button onClick={() => setCameraActive(!cameraActive)} className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${cameraActive ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
            {cameraActive ? 'Abort' : <Target size={18}/>} Acquisition
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className={`bg-slate-950 rounded-[3rem] overflow-hidden aspect-video relative shadow-2xl border-4 transition-all duration-700 ${isOverSpeeding || hasSafetyViolation ? 'border-red-500 shadow-red-500/20' : 'border-white'}`}>
            {cameraActive ? (
              <div className="h-full relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 transition-all duration-300 ${lockStatus === 'locked' ? 'border-blue-500' : 'border-white/5 opacity-30'}">
                    {lockStatus === 'locked' && <div className="absolute inset-0 flex flex-col items-center justify-center"><div className="bg-blue-600 px-4 py-1 rounded text-white font-black text-[9px] tracking-widest">LOCK_STABLE</div></div>}
                  </div>
                </div>
                <button onClick={capturePhoto} disabled={lockStatus !== 'locked'} className={`absolute bottom-8 left-1/2 -translate-x-1/2 p-8 rounded-full transition-all z-20 ${lockStatus === 'locked' ? 'bg-blue-600 text-white hover:scale-110 shadow-blue-500/50' : 'bg-slate-800 text-slate-600'}`}><Target size={36}/></button>
              </div>
            ) : capturedImage ? (
              <div className="h-full relative overflow-hidden group">
                <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                {aiResult && !isAnalyzing && (
                  <>
                    {aiResult.boundingBox && <div className={`absolute border-2 ${isOverSpeeding || hasSafetyViolation ? 'border-red-500' : 'border-blue-500'}`} style={{ top: `${aiResult.boundingBox.y}%`, left: `${aiResult.boundingBox.x}%`, width: `${aiResult.boundingBox.w}%`, height: `${aiResult.boundingBox.h}%` }}></div>}
                    {aiResult.plateBoundingBox && <div className="absolute border-2 border-green-500" style={{ top: `${aiResult.plateBoundingBox.y}%`, left: `${aiResult.plateBoundingBox.x}%`, width: `${aiResult.plateBoundingBox.w}%`, height: `${aiResult.plateBoundingBox.h}%` }}></div>}
                  </>
                )}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-white z-20">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-4" />
                    <p className="text-sm font-mono text-slate-400">{calibrationStep}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 bg-slate-900/50"><Crosshair size={72} className="text-slate-800 animate-pulse" /></div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className={`p-3 rounded-2xl mb-2 ${isTripleRiding ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}><Users size={20} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Occupancy</p>
                <span className="text-3xl font-black text-slate-900">{formData.riderCount} PAX</span>
             </div>
             
             <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
                <div className={`p-3 rounded-2xl mb-2 ${helmetViolation || seatbeltViolation ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}><ShieldCheck size={20} /></div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Safety Lock</p>
                <span className={`text-xl font-black uppercase ${helmetViolation || seatbeltViolation ? 'text-red-600' : 'text-green-600'}`}>{helmetViolation || seatbeltViolation ? 'VIOLATION' : 'SECURED'}</span>
             </div>

             <div className="bg-slate-950 p-6 rounded-[2.5rem] text-white flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Technical Summary</p>
                <p className="text-[11px] font-medium text-slate-400 italic">{aiResult ? aiResult.speedDerivation : "Waiting for calibration..."}</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-slate-100 h-full flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-8"><ShieldCheck className="text-blue-600" size={36} /> Automatic Audit</h3>
            <form onSubmit={validateAndProcess} className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-4 flex-1">
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-[2rem]">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Identified Plate</label>
                  <input required type="text" className="w-full px-5 py-4 bg-white border border-slate-100 rounded-2xl font-mono font-black text-2xl text-center tracking-[0.2em]" value={formData.enteredVehicleNumber} onChange={e => setFormData({...formData, enteredVehicleNumber: e.target.value.toUpperCase()})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-[2rem]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Velocity</label>
                    <input required type="text" className={`w-full px-4 py-3 bg-white border rounded-2xl font-black text-xl text-center ${isOverSpeeding ? 'text-red-600' : 'text-slate-900'}`} value={formData.speed} onChange={e => setFormData({...formData, speed: e.target.value})} />
                  </div>
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-[2rem]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Type</label>
                    <select className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-sm text-center" value={formData.enteredVehicleType} onChange={e => setFormData({...formData, enteredVehicleType: e.target.value as any})}>
                      <option value="Car">Car</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <div className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-1 ${isTripleRiding ? 'bg-red-50 border-red-200 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <Users size={16} />
                      <span className="text-[10px] font-black uppercase">Occupants</span>
                      <input type="number" className="bg-transparent w-full text-center font-black" value={formData.riderCount} onChange={e => setFormData({...formData, riderCount: Number(e.target.value)})} />
                   </div>
                   <div 
                    onClick={() => setFormData({...formData, helmetDetected: !formData.helmetDetected})}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${helmetViolation ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <HardHat size={16} />
                      <span className="text-[10px] font-black uppercase">Helmet</span>
                      <span className="text-[10px] font-black">{formData.helmetDetected ? 'ON' : 'OFF'}</span>
                   </div>
                   <div 
                    onClick={() => setFormData({...formData, seatbeltDetected: !formData.seatbeltDetected})}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${seatbeltViolation ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black uppercase">Seatbelt</span>
                      <span className="text-[10px] font-black">{formData.seatbeltDetected ? 'ON' : 'OFF'}</span>
                   </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200 rounded-[2rem]">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-2">Signal Status</label>
                  <select className="w-full px-4 py-3 bg-white border border-slate-100 rounded-2xl font-black text-sm text-center" value={formData.signalStatus} onChange={e => setFormData({...formData, signalStatus: e.target.value as any})}>
                    <option value={SignalStatus.GREEN}>GREEN</option>
                    <option value={SignalStatus.RED}>RED VIOLATION</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                 {isTripleRiding && <div className="flex items-center gap-2 text-[10px] font-black text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100 uppercase"><AlertCircle size={14}/> Triple Riding Detected</div>}
                 {helmetViolation && <div className="flex items-center gap-2 text-[10px] font-black text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100 uppercase"><HardHat size={14}/> Helmet not worn</div>}
                 {seatbeltViolation && <div className="flex items-center gap-2 text-[10px] font-black text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100 uppercase"><ShieldCheck size={14}/> Seat belt not worn</div>}
              </div>

              <button type="submit" disabled={isAnalyzing || !capturedImage} className="w-full py-6 bg-slate-950 text-white rounded-[3rem] font-black text-xl hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-5 mt-4">
                {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <><Zap size={28} className="text-blue-500" /> Log Compliance</>}
              </button>
            </form>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ManualInputForm;
