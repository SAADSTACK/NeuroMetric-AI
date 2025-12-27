import React, { useState, useEffect, useCallback } from 'react';
import { QUESTIONS, TIME_LIMIT_SECONDS, SCALE } from '../constants';
import { calculateConsistency, getStatusFromScore, saveAssessment } from '../services/assessmentService';
import { generateClinicalInterpretation } from '../services/geminiService';
import Timer from './Timer';
import { AssessmentResult } from '../types';

interface AssessmentViewProps {
  patientName: string;
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

const PAGE_SIZE = 5;

const AssessmentView: React.FC<AssessmentViewProps> = ({ patientName, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore state from local storage on mount (Crash recovery)
  useEffect(() => {
    const savedState = localStorage.getItem('neuro_current_session');
    if (savedState) {
      const { answers: savedAnswers, startTime } = JSON.parse(savedState);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = TIME_LIMIT_SECONDS - elapsed;
      
      if (remaining > 0) {
        setAnswers(savedAnswers);
        setTimeLeft(remaining);
      } else {
        // Time expired while away
        setTimeLeft(0);
      }
    } else {
      // Start new session
      localStorage.setItem('neuro_current_session', JSON.stringify({
        answers: {},
        startTime: Date.now()
      }));
    }
  }, []);

  // Update local storage on answer change
  useEffect(() => {
    const currentSession = JSON.parse(localStorage.getItem('neuro_current_session') || '{}');
    if (currentSession.startTime) {
      localStorage.setItem('neuro_current_session', JSON.stringify({
        ...currentSession,
        answers
      }));
    }
  }, [answers]);

  const handleSubmit = useCallback(async (forced = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const scores = QUESTIONS.map(q => answers[q.id] || 0); // 0 if skipped/forced
    const totalScore = scores.reduce((a, b) => a + b, 0);
    const maxScore = QUESTIONS.length * 5;
    const consistency = calculateConsistency(scores);
    const status = getStatusFromScore(totalScore);

    // Calculate category scores for AI
    const catScores: Record<string, number> = {};
    QUESTIONS.forEach((q, idx) => {
       const score = scores[idx];
       catScores[q.category] = (catScores[q.category] || 0) + score;
    });

    let interpretation = "Pending analysis...";
    if (!forced) {
        interpretation = await generateClinicalInterpretation(totalScore, maxScore, status, consistency, catScores);
    } else {
        interpretation = "Assessment terminated early due to time limit.";
    }

    const result: AssessmentResult = {
      id: crypto.randomUUID(),
      patient_name: patientName,
      date: new Date().toISOString(),
      score: totalScore,
      max_score: maxScore,
      percentage: (totalScore / maxScore) * 100,
      status,
      consistency_score: consistency,
      response_time_seconds: TIME_LIMIT_SECONDS - timeLeft,
      answers: scores,
      ai_interpretation: interpretation
    };

    await saveAssessment(result);
    localStorage.removeItem('neuro_current_session');
    onComplete(result);
  }, [answers, patientName, timeLeft, isSubmitting, onComplete]);

  // Handle Time Up
  const handleTimeUp = useCallback(() => {
    alert("Time limit reached. Submitting current answers.");
    handleSubmit(true);
  }, [handleSubmit]);

  const totalPages = Math.ceil(QUESTIONS.length / PAGE_SIZE);
  const currentQuestions = QUESTIONS.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  
  // Validation for next page
  const canProceed = currentQuestions.every(q => answers[q.id] !== undefined);
  const isLastPage = currentPage === totalPages - 1;

  const handleAnswer = (qId: number, val: number) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const progress = (Object.keys(answers).length / QUESTIONS.length) * 100;

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-6">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        <h2 className="text-xl font-semibold text-slate-700">Analyzing Response Patterns...</h2>
        <p className="text-slate-500">Consulting Gemini AI for clinical interpretation</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white shadow-xl rounded-2xl border border-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 sticky top-0 bg-white z-10 py-4 border-b">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Comprehensive Assessment</h1>
          <div className="text-sm text-slate-500 mt-1">
            Question {currentPage * PAGE_SIZE + 1} - {Math.min((currentPage + 1) * PAGE_SIZE, QUESTIONS.length)} of {QUESTIONS.length}
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
           <div className="w-32 md:w-48 bg-slate-100 rounded-full h-2.5">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
           </div>
           <Timer timeLeft={timeLeft} setTimeLeft={setTimeLeft} onTimeUp={handleTimeUp} />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-8 mb-8">
        {currentQuestions.map((q) => (
          <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-medium text-slate-900 mb-4">
              <span className="text-indigo-600 font-bold mr-2">{q.id}.</span>
              {q.text}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleAnswer(q.id, val)}
                  className={`
                    py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 border
                    ${answers[q.id] === val 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}
                  `}
                >
                  {SCALE[val as keyof typeof SCALE]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        
        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-6 py-2.5 text-slate-700 font-medium border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {isLastPage ? (
             <button
             onClick={() => handleSubmit(false)}
             disabled={!canProceed}
             className="px-8 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
           >
             Submit Assessment
           </button>
          ) : (
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!canProceed}
              className="px-8 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentView;
