
export enum RecordType {
  APPOINTMENT = 'Appointment',
  NOTE = 'Note',
  SYMPTOM = 'Symptom',
  VACCINATION = 'Vaccination',
  WATER = 'Water',
  MEDICINE = 'Medicine',
  NUTS = 'Nuts',
  VOMIT = 'Vomit',
  WEIGHT = 'Weight'
}

export enum EventStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  MISSED = 'Missed'
}

export enum MedicineSlot {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  NIGHT = 'Night'
}

export interface Medicine {
  id: string;
  name: string;
  totalQty: number;
  schedule: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
}

export interface MedicalRecord {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  time?: string; // HH:mm format
  location?: string;
  timestamp?: string; // Full ISO timestamp for specific events
  type: RecordType;
  title: string;
  details: string;
  value?: string; 
  status?: EventStatus;
  medicineId?: string; // Link to medicine config
  medicineSlot?: MedicineSlot; // Morning or Night
}

export interface User {
  name: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
  lastLogin?: string;
  profileImage?: string; // Base64 image string
}

export interface DateMetrics {
  totalDaysPassed: number;
  weeksPassed: number;
  daysPassedRemainder: number;
  totalDaysLeft: number;
  weeksLeft: number;
  daysLeftRemainder: number;
  progressPercentage: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface DailyInsights {
  babyMessage: string;
  doctorAdvice: string;
  sources?: GroundingSource[];
}
