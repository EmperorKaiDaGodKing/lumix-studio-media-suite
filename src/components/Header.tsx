import React, { useRef } from 'react';
import {
  Upload,
  Layers,
  Sparkles,
  Download,
  RotateCcw,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react';
import { MediaItem } from '../types';
import { SAMPLE_IMAGES } from '../utils/sampleImages';

interface HeaderProps {
  onFilesSelected: (files: FileList | File[]) => void;
  onSelectSample: (sampleId: string) => void;
  onResetItem: () => void;
  onExportCurrent: () => void;
  batchCount: number;
  onOpenBatchModal: () => void;
  currentItem: MediaItem | null;
}

export const Header: React.FC<HeaderProps> = ({
  onFilesSelected,
  onSelectSample,
  onResetItem,
  onExportCurrent,
  batchCount,
  onOpenBatchModal,
  currentItem,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
    // reset input so the same file can be re-selected if desired
    e.target.value = '';
  };

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800 px-4 flex items-center justify-between select-none shrink-0 z-20">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-950">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-white text-sm tracking-tight">Lumix Studio</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-400 border border-indigo-800">
              PRO
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 hidden sm:block">
            Advanced Media Transformation & Formatting
          </p>
        </div>
      </div>

      {/* Middle Controls: Samples & Upload */}
      <div className="flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-indigo-400" />
          <span>Upload Media</span>
        </button>

        {/* Sample selector dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors">
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Load Sample</span>
          </button>
          <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-2xl hidden group-hover:block z-50">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase px-2 py-1 block">
              Demo Test Assets
            </span>
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample(sample.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <div className="text-xs font-medium text-zinc-200">{sample.name}</div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {sample.width}×{sample.height} • {sample.category}
                </div>
              </button>
            ))}
          </div>
        </div>

        {currentItem && (
          <button
            onClick={onResetItem}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs transition-colors"
            title="Reset transformations to original"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        )}
      </div>

      {/* Right Controls: Batch Queue & Export */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenBatchModal}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-800 transition-colors"
          title="Batch Queue Manager"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Batch Queue</span>
          {batchCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-600 text-white font-mono font-bold">
              {batchCount}
            </span>
          )}
        </button>

        {currentItem && (
          <button
            onClick={onExportCurrent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-indigo-950 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export {currentItem.settings.format.replace('image/', '').toUpperCase()}</span>
          </button>
        )}
      </div>
    </header>
  );
};
