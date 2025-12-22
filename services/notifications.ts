import { StorageService } from './storage';
import { RecordType, MedicineSlot } from '../types';

// Audio Context for Alarm
let audioCtx: AudioContext | null = null;

const playAlarmSound = (urgent: boolean = false) => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = urgent ? 'square' : 'sine';
  oscillator.frequency.setValueAtTime(urgent ? 880 : 440, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(urgent ? 1760 : 880, audioCtx.currentTime + (urgent ? 0.3 : 0.5));
  
  gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (urgent ? 1.5 : 1));

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + (urgent ? 1.5 : 1));
};

export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  getPermissionStatus: (): NotificationPermission => {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  checkReminders: async () => {
    if (NotificationService.getPermissionStatus() !== 'granted') return;
    
    await NotificationService.checkGeneralReminders();
    await NotificationService.checkMedicineAlarms();
    await NotificationService.checkNutAlarm();
  },

  checkGeneralReminders: async () => {
    const records = await StorageService.getRecords();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const upcoming = records.filter(r => 
      (r.type === RecordType.APPOINTMENT || r.type === RecordType.VACCINATION) &&
      r.date >= todayStr &&
      new Date(r.date) <= threeDaysLater
    );

    upcoming.forEach(record => {
      try {
        const storageKey = `notified_${record.id}_${todayStr}`;
        if (!sessionStorage.getItem(storageKey)) {
          const title = record.type === RecordType.APPOINTMENT ? 'Upcoming Appointment 🩺' : 'Vaccination Due 💉';
          
          let dateStr = 'Unknown Date';
          try {
            const dateObj = new Date(record.date);
            if (!isNaN(dateObj.getTime())) {
                dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            }
          } catch (e) {
            console.warn('Skipping notification for invalid date', record);
            return;
          }

          const isToday = record.date === todayStr;
          
          new Notification(title, {
            body: `${record.title} is ${isToday ? 'today' : 'on ' + dateStr}.`,
          });
          sessionStorage.setItem(storageKey, 'true');
        }
      } catch (e) {
        console.error('Error processing notification:', e);
      }
    });
  },

  checkMedicineAlarms: async () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const medicines = await StorageService.getMedicines();
    // Use the current date for medication checks
    const todayStr = now.toISOString().split('T')[0];

    // 1. Morning Logic: 11 AM - 12 PM
    if (hour === 11 && [0, 15, 30, 45].includes(minutes)) {
      const morningMeds = medicines.filter(m => m.schedule.morning);
      let pendingCount = 0;
      for (const m of morningMeds) {
         // Fix: Added missing todayStr argument
         const taken = await StorageService.isMedicineTakenToday(m.id, MedicineSlot.MORNING, todayStr);
         if (!taken) pendingCount++;
      }
      if (pendingCount > 0) {
        NotificationService.triggerAlarm('Morning Medicine Reminder!', `You have ${pendingCount} morning medicines pending.`, false);
      }
    }

    // 2. Afternoon Logic (Iron): 1 PM to 5 PM
    // Reminder times: 3:30 PM (15:30), 4:00 PM (16:00), 4:30 PM (16:30)
    const isAfternoonReminder = 
      (hour === 15 && minutes === 30) || 
      (hour === 16 && (minutes === 0 || minutes === 30));
    
    // Final Alarm: 4:45 PM (16:45)
    const isAfternoonFinalAlarm = (hour === 16 && minutes === 45);

    if (isAfternoonReminder || isAfternoonFinalAlarm) {
      const afternoonMeds = medicines.filter(m => m.schedule.afternoon);
      let pendingCount = 0;
      for (const m of afternoonMeds) {
         // Fix: Added missing todayStr argument
         const taken = await StorageService.isMedicineTakenToday(m.id, MedicineSlot.AFTERNOON, todayStr);
         if (!taken) pendingCount++;
      }
      if (pendingCount > 0) {
        const title = isAfternoonFinalAlarm ? '🚨 FINAL AFTERNOON MEDICINE ALARM' : 'Afternoon Medicine Reminder';
        const body = isAfternoonFinalAlarm ? 'LAST CALL! Take your afternoon medicine now!' : `You have ${pendingCount} afternoon medicine(s) pending. Take it before 5 PM.`;
        NotificationService.triggerAlarm(title, body, isAfternoonFinalAlarm);
      }
    }

    // 3. Night Logic: 9:30 PM - 11:45 PM
    const isNightCheckTime = 
       (hour === 21 && minutes === 30) ||
       (hour === 22 && (minutes === 0 || minutes === 30)) ||
       (hour === 23 && (minutes === 0 || minutes === 30));

    if (isNightCheckTime) {
      const nightMeds = medicines.filter(m => m.schedule.night);
      let pendingCount = 0;
      for (const m of nightMeds) {
         // Fix: Added missing todayStr argument
         const taken = await StorageService.isMedicineTakenToday(m.id, MedicineSlot.NIGHT, todayStr);
         if (!taken) pendingCount++;
      }
      if (pendingCount > 0) {
        NotificationService.triggerAlarm('Night Medicine Reminder!', `You have ${pendingCount} night medicines pending.`, false);
      }
    }
  },

  checkNutAlarm: async () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    const isCheckTime = 
      (hour === 20 && minutes === 30) || 
      (hour === 21 && minutes === 0) || 
      (hour === 21 && minutes === 30);

    if (isCheckTime) {
      const todayStr = now.toISOString().split('T')[0];
      const items = await StorageService.getDailyNutLogs(todayStr);
      if (items.length < 4) {
        const missingCount = 4 - items.length;
        NotificationService.triggerAlarm(
          'Daily Nuts Reminder 🥜', 
          `It's ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}! ${missingCount} items remaining.`,
          false
        );
      }
    }
  },

  triggerAlarm: (title: string, body: string, urgent: boolean = false) => {
    playAlarmSound(urgent);
    const key = `alarm_${title}_${new Date().getHours()}_${new Date().getMinutes()}`;
    if (!sessionStorage.getItem(key)) {
      new Notification(title, {
        body: body,
        tag: 'health-alarm',
        requireInteraction: true,
        icon: 'https://cdn-icons-png.flaticon.com/512/822/822143.png'
      });
      sessionStorage.setItem(key, 'true');
    }
  }
};