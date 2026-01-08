import React, { useRef, useEffect } from 'react';

interface TimeWheelProps {
  range: number; // Max number (e.g., 60 or 90)
  value: number; // Current selected value
  onChange: (val: number) => void;
  disabled?: boolean;
}

const ITEM_HEIGHT = 80; // Height of each number in pixels

export const TimeWheel: React.FC<TimeWheelProps> = ({ 
  range, 
  value, 
  onChange, 
  disabled
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Generate array [0, 1, 2, ... range]
  const numbers = Array.from({ length: range + 1 }, (_, i) => i);

  // Sync scroll position when value changes externally (e.g. Clear button)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = value * ITEM_HEIGHT;
    }
  }, [value]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      if (index !== value && index <= range && index >= 0) {
        onChange(index);
      }
    }
  };

  return (
    <div className="relative w-full h-[240px] bg-slate-900 rounded-xl border-2 border-slate-800 overflow-hidden">
      {/* The Red Line Indicator */}
      <div className="absolute top-1/2 left-0 right-0 h-[80px] -mt-[40px] border-y-4 border-red-500 bg-slate-800/50 pointer-events-none z-10"></div>

      {/* The Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`
          h-full overflow-y-auto no-scrollbar snap-y-mandatory 
          ${disabled ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {/* Padding Top to center the first item (Height of container / 2 - Item Height / 2) */}
        <div style={{ height: 80 }} />

        {numbers.map((num) => (
          <div 
            key={num} 
            className={`
              h-[80px] flex items-center justify-center snap-center
              transition-colors duration-200
            `}
          >
            <span className={`
              font-black text-5xl md:text-6xl 
              ${num === value ? 'text-white scale-110' : 'text-slate-600 scale-90'}
            `}>
              {num}
            </span>
          </div>
        ))}

        {/* Padding Bottom */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
};