
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateVehicleData, detectViolations } from '../services/simulator';
import { VehicleData, ViolationRecord, SignalStatus } from '../types';
import { Activity, Radio, Sliders, Zap } from 'lucide-react';

interface SimulationDisplayProps {
  onViolationDetected: (v: ViolationRecord) => void;
}

const SimulationDisplay: React.FC<SimulationDisplayProps> = ({ onViolationDetected }) => {
  const [activeVehicles, setActiveVehicles] = useState<VehicleData[]>([]);
  const [currentSignal, setCurrentSignal] = useState<SignalStatus>(SignalStatus.GREEN);
  const [logs, setLogs] = useState<{ id: string; msg: string; type: 'info' | 'warn' | 'error' }[]>([]);
  
  // Simulation Controls
  const [spawnRate, setSpawnRate] = useState(2000); // ms
  
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = useCallback((msg: string, type: 'info' | 'warn' | 'error') => {
    setLogs(prev => [...prev, { id: Math.random().toString(), msg, type }].slice(-20));
  }, []);

  // Traffic signal cycling logic
  useEffect(() => {
    const signalInterval = setInterval(() => {
      setCurrentSignal(prev => prev === SignalStatus.GREEN ? SignalStatus.RED : SignalStatus.GREEN);
    }, 8000);

    return () => clearInterval(signalInterval);
  }, []);

  // Simulation execution loop
  useEffect(() => {
    const vehicleInterval = setInterval(() => {
      const vehicle = generateVehicleData();
      vehicle.signalStatus = currentSignal;
      
      setActiveVehicles(prev => [vehicle, ...prev].slice(0, 10));
      addLog(`Vehicle ${vehicle.vehicleNumber} (${vehicle.vehicleType}) tracked.`, 'info');

      const violation = detectViolations(vehicle);
      if (violation) {
        addLog(`VIOLATION: ${vehicle.vehicleNumber} flagged for ${violation.violationType.join(', ')}`, 'error');
        onViolationDetected(violation);
      }
    }, spawnRate);

    return () => clearInterval(vehicleInterval);
  }, [currentSignal, spawnRate, addLog, onViolationDetected]);

  // Fix: Added return statement to satisfy React.FC requirements
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Live Simulation</h2>
          <p className="text-slate-500">Synthetic traffic generation and real-time monitoring.</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 px-3">
            <Radio size={16} className="text-blue-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Feed</span>
          </div>
          <div className="h-8 w-px bg-slate-100"></div>
          <div className="px-3 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] ${currentSignal === SignalStatus.RED ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-sm font-bold text-slate-700">{currentSignal}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual Monitoring View */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative group shadow-2xl">
            <div className="absolute inset-0 bg-slate-800 opacity-20"></div>
            
            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
              <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 text-white font-mono text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>CAM_01_JUNCTION</span>
                </div>
                <div className="text-white/60">SIMULATION MODE</div>
              </div>

              <div className="bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 text-white font-mono text-xs text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span>LIVE TARGETS: {activeVehicles.length}</span>
                </div>
              </div>
            </div>

            {/* Simulated Feed Contents */}
            <div className="absolute inset-0 flex flex-col justify-center items-center p-8">
               <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
                  {activeVehicles.map((v) => (
                    <div key={v.id} className="animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className={`p-4 rounded-xl border-2 transition-all ${v.speed > 60 ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/10'}`}>
                        <div className="text-[10px] text-white/40 font-bold uppercase mb-1">{v.vehicleType}</div>
                        <div className="text-white font-bold font-mono text-xs truncate">{v.vehicleNumber}</div>
                        <div className={`text-sm font-black mt-1 ${v.speed > 60 ? 'text-red-400' : 'text-blue-400'}`}>
                          {v.speed} <span className="text-[10px]">km/h</span>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Scanning Laser Line Effect */}
            <div className="absolute inset-x-0 h-px bg-blue-500/20 shadow-[0_0_15px_#3b82f6] animate-[scan_4s_linear_infinite]"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Sliders size={18} className="text-slate-400" />
                  <h4 className="font-bold text-slate-900">Traffic Density Control</h4>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="5000" 
                  step="500"
                  value={spawnRate}
                  onChange={(e) => setSpawnRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                  <span>Fast</span>
                  <span>{spawnRate}ms Interval</span>
                  <span>Slow</span>
                </div>
             </div>
             <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-amber-500" />
                  <h4 className="font-bold text-slate-900">Processor Load</h4>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full animate-pulse" style={{ width: '78%' }}></div>
                  </div>
                  <span className="text-sm font-bold text-slate-600">78%</span>
                </div>
             </div>
          </div>
        </div>

        {/* Console Activity Log */}
        <div className="bg-slate-900 rounded-2xl flex flex-col shadow-xl border border-slate-800">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h4 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-green-500" />
              Event Stream
            </h4>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div ref={logRef} className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-2 h-[450px]">
            {logs.map((log) => (
              <div key={log.id} className={`${
                log.type === 'error' ? 'text-red-400 font-bold' : 
                log.type === 'warn' ? 'text-amber-400' : 'text-slate-400'
              }`}>
                <span className="opacity-50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span> {log.msg}
              </div>
            ))}
            {logs.length === 0 && <div className="text-slate-600 italic">Initializing traffic engine...</div>}
          </div>
          <div className="p-4 bg-black/20 text-[10px] text-slate-500 border-t border-white/5 uppercase tracking-tighter">
            System Monitoring: Active
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

// Fix: Added default export to resolve "no default export" error in App.tsx
export default SimulationDisplay;
