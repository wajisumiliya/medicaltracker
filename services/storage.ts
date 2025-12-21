import { MedicalRecord, Medicine, MedicineSlot, RecordType, User } from '../types';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query, 
  where,
  Firestore
} from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
// TODO: Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// Initialize Firebase with safety check
let app;
let db: Firestore | null = null;

try {
  // Simple check to see if config is still default placeholder
  if (firebaseConfig.apiKey === "REPLACE_WITH_YOUR_API_KEY") {
    console.warn("Firebase Config is missing. App is running in read-only/offline mode or will fail to save.");
  } else {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Failed to initialize Firebase:", error);
}

// Collection References
const RECORDS_COLLECTION = 'koala_records';
const CONFIG_COLLECTION = 'koala_config';

const CURRENT_USER_KEY = 'koala_current_session';

export const StorageService = {
  // --- User Session Management (Kept Local for Session State) ---
  
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

  // --- Medical Records CRUD (Firestore) ---

  getRecords: async (): Promise<MedicalRecord[]> => {
    if (!db) return [];
    try {
      const querySnapshot = await getDocs(collection(db, RECORDS_COLLECTION));
      const records: MedicalRecord[] = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() } as MedicalRecord);
      });
      // Sort by date descending
      return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error("Error getting records:", error);
      return [];
    }
  },

  addRecord: async (record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> => {
    if (!db) throw new Error("Database not connected");
    try {
      const newRecordData = {
        ...record,
        timestamp: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, RECORDS_COLLECTION), newRecordData);
      return { id: docRef.id, ...newRecordData };
    } catch (error) {
      console.error("Error adding record:", error);
      throw error;
    }
  },

  updateRecord: async (updatedRecord: MedicalRecord): Promise<void> => {
    if (!db) return;
    try {
      const { id, ...data } = updatedRecord;
      const recordRef = doc(db, RECORDS_COLLECTION, id);
      await updateDoc(recordRef, data);
    } catch (error) {
      console.error("Error updating record:", error);
    }
  },

  deleteRecord: async (id: string): Promise<void> => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, RECORDS_COLLECTION, id));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  },

  // --- Medicine Configuration CRUD (Firestore) ---

  getMedicines: async (): Promise<Medicine[]> => {
    if (!db) return [];
    try {
      const querySnapshot = await getDocs(collection(db, CONFIG_COLLECTION));
      const medicines: Medicine[] = [];
      querySnapshot.forEach((doc) => {
        medicines.push({ id: doc.id, ...doc.data() } as Medicine);
      });
      return medicines;
    } catch (error) {
      console.error("Error getting medicines:", error);
      return [];
    }
  },

  saveMedicine: async (medicine: Medicine): Promise<void> => {
    if (!db) return;
    try {
      // Check if medicine ID exists in our list (crude check, better to use setDoc with ID if we control IDs)
      // Since we generate IDs manually in Dashboard usually, let's use setDoc to ensure upsert
      const medRef = doc(db, CONFIG_COLLECTION, medicine.id);
      await setDoc(medRef, medicine);
    } catch (error) {
      console.error("Error saving medicine:", error);
    }
  },

  deleteMedicine: async (id: string): Promise<void> => {
    if (!db) return;
    try {
      // 1. Delete Medicine Config
      await deleteDoc(doc(db, CONFIG_COLLECTION, id));
      
      // 2. Delete associated history (Optional: Firestore doesn't cascade delete automatically)
      // For this app, we might leave history or implement a query delete.
      // Implementing a manual cleanup for simplicity:
      const records = await StorageService.getRecords();
      const linkedRecords = records.filter(r => r.medicineId === id);
      for (const r of linkedRecords) {
         await StorageService.deleteRecord(r.id);
      }
    } catch (error) {
      console.error("Error deleting medicine:", error);
    }
  },

  // --- Helpers for Dashboard (Async) ---

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
     if (!db) return;
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
    if (!db) return;
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
