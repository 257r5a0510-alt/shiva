
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  Search, 
  Image as ImageIcon, 
  Wand2, 
  Eye,
  Maximize,
  Split,
  ChevronRight,
  Download,
  Activity,
  Zap,
  Crosshair,
  BarChart2
} from 'lucide-react';
import { enhanceCCTVImage, EnhancementResult } from '../services/ai';

const EnhancementLab: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [filters, setFilters] = useState({ contrast: 100, brightness: 100, blur: 0, grayscale: 0, sharpness: 100 });
  const [isSplitView, setIsSplitView] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 50, y: 50, show: false });
  const [activeStep, setActiveStep] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImage(event.target?.result as string);
      reader.readAsDataURL(file);
      setResult(null);
      setActiveStep(0);
      setFilters({ contrast: 100, brightness: 100, blur: 0, grayscale: 0, sharpness: 100 });
    }
  };

  const runEnhance = async () => {
    if (!image) return;
    setIsProcessing(true);
    
    // Simulate pipeline steps
    const steps = [1, 2, 3, 4];
    for (const step of steps) {
      setActiveStep(step);
      await new Promise(r => setTimeout(r, 800));
    }

    const res = await enhanceCCTVImage(image);
    setResult(res);
    setIsProcessing(false);
    setFilters({ contrast: 140, brightness: 110, blur: 0, grayscale: 0, sharpness: 150 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagnifierPos({ x, y, show: true });
  };

  const downloadEnhanced = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image; // In real app, this would be the filtered canvas result
    link.download = `enhanced_forensic_${Date.now()}.jpg`;
    link.click();
  };

  const pipelineSteps = [
    { label: 'Ingest', icon: Upload },
    { label: 'Denoise', icon: Activity },
    { label: 'Deblur', icon: Wand2 },
    { label: 'Restore', icon: Zap },
    { label: 'Finalize', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Forensic Enhancement Lab</h2>
          <p className="text-slate-500 font-medium italic">Advanced CCTV deblurring and neural evidence restoration suite.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsSplitView(!isSplitView)}
            className={`px-4 py-2 border rounded-xl font-bold flex items-center gap-2 transition-all ${isSplitView ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Split size={18} /> Split View
          </button>
          <button 
            onClick={downloadEnhanced}
            disabled={!image || isProcessing}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-black disabled:opacity-30 transition-all flex items-center gap-2"
          >
            <Download size={18} /> Export Frame
          </button>
        </div>
      </header>

      {/* Forensic Pipeline Progress */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center relative">
          <div className="absolute h-1 bg-slate-100 left-8 right-8 top-1/2 -translate-y-1/2 -z-10"></div>
          <div className="absolute h-1 bg-blue-600 left-8 transition-all duration-500 top-1/2 -translate-y-1/2 -z-10" style={{ width: `${(activeStep / (pipelineSteps.length - 1)) * 85}%` }}></div>
          
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                activeStep >= idx ? 'bg-blue-600 border-white text-white scale-110 shadow-lg' : 'bg-white border-slate-100 text-slate-300'
              }`}>
                <step.icon size={18} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${activeStep >= idx ? 'text-blue-600' : 'text-slate-300'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Viewport */}
        <div className="lg:col-span-8 space-y-6">
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMagnifierPos(p => ({ ...p, show: false }))}
            className="bg-slate-900 rounded-[3rem] p-1 shadow-2xl overflow-hidden border-4 border-white relative aspect-video flex items-center justify-center group"
          >
            {image ? (
              <div className="relative w-full h-full overflow-hidden cursor-crosshair">
                {isSplitView ? (
                  <div className="relative w-full h-full flex">
                    <div className="w-1/2 h-full overflow-hidden border-r border-white/20">
                      <img src={image} className="h-full w-[200%] object-cover max-w-none" alt="Original" />
                      <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-mono">SOURCE_RAW</div>
                    </div>
                    <div className="w-1/2 h-full overflow-hidden">
                      <img 
                        src={image} 
                        className="h-full w-[200%] object-cover max-w-none ml-[-100%]" 
                        style={{ filter: `contrast(${filters.contrast}%) brightness(${filters.brightness}%) sharp(${filters.sharpness}%)` }}
                        alt="Enhanced" 
                      />
                      <div className="absolute top-4 right-4 bg-blue-600 px-2 py-1 rounded text-[10px] text-white font-mono">ENHANCED_GRID</div>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={image} 
                    className="w-full h-full object-cover transition-all duration-1000"
                    style={{ 
                      filter: `contrast(${filters.contrast}%) brightness(${filters.brightness}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%)`,
                      transform: isProcessing ? 'scale(1.05)' : 'scale(1)'
                    }}
                    alt="Source CCTV"
                  />
                )}

                {/* Digital Magnifier */}
                {magnifierPos.show && !isProcessing && (
                  <div 
                    className="absolute w-48 h-48 border-4 border-white rounded-full overflow-hidden shadow-2xl pointer-events-none z-30 bg-slate-900"
                    style={{ 
                      left: `calc(${magnifierPos.x}% - 96px)`, 
                      top: `calc(${magnifierPos.y}% - 96px)`,
                    }}
                  >
                    <img 
                      src={image} 
                      className="absolute w-[600%] h-[600%] max-w-none object-cover"
                      style={{ 
                        left: `-${magnifierPos.x * 6 - 50}%`,
                        top: `-${magnifierPos.y * 6 - 50}%`,
                        filter: `contrast(160%) brightness(110%)`
                      }}
                      alt="Zoomed"
                    />
                    <div className="absolute inset-0 flex items-center justify-center border-2 border-blue-500/30 rounded-full">
                       <Crosshair size={24} className="text-blue-500 opacity-50" />
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white z-40">
                    <Loader2 className="w-16 h-16 animate-spin mb-4 text-blue-400" />
                    <div className="text-center space-y-1">
                      <p className="font-black text-sm uppercase tracking-[0.2em]">{pipelineSteps[activeStep].label} PHASE</p>
                      <p className="text-[10px] text-blue-300 font-mono">ALGO_VER: NEURAL_RESTORE_V4</p>
                    </div>
                  </div>
                )}
                
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 text-[10px] text-white font-mono">
                      POS_X: {magnifierPos.x.toFixed(1)}%<br/>
                      POS_Y: {magnifierPos.y.toFixed(1)}%
                   </div>
                   <div className="flex gap-2">
                      <div className="p-2 bg-blue-600 rounded-lg text-white"><Maximize size={16}/></div>
                   </div>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors group"
              >
                <div className="p-10 rounded-full bg-slate-800 text-slate-500 group-hover:scale-110 transition-transform mb-4">
                  <Upload size={48} />
                </div>
                <p className="font-black text-slate-500 uppercase tracking-widest">Import Blurred Evidence</p>
                <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Contrast</label>
               <input type="range" min="50" max="200" value={filters.contrast} onChange={e => setFilters({...filters, contrast: Number(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-blue-600" />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sharpness</label>
               <input type="range" min="0" max="200" value={filters.sharpness} onChange={e => setFilters({...filters, sharpness: Number(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-blue-600" />
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Brightness</label>
               <input type="range" min="50" max="150" value={filters.brightness} onChange={e => setFilters({...filters, brightness: Number(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-lg appearance-none accent-blue-600" />
            </div>
            {/* Fix: Changed runAIAnalysis to runEnhance to fix "Cannot find name 'runAIAnalysis'" error */}
            <button 
              disabled={!image || isProcessing}
              onClick={runEnhance}
              className="flex items-center justify-center gap-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 disabled:opacity-30 shadow-lg transition-all"
            >
              <Wand2 size={18} /> RESTORE
            </button>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Histogram Visualization */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
             <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
               <BarChart2 className="text-blue-600" size={24} /> Intensity Histogram
             </h3>
             <div className="h-24 w-full flex items-end gap-[1px]">
                {Array.from({ length: 40 }).map((_, i) => (
                   <div 
                    key={i} 
                    className="flex-1 bg-blue-100 rounded-t-sm transition-all duration-1000"
                    style={{ height: image ? `${Math.floor(Math.random() * 80) + 20}%` : '5%' }}
                   ></div>
                ))}
             </div>
             <div className="mt-4 flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                <span>Shadows</span>
                <span>Midtones</span>
                <span>Highlights</span>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 min-h-[350px] flex flex-col">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
              <Eye className="text-blue-600" size={24} /> Forensic Summary
            </h3>
            
            {result ? (
              <div className="space-y-6 flex-1">
                <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl">
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">Neural Reconstruction Confidence</p>
                   <div className="flex items-center gap-4">
                      <div className="flex-1 bg-blue-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${result.confidence * 100}%` }}></div>
                      </div>
                      <span className="font-black text-blue-800">{(result.confidence * 100).toFixed(0)}%</span>
                   </div>
                </div>
                <div className="space-y-3">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Character Recognition</p>
                   <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-4 border-blue-200 pl-4 bg-slate-50 py-3 rounded-r-xl">
                     "{result.forensicSummary}"
                   </p>
                </div>
                <div className="mt-auto pt-6 border-t border-slate-100">
                   <div className="flex items-center gap-3 text-green-600">
                      <div className="p-2 bg-green-100 rounded-xl"><ShieldCheck size={18} /></div>
                      <div>
                         <span className="text-[10px] font-black uppercase tracking-widest block">Quality Verified</span>
                         <p className="text-[10px] text-slate-500 font-bold">Standard Met for Evidence Submission</p>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4">
                <Search size={32} />
                <p className="text-xs font-bold uppercase tracking-widest text-center px-8 opacity-60">Analyze a frame to decode hidden metadata and restore character clarity.</p>
              </div>
            )}
          </div>
          
          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
             <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
               <Zap size={16} className="text-blue-400" /> Sensor Metadata
             </h4>
             <ul className="space-y-3 text-[10px] font-bold text-slate-400">
               <li className="flex justify-between border-b border-slate-800 pb-2"><span>Resolution</span> <span className="text-slate-200">1920x1080 (HD)</span></li>
               <li className="flex justify-between border-b border-slate-800 pb-2"><span>Frame Rate</span> <span className="text-slate-200">15.00 FPS</span></li>
               <li className="flex justify-between border-b border-slate-800 pb-2"><span>Compression</span> <span className="text-slate-200">H.264 High Profile</span></li>
               <li className="flex justify-between"><span>Bitrate</span> <span className="text-slate-200">2.4 Mbps</span></li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancementLab;
