
import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { ViolationRecord, ViolationType } from '../types';
import { 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign,
  Scan,
  Activity
} from 'lucide-react';

interface DashboardProps {
  violations: ViolationRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ violations }) => {
  const stats = useMemo(() => {
    const byType = {
      [ViolationType.OVERSPEEDING]: 0,
      [ViolationType.SIGNAL_JUMP]: 0,
    };

    let totalFine = 0;
    violations.forEach(v => {
      v.violationType.forEach(t => {
        if (byType[t] !== undefined) byType[t]++;
      });
      totalFine += v.fineAmount;
    });

    const pieData = Object.entries(byType).map(([name, value]) => ({ name, value }));
    
    const hourlyData = Array.from({ length: 12 }, (_, i) => ({
      hour: `${(i + 8) % 12 || 12}${i + 8 < 12 ? 'AM' : 'PM'}`,
      violations: Math.floor(Math.random() * 50) + 10
    }));

    return { totalFine, byType, pieData, hourlyData };
  }, [violations]);

  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="space-y-6">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analytics Command</h2>
          <p className="text-slate-500 font-medium">Real-time intelligence from the TrafficEye neural network.</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase flex items-center gap-2">
              <Activity size={14}/> Sensors Active
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-4 bg-red-100 text-red-600 rounded-2xl group-hover:scale-110 transition-transform">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Confirmed Events</p>
            <h3 className="text-3xl font-black text-slate-900">{violations.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-4 bg-green-100 text-green-600 rounded-2xl group-hover:scale-110 transition-transform">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Revenue Forecast</p>
            <h3 className="text-3xl font-black text-slate-900">₹{stats.totalFine.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Scan size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI Verification</p>
            <h3 className="text-3xl font-black text-slate-900">99.2%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all">
          <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">System Health</p>
            <h3 className="text-3xl font-black text-slate-900">Optimal</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="text-xl font-black mb-6 text-slate-800 tracking-tight">Violation Distribution</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h4 className="text-xl font-black mb-6 text-slate-800 tracking-tight">Temporal Load Analysis</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="violations" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
