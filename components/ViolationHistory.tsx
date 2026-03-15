
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ViolationRecord, RecordStatus } from '../types';
import { updateViolationStatus, exportViolationsCSV } from '../services/storage';
import { 
  Search, 
  Download, 
  Image as ImageIcon, 
  MapPin, 
  Cloud, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ShieldAlert,
  Percent,
  BarChart2,
  Map as MapIcon,
  Tag,
  Link as LinkIcon,
  // Added missing Activity icon import from lucide-react
  Activity
} from 'lucide-react';

declare const L: any;

interface ViolationHistoryProps {
  violations: ViolationRecord[];
  onRefresh?: () => void;
}

const MiniMap: React.FC<{ lat: number; lng: number; id: string }> = ({ lat, lng, id }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false
      }).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        className: 'map-tiles-dark'
      }).addTo(mapInstance.current);

      L.circleMarker([lat, lng], {
        radius: 6,
        fillColor: "#ef4444",
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(mapInstance.current);
    }
  }, [lat, lng]);

  return <div ref={mapRef} className="w-24 h-16 rounded-lg border border-slate-200 shadow-sm overflow-hidden bg-slate-100" />;
};

const ViolationHistory: React.FC<ViolationHistoryProps> = ({ violations, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredViolations = useMemo(() => {
    return violations.filter(v => 
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.violationType.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [violations, searchTerm]);

  // Duplicate vehicle detection map
  const vehicleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    violations.forEach(v => {
      counts[v.vehicleNumber] = (counts[v.vehicleNumber] || 0) + 1;
    });
    return counts;
  }, [violations]);

  const handleStatusChange = (id: string, status: RecordStatus) => {
    updateViolationStatus(id, status);
    if (onRefresh) onRefresh();
  };

  const getStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case 'Paid': return <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold border border-green-100"><CheckCircle2 size={10} /> Paid</span>;
      case 'Disputed': return <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-100"><AlertCircle size={10} /> Disputed</span>;
      default: return <span className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold border border-amber-100"><Clock size={10} /> Pending</span>;
    }
  };

  const ConfidenceBar = ({ label, value, colorClass }: { label: string, value: number, colorClass: string }) => (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
        <span>{label}</span>
        <span>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-24">
        <div className={`h-full ${colorClass}`} style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Evidence Vault</h2>
          <p className="text-slate-500 font-medium">Forensic repository with geospatial telemetry.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={exportViolationsCSV}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 text-xs font-black uppercase tracking-widest"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Vehicle Number, Violation ID, or Location..." 
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5">Evidence / Geotag</th>
                <th className="px-6 py-5">AI Confidence Breakdown</th>
                <th className="px-6 py-5">Vehicle Entity</th>
                <th className="px-6 py-5">Violation Intelligence</th>
                <th className="px-6 py-5">Lifecycle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredViolations.map((v) => (
                <tr key={v.violationId} className={`hover:bg-slate-50/80 transition-all group ${v.requiresReview ? 'bg-amber-50/40' : ''}`}>
                  <td className="px-6 py-6 min-w-[300px]">
                    <div className="flex gap-4">
                      <div className="relative">
                        {v.evidenceImage ? (
                          <div 
                            onClick={() => setSelectedImage(v.evidenceImage || null)}
                            className="w-20 h-16 rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in border border-slate-200 shadow-sm"
                          >
                            <img src={v.evidenceImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Evidence" />
                          </div>
                        ) : (
                          <div className="w-20 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 p-1 bg-white rounded-lg shadow-md border border-slate-100">
                          <MapIcon size={14} className="text-blue-600" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col justify-between py-1">
                        <MiniMap lat={v.geo?.lat || 17.3850} lng={v.geo?.lng || 78.4867} id={v.violationId} />
                        <div className="flex items-center gap-1.5 mt-2">
                          <MapPin size={10} className="text-blue-500" />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter truncate max-w-[120px]">
                            {v.location}
                          </span>
                        </div>
                        <p className="text-[8px] font-mono text-slate-400 mt-0.5">
                          {v.geo?.lat.toFixed(4)}, {v.geo?.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart2 size={14} className="text-blue-600" />
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Reliability: {((v.confidenceBreakdown?.overall || v.confidenceScore) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="space-y-1.5">
                        <ConfidenceBar label="Plate OCR" value={v.confidenceBreakdown?.ocr || 0.8} colorClass="bg-blue-500" />
                        <ConfidenceBar label="Classification" value={v.confidenceBreakdown?.classification || 0.9} colorClass="bg-indigo-500" />
                        <ConfidenceBar label="Violation Logic" value={v.confidenceBreakdown?.violation || 0.85} colorClass="bg-purple-500" />
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="font-mono font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl text-sm border border-slate-200 uppercase shadow-sm">
                          {v.vehicleNumber}
                        </div>
                        {vehicleCounts[v.vehicleNumber] > 1 && (
                          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[9px] font-black uppercase animate-pulse border border-amber-200">
                            <LinkIcon size={10} /> Repeat Vehicle
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{v.vehicleType}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(v.timestamp).toLocaleDateString()} • {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {v.violationType.map((type, idx) => (
                          <span key={idx} className="bg-red-500 text-white text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shadow-sm">
                            {type}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-900">
                        <div className="flex items-center gap-1 text-red-600">
                          {/* Fixed: Activity icon is now properly imported */}
                          <Activity size={12} /> {v.speed} KM/H
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                           LIMIT: {v.speedLimit}
                        </div>
                        <div className="ml-auto text-lg">₹{v.fineAmount}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center gap-4">
                      {getStatusBadge(v.status)}
                      <select 
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black text-blue-600 outline-none cursor-pointer hover:bg-white transition-all shadow-sm uppercase tracking-widest"
                        value={v.status}
                        onChange={(e) => handleStatusChange(v.violationId, e.target.value as RecordStatus)}
                      >
                        <option value="Pending">Process</option>
                        <option value="Paid">Archive Paid</option>
                        <option value="Disputed">Flag Dispute</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredViolations.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner">
                      <Search size={32} className="text-slate-300" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No Evidence Logs Found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl w-full bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-slate-800" onClick={e => e.stopPropagation()}>
             <img src={selectedImage} className="w-full h-auto max-h-[75vh] object-contain" alt="Evidence Large" />
             <div className="p-8 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                <div>
                   <h3 className="text-white font-black text-xl tracking-tight">Forensic Evidence #EX-{Math.floor(Math.random()*10000)}</h3>
                   <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">High-Resolution Digital Forensic Capture</p>
                </div>
                <div className="flex gap-4">
                   <button className="bg-slate-800 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">Enhance Frame</button>
                   <button onClick={() => setSelectedImage(null)} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">Dismiss View</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationHistory;
