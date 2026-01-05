
import React, { useState } from 'react';
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
  Percent
} from 'lucide-react';

interface ViolationHistoryProps {
  violations: ViolationRecord[];
  onRefresh?: () => void;
}

const ViolationHistory: React.FC<ViolationHistoryProps> = ({ violations, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filteredViolations = violations.filter(v => 
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.violationType.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
    v.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Evidence Vault</h2>
          <p className="text-slate-500">Structured repository for high-fidelity violation management.</p>
        </div>
        <button 
          onClick={exportViolationsCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Filter by vehicle, location, or violation type..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Evidence</th>
                <th className="px-6 py-4">Context</th>
                <th className="px-6 py-4">AI Score</th>
                <th className="px-6 py-4">Vehicle No.</th>
                <th className="px-6 py-4">Violation Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredViolations.map((v) => (
                <tr key={v.violationId} className={`hover:bg-slate-50 transition-colors group ${v.requiresReview ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    {v.evidenceImage ? (
                      <div 
                        onClick={() => setSelectedImage(v.evidenceImage || null)}
                        className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 cursor-zoom-in border border-slate-200 group relative shadow-sm"
                      >
                        <img src={v.evidenceImage} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Evidence" />
                      </div>
                    ) : (
                      <div className="w-14 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <MapPin size={12} className="text-blue-500" /> {v.location}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                        <span>LANE {v.lane}</span>
                        <span className="flex items-center gap-1"><Cloud size={10} /> {v.weather}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                       <div className={`flex items-center gap-1 text-[11px] font-black ${v.requiresReview ? 'text-amber-600' : 'text-green-600'}`}>
                          <Percent size={10} /> {(v.confidenceScore * 100).toFixed(0)}%
                       </div>
                       {v.requiresReview && (
                         <div className="flex items-center gap-1 text-[9px] text-amber-500 font-black uppercase tracking-tighter">
                            <ShieldAlert size={10} /> REVIEW REQ.
                         </div>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded w-fit text-sm border border-slate-200 uppercase tracking-tighter">
                      {v.vehicleNumber}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{v.vehicleType}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {v.violationType.map((type, idx) => (
                        <span key={idx} className="bg-red-50 text-red-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">
                          {type}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-500 font-bold uppercase">{v.speed} km/h • {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       <span className="text-[10px] font-black text-slate-900">₹{v.fineAmount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(v.status)}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className="bg-transparent text-[10px] font-bold text-blue-600 outline-none cursor-pointer hover:underline"
                      value={v.status}
                      onChange={(e) => handleStatusChange(v.violationId, e.target.value as RecordStatus)}
                    >
                      <option value="Pending">Set Pending</option>
                      <option value="Paid">Mark Paid</option>
                      <option value="Disputed">Flag Disputed</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-700">
             <img src={selectedImage} className="max-w-full max-h-[80vh] object-contain" alt="Evidence Large" />
             <div className="p-4 bg-slate-900 flex justify-between items-center">
                <p className="text-white font-mono text-xs tracking-widest opacity-60">FORENSIC EVIDENCE CAPTURE</p>
                <button className="text-white bg-slate-700 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-600 transition-colors">Close View</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViolationHistory;
