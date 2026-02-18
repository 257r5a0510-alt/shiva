
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
import { Bell, Search, Settings, CloudRain, Sun, Wind, Cloud, Loader2, Zap, Activity, Cpu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [weather, setWeather] = useState<WeatherState>('Sunny');
  const [notifications, setNotifications] = useState<number>(0);
  const [isBooting, setIsBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootMessage, setBootMessage] = useState('Initializing Neural Core...');

  const refreshData = useCallback(() => {
    setViolations(getViolations());
  }, []);

  useEffect(() => {
    // Initial Hydration Sequence
    const bootSequence = async () => {
      // Step 1: Data Sync
      setBootMessage('Synchronizing Evidence Vault...');
      refreshData();
      setBootProgress(30);
      await new Promise(r => setTimeout(r, 600));

      // Step 2: Environment Calibration
      setBootMessage('Calibrating Environmental Sensors...');
      const states: WeatherState[] = ['Sunny', 'Rainy', 'Foggy', 'Cloudy'];
      setWeather(states[Math.floor(Math.random() * states.length)]);
      setBootProgress(60);
      await new Promise(r => setTimeout(r, 600));

      // Step 3: Vision Engine Warmup
      setBootMessage('Warming Vision Intelligence Unit...');
      setBootProgress(90);
      await new Promise(r => setTimeout(r, 600));

      // Step 4: Finalize
      setBootProgress(100);
      setBootMessage('System Ready.');
      await new Promise(r => setTimeout(r, 400));
      setIsBooting(false);
    };

    bootSequence();

    // Dynamic weather changes
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

  if (isBooting) {
    return (
      <div className="fixed inset-0 bg-slate-950 z-[9999] flex flex-col items-center justify-center text-white p-10 overflow-hidden">
        {/* Background Grid Effect */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:40px_40px]"></div>
        
        <div className="relative z-10 flex flex-col items-center max-w-md w-full">
          <div className="p-8 bg-blue-600 rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.5)] mb-12 animate-pulse">
            <