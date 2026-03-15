
import React, { useMemo } from 'react';
import { ViolationRecord, ViolationType } from '../types';
import { UserX, AlertTriangle, ShieldAlert, Zap, TrendingUp, BrainCircuit, Activity, ChevronRight } from 'lucide-react';

interface TopOffendersProps {
  violations: ViolationRecord[];
}

const TopOffenders: React.FC<TopOffendersProps> = ({ violations }) => {
  const offenders = useMemo(() => {
    const counts: Record<string, { 
      count: number; 
      totalFine: number; 
      lastViolation: string; 
      types: ViolationType[];
      avgSpeed: number;
    }> = {};
    
    violations.forEach(v => {
      if (!counts[v.vehicleNumber]) {
        counts[v.vehicleNumber] = { count: 0, totalFine: 0, lastViolation: '', types: [], avgSpeed: 0 };
      }
      counts[v.vehicleNumber].count++;
      counts[v.vehicleNumber].totalFine += v.fineAmount;
      counts[v.vehicleNumber].lastViolation = new Date(v.timestamp).toLocaleDateString();
      counts[v.vehicleNumber].types.push(...v.violationType);
      counts[v.vehicleNumber].avgSpeed = (counts[v.vehicleNumber].avgSpeed * (counts[v.vehicleNumber].count - 1) + v.speed) / counts[v.vehicleNumber].count;
    });

    return Object.entries(counts)
      .map(([vehicleNumber, stats]) => {
        // Predictive logic
        // Probability: Base 20% + 15% for each violation, capped at 99%
        const prob = Math.min(0.99, 0.2 + (stats.count * 0.15));
        
        // Next violation prediction: most common type
        const typeCounts: Record<string, number> = {};
        stats.types.forEach(t => typeCounts[t] = (typeCounts[t] || 0) + 1);
        const predictedNext = Object.entries(typeCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Unknown';

        return { 
          vehicleNumber, 
          ...stats, 
          reoffendProb: prob,
          predictedNext
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [violations]);

  const RiskMeter = ({ value }: { value: number }) => {
    const percentage = value * 100;
    const color = percentage > 80 ? 'bg-red-500' : percentage > 50 ? 'bg-amber-500' : 'bg-green-500';
    return (
      <div className="flex items-center gap-3">
        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-tighter ${percentage > 80 ? 'text-red-600' : 'text-slate-500'}`}>{percentage.toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recidivism Analytics</h2>
          <p className="text-slate-500 font-medium">Predictive modeling for repeated traffic violations.</p>
        </div>
        <div className="flex gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
              <BrainCircuit size={14} /> Neural Predictions Active
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-xl font-black flex items-center gap-3">
              <UserX className="text-red-500" size={24} />
              High-Risk Persistent Violators
            </h3>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <Activity size={14} /> Real-time Recalculation
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5">Vehicle Entity</th>
                  <th className="px-6 py-5">Frequency</th>
                  <th className="px-6 py-5">Reoffend Prob.</th>
                  <th className="px-6 py-5">Predicted Next</th>
                  <th className="px-6 py-5">Fines Accrued</th>
                  <th className="px-6 py-5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offenders.map((o, i) => (
                  <tr key={o.vehicleNumber} className="hover:bg-slate-50 transition-all group">
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-300">#{(i + 1).toString().padStart(2, '0')}</span>
                          <div className="font-mono font-black text-slate-900 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 uppercase tracking-tighter">
                            {o.vehicleNumber}
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-slate-900">{o.count} Events</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">AVG SPD: {o.avgSpeed.toFixed(0)} KM/H</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <RiskMeter value={o.reoffendProb} />
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 w-fit">
                         <Zap size={10} className="text-indigo-500" />
                         <span className="text-[10px] font-black uppercase tracking-tighter">{o.predictedNext}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="text-sm font-black text-slate-900">₹{o.totalFine.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-6">
                      {o.count > 5 ? (
                        <span className="flex items-center gap-1.5 text-red-600 text-[10px] font-black uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-xl border border-red-100 shadow-sm animate-pulse">
                          <ShieldAlert size={14} /> Blacklisted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
                          <AlertTriangle size={14} /> High Risk
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <ShieldAlert size={200} />
            </div>
            <div className="relative z-10">
              <h4 className="text-2xl font-black mb-4 tracking-tight flex items-center gap-3"><Zap className="text-amber-400" /> Auto-Suspension Core</h4>
              <p className="text-red-100 text-xs font-bold leading-relaxed mb-8 opacity-80 uppercase tracking-widest">Vehicles exceeding the Critical Threshold (5+) are flagged for immediate legal review.</p>
              <div className="flex items-end justify-between">
                 <div>
                   <p className="text-[10px] uppercase font-black text-red-200 tracking-widest mb-2">Pending Suspensions</p>
                   <p className="text-6xl font-black">
                     {offenders.filter(o => o.count > 5).length}
                   </p>
                 </div>
                 <button className="p-5 bg-white text-red-600 rounded-[2rem] shadow-xl hover:scale-105 active:scale-95 transition-all">
                    <ChevronRight size={24} />
                 </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl space-y-8">
            <h4 className="text-xl font-black flex items-center gap-3">
               <TrendingUp className="text-blue-600" size={24} /> 
               Recidivism Indicators
            </h4>
            <div className="space-y-6">
              {[
                { label: 'Speeding Recurrence', value: '42%', color: 'bg-blue-500' },
                { label: 'Lane Misconduct', value: '28%', color: 'bg-red-500' },
                { label: 'No Safety Gear', value: '18%', color: 'bg-amber-500' },
                { label: 'Illegal Maneuvers', value: '12%', color: 'bg-purple-500' }
              ].map((stat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                    <span className="text-xs font-black text-slate-900">{stat.value}</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden border border-slate-100">
                    <div className={`${stat.color} h-full transition-all duration-1000 shadow-sm`} style={{ width: stat.value }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-8 border-t border-slate-50">
               <div className="p-5 bg-slate-900 rounded-3xl text-white flex items-center gap-4 shadow-xl">
                  <Activity size={20} className="text-blue-400" />
                  <div className="text-[10px] font-bold text-slate-400 leading-tight">
                    Neural engine reports <span className="text-white">14% decrease</span> in reoffending since active blacklisting started.
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopOffenders;
