
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TrafficMap from './components/TrafficMap';
import ManualInputForm from './components/ManualInputForm';
import EnhancementLab from './components/EnhancementLab';
import ViolationHistory from './components/ViolationHistory';
import TopOffenders from './components/TopOffenders';
import SimulationDisplay from './components/SimulationDisplay';
import AIAssistant from './components/AIAssistant';
import VideoAnalyzer from './components/VideoAnalyzer';
import CityGrid from './components/CityGrid';
import { getViolations } from './services/storage';
import { ViolationRecord, WeatherState, AppSettings, AppNotification, SearchResult } from './types';
import { 
  Bell, Search, Settings, ShieldAlert, Cpu, Activity, Zap, Loader2, 
  X, Check, Info, AlertTriangle, AlertCircle, Moon, Sun, Monitor, RefreshCcw, 
  ChevronRight, Trash2, MapPin, Car, FileText 
} from 'lucide-react';

const HYDERABAD_ZONES = ['Madhapur', 'Gachibowli', 'Banjara Hills', 'Kukatpally', 'LB Nagar', 'Secunderabad', 'Charminar', 'Hitech City', 'Mehdipatnam'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [weather, setWeather] = useState<WeatherState>('Sunny');
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootMessage, setBootMessage] = useState('Initializing Neural Core...');

  // Interactivity States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    liveTelemetry: true,
    weatherSync: true,
    notificationsEnabled: true,
    monitoredZones: HYDERABAD_ZONES
  });
  
  const [settingsConfirmation, setSettingsConfirmation] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const refreshData = useCallback(() => {
    const data = getViolations();
    setViolations(data);
  }, []);

  // Initialize App
  useEffect(() => {
    const bootSequence = async () => {
      setBootMessage('Synchronizing Evidence Vault...');
      refreshData();
      setBootProgress(30);
      
      const savedSettings = localStorage.getItem('traffic_eye_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      }

      // Mock Notifications
      setNotifications([
        { id: '1', title: 'High Aggression Detected', message: 'Hitech City Flyover showing risk increase of 12%.', type: 'warning', timestamp: Date.now() - 1000 * 60 * 15, read: false },
        { id: '2', title: 'Rain Protocol Active', message: 'Gachibowli Junction weather updated to Rainy.', type: 'info', timestamp: Date.now() - 1000 * 60 * 45, read: true },
        { id: '3', title: 'System Health Check', message: 'Neural Core v3.5 passed all diagnostic tests.', type: 'success', timestamp: Date.now() - 1000 * 60 * 120, read: true },
      ]);

      await new Promise(r => setTimeout(r, 400));
      setBootProgress(60);
      setBootMessage('Calibrating Environmental Sensors...');
      setBootProgress(90);
      setIsBooting(false);
    };
    bootSequence();
  }, [refreshData]);

  // Search Logic - Real-time filtering with highlighting support logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      const results: SearchResult[] = [];
      const query = searchQuery.toLowerCase();

      // Search Violations (Vehicle Number, Violation ID, Location, Timestamp)
      violations.forEach(v => {
        const timestampStr = new Date(v.timestamp).toLocaleString().toLowerCase();
        if (
          v.vehicleNumber.toLowerCase().includes(query) || 
          v.violationId.toLowerCase().includes(query) ||
          v.location.toLowerCase().includes(query) ||
          timestampStr.includes(query)
        ) {
          results.push({
            id: v.violationId,
            title: v.vehicleNumber,
            subtitle: `${v.violationType[0]} at ${v.location}`,
            type: 'violation',
            originalData: v
          });
        }
      });

      // Search Areas
      HYDERABAD_ZONES.forEach(zone => {
        if (zone.toLowerCase().includes(query)) {
          results.push({
            id: `zone-${zone}`,
            title: zone,
            subtitle: 'Hyderabad Monitoring Zone',
            type: 'area',
            originalData: { name: zone }
          });
        }
      });

      setSearchResults(results.slice(0, 10));
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, violations]);

  // Close modals on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setShowSettings(false);
      // We don't necessarily want to close search just on click outside if user is using it, but let's keep it simple
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewViolation = useCallback((violation: ViolationRecord) => {
    setViolations(prev => [violation, ...prev]);
    if (settings.notificationsEnabled) {
      const newNotif: AppNotification = {
        id: Date.now().toString(),
        title: 'New Violation Detected',
        message: `${violation.vehicleType} ${violation.vehicleNumber} flagged for ${violation.violationType[0]} at ${violation.location}.`,
        type: 'alert',
        timestamp: Date.now(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  }, [settings.notificationsEnabled]);

  const toggleSettings = (key: keyof AppSettings) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      localStorage.setItem('traffic_eye_settings', JSON.stringify(newSettings));
      return newSettings;
    });
    setSettingsConfirmation(true);
    setTimeout(() => setSettingsConfirmation(false), 2000);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() 
            ? <span key={i} className="bg-yellow-400/30 text-yellow-600 dark:text-yellow-400">{part}</span> 
            : part
        )}
      </span>
    );
  };

  const renderContent = () => {
    const tabProps = { darkMode: settings.darkMode };
    switch (activeTab) {
      case 'dashboard': return <Dashboard violations={violations} {...tabProps} />;
      case 'map': return <TrafficMap violations={violations} />;
      case 'video': return <VideoAnalyzer weather={weather} onViolationDetected={handleNewViolation} />;
      case 'grid': return <CityGrid />;
      case 'input': return <ManualInputForm onProcessed={(v) => v && handleNewViolation(v)} />;
      case 'enhance': return <EnhancementLab />;
      case 'simulation': return <SimulationDisplay onViolationDetected={handleNewViolation} />;
      case 'ai_hub': return (
        <div className="h-full">
          <AIAssistant violations={violations} />
        </div>
      );
      case 'history': return <ViolationHistory violations={violations} onRefresh={refreshData} />;
      case 'offenders': return <TopOffenders violations={violations} />;
      default: return <Dashboard violations={violations} />;
    }
  };

  if (isBooting) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center text-white p-10 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]"></div>
        <div className="relative z-10 flex flex-col items-center max-w-md w-full">
          <div className="p-8 bg-blue-600 rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.3)] mb-12 animate-pulse">
            <ShieldAlert size={64} className="text-white" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter mb-2">TRAFFIC<span className="text-blue-500">EYE</span></h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Smart City Defense v3.5</p>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${bootProgress}%` }}></div>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[10px] uppercase tracking-widest">
            <Loader2 size={12} className="animate-spin text-blue-500" />
            {bootMessage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${settings.darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4 relative">
        <header className="flex justify-between items-center mb-10 z-40 relative">
          {/* Functional Search Bar */}
          <div ref={searchRef} className="relative">
            <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl shadow-sm border transition-all ${settings.darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'} w-[400px]`}>
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search vehicles, areas, or IDs..." 
                className="bg-transparent outline-none text-sm font-medium flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && <Loader2 size={16} className="animate-spin text-blue-500" />}
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>
            
            {searchQuery && (
              <div className={`absolute top-full left-0 right-0 mt-2 rounded-[2rem] shadow-2xl border p-3 z-50 animate-in fade-in zoom-in-95 origin-top ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                {searchResults.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-1">
                    {searchResults.map((result) => (
                      <button 
                        key={result.id}
                        onClick={() => {
                          if (result.type === 'violation') {
                            setActiveTab('history');
                          } else if (result.type === 'area') {
                            setActiveTab('dashboard');
                          }
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${settings.darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} active:scale-95`}
                      >
                        <div className={`p-2 rounded-xl ${result.type === 'violation' ? 'bg-red-500/10 text-red-500' : result.type === 'area' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                          {result.type === 'violation' ? <FileText size={16} /> : result.type === 'area' ? <MapPin size={16} /> : <Car size={16} />}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">{highlightText(result.title, searchQuery)}</p>
                          <p className="text-[10px] opacity-60 font-bold">{highlightText(result.subtitle, searchQuery)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="opacity-20" />
                    </div>
                    <p className="text-xs font-black opacity-40 uppercase tracking-widest">No matching telemetry found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Functional Notifications Dropdown */}
            <div ref={notificationsRef} className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-2xl shadow-sm border transition-all ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} hover:scale-105 active:scale-95`}
              >
                <Bell size={20} className={settings.darkMode ? 'text-slate-400' : 'text-slate-600'} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className={`absolute top-full right-0 mt-4 w-[400px] rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border overflow-hidden z-[60] animate-in slide-in-from-top-4 duration-300 origin-top-right ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="p-8 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <div>
                      <h4 className="font-black uppercase tracking-widest text-xs">Command Center Notifications</h4>
                      <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-tighter">Real-time Safety Feed</p>
                    </div>
                    <button onClick={clearAllNotifications} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-6 border-b transition-all cursor-pointer group flex gap-5 ${settings.darkMode ? 'border-slate-800 hover:bg-slate-800/50' : 'border-slate-50 hover:bg-slate-50'} ${!notif.read ? 'bg-blue-500/5 border-l-4 border-l-blue-500' : ''}`}
                        >
                          <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 ${
                            notif.type === 'alert' ? 'bg-red-500/10 text-red-500' : 
                            notif.type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                            notif.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {notif.type === 'alert' ? <AlertCircle size={22} /> : notif.type === 'warning' ? <AlertTriangle size={22} /> : notif.type === 'success' ? <Check size={22} /> : <Info size={22} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <p className={`text-xs font-black uppercase tracking-tight ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>{notif.title}</p>
                              <span className="text-[9px] font-bold opacity-40">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[11px] font-medium opacity-60 leading-relaxed pr-2">{notif.message}</p>
                            {!notif.read && <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-500"><Zap size={10} /> Mark as verified</div>}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Bell size={32} className="opacity-10" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All feeds synchronized</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 text-center">
                    <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">Audit Historical Log Files</button>
                  </div>
                </div>
              )}
            </div>

            {/* Functional Settings Panel */}
            <div ref={settingsRef} className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-2xl shadow-sm border transition-all ${settings.darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} hover:rotate-90 active:scale-95`}
              >
                <Settings size={20} className={settings.darkMode ? 'text-slate-400' : 'text-slate-600'} />
              </button>
              
              {showSettings && (
                <div className={`absolute top-full right-0 mt-4 w-80 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border p-10 z-[60] animate-in fade-in slide-in-from-right-4 duration-400 origin-top-right ${settings.darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-2xl font-black tracking-tighter">Unit Profile</h4>
                    {settingsConfirmation && (
                      <div className="bg-green-500 text-white p-1 rounded-full animate-in zoom-in duration-300">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                          {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Dark Protocol</span>
                      </div>
                      <button 
                        onClick={() => toggleSettings('darkMode')}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.darkMode ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform"><Monitor size={18} /></div>
                        <span className="text-xs font-black uppercase tracking-widest">Telemetry</span>
                      </div>
                      <button 
                        onClick={() => toggleSettings('liveTelemetry')}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.liveTelemetry ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.liveTelemetry ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform"><RefreshCcw size={18} /></div>
                        <span className="text-xs font-black uppercase tracking-widest">Auto-Sync</span>
                      </div>
                      <button 
                        onClick={() => toggleSettings('weatherSync')}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.weatherSync ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.weatherSync ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform"><Bell size={18} /></div>
                        <span className="text-xs font-black uppercase tracking-widest">Notify Hub</span>
                      </div>
                      <button 
                        onClick={() => toggleSettings('notificationsEnabled')}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.notificationsEnabled ? 'translate-x-6' : ''}`}></div>
                      </button>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Hyderabad Active Zones</p>
                      <div className="grid grid-cols-2 gap-2">
                        {HYDERABAD_ZONES.slice(0, 4).map(zone => (
                          <div key={zone} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-tighter">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> {zone}
                          </div>
                        ))}
                      </div>
                      <button className="w-full mt-4 flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all group active:scale-95">
                        <span className="text-[10px] font-black uppercase tracking-widest">Full Configuration</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="text-right">
                <p className={`text-xs font-black uppercase leading-none ${settings.darkMode ? 'text-white' : 'text-slate-900'}`}>Unit Alpha</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Hyd_System_Admin</p>
              </div>
              <div className="w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white font-black text-xs ring-4 ring-blue-500/20 group-hover:scale-105 transition-transform">
                UA
              </div>
            </div>
          </div>
        </header>

        <div className="min-h-[calc(100vh-160px)]">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default App;
