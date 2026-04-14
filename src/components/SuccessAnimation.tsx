import { useEffect, useState } from 'react';

interface SuccessAnimationProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export default function SuccessAnimation({ message = 'Done!', onComplete, duration = 2500 }: SuccessAnimationProps) {
  const [dismiss, setDismiss] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDismiss(true);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${dismiss ? 'animate-fade-out' : ''}`}>
      {/* Professional Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Success Content */}
      <div className="relative flex flex-col items-center gap-6 pointer-events-none">
        {/* Card Container */}
        <div className="bg-neutral-900/95 backdrop-blur-sm border border-emerald-500/30 rounded-3xl p-12 shadow-2xl animate-success-pop">
          {/* Success Icon */}
          <div className="relative w-24 h-24 mx-auto">
            {/* Outer Circle */}
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="50"
                fill="rgba(16, 185, 129, 0.15)"
                stroke="rgb(16, 185, 129)"
                strokeWidth="2"
                className="animate-circle-draw"
                strokeDasharray="314"
                strokeDashoffset="0"
              />
            </svg>

            {/* Checkmark */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25 50 L42 65 L75 35"
                stroke="rgb(16, 185, 129)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-checkmark-draw"
                strokeDasharray="50"
                strokeDashoffset="0"
              />
            </svg>
          </div>

          {/* Success Message */}
          <div className="text-center mt-6">
            <p className="text-2xl font-bold text-emerald-400">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
