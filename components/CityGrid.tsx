
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  Grid3X3, 
  Map as MapIcon, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  Car,
  Wind,
  ShieldAlert,
  ArrowUpRight,
  Navigation,
  Crosshair,
  AlertCircle,
  Settings2,
  LocateFixed,
  Info,
  Loader2
} from 'lucide-react';
import { AreaIntelligence } from '../types';

declare const L: any;

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CityGrid: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(100);
  const [currentZoneId, setCurrentZoneId] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, Partial<AreaIntelligence>>>({});
  const [alert, setAlert] = useState<{ msg: string; type: 'danger' | 'warning' } | null>(null);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const radiusCircleRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const allZones = useMemo<AreaIntelligence[]>(() => [
    { zoneId: 'H1', zoneName: 'Madhapur / Hitech City', congestionLevel: 88, riskScore: 75, activeIncidents: 3, avgSpeed: 15, boundary: [17.44, 78.37, 17.46, 78.39] },
    { zoneId: 'H2', zoneName: 'Gachibowli Corridor', congestionLevel: 82, riskScore: 68, activeIncidents: 2, avgSpeed: 18, boundary: [17.43, 78.33, 17.45, 78.36] },
    { zoneId: 'H3', zoneName: 'Banjara Hills', congestionLevel: 75, riskScore: 60, activeIncidents: 1, avgSpeed: 22, boundary: [17.40, 78.43, 17.42, 78.45] },
    { zoneId: 'H4', zoneName: 'Kukatpally Industrial', congestionLevel: 90, riskScore: 82, activeIncidents: 5, avgSpeed: 10, boundary: [17.48, 78.39, 17.50, 78.41] },
    { zoneId: 'H5', zoneName: 'Charminar / Old City', congestionLevel: 95, riskScore: 88, activeIncidents: 4, avgSpeed: 8, boundary: [17.35, 78.47, 17.37, 78.49] },
    { zoneId: 'H6', zoneName: 'Secunderabad Station', congestionLevel: 85, riskScore: 70, activeIncidents: 2, avgSpeed: 12, boundary: [17.43, 78.49, 17.45, 78.51] }
  ], []);

  const nearbyZones = useMemo(() => {
    if (!userLocation) return allZones;
    return allZones.filter(z => {
      if (!z.boundary) return false;
      const centerLat = (z.boundary[0] + z.boundary[2]) / 2;
      const centerLng = (z.boundary[1] + z.boundary[3]) / 2;
      return getDistance(userLocation.lat, userLocation.lng, centerLat, centerLng) <= searchRadius;
    });
  }, [allZones, userLocation, searchRadius]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const initialLat = 17.3850;
    const initialLng = 78.4867;
    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([initialLat, initialLng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap', className: 'map-tiles-dark' }).addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => { if (mapRef.current) mapRef.current.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;
    const map = mapRef.current;
    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current);
    radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], { radius: searchRadius * 1000, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2, dashArray: '5, 10' }).addTo(map);
    markersLayerRef.current.clearLayers();
    nearbyZones.forEach(z => {
      const centerLat = (z.boundary![0] + z.boundary![2]) / 2;
      const centerLng = (z.boundary![1] + z.boundary![3]) / 2;
      L.marker([centerLat, centerLng], { icon: L.divIcon({ className: 'custom-marker', html: `<div class="p-2 rounded-full border-2 ${z.riskScore > 70 ? 'bg-red-50 border-white' : 'bg-blue-600 border-white'} shadow-xl text-white"><div class="w-2 h-2 rounded-full bg-white"></div></div>` }) }).addTo(markersLayerRef.current).bindPopup(`<div class="p-2 font-black text-xs uppercase">${z.zoneName}</div>`);
    });
    map.setView([userLocation.lat, userLocation.lng], map.getZoom());
  }, [userLocation, searchRadius, nearbyZones]);

  useEffect(() => {
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        const zone = allZones.find(z => {
          const [minLat, minLng, maxLat, maxLng] = z.boundary!;
          return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
        });
        if (zone) {
          if (zone.zoneId !== currentZoneId) {
            setCurrentZoneId(zone.zoneId);
            if (zone.riskScore > 70) setAlert({ msg: `HIGH RISK: ${zone.zoneName.toUpperCase()}`, type: 'danger' });
            else if (zone.congestionLevel > 80) setAlert({ msg: `HEAVY CONGESTION: ${zone.zoneName.toUpperCase()}`, type: 'warning' });
            else setAlert(null);
          }
        } else { setCurrentZoneId(null); setAlert(null); }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, [allZones, currentZoneId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Hyderabad City Grid</h2>
          <p className="text-slate-500 font-medium italic">Multi-zone telemetry for the Hyderabad Metropolitan Grid.</p>
        </div>
        {userLocation && (
          <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 font-mono text-[10px] shadow-xl">
            <Crosshair size={14} className="text-blue-400 animate-pulse" />
            <span>HYD_LOC: {userLocation.lat?.toFixed(4)}, {userLocation.lng?.toFixed(4)}</span>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[500px]">
        <div className="lg:col-span-12 bg-white p-2 rounded-[3.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
          <div ref={mapContainerRef} className="w-full h-full rounded-[3rem] z-0"></div>
          {!userLocation && (
             <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Syncing Hyderabad Grid...</p>
             </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {nearbyZones.map(zone => (
          <div key={zone.zoneId} className={`p-8 rounded-[3rem] shadow-xl border-2 transition-all relative overflow-hidden bg-white ${zone.zoneId === currentZoneId ? 'border-blue-500 scale-[1.02]' : 'border-slate-100'}`}>
             <h3 className="text-xl font-black">{zone.zoneName}</h3>
             <div className="grid grid-cols-2 gap-4 mt-6">
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Congestion</p><p className="text-2xl font-black">{zone.congestionLevel}%</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase">Avg Speed</p><p className="text-2xl font-black">{zone.avgSpeed} <span className="text-xs">km/h</span></p></div>
             </div>
             <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${zone.riskScore > 70 ? 'text-red-500' : 'text-green-500'}`}>Risk Score: {zone.riskScore}</span>
                <div className="p-3 bg-slate-900 text-white rounded-2xl"><ArrowUpRight size={18} /></div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CityGrid;
