const DAY_MS = 86400000;
export const localDateString = (date = new Date()): string => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const parseLocalDate = (value:string):Date => new Date(`${value}T12:00:00`);
export const formatDate = (value:string):string => parseLocalDate(value).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
export const getAge = (birthDate?:string, today=new Date()):string => {
  if(!birthDate) return 'Age not set'; const birth=parseLocalDate(birthDate); if(birth>today) return 'Not born yet';
  let years=today.getFullYear()-birth.getFullYear(), months=today.getMonth()-birth.getMonth(), days=today.getDate()-birth.getDate();
  if(days<0){months--;days+=new Date(today.getFullYear(),today.getMonth(),0).getDate();} if(months<0){years--;months+=12;}
  if(years>0)return `${years}y ${months}m`; if(months>0)return `${months}m ${days}d`; return `${Math.max(0,Math.floor((today.getTime()-birth.getTime())/DAY_MS))} days`;
};

export interface LifeStats {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  daysToBirthday: number;
  nextBirthday: string;
}

export const getLifeStats = (birthDate?:string, today=new Date()):LifeStats|null => {
  if(!birthDate)return null;
  const birth=parseLocalDate(birthDate);
  const current=parseLocalDate(localDateString(today));
  if(birth>current)return null;
  let years=current.getFullYear()-birth.getFullYear();
  let months=current.getMonth()-birth.getMonth();
  let days=current.getDate()-birth.getDate();
  if(days<0){months--;days+=new Date(current.getFullYear(),current.getMonth(),0).getDate();}
  if(months<0){years--;months+=12;}
  let birthday=new Date(current.getFullYear(),birth.getMonth(),birth.getDate(),12);
  if(birthday<current)birthday=new Date(current.getFullYear()+1,birth.getMonth(),birth.getDate(),12);
  const totalDays=Math.floor((current.getTime()-birth.getTime())/DAY_MS);
  return {years,months,days,totalDays,totalWeeks:Math.floor(totalDays/7),daysToBirthday:Math.round((birthday.getTime()-current.getTime())/DAY_MS),nextBirthday:localDateString(birthday)};
};
