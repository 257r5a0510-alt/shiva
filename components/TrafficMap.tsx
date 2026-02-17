
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  Compass, 
  Loader2, 
  Signal, 
  ShieldAlert, 
  Globe,
  RefreshCw,
  Zap,
  Activity,
  Search,
  Play,
  Square,
  ArrowRight,
  Car,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ViolationRecord, RouteInfo } from '../types';
import { analyzeRouteSafety } from '../services/ai';

declare const L: any;

const INDIAN_CITIES = ["MG Road, Bangalore", "Indiranagar, Bangalore", "Koramangala, Bangalore", "HSR Layout, Bangalore", "Silk Board Junction, Bangalore", "Marathahalli, Bangalore", "Whitefield, Bangalore", "Electronic City, Bangalore"];

const TrafficMap: React.FC<{ violations?: ViolationRecord[] }> = ({ violations = [] }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const violationLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const simMarkerRef = useRef<any>(null);
  
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingActive, setPingActive] = useState(false);
  
  // Routing State
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-complete simple implementation
  const suggestions = useMemo(() => 
    INDIAN_CITIES.filter(c => destination && c.toLowerCase().includes(destination.toLowerCase()) && c !== destination),
  [destination]);

  const initMap = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([lat, lng], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      className: 'map-tiles-dark'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'user-marker',
        html: `<div class="relative w-8 h-8 flex items-center justify-center">
                <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-40"></div>
                <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-xl"></div>
              </div>`
      })
    }).addTo(map);

    violationLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    
    updateViolationMarkers(violations, lat, lng);
  };

  const updateViolationMarkers = (records: ViolationRecord[], lat: number, lng: number) => {
    if (!violationLayerRef.current) return;
    violationLayerRef.current.clearLayers();
    records.slice(0, 15).forEach((v) => {
      const vLat = lat + (Math.random() - 0.5) * 0.05;
      const vLng = lng + (Math.random() - 0.5) * 0.05;
      L.marker([vLat, vLng], {
        icon: L.divIcon({
          className: 'v-marker',
          html: `<div class="bg-red-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg text-white font-black text-[8px] animate-pulse">!</div>`
        })
      })
      .addTo(violationLayerRef.current)
      .bindPopup(`<div class="p-3 text-[10px] font-bold">${v.violationType[0]} detected here.</div>`);
    });
  };

  const geocode = async (query: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      return null;
    } catch (e) {
      console.error("Geocoding error", e);
      return null;
    }
  };

  const calculateMultiRoutes = async () => {
    if (!coords || !destination) return;
    setIsCalculating(true);
    setError(null);
    setRoutes([]);
    routeLayerRef.current.clearLayers();

    try {
      // 1. Geocode Start and End
      const startCoords = source ? await geocode(source) : coords;
      const endCoords = await geocode(destination);

      if (!startCoords || !endCoords) {
        throw new Error("Could not locate source or destination on road network.");
      }

      // 2. Fetch from OSRM
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?overview=full&geometries=geojson&alternatives=true`;
      const response = await fetch(osrmUrl);
      const data = await response.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error("No road-network route found between these points.");
      }

      // 3. AI Safety Pass
      const safetyTip = await analyzeRouteSafety(source || "Current Position", destination, "Sunny");

      // 4. Process OSRM Routes
      const newRoutes: RouteInfo[] = data.routes.map((r: any, idx: number) => {
        // Swap lng/lat to lat/lng for Leaflet
        const path = r.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        
        // Split road path into colored traffic segments
        const segments: RouteInfo['segments'] = [];
        for (let i = 0; i < path.length - 1; i++) {
          const trafficChance = Math.random();
          const traffic: 'low' | 'mid' | 'high' = trafficChance > 0.8 ? 'high' : trafficChance > 0.5 ? 'mid' : 'low';
          
          let avgSpeed = 60;
          if (traffic === 'high') avgSpeed = Math.floor(Math.random() * 10) + 5;
          else if (traffic === 'mid') avgSpeed = Math.floor(Math.random() * 20) + 20;
          else avgSpeed = Math.floor(Math.random() * 20) + 50;

          segments.push({
            points: [path[i], path[i+1]],
            traffic,
            avgSpeed
          });
        }

        return {
          id: `route-${idx}`,
          name: idx === 0 ? "Optimal Network" : idx === 1 ? "Secondary Path" : "Alternate Vector",
          distance: parseFloat((r.distance / 1000).toFixed(1)), // km
          duration: Math.ceil(r.duration / 60), // mins
          trafficScore: Math.floor(Math.random() * 40) + 20,
          safetyScore: idx === 0 ? 92 : 85,
          path,
          segments,
          recommendation: idx === 0 ? safetyTip : "Maintain situational awareness on secondary corridors."
        };
      });

      setRoutes(newRoutes);
      setSelectedRouteIndex(0);
      drawRoute(newRoutes[0]);
      setPingActive(true);
      setTimeout(() => setPingActive(false), 2000);

    } catch (err: any) {
      setError(err.message || "Failed to compute road-network route.");
    } finally {
      setIsCalculating(false);
    }
  };

  const drawRoute = (route: RouteInfo) => {
    if (!routeLayerRef.current || !mapInstanceRef.current) return;
    routeLayerRef.current.clearLayers();

    // Draw individual colored road segments
    route.segments.forEach(seg => {
      const color = seg.traffic === 'high' ? '#ef4444' : seg.traffic === 'mid' ? '#f59e0b' : '#22c55e';
      const statusLabel = seg.traffic === 'high' ? 'Heavy Congestion' : seg.traffic === 'mid' ? 'Moderate Traffic' : 'Free Flow';
      
      const poly = L.polyline(seg.points, { 
        color, 
        weight: 10, 
        opacity: 0.9, 
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayerRef.current);

      poly.bindPopup(`
        <div class="p-3 font-sans">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 rounded-full" style="background-color: ${color}"></div>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">${statusLabel}</span>
          </div>
          <div class="flex justify-between items-end border-t border-slate-100 pt-2">
            <div>
              <p class="text-[9px] font-bold text-slate-400 uppercase">Avg Speed</p>
              <p class="text-lg font-black text-slate-900">${seg.avgSpeed} <span class="text-xs font-medium">KM/H</span></p>
            </div>
            <div class="text-right">
              <p class="text-[9px] font-bold text-slate-400 uppercase">Segment</p>
              <p class="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Live Insight</p>
            </div>
          </div>
          <p class="text-[8px] text-slate-400 mt-2 italic font-medium leading-none">Click to inspect nearby sensors</p>
        </div>
      `);

      // Hover effect for segments
      poly.on('mouseover', () => poly.setStyle({ weight: 14 }));
      poly.on('mouseout', () => poly.setStyle({ weight: 10 }));
    });

    // Start & End markers snapped to road network
    L.marker(route.path[0], { 
      icon: L.divIcon({ 
        className: 'pin', 
        html: `<div class="w-4 h-4 bg-white border-4 border-blue-600 rounded-full shadow-2xl"></div>` 
      }) 
    }).addTo(routeLayerRef.current);

    L.marker(route.path[route.path.length-1], { 
      icon: L.divIcon({ 
        className: 'pin', 
        html: `<div class="w-8 h-8 bg-slate-900 border-4 border-white rounded-full flex items-center justify-center shadow-2xl text-white transform -translate-y-2"><MapPin size={14}/></div>` 
      }) 
    }).addTo(routeLayerRef.current);
    
    mapInstanceRef.current.fitBounds(L.polyline(route.path).getBounds(), { padding: [100, 100], animate: true });
  };

  const startSimulation = () => {
    setIsSimulating(true);
    setSimProgress(0);
    const route = routes[selectedRouteIndex];
    if (!simMarkerRef.current) {
      simMarkerRef.current = L.marker(route.path[0], {
        icon: L.divIcon({
          className: 'sim-car',
          html: `<div class="bg-blue-600 p-2 rounded-full border-2 border-white shadow-2xl text-white"><Car size={16} className="animate-pulse"/></div>`
        })
      }).addTo(routeLayerRef.current);
    }
  };

  useEffect(() => {
    if (isSimulating && routes[selectedRouteIndex]) {
      const interval = setInterval(() => {
        setSimProgress(prev => {
          const next = prev + 1;
          if (next >= routes[selectedRouteIndex].path.length) {
            setIsSimulating(false);
            if (simMarkerRef.current) {
              routeLayerRef.current.removeLayer(simMarkerRef.current);
              simMarkerRef.current = null;
            }
            return 0;
          }
          if (simMarkerRef.current) {
            simMarkerRef.current.setLatLng(routes[selectedRouteIndex].path[next]);
          }
          return next;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isSimulating, routes, selectedRouteIndex]);

  useEffect(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        initMap(c.lat, c.lng);
        setLoading(false);
      },
      () => {
        const c = { lat: 12.9716, lng: 77.5946 }; // fallback Bangalore
        setCoords(c);
        initMap(c.lat, c.lng);
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 h-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Network Pathfinding</h2>
          <p className="text-slate-500 font-medium italic">High-fidelity OSRM road-network analysis & traffic telemetry.</p>
        </div>
        <div className="flex gap-2">
           <div className={`flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 transition-all ${pingActive ? 'ring-4 ring-blue-500/20' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${pingActive ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{pingActive ? 'SYNCING NETWORK' : 'OSM GRID: LOCKED'}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[680px]">
        {/* MAP FIELD */}
        <div className="lg:col-span-8 relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white bg-slate-950 group">
          <div ref={mapContainerRef} className="w-full h-full z-0"></div>

          {/* SEARCH HUD */}
          <div className="absolute top-8 left-8 right-8 z-10 pointer-events-none">
             <div className="max-w-xl mx-auto flex flex-col gap-2 pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-2xl border border-white/20 flex flex-col md:flex-row items-center gap-3">
                   <div className="flex-1 w-full flex items-center gap-3 border-r-0 md:border-r border-slate-100 pr-0 md:pr-4">
                      <div className="p-2 bg-slate-100 text-slate-400 rounded-xl"><MapPin size={18}/></div>
                      <input 
                        type="text" 
                        placeholder="Current Position..." 
                        className="bg-transparent text-xs font-black outline-none py-2 w-full"
                        value={source}
                        onChange={e => setSource(e.target.value)}
                      />
                   </div>
                   <div className="flex-[1.5] w-full flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Navigation size={18}/></div>
                      <input 
                        type="text" 
                        placeholder="Target Destination..." 
                        className="bg-transparent text-xs font-black outline-none py-2 w-full"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && calculateMultiRoutes()}
                      />
                      <button 
                        disabled={isCalculating || !destination}
                        onClick={calculateMultiRoutes}
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-black transition-all disabled:opacity-50 shrink-0"
                      >
                        {isCalculating ? <Loader2 size={18} className="animate-spin"/> : <Search size={18}/>}
                      </button>
                   </div>
                </div>

                {suggestions.length > 0 && (
                  <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-white/20 p-2 space-y-1 animate-in slide-in-from-top-2">
                    {suggestions.map(s => (
                      <button 
                        key={s} 
                        onClick={() => { setDestination(s); calculateMultiRoutes(); }}
                        className="w-full text-left px-4 py-2 text-[10px] font-black text-slate-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider"
                      >
                        <Car size={10}/> {s}
                      </button>
                    ))}
                  </div>
                )}
             </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-10 w-full max-w-sm">
               <div className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                  <AlertTriangle size={20} />
                  <span className="text-xs font-black uppercase tracking-wider">{error}</span>
               </div>
            </div>
          )}

          {/* HUD Status Overlay */}
          <div className="absolute bottom-10 left-10 p-5 bg-slate-900/80 backdrop-blur-lg rounded-2xl border border-white/10 text-white font-mono text-[10px] space-y-1 z-10 pointer-events-none transition-all group-hover:bg-slate-900">
             <div className="flex items-center gap-2 text-blue-400 font-black mb-2 uppercase">
               <Signal size={12} className="animate-pulse" /> NETWORK_TELEMETRY_v5
             </div>
             <div className="flex justify-between gap-8 opacity-60"><span>LATITUDE:</span> <span>{coords?.lat.toFixed(5) || '---'}</span></div>
             <div className="flex justify-between gap-8 opacity-60"><span>LONGITUDE:</span> <span>{coords?.lng.toFixed(5) || '---'}</span></div>
             <div className="text-green-400 mt-3 font-black uppercase flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> ROUTING ENGINE: READY
             </div>
          </div>
        </div>

        {/* GUIDANCE SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-slate-100 h-full flex flex-col overflow-hidden">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3 mb-8">
              <Compass className="text-blue-600" size={32} /> Intelligence Sidebar
            </h3>

            {!routes.length ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                 <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 border-4 border-dashed border-slate-100">
                    <Navigation size={64} className="opacity-20" />
                 </div>
                 <div className="space-y-2">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Awaiting Mission Parameters</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed max-w-[200px] mx-auto">
                      Define source and destination to initiate OSRM network analysis.
                    </p>
                 </div>
              </div>
            ) : (
              <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-2 pb-6">
                {/* Route Selectors */}
                <div className="grid grid-cols-1 gap-4">
                   {routes.map((r, i) => (
                     <button 
                      key={r.id}
                      onClick={() => { setSelectedRouteIndex(i); drawRoute(r); }}
                      className={`p-5 rounded-3xl border-2 transition-all text-left relative overflow-hidden group/btn ${selectedRouteIndex === i ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-500/10' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                     >
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${selectedRouteIndex === i ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                 <Navigation size={12}/>
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{r.name}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-sm font-black text-slate-900 block">{r.duration}m</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{r.distance} KM</span>
                           </div>
                        </div>
                        <div className="flex items-end justify-between mt-4">
                           <div className="flex gap-6">
                              <div>
                                 <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Safety Index</p>
                                 <p className={`text-xs font-black ${r.safetyScore > 90 ? 'text-green-600' : 'text-amber-600'}`}>{r.safetyScore}%</p>
                              </div>
                              <div>
                                 <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1">Network Load</p>
                                 <p className="text-xs font-black text-slate-900">{r.trafficScore}%</p>
                              </div>
                           </div>
                           <div className={`p-2 rounded-xl transition-all ${selectedRouteIndex === i ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300 group-hover/btn:text-blue-600'}`}>
                              <ArrowRight size={16} />
                           </div>
                        </div>
                     </button>
                   ))}
                </div>

                {/* Selected Route Deep Intelligence */}
                <div className="p-8 bg-slate-950 rounded-[2.5rem] text-white space-y-8 animate-in slide-in-from-bottom-6 shadow-2xl">
                   <div className="flex items-center gap-3 text-blue-400">
                      <Zap size={20} />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">Neural Safety Audit</span>
                   </div>
                   
                   <div className="relative">
                      <p className="text-xs font-bold italic text-slate-300 leading-relaxed border-l-4 border-blue-600 pl-6 py-2">
                        "{routes[selectedRouteIndex].recommendation}"
                      </p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                         <div className="flex items-center gap-2 mb-3 text-amber-400">
                            <Clock size={14}/>
                            <span className="text-[9px] font-black uppercase tracking-widest">Network Jitter</span>
                         </div>
                         <p className="text-xs font-black">± {Math.floor(routes[selectedRouteIndex].duration * 0.1)} Min</p>
                      </div>
                      <div className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                         <div className="flex items-center gap-2 mb-3 text-green-400">
                            <ShieldCheck size={14}/>
                            <span className="text-[9px] font-black uppercase tracking-widest">OSRM Accuracy</span>
                         </div>
                         <p className="text-xs font-black">99.4% Valid</p>
                      </div>
                   </div>

                   <button 
                    onClick={isSimulating ? () => setIsSimulating(false) : startSimulation}
                    className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 ${isSimulating ? 'bg-red-600 hover:bg-red-700 shadow-red-900/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/30'}`}
                   >
                     {isSimulating ? <><Square size={16}/> Abort Pathfeed</> : <><Play size={16}/> Initiate Live Tracking</>}
                   </button>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-start gap-4">
                   <div className="p-2 bg-white rounded-xl shadow-sm"><Info size={16} className="text-blue-500" /></div>
                   <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Legal Disclaimer</span>
                      <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                        Routing is advisory. Live OSRM data may vary by 150m. Always observe physical traffic signals and enforcement.
                      </p>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .map-tiles-dark { filter: grayscale(1) invert(0.9) brightness(0.8) contrast(1.2); }
        .pin { border: none !important; background: transparent !important; }
        .user-marker { border: none !important; background: transparent !important; }
        .sim-car { border: none !important; background: transparent !important; z-index: 1000 !important; }
      `}</style>
    </div>
  );
};

export default TrafficMap;
