import { StorageService } from './storage';
import { RecordType, MedicineSlot } from '../types';

// Audio Context for Alarm
let audioCtx: AudioContext | null = null;

const playAlarmSound = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
  oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
  
  gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1);
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

    // 1. Morning Logic: 11 AM - 12 PM (11:00 to 11:59)
    // Check every 15 mins: 0, 15, 30, 45
    if (hour === 11 && [0, 15, 30, 45].includes(minutes)) {
      const morningMeds = medicines.filter(m => m.schedule.morning);
      // Need async filter helper or manual loop
      let pendingCount = 0;
      for (const m of morningMeds) {
         const taken = await StorageService.isMedicineTakenToday(m.id, MedicineSlot.MORNING);
         if (!taken) pendingCount++;
      }

      if (pendingCount > 0) {
        NotificationService.triggerAlarm('Morning Medicine Missed!', `You have ${pendingCount} morning medicines pending. Please take them now.`);
      }
    }

    // 2. Night Logic: 9:30 PM (21:30) - 11:45 PM (23:45)
    // Check every 30 mins.
    const isNightCheckTime = 
       (hour === 21 && minutes === 30) ||
       (hour === 22 && (minutes === 0 || minutes === 30)) ||
       (hour === 23 && (minutes === 0 || minutes === 30));

    if (isNightCheckTime) {
      const nightMeds = medicines.filter(m => m.schedule.night);
      let pendingCount = 0;
      for (const m of nightMeds) {
         const taken = await StorageService.isMedicineTakenToday(m.id, MedicineSlot.NIGHT);
         if (!taken) pendingCount++;
      }

      if (pendingCount > 0) {
        NotificationService.triggerAlarm('Night Medicine Missed!', `You have ${pendingCount} night medicines pending. Please take them now.`);
      }
    }
  },

  checkNutAlarm: async () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Check at 8:30 PM (20:30) strict.
    // Also add follow ups at 9:00 PM and 9:30 PM if still not done.
    const isCheckTime = 
      (hour === 20 && minutes === 30) || 
      (hour === 21 && minutes === 0) || 
      (hour === 21 && minutes === 30);

    if (isCheckTime) {
      const todayStr = now.toISOString().split('T')[0];
      const items = await StorageService.getDailyNutItems(todayStr);
      
      // Target is 4 items (Almonds, Walnuts, Seeds, Dates)
      if (items.length < 4) {
        const missingCount = 4 - items.length;
        NotificationService.triggerAlarm(
          'Daily Nuts Reminder 🥜', 
          `It's ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}! You haven't finished your daily bowl yet. ${missingCount} items remaining.`
        );
      }
    }
  },

  triggerAlarm: (title: string, body: string) => {
    // 1. Play Sound
    playAlarmSound();

    // 2. Show Notification (if not recently shown to prevent spam in the exact same minute)
    const key = `alarm_${title}_${new Date().getMinutes()}`;
    if (!sessionStorage.getItem(key)) {
      new Notification(title, {
        body: body,
        icon: '/vite.svg', // Fallback
        tag: 'health-alarm',
        requireInteraction: true
      });
      sessionStorage.setItem(key, 'true');
    }
  }
};