import React, { useEffect } from 'react';

interface TimerProps {
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, setTimeLeft, onTimeUp }) => {
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp, setTimeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft < 60;
  const isWarning = timeLeft < 180;

  return (
    <div className={`
      flex items-center space-x-2 font-mono text-xl font-bold rounded-lg px-4 py-2 border
      ${isUrgent ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 
        isWarning ? 'bg-orange-50 text-orange-600 border-orange-200' : 
        'bg-slate-50 text-slate-700 border-slate-200'}
    `}>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};

export default Timer;
