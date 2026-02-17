
import React from 'react';
import { 
  LayoutDashboard, 
  History, 
  AlertTriangle, 
  Users, 
  Car,
  Camera,
  Bot,
  Wand2,
  Map as MapIcon,
  Video,
  Grid3X3
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Analytics Hub', icon: LayoutDashboard },
    { id: 'map', label: 'Traffic Map', icon: MapIcon },
    { id: 'video', label: 'Vision Stream', icon: Video },
    { id: 'grid', label: 'City Grid', icon: Grid3X3 },
    { id: 'input', label: 'Detection Unit', icon: Camera },
    { id: 'enhance', label: 'Enhancement Lab', icon: Wand2 },
    { id: 'simulation', label: 'Auto Monitor', icon: Car },
    { id: 'ai_hub', label: 'AI Intelligence', icon: Bot },
    { id: 'history', label: 'Evidence Vault', icon: History },
    { id: 'offenders', label: 'Violator List', icon: Users },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
      <div className="p-8 flex items-center gap-4">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
          <AlertTriangle size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tighter leading-none">TrafficEye</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Defense Grid</p>
        </div>
      </div>
      
      <nav className="flex-1 mt-4 px-6 overflow-y-auto no-scrollbar">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/50 translate-x-1' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : ''} />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-8 border-t border-slate-800">
        <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-700/50">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3">Unit Status</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <span className="text-sm font-bold text-slate-200">System Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
