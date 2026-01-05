
export enum ViolationType {
  OVERSPEEDING = 'Over-speeding',
  SIGNAL_JUMP = 'Signal Jump',
  LANE_DISCIPLINE = 'Lane Discipline',
  TRIPLE_RIDING = 'Triple Riding',
  HELMET = 'No Helmet',
  SEAT_BELT = 'No Seat Belt'
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

export type RecordStatus = 'Pending' | 'Paid' | 'Disputed';

export type VehicleCategory = 'Car' | 'Motorcycle' | 'Truck' | 'Bus' | 'Auto';

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
}

export interface ViolationRecord extends VehicleData {
  violationId: string;
  violationType: ViolationType[];
  severity: Severity;
  fineAmount: number;
  evidenceImage?: string;
  location: string;
  lane: number;
  weather: 'Clear' | 'Rainy' | 'Foggy';
  status: RecordStatus;
  officerId: string;
  speedLimit: number;
  confidenceScore: number;
  requiresReview: boolean;
}

export interface TrafficDensity {
  location: string;
  level: 'High' | 'Medium' | 'Low';
  coordinates: { lat: number; lng: number };
  description: string;
}

export interface AnalyticsStats {
  totalViolations: number;
  revenue: {
    total: number;
    pending: number;
    collected: number;
  };
  byType: Record<string, number>;
  byWeather: Record<'Clear' | 'Rainy' | 'Foggy', number>;
  topOffenders: { vehicleNumber: string; count: number }[];
  hourlyTrends: any[];
}
