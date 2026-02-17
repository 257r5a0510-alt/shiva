
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { ViolationRecord, WeatherState } from '../types';
import { 
  AlertCircle, Zap, ShieldAlert, Activity, Wind, CloudRain, Sun, 
  Navigation, TrendingUp, Cpu, Map as MapIcon, Droplets
} from 'lucide-react';

interface DashboardProps {
  violations: ViolationRecord[];
  weather?: WeatherState;
}

const Dashboard: React.FC<DashboardProps> = ({ violations, weather = 'Sunny' }) => {
  const stats = useMemo(() => {
    const totalAggression = violations.reduce((acc, v) => acc + (v.aggressionScore || 0), 0);
    const avgAggression = violations.length ? (totalAggression / violations.length).toFixed(1) : 0;
    
    // Risk Score Calculation
    const trafficDensity = 0.65; // Simulated
    const riskScore = (trafficDensity * 40) + (violations.length * 0.3) + (Number(avgAggression) * 0.3);

    const hourlyData = Array.from({ length: 12 }, (_, i) => ({
      time: `${i + 8}:00`,
      aggression: Math.floor(Math.random() * 40) + 20,
      risk: Math.floor(Math.random() * 50) + 30
    }));

    const weatherImpact = [
      { name: 'Sunny', count: violations.filter(v => v.weather === 'Sunny').length },
      { name: 'Rainy', count: violations.filter(v => v.weather === 'Rainy').length },
      { name: 'Foggy', count: violations.filter(v => v.weather === 'Foggy').length },
    ];

    return { avgAggression, riskScore, hourlyData, weatherImpact };
  }, [violations]);

  const themeClasses = {
    Sunny: 'bg-amber-50/30 border-amber-100',
    Rainy: 'bg-blue-50/30 border-blue-100',
    Foggy: 'bg-slate-100/50 border-slate-200',
    Night: 'bg-indigo-950/20 border-indigo-900',
    Cloudy: 'bg-zinc-100 border-zinc-200'
  };

  return (
    <div className={`space-y-8 transition-all duration-1000 p-6 rounded-[3rem] ${themeClasses[weather]}`}>
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-3xl shadow-xl ${weather === 'Rainy' ? 'bg-blue-600' : 'bg-slate-900'} text-white`}>
            {weather === 'Rainy' ? <CloudRain size={32} /> : weather === 'Sunny' ? <Sun size={32} /> : <Wind size={32} />}
          </div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Command Intelligence</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Weather Sync: {weather} Condition</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Risk Index</p>
                <p className={`text-xl font-black ${stats.riskScore > 60 ? 'text-red-600' : 'text-green-600'}`}>
                   {stats.riskScore.toFixed(0)}%
                </p>
             </div>
             <ShieldAlert size={24} className={stats.riskScore > 60 ? 'text-red-500 animate-pulse' : 'text-green-500'} />
          </div>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:scale-105 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Aggression Score</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-900">{stats.avgAggression}</h3>
            <span className="text-xs font-bold text-red-500 mb-1 flex items-center"><TrendingUp size={12}/> +2.4%</span>
          </div>
          <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${stats.avgAggression}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Traffic Density</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-black text-slate-900">65%</h3>
            <span className="text-xs font-bold text-amber-500 mb-1">Heavy</span>
          </div>
          <div className="mt-4 flex gap-1">
             {[1,2,3,4,5].map(i => <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-amber-400' : 'bg-slate-100'}`}></div>)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Total Violations</p>
          <h3 className="text-4xl font-black text-slate-900">{violations.length}</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1"><Zap size={10} className="text-blue-500"/> Real-time Sync</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">AI Confidence</p>
          <h3 className="text-4xl font-black text-blue-600">98.4%</h3>
          <p className="text-[10px] text-slate-400 font-bold mt-2 flex items-center gap-1"><Cpu size={10}/> Neural Core Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Risk Analysis Chart */}
        <div className="lg:col-span-8 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="text-blue-600" size={24}/> Aggression vs Risk Timeline
            </h4>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold">12H</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold">LIVE</button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourlyData}>
                <defs>
                  <linearGradient id="colorAgg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="aggression" stroke="#ef4444" fillOpacity={1} fill="url(#colorAgg)" strokeWidth={3} />
                <Area type="monotone" dataKey="risk" stroke="#3b82f6" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Mini Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-10">
                <MapIcon size={120} />
             </div>
             <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-blue-400">
               <Navigation size={16}/> Area Risk Profile
             </h4>
             <div className="space-y-4">
                {[
                  { name: 'Mumbai North', risk: 82, color: 'bg-red-500' },
                  { name: 'Delhi Gate', risk: 45, color: 'bg-amber-500' },
                  { name: 'Bangalore Silk Board', risk: 94, color: 'bg-red-600' }
                ].map(area => (
                  <div key={area.name}>
                    <div className="flex justify-between text-[10px] font-black uppercase mb-2">
                       <span>{area.name}</span>
                       <span>{area.risk}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                       <div className={`h-full ${area.color}`} style={{ width: `${area.risk}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
             <h4 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-slate-400">
               <Droplets size={16} className="text-blue-500"/> Weather Correlation
             </h4>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.weatherImpact} dataKey="count" innerRadius={40} outerRadius={60} paddingAngle={5}>
                      <Cell fill="#f59e0b" />
                      <Cell fill="#3b82f6" />
                      <Cell fill="#94a3b8" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
