
import { 
  VehicleData, 
  SignalStatus, 
  ViolationType, 
  ViolationRecord,
  Severity
} from '../types';
import { saveViolation } from './storage';

const VEHICLE_PREFIXES = ['TS', 'AP', 'KA', 'MH', 'DL'];
const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Truck', 'Bus', 'Auto'] as const;

const JUNCTIONS = [
  { name: 'Madhapur / Cyber Towers', lat: 17.4483, lng: 78.3915 },
  { name: 'Gachibowli Junction', lat: 17.4401, lng: 78.3489 },
  { name: 'Banjara Hills Rd No 12', lat: 17.4156, lng: 78.4347 },
  { name: 'Kukatpally Housing Board', lat: 17.4948, lng: 78.3996 },
  { name: 'LB Nagar Ring Road', lat: 17.3457, lng: 78.5522 }
];

const WEATHER_TYPES = ['Sunny', 'Rainy', 'Foggy'] as const;

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

export const createForensicRecord = (
  type: string,
  description: string,
  severity: Severity,
  image?: string
): ViolationRecord => {
  const junction = JUNCTIONS[Math.floor(Math.random() * JUNCTIONS.length)];
  return {
    id: Math.random().toString(36).substr(2, 9),
    vehicleNumber: 'AI_DETECTION',
    vehicleType: 'Car',
    speed: 0,
    signalStatus: SignalStatus.GREEN,
    timestamp: Date.now(),
    riderCount: 1,
    violationId: `AI-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    violationType: [type as any],
    severity,
    fineAmount: severity === Severity.HIGH ? 5000 : 1000,
    evidenceImage: image,
    location: junction.name,
    geo: { lat: junction.lat, lng: junction.lng },
    weather: 'Sunny',
    aggressionScore: 90,
    status: 'Pending',
    lane: 1,
    officerId: 'AI_VISION_CORE',
    speedLimit: 60,
    confidenceScore: 0.95,
    confidenceBreakdown: {
      ocr: 0.98,
      classification: 0.99,
      violation: 0.95,
      overall: 0.97
    },
    requiresReview: true
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

  if (data.speed > customSpeedLimit) {
    violations.push(ViolationType.OVERSPEEDING);
    totalFine += 1000;
    const speedDelta = data.speed - customSpeedLimit;
    if (speedDelta > 40) severity = Severity.HIGH;
    else if (speedDelta > 20) severity = Severity.MEDIUM;
  }

  if (data.signalStatus === SignalStatus.RED) {
    violations.push(ViolationType.SIGNAL_JUMP);
    totalFine += 1500;
    severity = Severity.HIGH;
  }

  if (data.vehicleType === 'Motorcycle' && data.riderCount > 2) {
    violations.push(ViolationType.TRIPLE_RIDING);
    totalFine += 2000;
    severity = Severity.HIGH;
  }

  if (data.vehicleType === 'Motorcycle' && !data.helmetDetected) {
    violations.push(ViolationType.HELMET);
    totalFine += 500;
    if (severity !== Severity.HIGH) severity = Severity.MEDIUM;
  }

  if ((data.vehicleType === 'Car' || data.vehicleType === 'Truck') && !data.seatbeltDetected) {
    violations.push(ViolationType.SEAT_BELT);
    totalFine += 1000;
    if (severity !== Severity.HIGH) severity = Severity.MEDIUM;
  }

  if (violations.length > 0) {
    const junction = JUNCTIONS[Math.floor(Math.random() * JUNCTIONS.length)];
    const ocrConf = 0.85 + Math.random() * 0.14;
    const classConf = 0.90 + Math.random() * 0.09;
    const vioConf = 0.80 + Math.random() * 0.19;

    const record: ViolationRecord = {
      ...data,
      violationId: `VIO-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      violationType: violations,
      severity,
      fineAmount: totalFine,
      evidenceImage,
      location: junction.name,
      geo: { lat: junction.lat, lng: junction.lng },
      lane: Math.floor(Math.random() * 4) + 1,
      weather: WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)],
      status: 'Pending',
      officerId: 'SYS_ADMIN',
      speedLimit: customSpeedLimit,
      confidenceScore: (ocrConf + classConf + vioConf) / 3,
      confidenceBreakdown: {
        ocr: ocrConf,
        classification: classConf,
        violation: vioConf,
        overall: (ocrConf + classConf + vioConf) / 3
      },
      requiresReview: confidenceScore < 0.75,
      aggressionScore: Math.floor(Math.random() * 100)
    };
    saveViolation(record);
    return record;
  }

  return null;
};
