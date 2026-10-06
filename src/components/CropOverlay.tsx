import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CropRegion } from '../types';

interface CropOverlayProps {
  crop: CropRegion;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
  onChange: (newCrop: CropRegion) => void;
}

type HandleType = 'center' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export const CropOverlay: React.FC<CropOverlayProps> = ({
  crop,
  imageNaturalWidth,
  imageNaturalHeight,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialCrop: CropRegion;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveHandle(handle);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialCrop: { ...crop },
    };
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!activeHandle || !dragStartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPct = ((e.clientX - dragStartRef.current.startX) / rect.width) * 100;
      const deltaYPct = ((e.clientY - dragStartRef.current.startY) / rect.height) * 100;
      const { initialCrop } = dragStartRef.current;

      let nextX = initialCrop.x;
      let nextY = initialCrop.y;
      let nextW = initialCrop.width;
      let nextH = initialCrop.height;

      const aspect = initialCrop.aspectRatio; // target aspect ratio width/height

      if (activeHandle === 'center') {
        nextX = Math.min(Math.max(0, initialCrop.x + deltaXPct), 100 - initialCrop.width);
        nextY = Math.min(Math.max(0, initialCrop.y + deltaYPct), 100 - initialCrop.height);
      } else {
        // Handle resizing
        if (activeHandle.includes('e')) {
          nextW = Math.min(Math.max(5, initialCrop.width + deltaXPct), 100 - initialCrop.x);
        }
        if (activeHandle.includes('w')) {
          const maxLeftShift = initialCrop.width - 5;
          const shift = Math.min(Math.max(-initialCrop.x, deltaXPct), maxLeftShift);
          nextX = initialCrop.x + shift;
          nextW = initialCrop.width - shift;
        }
        if (activeHandle.includes('s')) {
          nextH = Math.min(Math.max(5, initialCrop.height + deltaYPct), 100 - initialCrop.y);
        }
        if (activeHandle.includes('n')) {
          const maxTopShift = initialCrop.height - 5;
          const shift = Math.min(Math.max(-initialCrop.y, deltaYPct), maxTopShift);
          nextY = initialCrop.y + shift;
          nextH = initialCrop.height - shift;
        }

        // Apply aspect ratio constraint if specified
        if (aspect) {
          // container visual aspect ratio correction:
          // visual width / visual height = (nextW * imgW) / (nextH * imgH)
          // We want (nextW * imgW) / (nextH * imgH) = aspect
          // => nextH = (nextW * imgW) / (aspect * imgH)
          if (activeHandle.includes('e') || activeHandle.includes('w')) {
            nextH = ((nextW / 100) * imageNaturalWidth) / aspect / (imageNaturalHeight / 100);
            if (nextY + nextH > 100) {
              nextH = 100 - nextY;
              nextW = ((nextH / 100) * imageNaturalHeight * aspect) / (imageNaturalWidth / 100);
            }
          } else {
            nextW = ((nextH / 100) * imageNaturalHeight * aspect) / (imageNaturalWidth / 100);
            if (nextX + nextW > 100) {
              nextW = 100 - nextX;
              nextH = ((nextW / 100) * imageNaturalWidth) / aspect / (imageNaturalHeight / 100);
            }
          }
        }
      }

      // Bound safety
      nextX = Math.max(0, Math.min(100 - nextW, nextX));
      nextY = Math.max(0, Math.min(100 - nextH, nextY));

      onChange({
        ...crop,
        x: nextX,
        y: nextY,
        width: nextW,
        height: nextH,
      });
    },
    [activeHandle, crop, imageNaturalWidth, imageNaturalHeight, onChange]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveHandle(null);
      dragStartRef.current = null;
    }
  };

  const pxWidth = Math.round((crop.width / 100) * imageNaturalWidth);
  const pxHeight = Math.round((crop.height / 100) * imageNaturalHeight);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 z-30 pointer-events-auto select-none touch-none"
    >
      {/* Dark mask outside crop rectangle */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.65)`,
          left: `${crop.x}%`,
          top: `${crop.y}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`,
        }}
      />

      {/* Crop Box Window */}
      <div
        style={{
          left: `${crop.x}%`,
          top: `${crop.y}%`,
          width: `${crop.width}%`,
          height: `${crop.height}%`,
        }}
        onPointerDown={(e) => handlePointerDown(e, 'center')}
        className="absolute border border-white shadow-2xl cursor-move group"
      >
        {/* Rule of thirds grid lines */}
        <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity">
          <div className="absolute left-1/3 top-0 bottom-0 w-[1px] bg-white/70" />
          <div className="absolute left-2/3 top-0 bottom-0 w-[1px] bg-white/70" />
          <div className="absolute top-1/3 left-0 right-0 h-[1px] bg-white/70" />
          <div className="absolute top-2/3 left-0 right-0 h-[1px] bg-white/70" />
        </div>

        {/* Dimension badge */}
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/85 text-white text-[11px] font-mono px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap border border-zinc-700">
          {pxWidth} × {pxHeight} px
        </div>

        {/* 4 Corner handles */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'nw')}
          className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, 'ne')}
          className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, 'sw')}
          className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nesw-resize shadow-md"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, 'se')}
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-indigo-600 rounded-sm cursor-nwse-resize shadow-md"
        />

        {/* 4 Edge handles */}
        <div
          onPointerDown={(e) => handlePointerDown(e, 'n')}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-white/90 border border-indigo-600 rounded-full cursor-ns-resize shadow"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, 's')}
          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-white/90 border border-indigo-600 rounded-full cursor-ns-resize shadow"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, 'w')}
          className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-2 h-8 bg-white/90 border border-indigo-600 rounded-full cursor-ew-resize shadow"
        />
        <div
          onPointerDown={(e) => handlePointerDown(e, 'e')}
          className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-2 h-8 bg-white/90 border border-indigo-600 rounded-full cursor-ew-resize shadow"
        />
      </div>
    </div>
  );
};
