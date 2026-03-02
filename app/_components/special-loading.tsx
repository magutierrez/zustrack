'use client';

import { cn } from '@/lib/utils';

interface SpecialLoadingProps {
  message?: string;
  className?: string;
}

export function SpecialLoading({ message, className }: SpecialLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-10 p-12", className)}>
      <div className="relative flex items-center justify-center">
        {/* Soft, sophisticated ambient glow */}
        <div className="absolute h-32 w-32 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded-full bg-blue-500/10 blur-[40px] dark:bg-blue-400/10" />
        
        {/* Floating Logo Container */}
        <div className="relative animate-[float_4s_ease-in-out_infinite]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="310.8 429.5 593 593"
            className="h-16 w-16 drop-shadow-[0_8px_16px_rgba(37,99,235,0.15)] md:h-20 md:w-20 dark:drop-shadow-[0_8px_16px_rgba(255,255,255,0.05)]"
          >
            <defs>
              {/* Snake Gradient for Dark Mode: Base White -> Shine Blue -> Base White */}
              <linearGradient id="snake-dark" x1="-100%" y1="-100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                <stop offset="65%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
                <animate attributeName="x1" values="-100%; 200%" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0%; 300%" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="y1" values="-100%; 200%" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="y2" values="0%; 300%" dur="2.5s" repeatCount="indefinite" />
              </linearGradient>

              {/* Snake Gradient for Light Mode: Base Blue -> Shine White -> Base Blue */}
              <linearGradient id="snake-light" x1="-100%" y1="-100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#2563eb" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="65%" stopColor="#2563eb" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.9" />
                <animate attributeName="x1" values="-100%; 200%" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="x2" values="0%; 300%" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="y1" values="-100%; 200%" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="y2" values="0%; 300%" dur="2.5s" repeatCount="indefinite" />
              </linearGradient>
            </defs>
            
            {/* Light mode path */}
            <g className="dark:hidden" fill="url(#snake-light)">
              <path d="M314.5 505.7c2.1 3.8 5.9 10.4 8.5 14.8s7.4 12.5 10.6 18c3.1 5.5 9.4 16.3 14 24 4.5 7.7 13.1 22.4 19 32.7l10.9 18.8h35.7c19.7 0 35.8-.2 35.8-.4 0-.1-4.3-7.7-9.6-16.7-11.5-19.5-21.4-36.8-21.4-37.2 0-.7 225.6-.8 228.2-.2l2.7.7-2.3 3.6c-1.3 2.1-9.9 16.5-19.1 32.2s-23 38.8-30.5 51.5c-17.4 29.2-22 37.2-22 37.9 0 .3 15.9.6 35.4.6h35.4l5.3-9.3c2.9-5 10.7-18.4 17.4-29.7s16-27 20.7-35 15.2-25.8 23.3-39.5c23.2-39.3 24.4-41.3 31.7-54 3.9-6.6 7.9-13.7 8.9-15.8l1.9-3.7H310.8Z" />
              <path d="m510.8 601.9-5.7.6-22.2 37.5c-31.4 53.1-41.8 70.7-65.9 111.5-11.7 19.8-21.7 36.6-22.2 37.2-.8 1 11.2 1.3 58.5 1.5l59.6.3-12.6 21.5c-6.9 11.8-18.9 32.3-26.8 45.5-22.2 37.5-36.5 61.7-46 78-4.8 8.2-9.1 15.5-9.6 16.1s-.6 1.4-.2 1.7c.7.8 486.3 1 486.3.2 0-.2-2.6-4.8-5.7-10.2s-7.1-12.3-8.8-15.3c-4.2-7.3-26.3-45.4-35.1-60.3-10-17.2-20.3-34.9-31.2-53.7-5.2-9.1-17.7-30.5-27.7-47.5-10-17.1-21.5-36.6-25.5-43.5s-8.2-14.1-9.5-16c-1.2-1.9-8.2-13.9-15.5-26.5-20.2-35.2-23.4-40.5-24.1-40.5-.4 0-5.8 8.7-12 19.2-6.2 10.6-14.6 24.9-18.7 31.8s-13.6 22.8-21 35.5c-7.5 12.6-17 28.8-21.2 36-4.3 7.1-15.4 26-24.7 42-9.4 15.9-18.8 31.9-21 35.5s-4.5 7.5-5.2 8.7l-1.2 2.3h70.6l3.4-5.8c14.3-24.1 24.2-40.9 35.8-60.7 7.4-12.7 13.8-23.4 14.2-23.8.8-.8 7.5 10.4 46.8 78.3 3.4 5.8 11.7 20.2 18.6 32l12.6 21.5-136.6.3c-75.2.1-136.8 0-137.1-.2-.2-.3 4.3-8.3 10-17.8 5.8-9.5 15.6-26.1 21.8-36.8s15.5-26.5 20.5-35c31.5-52.9 42.5-71.9 42.5-73.5 0-.2-26.5-.6-58.9-.7l-58.9-.3 9.2-15.5c5.1-8.5 17-28.6 26.3-44.5 9.4-16 21.9-37.2 27.8-47.3 5.9-10 10.6-18.4 10.4-18.6-.8-.7-58.5-1.3-64.1-.7" />
            </g>

            {/* Dark mode path */}
            <g className="hidden dark:block" fill="url(#snake-dark)">
              <path d="M314.5 505.7c2.1 3.8 5.9 10.4 8.5 14.8s7.4 12.5 10.6 18c3.1 5.5 9.4 16.3 14 24 4.5 7.7 13.1 22.4 19 32.7l10.9 18.8h35.7c19.7 0 35.8-.2 35.8-.4 0-.1-4.3-7.7-9.6-16.7-11.5-19.5-21.4-36.8-21.4-37.2 0-.7 225.6-.8 228.2-.2l2.7.7-2.3 3.6c-1.3 2.1-9.9 16.5-19.1 32.2s-23 38.8-30.5 51.5c-17.4 29.2-22 37.2-22 37.9 0 .3 15.9.6 35.4.6h35.4l5.3-9.3c2.9-5 10.7-18.4 17.4-29.7s16-27 20.7-35 15.2-25.8 23.3-39.5c23.2-39.3 24.4-41.3 31.7-54 3.9-6.6 7.9-13.7 8.9-15.8l1.9-3.7H310.8Z" />
              <path d="m510.8 601.9-5.7.6-22.2 37.5c-31.4 53.1-41.8 70.7-65.9 111.5-11.7 19.8-21.7 36.6-22.2 37.2-.8 1 11.2 1.3 58.5 1.5l59.6.3-12.6 21.5c-6.9 11.8-18.9 32.3-26.8 45.5-22.2 37.5-36.5 61.7-46 78-4.8 8.2-9.1 15.5-9.6 16.1s-.6 1.4-.2 1.7c.7.8 486.3 1 486.3.2 0-.2-2.6-4.8-5.7-10.2s-7.1-12.3-8.8-15.3c-4.2-7.3-26.3-45.4-35.1-60.3-10-17.2-20.3-34.9-31.2-53.7-5.2-9.1-17.7-30.5-27.7-47.5-10-17.1-21.5-36.6-25.5-43.5s-8.2-14.1-9.5-16c-1.2-1.9-8.2-13.9-15.5-26.5-20.2-35.2-23.4-40.5-24.1-40.5-.4 0-5.8 8.7-12 19.2-6.2 10.6-14.6 24.9-18.7 31.8s-13.6 22.8-21 35.5c-7.5 12.6-17 28.8-21.2 36-4.3 7.1-15.4 26-24.7 42-9.4 15.9-18.8 31.9-21 35.5s-4.5 7.5-5.2 8.7l-1.2 2.3h70.6l3.4-5.8c14.3-24.1 24.2-40.9 35.8-60.7 7.4-12.7 13.8-23.4 14.2-23.8.8-.8 7.5 10.4 46.8 78.3 3.4 5.8 11.7 20.2 18.6 32l12.6 21.5-136.6.3c-75.2.1-136.8 0-137.1-.2-.2-.3 4.3-8.3 10-17.8 5.8-9.5 15.6-26.1 21.8-36.8s15.5-26.5 20.5-35c31.5-52.9 42.5-71.9 42.5-73.5 0-.2-26.5-.6-58.9-.7l-58.9-.3 9.2-15.5c5.1-8.5 17-28.6 26.3-44.5 9.4-16 21.9-37.2 27.8-47.3 5.9-10 10.6-18.4 10.4-18.6-.8-.7-58.5-1.3-64.1-.7" />
            </g>
          </svg>
        </div>
      </div>
      
      {message && (
        <div className="mt-4">
          <p className="animate-[shimmer_2.5s_infinite] bg-[linear-gradient(110deg,#64748b,45%,#0f172a,55%,#64748b)] bg-[length:200%_100%] bg-clip-text font-sans text-[11px] font-bold tracking-[0.25em] text-transparent uppercase dark:bg-[linear-gradient(110deg,#64748b,45%,#f8fafc,55%,#64748b)]">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
