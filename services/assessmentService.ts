import { QUESTIONS, CONSISTENCY_PATTERNS } from "../constants";
import { AssessmentResult } from "../types";

// --- Consistency Logic Ported from Python ---
export const calculateConsistency = (answers: number[]): number => {
  let totalChecks = 0;
  let consistentChecks = 0;

  CONSISTENCY_PATTERNS.forEach((pattern) => {
    pattern.pairs.forEach(([q1, q2]) => {
      // Python uses 1-based indexing, JS uses 0-based.
      // We accept 1-based indices from constants and convert here.
      const val1 = answers[q1 - 1];
      const val2 = answers[q2 - 1];

      if (val1 !== undefined && val2 !== undefined) {
        totalChecks++;
        // Logic: |score1 - score2| <= 2 is consistent
        if (Math.abs(val1 - val2) <= 2) {
          consistentChecks++;
        }
      }
    });
  });

  return totalChecks > 0 ? (consistentChecks / totalChecks) * 100 : 100;
};

// --- Interpretation Logic ---
export const getStatusFromScore = (score: number): 'Critical' | 'Poor' | 'Normal' | 'Good' => {
  if (score <= 120) return 'Critical';
  if (score <= 180) return 'Poor';
  if (score <= 220) return 'Normal';
  return 'Good';
};

// --- Mock Database (Simulating Supabase) ---
// In a real app, these would be calls to supabase.from('assessments').insert(...)
const MOCK_DB_KEY = 'neuro_metric_db';

export const saveAssessment = async (result: AssessmentResult): Promise<void> => {
  const existing = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || '[]');
  existing.push(result);
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(existing));
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
};

export const fetchAllAssessments = async (): Promise<AssessmentResult[]> => {
  const existing = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || '[]');
  // If empty, seed some data for the Admin Dashboard to look good
  if (existing.length === 0) {
    return generateMockData();
  }
  return existing;
};

// Helper to generate fake data if DB is empty
const generateMockData = (): AssessmentResult[] => {
  const mock: AssessmentResult[] = [];
  const statuses = ['Good', 'Normal', 'Poor', 'Critical'];
  for (let i = 0; i < 20; i++) {
    const score = Math.floor(Math.random() * 200) + 50;
    mock.push({
      id: `mock-${i}`,
      patient_name: `Patient ${100 + i}`,
      date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
      score,
      max_score: 250,
      percentage: (score / 250) * 100,
      status: getStatusFromScore(score),
      consistency_score: Math.floor(Math.random() * 30) + 70,
      response_time_seconds: 500,
      answers: [],
      ai_interpretation: "Historical data migrated from legacy system."
    });
  }
  return mock;
};
