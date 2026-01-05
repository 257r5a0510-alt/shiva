
import { ViolationRecord, RecordStatus, ViolationType, AnalyticsStats } from '../types';

const STORAGE_KEY = 'traffic_eye_violations_v2';

export const saveViolation = (violation: ViolationRecord) => {
  const existing = getViolations();
  const updated = [violation, ...existing].slice(0, 2000);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getViolations = (): ViolationRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const updateViolationStatus = (id: string, newStatus: RecordStatus) => {
  const violations = getViolations();
  const updated = violations.map(v => 
    v.violationId === id ? { ...v, status: newStatus } : v
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getAnalyticsSummary = (): AnalyticsStats => {
  const violations = getViolations();
  
  const stats: AnalyticsStats = {
    totalViolations: violations.length,
    revenue: { total: 0, pending: 0, collected: 0 },
    byType: {
      [ViolationType.OVERSPEEDING]: 0,
      [ViolationType.SIGNAL_JUMP]: 0,
    },
    byWeather: { Clear: 0, Rainy: 0, Foggy: 0 },
    topOffenders: [],
    hourlyTrends: []
  };

  const offenderMap: Record<string, number> = {};

  violations.forEach(v => {
    stats.revenue.total += v.fineAmount;
    if (v.status === 'Paid') stats.revenue.collected += v.fineAmount;
    else if (v.status === 'Pending') stats.revenue.pending += v.fineAmount;

    v.violationType.forEach(t => {
      if (stats.byType[t] !== undefined) stats.byType[t]++;
    });

    stats.byWeather[v.weather]++;
    offenderMap[v.vehicleNumber] = (offenderMap[v.vehicleNumber] || 0) + 1;
  });

  stats.topOffenders = Object.entries(offenderMap)
    .map(([vehicleNumber, count]) => ({ vehicleNumber, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
};

export const exportViolationsCSV = () => {
  const data = getViolations();
  if (data.length === 0) return;

  const headers = ['Violation ID', 'Vehicle', 'Date', 'Speed', 'Type', 'Fine', 'Status', 'Location'];
  const rows = data.map(v => [
    v.violationId,
    v.vehicleNumber,
    new Date(v.timestamp).toLocaleString(),
    v.speed,
    v.violationType.join(';'),
    v.fineAmount,
    v.status,
    v.location
  ]);

  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `traffic_violations_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const clearViolations = () => {
  localStorage.removeItem(STORAGE_KEY);
};
