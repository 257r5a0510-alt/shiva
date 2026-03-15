
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { ViolationRecord, WeatherState, CityIntelligence } from '../types';
import { getHyderabadIntelligence } from '../services/ai';
import { 
  AlertCircle, Zap, ShieldAlert, Activity, Wind, CloudRain, Sun, 
  Navigation, TrendingUp, Cpu, Map as MapIcon, Droplets, Share2,
  Thermometer, Clock, Loader2, Cloud, Power
} from 'lucide-react';

interface DashboardProps {
  violations: ViolationRecord[];
  darkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ violations, darkMode }) => {
  const [cityIntel, setCityIntel] = useState<CityIntelligence | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntel = async () => {
      setLoading(true);
      const intel = await getHyderabadIntelligence();
      if (intel) setCityIntel(intel);
      setLoading(false);
    };
    fetchIntel();
  }, []);

  const stats = useMemo(() => {
    const totalAggression = violations.reduce((acc, v) => acc + (v.aggressionScore || 0), 0);
    const avgAggression = violations.length ? (totalAggression / violations.length).toFixed(1) : 0;
    
    const trafficDensity = 0.65;
    const riskScore = (trafficDensity * 40) + (violations.length * 0.3) + (Number(avgAggression) * 0.3);

    const hourlyData = Array.from({ length: 12 }, (_, i) => ({
      time: `${i + 8}:00`,
      aggression: Math.floor(Math.random() * 40) + 20,
      risk: Math.floor(Math.random() * 50) + 30
    }));

    return { avgAggression, riskScore, hourlyData };
  }, [violations]);

  const handleShareReport = async () => {
    const shareData = {
      title: 'TrafficEye Hyderabad City Safety Report',
      text: `Hyderabad Smart City Intelligence Update:\n- Risk Index: ${stats.riskScore.toFixed(0)}%\n- Aggression Level: ${stats.avgAggression}%\n- Weather: ${cityIntel?.current_weather.condition || 'N/A'} (${cityIntel?.current_weather.temperature || 'N/A'})\nShared from TrafficEye Command Center.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    } else {
      navigator.clipboard.writeText(shareData.text);
      alert('Report text copied to clipboard.');
    }
  };

  const currentCondition = cityIntel?.current_weather.condition || 'Sunny';

  const themeClasses: Record<string, string> = {
    Sunny: darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-amber-50/40 border-amber-200 shadow-amber-900/5',
    Rainy: 'bg-slate-900 border-slate-700 text-white',
    Foggy: darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-zinc-100 border-zinc-200 text-slate-900',
    Cloudy: darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900',
    Clear: darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-blue-50/40 border-blue-200'
  };

  const headerIcon = () => {
    switch (currentCondition) {
      case 'Rainy': return <CloudRain size={32} />;
      case 'Sunny': return <Sun size={32} />;
      case 'Cloudy': return <Cloud size={32} />;
      default: return <Wind size={32} />;
    }
  };

  return (
    <div className={`space-y-8 transition-all duration-1000 p-10 rounded-[4rem] border ${themeClasses[currentCondition] || themeClasses['Sunny']}`}>
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className={`p-6 rounded-[2rem] shadow-2xl ${currentCondition === 'Rainy' ? 'bg-blue-600' : 'bg-slate-900'} text-white transition-all transform hover:rotate-6 active:scale-95 cursor-pointer`}>
            {headerIcon()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black tracking-tighter">Hyderabad Intelligence</h2>
              <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-1.5">
                <Power size={8} className="animate-pulse" /> Live Telemetry
              </div>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1 flex items-center gap-2">
              {loading ? <Loader2 size={10} className="animate-spin" /> : <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>}
              System Snapshot: {cityIntel?.current_weather.last_updated || 'Synchronizing Neural Link...'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          {cityIntel && (
            <div className={`flex gap-6 p-5 rounded-[2.5rem] border shadow-sm grow lg:grow-0 transition-all ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/10 backdrop-blur-md border-white/20'}`}>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl"><Thermometer size={18} className="text-blue-500" /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black opacity-40 uppercase">Temp</p>
                    <p className="text-sm font-black tracking-tight">{cityIntel.current_weather.temperature}</p>
                  </div>
               </div>
               <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-xl"><Droplets size={18} className="text-indigo-500" /></div>
                  <div className="text-right">
                    <p className="text-[10px] font-black opacity-40 uppercase">Humidity</p>
                    <p className="text-sm font-black tracking-tight">{cityIntel.current_weather.humidity}</p>
                  </div>
               </div>
            </div>
          )}
          <button 
            onClick={handleShareReport}
            className="bg-slate-900 text-white hover:bg-black px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 transition-all active:scale-95 grow lg:grow-0 justify-center group"
          >
             <Share2 size={18} className="text-blue-400 group-hover:rotate-12 transition-transform" />
             <span className="text-xs font-black uppercase tracking-widest">Broadcast Data</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Aggression Score', value: stats.avgAggression, sub: '+2.4%', color: 'text-red-500', icon: TrendingUp, progress: stats.avgAggression },
          { label: 'Traffic Load', value: '65%', sub: 'High Density', color: 'text-amber-500', bars: 4 },
          { label: 'Active Violations', value: violations.length, sub: 'Real-time Feed', color: 'text-blue-600', icon: Zap },
          { label: 'System Health', value: '98.4%', sub: 'Neural v4.2 Stable', color: 'text-blue-600', icon: Cpu }
        ].map((card, idx) => (
          <div key={idx} className={`p-8 rounded-[3.5rem] shadow-2xl border transition-all hover:scale-[1.02] cursor-default ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 backdrop-blur-md border-white/20'}`}>
            <p className="text-[10px] font-black opacity-40 uppercase mb-4 tracking-widest">{card.label}</p>
            <div className="flex items-end gap-2">
              <h3 className={`text-5xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{card.value}</h3>
              {card.sub && <span className={`text-[10px] font-bold mb-2 flex items-center gap-1 ${card.color}`}>{card.icon && <card.icon size={12}/>} {card.sub}</span>}
            </div>
            {card.progress !== undefined && (
              <div className="mt-8 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${card.color.replace('text', 'bg')}`} style={{ width: `${card.progress}%` }}></div>
              </div>
            )}
            {card.bars && (
              <div className="mt-8 flex gap-1.5">
                {[1,2,3,4,5,6].map(i => <div key={i} className={`h-2 flex-1 rounded-full ${i <= card.bars ? 'bg-amber-400' : 'bg-slate-100 dark:bg-slate-700'}`}></div>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`lg:col-span-8 p-10 rounded-[4rem] shadow-2xl border transition-all ${darkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-white/90 backdrop-blur-md border-white/20'}`}>
          <div className="flex justify-between items-center mb-12">
            <h4 className={`text-2xl font-black tracking-tight flex items-center gap-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <Activity className="text-blue-600" size={32}/> Temporal Risk Analytics
            </h4>
            <div className="flex gap-3">
              <button className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-slate-200">24H</button>
              <button className="px-6 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">Live</button>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourlyData}>
                <defs>
                  <linearGradient id="colorAgg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#f1f5f9"} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: darkMode ? '#64748b' : '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: darkMode ? '#64748b' : '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '2rem', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', fontWeight: 800, backgroundColor: darkMode ? '#0f172a' : '#fff' }}
                />
                <Area type="monotone" dataKey="aggression" stroke="#ef4444" fillOpacity={1} fill="url(#colorAgg)" strokeWidth={4} />
                <Area type="monotone" dataKey="risk" stroke="#3b82f6" fill="transparent" strokeWidth={4} strokeDasharray="8 8" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 h-full">
          <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden h-full flex flex-col">
             <div className="absolute -right-12 -top-12 opacity-5">
                <MapIcon size={240} />
             </div>
             <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-12 flex items-center gap-4 text-blue-400">
               <Navigation size={20} className="animate-pulse" /> Area Risk Profiles
             </h4>
             
             <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar pr-4">
                {cityIntel?.areas.map(area => (
                  <div key={area.name} className="group hover:scale-105 transition-all duration-300">
                    <div className="flex justify-between text-[11px] font-black uppercase mb-4 tracking-wider">
                       <span className="group-hover:text-blue-400 transition-colors">{area.name}</span>
                       <span className={area.risk_level === 'High' ? 'text-red-500' : area.risk_level === 'Medium' ? 'text-amber-500' : 'text-green-500'}>
                         {area.risk_level} ({area.risk_percentage}%)
                       </span>
                    </div>
                    <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-white/5 ring-1 ring-white/5">
                       <div 
                        className={`h-full transition-all duration-1000 ${area.risk_level === 'High' ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]' : area.risk_level === 'Medium' ? 'bg-amber-500' : 'bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`} 
                        style={{ width: `${area.risk_percentage}%` }}
                       ></div>
                    </div>
                  </div>
                )) || (
                  <div className="flex flex-col items-center justify-center h-full opacity-40">
                     <Loader2 className="animate-spin mb-6" size={32} />
                     <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aggregating Hyderabad Grid Data...</p>
                  </div>
                )}
             </div>

             <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center gap-5">
                <div className="p-3 bg-white/5 rounded-2xl"><Clock size={20} className="text-slate-500" /></div>
                <div className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                   Next recalibration in: <span className="text-white">12:04m</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
