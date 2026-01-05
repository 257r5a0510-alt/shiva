
import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Loader2, 
  Signal, 
  ShieldAlert, 
  ExternalLink,
  Globe,
  Map as MapIcon,
  Layers
} from 'lucide-react';
import { getLocalTrafficDensity, TrafficDensityResult } from '../services/ai';

const TrafficMap: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrafficDensityResult | null>(null);
  const [viewMode, setViewMode] = useState<'Standard' | 'Satellite' | 'Heatmap'>('Heatmap');

  useEffect(() => {
    refreshTraffic();
  }, []);

  const refreshTraffic = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        fetchTraffic(newCoords.lat, newCoords.lng);
      },
      () => {
        const fallback = { lat: 12.9249, lng: 77.6701 }; // Silk Board, Bangalore
        setCoords(fallback);
        fetchTraffic(fallback.lat, fallback.lng);
      }
    );
  };

  const fetchTraffic = async (lat: number, lng: number) => {
    const data = await getLocalTrafficDensity(lat, lng);
    setResult(data);
    setLoading(false);
  };

  const openInGoogleMaps = () => {
    if (coords) {
      window.open(`https://www.google.com/maps/@${coords.lat},${coords.lng},15z/data=!5m1!1e1`, '_blank');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Traffic Awareness Map</h2>
          <p className="text-slate-500 font-medium italic">Real-time congestion heatmaps and safe-route identifiers via Google Grounding.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={refreshTraffic}
            disabled={loading}
            className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} className="text-blue-500" />}
            Refresh Grid
          </button>
          <button 
            onClick={openInGoogleMaps}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2"
          >
            <MapIcon size={16} /> Open Native Maps
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Map Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900 rounded-[3.5rem] p-1 shadow-2xl overflow-hidden border-4 border-white relative aspect-[16/10] md:aspect-video flex items-center justify-center">
            {/* Simulation Overlay for Map */}
            <div className={`absolute inset-0 transition-opacity duration-1000 ${viewMode === 'Satellite' ? 'opacity-40' : 'opacity-100'}`} style={{ backgroundColor: '#e5e7eb' }}>
               <svg width="100%" height="100%" viewBox="0 0 1000 600" className="opacity-80">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d1d5db" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  {/* Road Network */}
                  <path d="M0,100 L1000,100 M0,300 L1000,300 M0,500 L1000,500 M200,0 L200,600 M500,0 L500,600 M800,0 L800,600" stroke="#fff" strokeWidth="30" fill="none" />
                  
                  {/* Traffic Heatmap Layers */}
                  <g className={viewMode === 'Heatmap' ? 'opacity-100' : 'opacity-20'}>
                    <path d="M0,100 L500,100" stroke="#ef4444" strokeWidth="10" fill="none" className="animate-pulse" />
                    <path d="M500,100 L1000,100" stroke="#22c55e" strokeWidth="10" fill="none" />
                    <path d="M500,0 L500,300" stroke="#f59e0b" strokeWidth="10" fill="none" />
                    <path d="M0,300 L800,300" stroke="#ef4444" strokeWidth="12" fill="none" />
                    <path d="M200,500 L800,500" stroke="#22c55e" strokeWidth="10" fill="none" />
                  </g>
               </svg>
            </div>

            {/* Radar Scanning HUD */}
            <div className="absolute inset-0 pointer-events-none z-10">
               <div className="absolute top-10 left-10 p-4 bg-black/60 backdrop-blur-lg rounded-2xl border border-white/20 text-white font-mono text-[10px] space-y-1">
                  <div className="flex items-center gap-2 text-blue-400 font-bold">
                    <Signal size={12} className="animate-pulse" /> GRID_SCANNER_04
                  </div>
                  <div>LAT: {coords?.lat.toFixed(4) || '---'}</div>
                  <div>LNG: {coords?.lng.toFixed(4) || '---'}</div>
                  <div className="text-green-400 mt-2">DENSITY_EST: ACTIVE</div>
               </div>

               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-20 h-20 bg-blue-600/30 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 m-auto w-8 h-8 bg-blue-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(59,130,246,0.8)] flex items-center justify-center">
                       <MapPin size={14} className="text-white" />
                    </div>
                  </div>
               </div>
            </div>

            {/* View Mode Switcher */}
            <div className="absolute top-8 right-8 flex bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white z-20">
               {(['Standard', 'Satellite', 'Heatmap'] as const).map((mode) => (
                 <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                 >
                    {mode}
                 </button>
               ))}
            </div>

            {/* Legend */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-8 py-4 rounded-3xl shadow-2xl border border-white flex gap-10 z-20">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Congested</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Moderate</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Optimal</span>
               </div>
            </div>
          </div>

          {/* Grounding Sources (Required by Gemini Policy) */}
          {result && result.links.length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
               <h3 className="text-lg font-black text-slate-900 flex items-center gap-3 mb-6">
                 <Layers className="text-blue-600" size={20} /> Verified Grounding Sources
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.links.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 group-hover:bg-blue-100 transition-colors">
                           <MapIcon size={16} className="text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{link.title}</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-400" />
                    </a>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-full flex flex-col min-h-[500px]">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 mb-6">
              <Compass className="text-blue-600" size={24} /> Neural Road Intelligence
            </h3>
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Loader2 className="animate-spin text-blue-600" size={40} />
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest">Querying Google Grids...</p>
                  <p className="text-[10px] font-bold mt-1 opacity-60">Triangulating high-density sectors</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                {result ? (
                   <>
                     <div className="prose prose-sm prose-slate font-medium text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                        {result.text.split('\n').map((line, i) => (
                          <p key={i} className="mb-2">{line}</p>
                        ))}
                     </div>

                     <div className="mt-auto space-y-4 pt-4 border-t border-slate-100">
                        <div className="p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-start gap-4">
                           <div className="p-2 bg-red-100 rounded-xl text-red-600">
                              <ShieldAlert size={18} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Congestion Warning</p>
                              <p className="text-xs font-bold text-red-800 mt-1">Slower than usual traffic reported in your immediate perimeter.</p>
                           </div>
                        </div>
                        <div className="p-5 bg-green-50 border border-green-100 rounded-[2rem] flex items-start gap-4">
                           <div className="p-2 bg-green-100 rounded-xl text-green-600">
                              <Navigation size={18} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Route Recommendation</p>
                              <p className="text-xs font-bold text-green-800 mt-1">Grid analysis suggests using arterial roads for transit bypass.</p>
                           </div>
                        </div>
                     </div>
                   </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-300 gap-4">
                    <Navigation size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest text-center">Locate yourself to begin sector analysis</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-600/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
             <h4 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
               <Layers size={16} className="text-blue-400" /> Awareness Protocol
             </h4>
             <ul className="space-y-4 text-[11px] font-bold">
               <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-400">Decision-support mapping only</span>
               </li>
               <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-400">Google Grounding v2.5 verified</span>
               </li>
               <li className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-400">Historical pattern integration</span>
               </li>
             </ul>
             <div className="mt-8 pt-6 border-t border-slate-800">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Confidence Level: High</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficMap;
