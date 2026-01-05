
import { 
  VehicleData, 
  SignalStatus, 
  ViolationType, 
  ViolationRecord,
  Severity
} from '../types';
import { saveViolation } from './storage';

const VEHICLE_PREFIXES = ['KA', 'MH', 'DL', 'TN', 'UP', 'HR', 'GA'];
const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Truck', 'Bus', 'Auto'] as const;
const JUNCTIONS = ['Central Plaza', 'East Highway', 'Silk Board', 'Airport Road', 'Metro Junction'];
const WEATHER_TYPES = ['Clear', 'Rainy', 'Foggy'] as const;

export const generateVehicleData = (): VehicleData => {
  const prefix = VEHICLE_PREFIXES[Math.floor(Math.random() * VEHICLE_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  const code = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  const vehicleType = VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
  const signalStatus = Math.random() < 0.3 ? SignalStatus.RED : SignalStatus.GREEN;
  const speed = Math.random() < 0.15 ? 65 + Math.random() * 40 : 30 + Math.random() * 30;

  return {
    id: Math.random().toString(36).substr(2, 9),
    vehicleNumber: `${prefix}-${num}-${code}`,
    vehicleType,
    speed: Math.round(speed),
    signalStatus,
    timestamp: Date.now(),
    riderCount: vehicleType === 'Motorcycle' ? (Math.random() > 0.1 ? 1 : 3) : (Math.floor(Math.random() * 4) + 1),
    helmetDetected: Math.random() > 0.1,
    seatbeltDetected: Math.random() > 0.1
  };
};

export const detectViolations = (
  data: VehicleData, 
  evidenceImage?: string, 
  customSpeedLimit: number = 60,
  confidenceScore: number = 1.0
): ViolationRecord | null => {
  const violations: ViolationType[] = [];
  let totalFine = 0;
  let severity = Severity.LOW;

  // 1. Speed Rule
  if (data.speed > customSpeedLimit) {
    violations.push(ViolationType.OVERSPEEDING);
    totalFine += 1000;
    const speedDelta = data.speed - customSpeedLimit;
    if (speedDelta > 40) severity = Severity.HIGH;
    else if (speedDelta > 20) severity = Severity.MEDIUM;
  }

  // 2. Signal Rule
  if (data.signalStatus === SignalStatus.RED) {
    violations.push(ViolationType.SIGNAL_JUMP);
    totalFine += 1500;
    severity = Severity.HIGH;
  }

  // 3. Triple Riding Rule (Motorcycle Only)
  if (data.vehicleType === 'Motorcycle' && data.riderCount > 2) {
    violations.push(ViolationType.TRIPLE_RIDING);
    totalFine += 2000;
    severity = Severity.HIGH;
  }

  // 4. Helmet Rule (Motorcycle Only)
  if (data.vehicleType === 'Motorcycle' && !data.helmetDetected) {
    violations.push(ViolationType.HELMET);
    totalFine += 500;
    if (severity !== Severity.HIGH) severity = Severity.MEDIUM;
  }

  // 5. Seat Belt Rule (Car / Truck Only)
  if ((data.vehicleType === 'Car' || data.vehicleType === 'Truck') && !data.seatbeltDetected) {
    violations.push(ViolationType.SEAT_BELT);
    totalFine += 1000;
    if (severity !== Severity.HIGH) severity = Severity.MEDIUM;
  }

  if (violations.length > 0) {
    const record: ViolationRecord = {
      ...data,
      violationId: `VIO-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      violationType: violations,
      severity,
      fineAmount: totalFine,
      evidenceImage,
      location: JUNCTIONS[Math.floor(Math.random() * JUNCTIONS.length)],
      lane: Math.floor(Math.random() * 4) + 1,
      weather: WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)],
      status: 'Pending',
      officerId: 'SYS_ADMIN',
      speedLimit: customSpeedLimit,
      confidenceScore: confidenceScore,
      requiresReview: confidenceScore < 0.75
    };
    saveViolation(record);
    return record;
  }

  return null;
};
