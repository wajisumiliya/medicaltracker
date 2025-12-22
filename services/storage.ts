
import { MedicalRecord, Medicine, MedicineSlot, RecordType, User, DailyInsights } from '../types';

const RECORDS_KEY = 'koala_records_v1';
const CONFIG_KEY = 'koala_medicine_config_v1';
const CURRENT_USER_KEY = 'koala_current_session';
const GLOBAL_PROFILE_IMAGE_KEY = 'koala_global_profile_image';
const INSIGHTS_CACHE_KEY = 'koala_insights_cache_v1';
const QUOTA_ERROR_KEY = 'koala_quota_error_ts';

export const StorageService = {
  // --- User Session Management ---
  
  getUserData: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    if (!data) return null;
    const user = JSON.parse(data) as User;
    const globalImage = localStorage.getItem(GLOBAL_PROFILE_IMAGE_KEY);
    if (globalImage) {
      user.profileImage = globalImage;
    }
    return user;
  },

  getGlobalProfileImage: (): string | null => {
    return localStorage.getItem(GLOBAL_PROFILE_IMAGE_KEY);
  },

  saveProfileImage: (base64: string): void => {
    localStorage.setItem(GLOBAL_PROFILE_IMAGE_KEY, base64);
    const userData = StorageService.getUserData();
    if (userData) {
      userData.profileImage = base64;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    }
    window.dispatchEvent(new CustomEvent('koalaProfileUpdate', { detail: base64 }));
  },

  login: (username: string): boolean => {
    const cleanName = username.trim();
    // Strict requirement: User Sumaiya only can access
    if (cleanName.toLowerCase() !== 'sumaiya') {
      return false; 
    }
    const userData: User = {
      name: cleanName,
      role: 'admin',
      isAuthenticated: true,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return true;
  },

  // --- Quota Management ---
  setQuotaExceeded: (retryAfterSeconds: number = 60) => {
    const expiration = Date.now() + (retryAfterSeconds * 1000);
    localStorage.setItem(QUOTA_ERROR_KEY, expiration.toString());
  },

  isQuotaExceeded: (): boolean => {
    const expiration = localStorage.getItem(QUOTA_ERROR_KEY);
    if (!expiration) return false;
    if (Date.now() > parseInt(expiration)) {
      localStorage.removeItem(QUOTA_ERROR_KEY);
      return false;
    }
    return true;
  },

  // --- AI Insights Caching ---

  getCachedInsights: (week: number, day: number): DailyInsights | null => {
    const data = localStorage.getItem(INSIGHTS_CACHE_KEY);
    if (!data) return null;
    const cache = JSON.parse(data);
    const key = `w${week}d${day}`;
    return cache[key] || null;
  },

  saveInsightsToCache: (week: number, day: number, insights: DailyInsights): void => {
    const data = localStorage.getItem(INSIGHTS_CACHE_KEY);
    const cache = data ? JSON.parse(data) : {};
    const key = `w${week}d${day}`;
    cache[key] = insights;
    localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(cache));
  },

  // --- Medical Records CRUD ---

  getRecords: async (): Promise<MedicalRecord[]> => {
    const data = localStorage.getItem(RECORDS_KEY);
    const records: MedicalRecord[] = data ? JSON.parse(data) : [];
    return records.sort((a, b) => {
      const dateA = a.date + (a.time || '00:00');
      const dateB = b.date + (b.time || '00:00');
      return dateB.localeCompare(dateA);
    });
  },

  addRecord: async (record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> => {
    const records = await StorageService.getRecords();
    const now = new Date();
    const newRecord: MedicalRecord = {
      ...record,
      id: StorageService.generateId(),
      timestamp: now.toISOString(),
      time: record.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    };
    const updated = [newRecord, ...records];
    localStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
    return newRecord;
  },

  updateRecord: async (updatedRecord: MedicalRecord): Promise<void> => {
    const records = await StorageService.getRecords();
    const updated = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
  },

  deleteRecord: async (id: string): Promise<void> => {
    const records = await StorageService.getRecords();
    const updated = records.filter(r => r.id !== id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(updated));
  },

  // --- Medicine Configuration ---

  getMedicines: async (): Promise<Medicine[]> => {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : [];
  },

  seedInitialMedicines: async (): Promise<void> => {
    const currentMeds = await StorageService.getMedicines();
    if (currentMeds.length > 0) return;
    const initialMeds: Medicine[] = [
      { id: 'med-folic-acid', name: 'Folic Acid', totalQty: 30, schedule: { morning: true, afternoon: false, night: false } },
      { id: 'med-sustain', name: 'Sustain', totalQty: 30, schedule: { morning: false, afternoon: false, night: true } },
      { id: 'med-iron', name: 'Iron', totalQty: 30, schedule: { morning: false, afternoon: true, night: false } },
      { id: 'med-calcium', name: 'Calcium', totalQty: 30, schedule: { morning: false, afternoon: false, night: true } }
    ];
    localStorage.setItem(CONFIG_KEY, JSON.stringify(initialMeds));
  },

  saveMedicine: async (medicine: Medicine): Promise<void> => {
    const medicines = await StorageService.getMedicines();
    const index = medicines.findIndex(m => m.id === medicine.id);
    let updated = index >= 0 ? [...medicines] : [...medicines, medicine];
    if (index >= 0) updated[index] = medicine;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  },

  deleteMedicine: async (id: string): Promise<void> => {
    const medicines = await StorageService.getMedicines();
    const updated = medicines.filter(m => m.id !== id);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  },

  // --- Daily Habit Helpers with Date Context ---

  getDailyWaterLogs: async (dateStr: string): Promise<MedicalRecord[]> => {
    const records = await StorageService.getRecords();
    return records.filter(r => r.type === RecordType.WATER && r.date === dateStr)
                  .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
  },

  addWaterLog: async (dateStr: string): Promise<void> => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    await StorageService.addRecord({
      type: RecordType.WATER,
      title: 'Water Glass',
      date: dateStr,
      time: timeStr,
      details: `Logged at ${timeStr}`,
      value: '1'
    });
  },

  getDailyNutLogs: async (dateStr: string): Promise<MedicalRecord[]> => {
    const records = await StorageService.getRecords();
    return records.filter(r => r.type === RecordType.NUTS && r.date === dateStr);
  },

  toggleNutItem: async (itemTitle: string, dateStr: string): Promise<void> => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const records = await StorageService.getRecords();
    const existing = records.find(r => r.type === RecordType.NUTS && r.date === dateStr && r.title === itemTitle);
    if (existing) {
      await StorageService.deleteRecord(existing.id);
    } else {
      await StorageService.addRecord({
        type: RecordType.NUTS,
        title: itemTitle,
        date: dateStr,
        time: timeStr,
        details: `Logged at ${timeStr}`,
        value: '1'
      });
    }
  },

  getMedicineTakenTime: async (medicineId: string, slot: MedicineSlot, dateStr: string): Promise<string | null> => {
    const records = await StorageService.getRecords();
    const record = records.find(r => r.type === RecordType.MEDICINE && r.date === dateStr && r.medicineId === medicineId && r.medicineSlot === slot);
    return record?.time || null;
  },

  isMedicineTakenToday: async (medicineId: string, slot: MedicineSlot, dateStr: string): Promise<boolean> => {
    const time = await StorageService.getMedicineTakenTime(medicineId, slot, dateStr);
    return time !== null;
  },

  generateId: (): string => Date.now().toString(36) + Math.random().toString(36).substr(2)
};
