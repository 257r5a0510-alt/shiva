
export enum ViolationType {
  OVERSPEEDING = 'Over-speeding',
  SIGNAL_JUMP = 'Signal Jump',
  LANE_DISCIPLINE = 'Lane Discipline',
  TRIPLE_RIDING = 'Triple Riding',
  HELMET = 'No Helmet',
  SEAT_BELT = 'No Seat Belt',
  WRONG_SIDE = 'Wrong Side Driving',
  TAILGATING = 'Tailgating'
}

export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export enum SignalStatus {
  RED = 'RED',
  GREEN = 'GREEN',
  YELLOW = 'YELLOW'
}

export type WeatherState = 'Sunny' | 'Rainy' | 'Foggy' | 'Night' | 'Cloudy';
export type RecordStatus = 'Pending' | 'Paid' | 'Disputed';
export type VehicleCategory = 'Car' | 'Motorcycle' | 'Truck' | 'Bus' | 'Auto';

export interface RouteInfo {
  id: string;
  name: string;
  distance: number; // km
  duration: number; // mins
  trafficScore: number; // 0-100 (100 is worst)
  safetyScore: number; // 0-100 (100 is safest)
  path: number[][];
  segments: { points: number[][], traffic: 'low' | 'mid' | 'high', avgSpeed: number }[];
  recommendation: string;
}

export interface VehicleData {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleCategory;
  speed: number;
  signalStatus: SignalStatus;
  timestamp: number;
  riderCount: number;
  helmetDetected?: boolean;
  seatbeltDetected?: boolean;
  distanceToLeadingVehicle?: number;
  confidence?: number;
  isVerified?: boolean;
}

export interface ViolationRecord extends VehicleData {
  violationId: string;
  violationType: ViolationType[];
  severity: Severity;
  fineAmount: number;
  evidenceImage?: string;
  location: string;
  weather: WeatherState;
  aggressionScore: number;
  status: RecordStatus;
  lane: number;
  officerId: string;
  speedLimit: number;
  confidenceScore: number;
  requiresReview: boolean;
}

export interface AnalyticsStats {
  totalViolations: number;
  revenue: { total: number; pending: number; collected: number };
  byType: Record<string, number>;
  byWeather: Record<string, number>;
  topOffenders: { vehicleNumber: string; count: number }[];
  hourlyTrends: any[];
}

export interface AreaIntelligence {
  zoneId: string;
  zoneName: string;
  congestionLevel: number; // 0-100
  riskScore: number; // 0-100
  activeIncidents: number;
  avgSpeed: number;
  // Geographic boundary [minLat, minLng, maxLat, maxLng]
  boundary?: [number, number, number, number];
}

export interface VideoFrameAnalysis {
  timestamp: number;
  detections: {
    box: [number, number, number, number]; // [x, y, w, h] in %
    label: string;
    violation?: string;
    speed?: number;
  }[];
  aggressionScore: number;
}
