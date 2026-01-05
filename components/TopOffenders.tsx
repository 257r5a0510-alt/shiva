
import React, { useMemo } from 'react';
import { ViolationRecord } from '../types';
import { UserX, AlertTriangle, ShieldAlert } from 'lucide-react';

interface TopOffendersProps {
  violations: ViolationRecord[];
}

const TopOffenders: React.FC<TopOffendersProps> = ({ violations }) => {
  const offenders = useMemo(() => {
    const counts: Record<string, { count: number; totalFine: number; lastViolation: string }> = {};
    
    violations.forEach(v => {
      if (!counts[v.vehicleNumber]) {
        counts[v.vehicleNumber] = { count: 0, totalFine: 0, lastViolation: '' };
      }
      counts[v.vehicleNumber].count++;
      counts[v.vehicleNumber].totalFine += v.fineAmount;
      counts[v.vehicleNumber].lastViolation = new Date(v.timestamp).toLocaleDateString();
    });

    return Object.entries(counts)
      .map(([vehicleNumber, stats]) => ({ vehicleNumber, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [violations]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Recidivism Tracking</h2>
        <p className="text-slate-500">Identification of repeated traffic rule offenders.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <UserX className="text-red-500" size={20} />
              Top 10 Persistent Violators
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Vehicle Number</th>
                  <th className="px-6 py-4">Violations</th>
                  <th className="px-6 py-4">Total Fines</th>
                  <th className="px-6 py-4">Last Event</th>
                  <th className="px-6 py-4">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offenders.map((o, i) => (
                  <tr key={o.vehicleNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-400">#0{i + 1}</td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{o.vehicleNumber}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg font-bold">
                        {o.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">₹{o.totalFine.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{o.lastViolation}</td>
                    <td className="px-6 py-4">
                      {o.count > 3 ? (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-bold">
                          <ShieldAlert size={14} /> Critical
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-500 text-sm font-bold">
                          <AlertTriangle size={14} /> High
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-2xl text-white shadow-lg">
            <h4 className="text-lg font-bold mb-2">Automated Blacklist</h4>
            <p className="text-red-100 text-sm mb-4">Vehicles with more than 5 violations are automatically suggested for license suspension review.</p>
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <p className="text-xs uppercase font-bold text-red-200">Pending Reviews</p>
              <p className="text-2xl font-black">
                {offenders.filter(o => o.count > 5).length} Vehicles
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold mb-4">Violation Types by Recidivists</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Over-speeding</span>
                <span className="font-bold">42%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full">
                <div className="bg-blue-500 h-2 rounded-full w-[42%]"></div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Signal Jump</span>
                <span className="font-bold">28%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full">
                <div className="bg-red-500 h-2 rounded-full w-[28%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopOffenders;
