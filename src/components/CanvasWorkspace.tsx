import React, { useRef, useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Columns2,
  Activity,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { CropRegion, HistogramChannel, MediaItem } from '../types';
import { CropOverlay } from './CropOverlay';
import { CompareSlider } from './CompareSlider';
import { HistogramView } from './HistogramView';

interface CanvasWorkspaceProps {
  item: MediaItem;
  transformedUrl: string | null;
  histogramData: HistogramChannel | null;
  activeCropTool: boolean;
  onUpdateCrop: (crop: CropRegion) => void;
  isProcessing: boolean;
}

export const CanvasWorkspace: React.FC<CanvasWorkspaceProps> = ({
  item,
  transformedUrl,
  histogramData,
  activeCropTool,
  onUpdateCrop,
  isProcessing,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showCompare, setShowCompare] = useState(false);
  const [showHistogram, setShowHistogram] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => setZoom(1);

  // Default crop if active
  const effectiveCrop: CropRegion = item.settings.crop || {
    x: 10,
    y: 10,
    width: 80,
    height: 80,
    aspectRatio: null,
  };

  const currentW = item.settings.targetWidth || item.originalWidth;
  const currentH = item.settings.targetHeight || item.originalHeight;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 bg-zinc-950 flex flex-col overflow-hidden select-none"
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-zinc-900/85 backdrop-blur-md border border-zinc-800 p-1.5 rounded-xl shadow-xl">
        {/* Compare button */}
        <button
          onClick={() => setShowCompare(!showCompare)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showCompare
              ? 'bg-indigo-600 text-white'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
          title="Split-screen Before / After slider"
        >
          <Columns2 className="w-3.5 h-3.5" />
          <span>Compare</span>
        </button>

        {/* Histogram toggle */}
        <button
          onClick={() => setShowHistogram(!showHistogram)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            showHistogram
              ? 'bg-zinc-700 text-white'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          title="Toggle Histogram"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Histogram</span>
        </button>

        <div className="w-[1px] h-4 bg-zinc-800 mx-0.5" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 rounded text-xs font-mono text-zinc-300 hover:text-white hover:bg-zinc-800"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Histogram Panel */}
      {showHistogram && (
        <div className="absolute top-16 left-4 z-40 transition-all">
          <HistogramView data={histogramData} />
        </div>
      )}

      {/* Main Canvas Display Area */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div
          className="relative transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {showCompare && transformedUrl ? (
            <div className="relative max-w-[80vw] max-h-[75vh] shadow-2xl rounded-lg overflow-hidden border border-zinc-800">
              <CompareSlider
                originalSrc={item.originalUrl}
                transformedSrc={transformedUrl}
                className="max-h-[75vh]"
              />
            </div>
          ) : (
            <div className="relative max-w-[80vw] max-h-[75vh] shadow-2xl rounded-lg overflow-hidden border border-zinc-800/80 bg-zinc-900/50 flex items-center justify-center">
              {transformedUrl ? (
                <img
                  src={transformedUrl}
                  alt={item.name}
                  className="max-w-full max-h-[75vh] object-contain block pointer-events-none"
                />
              ) : (
                <img
                  src={item.originalUrl}
                  alt={item.name}
                  className="max-w-full max-h-[75vh] object-contain block pointer-events-none"
                />
              )}

              {/* Crop interactive handles when Crop tool active */}
              {activeCropTool && (
                <CropOverlay
                  crop={effectiveCrop}
                  imageNaturalWidth={item.originalWidth}
                  imageNaturalHeight={item.originalHeight}
                  onChange={onUpdateCrop}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status & Dimension Ribbon */}
      <div className="h-9 bg-zinc-900/80 border-t border-zinc-800 px-4 flex items-center justify-between text-xs text-zinc-400 select-none">
        <div className="flex items-center gap-4">
          <span className="font-medium text-zinc-300">{item.name}</span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-[11px]">
            Target: {currentW} × {currentH} px
          </span>
          <span className="text-zinc-600">|</span>
          <span className="font-mono text-[11px]">
            Original: {item.originalWidth} × {item.originalHeight} px
          </span>
          <span className="text-zinc-600">|</span>
          <span className="uppercase text-indigo-400 font-bold text-[10px]">
            {item.settings.format.replace('image/', '')}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {isProcessing ? (
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Rendering updates...
            </span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
