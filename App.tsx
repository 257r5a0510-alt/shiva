
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TrafficMap from './components/TrafficMap';
import ManualInputForm from './components/ManualInputForm';
import EnhancementLab from './components/EnhancementLab';
import ViolationHistory from './components/ViolationHistory';
import TopOffenders from './components/TopOffenders';
import SimulationDisplay from './components/SimulationDisplay';
import AIAssistant from './components/AIAssistant';
import RecommendationAI from './components/RecommendationAI';
import VideoAnalyzer from './components/VideoAnalyzer';
import CityGrid from './components/CityGrid';
import { getViolations } from './services/storage';
import { ViolationRecord, VehicleData, WeatherState } from './types';
import { Bell, Search, Settings, CloudRain, Sun, Wind, Cloud } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [weather, setWeather] = useState<WeatherState>('Sunny');
  const [notifications, setNotifications] = useState<number>(0);

  const refreshData = useCallback(() => {
    setViolations(getViolations());
  }, []);

  useEffect(() => {
    refreshData();
    // Simulate dynamic weather changes
    const weatherTimer = setInterval(() => {
      const states: WeatherState[] = ['Sunny', 'Rainy', 'Foggy', 'Cloudy'];
      setWeather(states[Math.floor(Math.random() * states.length)]);
    }, 60000);
    return () => clearInterval(weatherTimer);
  }, [refreshData]);

  const handleNewViolation = useCallback((violation: ViolationRecord) => {
    setViolations(prev => [violation, ...prev]);
    setNotifications(prev => prev + 1);
  }, []);

  const handleManualEntry = (violation: ViolationRecord | null, vehicle: VehicleData) => {
    if (violation) handleNewViolation(violation);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return (
        <div className="space-y-10">
          <Dashboard violations={violations} weather={weather} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <RecommendationAI violations={violations} />
             <AIAssistant violations={violations} />
          </div>
        </div>
      );
      case 'map': return <TrafficMap violations={violations} />;
      case 'video': return <VideoAnalyzer weather={weather} onViolationDetected={handleNewViolation} />;
      case 'grid': return <CityGrid />;
      case 'input': return <ManualInputForm onProcessed={handleManualEntry} />;
      case 'enhance': return <EnhancementLab />;
      case 'history': return <ViolationHistory violations={violations} onRefresh={refreshData} />;
      case 'offenders': return <TopOffenders violations={violations} />;
      case 'simulation': return <SimulationDisplay onViolationDetected={handleNewViolation} />;
      default: return <Dashboard violations={violations} weather={weather} />;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-1000 flex ${weather === 'Rainy' ? 'bg-slate-200/50' : 'bg-slate-50'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-10 relative">
        {/* Weather Effects Overlays */}
        {weather === 'Rainy' && <div className="fixed inset-0 pointer-events-none z-50 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/rain.png')] animate-[slide_10s_linear_infinite]"></div>}
        
        <nav className="flex justify-between items-center mb-10">
          <div className="relative w-96 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Global search for plates or events..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm focus:ring-8 focus:ring-blue-100 outline-none font-medium text-slate-600 transition-all" />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-[2rem] border border-slate-100 shadow-sm">
               {weather === 'Sunny' ? <Sun className="text-amber-500" size={18}/> : weather === 'Rainy' ? <CloudRain className="text-blue-500" size={18}/> : <Cloud className="text-slate-400" size={18}/>}
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{weather}</span>
            </div>
            
            <button className="p-4 bg-white rounded-2xl shadow-sm hover:bg-slate-50 text-slate-400 relative transition-all active:scale-95">
              <Bell size={20} />
              {notifications > 0 && <span className="absolute top-3 right-3 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{notifications}</span>}
            </button>
            
            <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-3xl shadow-sm border border-slate-100 group cursor-pointer hover:border-blue-200 transition-all">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 leading-none">Command Center</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Admin Level 4</p>
              </div>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Traffic" alt="Admin" className="w-12 h-12 rounded-2xl border-2 border-slate-50 bg-slate-100 shadow-lg group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </nav>

        <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000 h-[calc(100vh-180px)] overflow-y-auto no-scrollbar">
          {renderContent()}
        </div>
      </main>

      <style>{`
        @keyframes slide {
          from { background-position: 0 0; }
          to { background-position: 500px 500px; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
