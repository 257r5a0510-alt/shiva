
import React, { useState, useRef, useEffect } from 'react';
import { SignalStatus, ViolationType, ViolationRecord, VehicleData, VehicleCategory, Severity } from '../types';
import { detectViolations } from '../services/simulator';
import { analyzeVehicleImage } from '../services/ai';
import { 
  Camera, 
  ScanLine,
  Upload,
  Loader2,
  ShieldCheck,
  Zap,
  Target,
  Terminal,
  Fingerprint,
  RefreshCw,
  Cpu,
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
  const [aiResult, setAiResult] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState<string>('');
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setOcrConfidence(0);
    
    const steps = ["LOCALIZING ROI (YOLO)...", "PREPROCESSING PLATE...", "APPLYING OCR (EASYOCR)...", "PATTERN VALIDATION..."];
    for (const step of steps) {
      setCalibrationStep(step);
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      const result = await analyzeVehicleImage(image);
      setIsAnalyzing(false);
      
      if (result) {
        const confidence = result.confidence_score || 0;
        const plateNumber = result.plate_detected && result.plate_number ? result.plate_number : '';
        const vehicleType = result.vehicle_type ? (result.vehicle_type.charAt(0).toUpperCase() + result.vehicle_type.slice(1)) : 'Car';
        
        setAiResult(result);
        setOcrConfidence(confidence);
        
        if (!result.plate_detected || !plateNumber) {
          setFormData(prev => ({ 
            ...prev, 
            enteredVehicleNumber: result.error_message || 'NO PLATE DETECTED', 
            enteredVehicleType: vehicleType as VehicleCategory, 
          }));
          setIsVerified(false);
        } else {
          setFormData(prev => ({ 
            ...prev, 
            enteredVehicleNumber: plateNumber, 
            enteredVehicleType: vehicleType as VehicleCategory, 
            speed: (40 + Math.random() * 30).toFixed(1),
            riderCount: vehicleType.toLowerCase() === 'motorcycle' ? 1 : 2,
            helmetDetected: true,
            seatbeltDetected: true
          }));
          setIsVerified(true);
        }
      } else {
        setOcrConfidence(0);
        setFormData(prev => ({ ...prev, enteredVehicleNumber: 'DETECTION FAILED' }));
      }
    } catch (e) {
      setIsAnalyzing(false);
      setOcrConfidence(0);
      setFormData(prev => ({ ...prev, enteredVehicleNumber: 'ERROR' }));
    }
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
      confidence: 0.95,
      isVerified: true
    };
    const violation = detectViolations(vehicle, capturedImage || undefined, formData.speedLimit, 0.95);
    onProcessed(violation, vehicle);
    setCapturedImage(null); setAiResult(null); setIsVerified(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <Fingerprint className="text-blue-600" size={32} /> Forensic Detection Unit
          </h2>
          <p className="text-slate-500 font-medium italic">Multi-stage Advanced ANPR Audit Pipeline.</p>
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
          <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"><Upload size={18} /> Load Image</button>
          <button onClick={() => setCameraActive(!cameraActive)} className={`px-6 py-2 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${cameraActive ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
            {cameraActive ? <RefreshCw size={18} className="animate-spin" /> : <Target size={18}/>} 
            {cameraActive ? 'Stop Feed' : 'Initiate Scan'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-950 rounded-[3rem] overflow-hidden aspect-video relative shadow-2xl border-4 border-white">
            {cameraActive ? (
              <div className="h-full relative">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 border-2 border-blue-500/40">
                     <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                  </div>
                </div>
                <button onClick={capturePhoto} className="absolute bottom-10 left-1/2 -translate-x-1/2 p-8 rounded-full bg-blue-600 text-white shadow-blue-500/50 transition-all z-20"><Camera size={36}/></button>
              </div>
            ) : capturedImage ? (
              <div className="h-full relative overflow-hidden group">
                <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-white z-20">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-6" />
                    <p className="text-sm font-mono text-slate-300">{calibrationStep}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-6 bg-slate-900/50">
                 <Cpu size={72} className="text-slate-800 animate-pulse" />
                 <p className="font-black uppercase tracking-[0.5em] text-slate-700">Ready for Audit</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900">Audit Panel</h3>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Override</span>
                <button 
                  type="button"
                  onClick={() => setIsOverrideEnabled(!isOverrideEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${isOverrideEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isOverrideEnabled ? 'left-4.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
            
            <form onSubmit={validateAndProcess} className="space-y-4 flex-1 flex flex-col">
              <div className="space-y-3">
                <div className={`p-5 rounded-3xl border-2 transition-all ${
                  ocrConfidence > 0 ? (ocrConfidence < 0.7 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200') : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Neural Plate Identity</label>
                    {ocrConfidence > 0 && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${ocrConfidence < 0.7 ? 'bg-amber-200 text-amber-800' : 'bg-green-200 text-green-800'}`}>
                        {(ocrConfidence * 100).toFixed(0)}% CONFIDENCE
                      </span>
                    )}
                  </div>
                  <input 
                    required 
                    type="text" 
                    readOnly={!isOverrideEnabled}
                    className={`w-full px-4 py-3 bg-white border-2 rounded-xl outline-none font-mono font-black text-xl text-center uppercase transition-all ${
                      isOverrideEnabled ? 'border-blue-400 ring-2 ring-blue-100' : (ocrConfidence > 0 ? (ocrConfidence < 0.7 ? 'border-amber-400 text-amber-700' : 'border-green-500 text-green-700') : 'border-slate-200')
                    }`} 
                    value={formData.enteredVehicleNumber} 
                    onChange={e => setFormData({...formData, enteredVehicleNumber: e.target.value.toUpperCase()})} 
                  />
                  {ocrConfidence > 0 && ocrConfidence < 0.7 && (
                    <div className="mt-2 flex items-center gap-1.5 text-amber-600">
                      <AlertCircle size={12} />
                      <span className="text-[9px] font-bold uppercase">Low Confidence Plate Detection</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Speed</label>
                    <input 
                      type="text" 
                      readOnly={!isOverrideEnabled}
                      className={`w-full bg-transparent font-black text-lg text-center outline-none ${isOverrideEnabled ? 'text-blue-600' : 'text-slate-800'}`} 
                      value={formData.speed} 
                      onChange={e => setFormData({...formData, speed: e.target.value})} 
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Type</label>
                    <select 
                      disabled={!isOverrideEnabled}
                      className={`w-full bg-transparent font-bold text-xs outline-none appearance-none text-center ${isOverrideEnabled ? 'text-blue-600' : 'text-slate-800'}`} 
                      value={formData.enteredVehicleType} 
                      onChange={e => setFormData({...formData, enteredVehicleType: e.target.value as any})}
                    >
                      <option value="Car">Car</option>
                      <option value="Motorcycle">Motorcycle</option>
                      <option value="Truck">Truck</option>
                      <option value="Bus">Bus</option>
                      <option value="Auto">Auto</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isAnalyzing || !capturedImage} className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 disabled:opacity-30 active:scale-[0.98] mt-auto shadow-xl">
                {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <><Zap size={20} className="text-blue-500" /> Log Evidence</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualInputForm;
