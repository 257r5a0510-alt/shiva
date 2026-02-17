
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Grid3X3, 
  Map as MapIcon, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Users,
  Car,
  Wind,
  ShieldAlert,
  ArrowUpRight,
  Navigation,
  Crosshair,
  AlertCircle
} from 'lucide-react';
import { AreaIntelligence } from '../types';

const CityGrid: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, Partial<AreaIntelligence>>>({});
  const [alert, setAlert] = useState<{ msg: string; type: 'danger' | 'warning' } | null>(null);

  // Define Zone Boundaries (Bangalore Centric)
  const zones = useMemo<AreaIntelligence[]>(() => [
    { 
      zoneId: 'Z1', 
      zoneName: 'Central District', 
      congestionLevel: 84, 
      riskScore: 72, 
      activeIncidents: 4, 
      avgSpeed: 12,
      boundary: [12.96, 77.58, 12.98, 77.61] // MG Road area
    },
    { 
      zoneId: 'Z2', 
      zoneName: 'Highway East', 
      congestionLevel: 42, 
      riskScore: 45, 
      activeIncidents: 1, 
      avgSpeed: 74,
      boundary: [12.95, 77.63, 12.97, 77.67] // Indiranagar/Old Airport Road
    },
    { 
      zoneId: 'Z3', 
      zoneName: 'South Tech Corridor', 
      congestionLevel: 91, 
      riskScore: 88, 
      activeIncidents: 7, 
      avgSpeed: 8,
      boundary: [12.90, 77.60, 12.93, 77.63] // HSR/Silk Board
    },
    { 
      zoneId: 'Z4', 
      zoneName: 'Industrial North', 
      congestionLevel: 31, 
      riskScore: 24, 
      activeIncidents: 0, 
      avgSpeed: 52,
      boundary: [13.00, 77.57, 13.05, 77.60] // Hebbal/Peenya
    },
    { 
      zoneId: 'Z5', 
      zoneName: 'Suburban West', 
      congestionLevel: 55, 
      riskScore: 32, 
      activeIncidents: 2, 
      avgSpeed: 38,
      boundary: [12.96, 77.52, 12.99, 77.56] // Vijayanagar
    },
    { 
      zoneId: 'Z6', 
      zoneName: 'Airport Link', 
      congestionLevel: 68, 
      riskScore: 59, 
      activeIncidents: 3, 
      avgSpeed: 45,
      boundary: [13.15, 77.65, 13.25, 77.75] // Airport
    },
  ], []);

  // Geolocation Polling
  useEffect(() => {
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        
        // Find current zone
        const zone = zones.find(z => {
          if (!z.boundary) return false;
          const [minLat, minLng, maxLat, maxLng] = z.boundary;
          return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
        });

        if (zone) {
          if (zone.zoneId !== currentZoneId) {
            setCurrentZoneId(zone.zoneId);
            if (zone.riskScore > 70) {
              setAlert({ msg: `ENTERING HIGH RISK ZONE: ${zone.zoneName.toUpperCase()}`, type: 'danger' });
            } else if (zone.congestionLevel > 80) {
              setAlert({ msg: `HEAVY CONGESTION DETECTED IN ${zone.zoneName.toUpperCase()}`, type: 'warning' });
            } else {
              setAlert(null);
            }
          }
        } else {
          setCurrentZoneId(null);
          setAlert(null);
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [zones, currentZoneId]);

  // Simulate Live Metric Fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      const updates: Record<string, Partial<AreaIntelligence>> = {};
      zones.forEach(z => {
        updates[z.zoneId] = {
          congestionLevel: Math.max(0, Math.min(100, z.congestionLevel + (Math.random() - 0.5) * 5)),
          avgSpeed: Math.max(5, Math.min(100, z.avgSpeed + (Math.random() - 0.5) * 10))
        };
      });
      setLiveMetrics(prev => ({ ...prev, ...updates }));
    }, 3000);
    return () => clearInterval(interval);
  }, [zones]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">City Grid Intelligence</h2>
          <p className="text-slate-500 font-medium italic">Holistic multi-zone traffic telemetry and predictive risk mapping.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
           {userLocation && (
             <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 font-mono text-[10px] shadow-xl">
                <Crosshair size={14} className="text-blue-400 animate-pulse" />
                <span>LOC: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
             </div>
           )}
           <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Grid Synchronized</span>
           </div>
        </div>
      </header>

      {/* Global Alert System */}
      {alert && (
        <div className={`p-6 rounded-[2.5rem] flex items-center gap-6 animate-bounce shadow-2xl border-4 ${
          alert.type === 'danger' ? 'bg-red-600 border-red-500 text-white' : 'bg-amber-500 border-amber-400 text-white'
        }`}>
           <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md">
             <AlertCircle size={32} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Intelligence Alert</p>
              <h4 className="text-xl font-black tracking-tight">{alert.msg}</h4>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {zones.map(zone => {
          const isCurrent = zone.zoneId === currentZoneId;
          const currentCongestion = Math.round(liveMetrics[zone.zoneId]?.congestionLevel || zone.congestionLevel);
          const currentSpeed = Math.round(liveMetrics[zone.zoneId]?.avgSpeed || zone.avgSpeed);

          return (
            <div 
              key={zone.zoneId} 
              className={`group bg-white p-8 rounded-[3.5rem] shadow-xl border-2 transition-all relative overflow-hidden ${
                isCurrent 
                ? 'border-blue-500 ring-4 ring-blue-500/10 scale-[1.03] z-10' 
                : 'border-slate-100 hover:scale-[1.02]'
              }`}
            >
               {/* Location Indicator */}
               {isCurrent && (
                 <div className="absolute top-6 left-6 flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse z-20 shadow-lg">
                    <Navigation size={10} fill="currentColor" /> You are here
                 </div>
               )}

               {/* Dynamic Background Indicator */}
               <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 translate-x-8 -translate-y-8 transition-transform group-hover:scale-110 ${isCurrent ? 'opacity-10 text-blue-600' : ''}`}>
                  <MapIcon size={128} />
               </div>

               <div className="flex justify-between items-start mb-8 pt-4">
                  <div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Zone {zone.zoneId}</span>
                     <h3 className={`text-xl font-black mt-1 ${isCurrent ? 'text-blue-600' : 'text-slate-900'}`}>{zone.zoneName}</h3>
                  </div>
                  <div className={`p-4 rounded-3xl ${zone.riskScore > 70 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                     <ShieldAlert size={24} className={zone.riskScore > 70 ? 'animate-pulse' : ''} />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Congestion</p>
                     <p className={`text-2xl font-black ${currentCongestion > 80 ? 'text-red-600' : 'text-slate-900'}`}>
                       {currentCongestion}%
                     </p>
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg Speed</p>
                     <p className="text-2xl font-black text-slate-900">{currentSpeed} <span className="text-xs">km/h</span></p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                     <span className="text-slate-500">Predicted Risk</span>
                     <span className={zone.riskScore > 70 ? 'text-red-600' : 'text-slate-900'}>{zone.riskScore}/100</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div 
                      className={`h-full transition-all duration-1000 ${zone.riskScore > 70 ? 'bg-red-600' : isCurrent ? 'bg-blue-600 shadow-[0_0_10px_#3b82f6]' : 'bg-slate-400'}`} 
                      style={{ width: `${zone.riskScore}%` }}
                     ></div>
                  </div>
               </div>

               <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Incidents</span>
                        <span className="text-sm font-black text-slate-900">{zone.activeIncidents} Active</span>
                     </div>
                  </div>
                  <button className={`p-3 rounded-2xl transition-all ${isCurrent ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-white hover:bg-blue-600'}`}>
                     <ArrowUpRight size={18} />
                  </button>
               </div>
            </div>
          );
        })}

        {/* Aggregate City Stat Card */}
        <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Grid3X3 size={120} />
           </div>
           
           <div>
              <h3 className="text-2xl font-black mb-2">City Aggregate</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Global Telemetry Pass</p>
           </div>

           <div className="space-y-6 my-10">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-white/10 rounded-[2rem] text-blue-400 shadow-inner"><Car size={32}/></div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fleet Density</p>
                    <p className="text-3xl font-black">12.4k <span className="text-sm font-normal text-slate-500">Vehicles</span></p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-white/10 rounded-[2rem] text-amber-400 shadow-inner"><Wind size={32}/></div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Grid Stability</p>
                    <p className="text-3xl font-black">Medium</p>
                 </div>
              </div>
           </div>

           <div className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem]">
              <div className="flex items-center gap-3 text-green-400 mb-2">
                 <TrendingUp size={18}/>
                 <span className="text-[10px] font-black uppercase tracking-widest">Efficiency Rating</span>
              </div>
              <p className="text-xl font-black">74.2% <span className="text-xs text-slate-500 font-normal">+1.2% Trend</span></p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CityGrid;
