import React from 'react';

interface TimerDisplayProps {
  totalSeconds: number;
  isHighAlert: boolean;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ totalSeconds, isHighAlert }) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const format = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`
      relative
      flex flex-col items-center justify-center
      w-full py-10 my-4
      rounded-3xl
      border-4
      ${isHighAlert ? 'bg-red-900 border-red-500 animate-pulse' : 'bg-slate-900 border-slate-700'}
    `}>
      <div className={`
        font-black tabular-nums tracking-wider
        ${isHighAlert ? 'text-red-100' : 'text-amber-400'}
        text-[5rem] leading-none
      `}>
        {hours > 0 && <span>{format(hours)}<span className="text-2xl align-top mx-1">:</span></span>}
        <span>{format(minutes)}</span>
        <span className="text-2xl align-top mx-1">:</span>
        <span>{format(seconds)}</span>
      </div>
      <div className="text-slate-400 text-xl font-bold mt-2 uppercase tracking-widest">
        {hours > 0 ? 'Hrs : Min : Sec' : 'Minutes : Seconds'}
      </div>
    </div>
  );
};