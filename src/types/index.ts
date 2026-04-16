export interface DailyEntry {
  id?: string;
  userId: string;
  date: string; // ISO date
  mood: number;
  priorities: string[];
  accomplishments: string;
  habits: {
    exercise: boolean;
    focusedWork: boolean;
    healthyEating: boolean;
    goodSleep: boolean;
  };
  distraction: string;
  learned: string;
  wentWell: string;
  improvement: string;
  gratitude: string[];
  analysis?: {
    summary: string;
    pattern: string;
    actionableStep: string;
  };
  timestamp: any;
}

export interface StudySession {
  id?: string;
  userId: string;
  subject: string;
  duration: number;
  notes: string;
  imageUrl?: string;
  timestamp: any;
}

export interface Habit {
  id?: string;
  userId: string;
  name: string;
  completedDates: string[]; // Array of YYYY-MM-DD
  createdAt: any;
}

export interface UserSettings {
  dailyReminders: boolean;
  reminderTime: string; // HH:mm
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  settings?: UserSettings;
}

export type QuestionId = 
  | 'mood' 
  | 'priorities' 
  | 'accomplishments' 
  | 'habits' 
  | 'distraction' 
  | 'learned' 
  | 'wentWell' 
  | 'improvement' 
  | 'gratitude';

export interface Question {
  id: QuestionId;
  text: string;
  type: 'number' | 'text' | 'multiline' | 'habits' | 'list';
  placeholder?: string;
}
