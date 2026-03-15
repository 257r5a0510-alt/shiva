
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

export type WeatherState = 'Sunny' | 'Rainy' | 'Foggy' | 'Night' | 'Cloudy' | 'Clear';
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

export interface ConfidenceBreakdown {
  ocr: number;
  classification: number;
  violation: number;
  overall: number;
}

export interface Geolocation {
  lat: number;
  lng: number;
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
  confidenceScore: number; // legacy overall
  confidenceBreakdown: ConfidenceBreakdown;
  geo: Geolocation;
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
  boundary?: [number, number, number, number];
}

export interface AdvancedAIVehicle {
  id: string;
  type: string;
  confidence: number;
  speed_estimated_kmph: number;
  bbox: [number, number, number, number];
  status: 'normal' | 'abnormal' | 'involved_in_accident';
  plate?: string;
}

export interface AdvancedAIResponse {
  vehicles: AdvancedAIVehicle[];
  collision_detected: boolean;
  collision_confidence: number;
  collision_zone_coordinates: [number, number, number, number];
  vehicles_involved: string[];
  alert_level: 'LOW' | 'MEDIUM' | 'HIGH';
  warning_message: string;
}

// Hyderabad Specific Interfaces
export interface HyderabadArea {
  name: string;
  risk_percentage: number;
  risk_level: 'Low' | 'Medium' | 'High';
}

export interface CityIntelligence {
  city: string;
  areas: HyderabadArea[];
  current_weather: {
    temperature: string;
    condition: string;
    humidity: string;
    wind_speed: string;
    last_updated: string;
  };
}

export interface EnhancementResult {
  confidence: number;
  forensicSummary: string;
}

// Interactivity Types
export interface AppSettings {
  darkMode: boolean;
  liveTelemetry: boolean;
  weatherSync: boolean;
  notificationsEnabled: boolean;
  monitoredZones: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  timestamp: number;
  read: boolean;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'violation' | 'area' | 'vehicle';
  originalData: any;
}
