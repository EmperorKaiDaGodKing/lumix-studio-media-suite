import React, { useState, useRef, useCallback } from 'react';
import { Columns2 } from 'lucide-react';

interface CompareSliderProps {
  originalSrc: string;
  transformedSrc: string;
  className?: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  originalSrc,
  transformedSrc,
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePos(e.clientX);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      updatePos(e.clientX);
    },
    [isDragging]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  const updatePos = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, pos)));
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative overflow-hidden select-none touch-none ${className}`}
    >
      {/* Transformed image (Background / Right) */}
      <img
        src={transformedSrc}
        alt="Transformed"
        className="w-full h-full object-contain pointer-events-none"
      />

      {/* Original Image (Clipped / Left) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPos}%` }}
      >
        <img
          src={originalSrc}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain max-w-none pointer-events-none"
          style={{
            width: containerRef.current?.clientWidth || '100%',
            height: containerRef.current?.clientHeight || '100%',
          }}
        />
      </div>

      {/* Divider Line & Grabber Handle */}
      <div
        style={{ left: `${sliderPos}%` }}
        onPointerDown={handlePointerDown}
        className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-20 -translate-x-1/2 flex items-center justify-center group"
      >
        <div className="w-8 h-8 rounded-full bg-white text-zinc-900 shadow-2xl flex items-center justify-center border-2 border-zinc-900/20 group-hover:scale-110 active:scale-95 transition-transform">
          <Columns2 className="w-4 h-4" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 pointer-events-none">
        Original
      </div>
      <div className="absolute top-3 right-3 bg-indigo-600/80 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 pointer-events-none">
        Transformed
      </div>
    </div>
  );
};
