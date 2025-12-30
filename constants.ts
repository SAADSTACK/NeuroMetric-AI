import { Question, ConsistencyPattern } from './types';

export const ADMIN_PASSWORD_HASH = "hfelab"; // In prod, verify hash on server. Kept simple for port.

export const QUESTIONS: Question[] = [
  // Mood and Emotional State
  { id: 1, text: "I often feel happy and content with my life", category: "Mood" },
  { id: 2, text: "My mood changes frequently throughout the day", category: "Mood" },
  { id: 3, text: "I find it difficult to experience pleasure in activities I used to enjoy", category: "Mood" },
  { id: 4, text: "I feel overwhelmed by my emotions", category: "Mood" },
  { id: 5, text: "I have periods of excessive energy followed by periods of exhaustion", category: "Mood" },
  { id: 6, text: "I am generally satisfied with my personal relationships", category: "Mood" },
  { id: 7, text: "I feel lonely even when I'm with other people", category: "Mood" },
  { id: 8, text: "I am able to handle criticism without becoming upset", category: "Mood" },
  { id: 9, text: "I often feel irritable or angry for no apparent reason", category: "Mood" },
  { id: 10, text: "I feel emotionally stable most of the time", category: "Mood" },
  
  // Anxiety and Stress
  { id: 11, text: "I worry excessively about everyday situations", category: "Anxiety" },
  { id: 12, text: "I feel tense or on edge most of the time", category: "Anxiety" },
  { id: 13, text: "I experience physical symptoms of anxiety (racing heart, sweating, trembling)", category: "Anxiety" },
  { id: 14, text: "I avoid social situations because they make me anxious", category: "Anxiety" },
  { id: 15, text: "I have difficulty falling or staying asleep due to worrying", category: "Anxiety" },
  { id: 16, text: "I feel overwhelmed by my responsibilities", category: "Anxiety" },
  { id: 17, text: "I am able to relax and unwind easily", category: "Anxiety" },
  { id: 18, text: "I experience panic attacks or sudden feelings of intense fear", category: "Anxiety" },
  { id: 19, text: "I feel constantly under pressure", category: "Anxiety" },
  { id: 20, text: "I can manage stress effectively in my daily life", category: "Anxiety" },

  // Self-Perception
  { id: 21, text: "I have a positive opinion of myself", category: "Self-Perception" },
  { id: 22, text: "I feel confident in my abilities", category: "Self-Perception" },
  { id: 23, text: "I often compare myself negatively to others", category: "Self-Perception" },
  { id: 24, text: "I know who I am and what I want in life", category: "Self-Perception" },
  { id: 25, text: "I feel like I'm living authentically", category: "Self-Perception" },
  { id: 26, text: "I am comfortable with how others perceive me", category: "Self-Perception" },
  { id: 27, text: "I feel worthy of love and respect", category: "Self-Perception" },
  { id: 28, text: "I struggle with feelings of inadequacy", category: "Self-Perception" },
  { id: 29, text: "I am proud of my accomplishments", category: "Self-Perception" },
  { id: 30, text: "I feel disconnected from my true self", category: "Self-Perception" },

  // Cognitive
  { id: 31, text: "I can concentrate easily on tasks", category: "Cognitive" },
  { id: 32, text: "My mind often goes blank", category: "Cognitive" },
  { id: 33, text: "I have difficulty making decisions", category: "Cognitive" },
  { id: 34, text: "I am able to think clearly and logically", category: "Cognitive" },
  { id: 35, text: "I frequently forget important things", category: "Cognitive" },
  { id: 36, text: "I feel mentally sharp and alert", category: "Cognitive" },
  { id: 37, text: "I struggle with problem-solving", category: "Cognitive" },
  { id: 38, text: "My thoughts race uncontrollably at times", category: "Cognitive" },
  { id: 39, text: "I can easily learn new things", category: "Cognitive" },
  { id: 40, text: "I feel mentally exhausted most of the time", category: "Cognitive" },

  // Behavioral
  { id: 41, text: "I maintain healthy daily routines", category: "Behavioral" },
  { id: 42, text: "I engage in self-destructive behaviors", category: "Behavioral" },
  { id: 43, text: "I take good care of my physical health", category: "Behavioral" },
  { id: 44, text: "I procrastinate important tasks", category: "Behavioral" },
  { id: 45, text: "I am able to set and maintain boundaries", category: "Behavioral" },
  { id: 46, text: "I use substances to cope with difficult emotions", category: "Behavioral" },
  { id: 47, text: "I engage in regular physical activity", category: "Behavioral" },
  { id: 48, text: "I have difficulty completing tasks", category: "Behavioral" },
  { id: 49, text: "I maintain a balanced lifestyle", category: "Behavioral" },
  { id: 50, text: "I often act impulsively without thinking", category: "Behavioral" }
];

export const CONSISTENCY_PATTERNS: ConsistencyPattern[] = [
    { name: "mood_consistency", pairs: [[1, 10], [2, 9], [6, 16]] },
    { name: "anxiety_pattern", pairs: [[11, 21], [12, 22], [15, 25]] },
    { name: "self_esteem_consistency", pairs: [[31, 41], [32, 42], [37, 47]] }
];

export const TIME_LIMIT_SECONDS = 360; // 6 minutes

export const SCALE = {
    1: "Strongly Disagree",
    2: "Disagree", 
    3: "Neutral",
    4: "Agree",
    5: "Strongly Agree"
};