export type Role = 'patient' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  username: string; // acts as the Authentication ID (Firebase UID)
  email?: string;   // Linked email from provider
  password?: string;
  role: Role;
  status: UserStatus;
  contact_number?: string;
  address?: string;
}

export interface Question {
  id: number;
  text: string;
  category: string;
}

export interface AssessmentResult {
  id: string;
  patient_name: string;
  patient_id?: string;
  date: string;
  score: number;
  max_score: number;
  percentage: number;
  status: 'Critical' | 'Poor' | 'Normal' | 'Good' | 'Excellent';
  consistency_score: number;
  response_time_seconds: number;
  ai_interpretation?: string;
  answers: number[]; // Array of scores (1-5)
}

export interface ConsistencyPattern {
  name: string;
  pairs: [number, number][]; // 1-based indices from Python code
}

export enum AssessmentStatus {
  IDLE = 'IDLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SUBMITTING = 'SUBMITTING'
}