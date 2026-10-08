export enum ProfileKind { CHILD = 'child', ADULT = 'adult' }
export interface Profile { id: string; name: string; kind: ProfileKind; birthDate?: string; sex?: 'female' | 'male' | 'unspecified'; color: string; photo?: string; allergies: string; notes: string; }
export enum RecordType { APPOINTMENT='Appointment', NOTE='Note', SYMPTOM='Symptom', VACCINATION='Vaccination', MEDICINE='Medicine', WEIGHT='Weight', HEIGHT='Height', HEAD_CIRCUMFERENCE='Head circumference', TEMPERATURE='Temperature', FEEDING='Feeding', SLEEP='Sleep', DIAPER='Diaper', DENTAL='Dental' }
export enum EventStatus { PENDING='Pending', COMPLETED='Completed', MISSED='Missed' }
export interface Medicine { id:string; profileId:string; name:string; dosage:string; reason:string; prescribingDoctor:string; startDate:string; endDate?:string; reminderTimes:string[]; }
export interface MedicalRecord { id:string; profileId:string; date:string; time?:string; timestamp?:string; type:RecordType; title:string; details:string; value?:number; unit?:string; location?:string; status?:EventStatus; medicineId?:string; doseNumber?:string; nextDueDate?:string; }
export interface User { name:string; role:'admin'|'user'; isAuthenticated:boolean; lastLogin?:string; profileImage?:string; }
export interface BackupData { version:2; exportedAt:string; profiles:Profile[]; records:MedicalRecord[]; medicines:Medicine[]; }
export interface GroundingSource { title:string; uri:string; }
export interface DailyFamilyInsight { babyMessage:string; momAdvice:string; generatedAt:string; source:'ai'|'fallback'; }
export interface DailyIslamicQuiz { question:string; options:string[]; correctIndex:number; explanation:string; generatedAt:string; source:'ai'|'fallback'; }
