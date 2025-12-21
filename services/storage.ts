import { MedicalRecord, Medicine, MedicineSlot, RecordType, User } from '../types';

const RECORDS_KEY = 'koala_records_v1';
const CONFIG_KEY = 'koala_medicine_config_v1';
const CURRENT_USER_KEY = 'koala_current_session';

export const StorageService = {
  // --- User Session Management ---
  
  getUserData: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  login: (username: string): boolean => {
    const cleanName = username.trim();
    if (cleanName !== 'Sumaiya' && cleanName !== 'Wajeeth') {
      return false; 
    }

    const userData: User = {
      name: cleanName,
      role: cleanName === 'Wajeeth' ? 'admin' : 'user',
      isAuthenticated: true,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    return true;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // --- Medical Records CRUD ---

  getRecords: async (): Promise<MedicalRecord[]> => {
    const data = localStorage.getItem(RECORDS_KEY);
    const records: MedicalRecord[] = data ? JSON.parse(data) : [];
    // Sort by date descending
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  addRecord: async (record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> => {
    const records = await StorageService.getRecords();
    const newRecord: MedicalRecord = {
      ...record,
      id: StorageService.generateId(),
      timestamp: new Date().toISOString()
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

  // --- Medicine Configuration CRUD ---

  getMedicines: async (): Promise<Medicine[]> => {
    const data = localStorage.getItem(CONFIG_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveMedicine: async (medicine: Medicine): Promise<void> => {
    const medicines = await StorageService.getMedicines();
    const index = medicines.findIndex(m => m.id === medicine.id);
    
    let updated;
    if (index >= 0) {
      updated = [...medicines];
      updated[index] = medicine;
    } else {
      updated = [...medicines, medicine];
    }
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  },

  deleteMedicine: async (id: string): Promise<void> => {
    // 1. Delete Medicine Config
    const medicines = await StorageService.getMedicines();
    const updatedMeds = medicines.filter(m => m.id !== id);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updatedMeds));
    
    // 2. Cleanup history associated with this medicine
    const records = await StorageService.getRecords();
    const updatedRecords = records.filter(r => r.medicineId !== id);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(updatedRecords));
  },

  // --- Helpers for Dashboard ---

  getDailyCount: async (type: RecordType, dateStr: string): Promise<number> => {
    const records = await StorageService.getRecords();
    return records.filter(r => r.type === type && r.date === dateStr).length;
  },

  getDailyWaterLogs: async (dateStr: string): Promise<MedicalRecord[]> => {
    const records = await StorageService.getRecords();
    return records
      .filter(r => r.type === RecordType.WATER && r.date === dateStr)
      .sort((a, b) => {
        const tA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const tB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return tA - tB;
      });
  },

  addWaterLog: async (): Promise<void> => {
     const todayStr = new Date().toISOString().split('T')[0];
     const count = await StorageService.getDailyCount(RecordType.WATER, todayStr);
     if (count >= 8) return;

     await StorageService.addRecord({
        type: RecordType.WATER,
        title: 'Water Glass',
        date: todayStr,
        details: `Logged at ${new Date().toLocaleTimeString()}`,
        value: '1'
     });
  },

  toggleNutItem: async (itemTitle: string): Promise<void> => {
    const records = await StorageService.getRecords();
    const todayStr = new Date().toISOString().split('T')[0];
    
    const existing = records.find(r => 
      r.type === RecordType.NUTS && 
      r.date === todayStr && 
      r.title === itemTitle
    );

    if (existing) {
      await StorageService.deleteRecord(existing.id);
    } else {
      await StorageService.addRecord({
        type: RecordType.NUTS,
        title: itemTitle,
        date: todayStr,
        details: `Logged at ${new Date().toLocaleTimeString()}`,
        value: '0.25'
      });
    }
  },

  getDailyNutItems: async (dateStr: string): Promise<string[]> => {
    const records = await StorageService.getRecords();
    return records
      .filter(r => r.type === RecordType.NUTS && r.date === dateStr)
      .map(r => r.title);
  },

  isMedicineTakenToday: async (medicineId: string, slot: MedicineSlot): Promise<boolean> => {
    const records = await StorageService.getRecords();
    const todayStr = new Date().toISOString().split('T')[0];
    
    return records.some(r => 
      r.type === RecordType.MEDICINE && 
      r.date === todayStr && 
      r.medicineId === medicineId && 
      r.medicineSlot === slot
    );
  },

  generateId: (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};