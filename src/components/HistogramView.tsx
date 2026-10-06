import React, { useState } from 'react';
import { HistogramChannel } from '../types';

interface HistogramViewProps {
  data: HistogramChannel | null;
}

export const HistogramView: React.FC<HistogramViewProps> = ({ data }) => {
  const [showR, setShowR] = useState(true);
  const [showG, setShowG] = useState(true);
  const [showB, setShowB] = useState(true);
  const [showLum, setShowLum] = useState(true);

  if (!data) return null;

  const pointsToSvgPath = (points: number[]) => {
    return points
      .map((val, idx) => {
        const x = (idx / 255) * 100;
        const y = 100 - val * 95;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  };

  return (
    <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl p-3 shadow-xl w-64 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          RGB & Lum Histogram
        </span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            onClick={() => setShowLum(!showLum)}
            className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
              showLum ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            L
          </button>
          <button
            onClick={() => setShowR(!showR)}
            className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
              showR ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'text-zinc-600'
            }`}
          >
            R
          </button>
          <button
            onClick={() => setShowG(!showG)}
            className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
              showG ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40' : 'text-zinc-600'
            }`}
          >
            G
          </button>
          <button
            onClick={() => setShowB(!showB)}
            className={`px-1.5 py-0.5 rounded font-mono transition-colors ${
              showB ? 'bg-blue-500/30 text-blue-400 border border-blue-500/40' : 'text-zinc-600'
            }`}
          >
            B
          </button>
        </div>
      </div>

      <div className="relative h-24 w-full bg-zinc-950/80 rounded-lg overflow-hidden border border-zinc-800/80">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {showLum && (
            <path
              d={`${pointsToSvgPath(data.lum)} L 100 100 L 0 100 Z`}
              fill="rgba(255, 255, 255, 0.15)"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.8"
            />
          )}
          {showR && (
            <path
              d={`${pointsToSvgPath(data.r)} L 100 100 L 0 100 Z`}
              fill="rgba(239, 68, 68, 0.2)"
              stroke="#ef4444"
              strokeWidth="0.8"
            />
          )}
          {showG && (
            <path
              d={`${pointsToSvgPath(data.g)} L 100 100 L 0 100 Z`}
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#10b981"
              strokeWidth="0.8"
            />
          )}
          {showB && (
            <path
              d={`${pointsToSvgPath(data.b)} L 100 100 L 0 100 Z`}
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3b82f6"
              strokeWidth="0.8"
            />
          )}
        </svg>

        <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[9px] text-zinc-500 font-mono">
          <span>0 (Shadows)</span>
          <span>128 (Mids)</span>
          <span>255 (Highlights)</span>
        </div>
      </div>
    </div>
  );
};
