
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ViolationHistory from './components/ViolationHistory';
import TopOffenders from './components/TopOffenders';
import SimulationDisplay from './components/SimulationDisplay';
import ManualInputForm from './components/ManualInputForm';
import AIAssistant from './components/AIAssistant';
import EnhancementLab from './components/EnhancementLab';
import TrafficMap from './components/TrafficMap';
import { getViolations } from './services/storage';
import { ViolationRecord, VehicleData } from './types';
import { Bell, Search, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [notifications, setNotifications] = useState<number>(0);

  const refreshData = useCallback(() => {
    setViolations(getViolations());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleNewViolation = useCallback((violation: ViolationRecord) => {
    setViolations(prev => [violation, ...prev]);
    setNotifications(prev => prev + 1);
  }, []);

  const handleManualEntry = (violation: ViolationRecord | null, vehicle: VehicleData) => {
    if (violation) {
      handleNewViolation(violation);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard violations={violations} />;
      case 'map': return <TrafficMap />;
      case 'input': return <ManualInputForm onProcessed={handleManualEntry} />;
      case 'enhance': return <EnhancementLab />;
      case 'history': return <ViolationHistory violations={violations} onRefresh={refreshData} />;
      case 'offenders': return <TopOffenders violations={violations} />;
      case 'simulation': return <SimulationDisplay onViolationDetected={handleNewViolation} />;
      case 'ai_hub': return <AIAssistant violations={violations} />;
      default: return <Dashboard violations={violations} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-10">
        <nav className="flex justify-between items-center mb-10">
          <div className="relative w-96 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Global search for plates or events..." className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 outline-none" />
          </div>

          <div className="flex items-center gap-6">
            <button className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 text-slate-400"><Settings size={20}/></button>
            <div className="relative">
              <button className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 text-slate-600">
                <Bell size={20} />
                {notifications > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">{notifications}</span>}
              </button>
            </div>
            <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100">
              <div className="text-right">
                <p className="text-sm font-black text-slate-900 leading-none">Command Center</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Admin Level 4</p>
              </div>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Traffic" alt="Admin" className="w-10 h-10 rounded-xl border-2 border-slate-50 bg-slate-100" />
            </div>
          </div>
        </nav>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
