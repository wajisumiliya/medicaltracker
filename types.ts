export enum RecordType {
  APPOINTMENT = 'Appointment',
  VITALS = 'Vitals', // BP, Heart rate
  NOTE = 'Note',
  SYMPTOM = 'Symptom',
  VACCINATION = 'Vaccination',
  GROWTH = 'Growth', // Weight, Length
  WATER = 'Water',
  MEDICINE = 'Medicine',
  NUTS = 'Nuts',
  VOMIT = 'Vomit'
}

export enum MedicineSlot {
  MORNING = 'Morning',
  NIGHT = 'Night'
}

export interface Medicine {
  id: string;
  name: string;
  totalQty: number;
  schedule: {
    morning: boolean;
    night: boolean;
  };
}

export interface MedicalRecord {
  id: string;
  date: string; // ISO Date string YYYY-MM-DD
  timestamp?: string; // Full ISO timestamp for specific events
  type: RecordType;
  title: string;
  details: string;
  value?: string; // e.g., "65kg" or "120/80"
  medicineId?: string; // Link to medicine config
  medicineSlot?: MedicineSlot; // Morning or Night
}

export interface User {
  name: string;
  role: 'admin' | 'user';
  isAuthenticated: boolean;
  lastLogin?: string;
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