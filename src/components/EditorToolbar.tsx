import React, { useState } from 'react';
import {
  Crop as CropIcon,
  Maximize2,
  Sliders,
  Download,
  Tag,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock,
  Sparkles,
  RefreshCw,
  Plus,
  X,
  FileCheck,
  Check,
  Zap,
} from 'lucide-react';
import {
  AnimeStyleSettings,
  ColorAdjustments,
  CropRegion,
  ImageFormat,
  MediaItem,
  ResampleAlgorithm,
  TransformSettings,
} from '../types';
import {
  ASPECT_RATIO_PRESETS,
  COLOR_PRESETS,
  RESOLUTION_PRESETS,
} from '../utils/presets';
import { DEFAULT_ADJUSTMENTS, DEFAULT_ANIME_SETTINGS, formatBytes } from '../utils/imageProcessing';

interface EditorToolbarProps {
  item: MediaItem;
  onUpdateSettings: (newSettings: Partial<TransformSettings>) => void;
  onUpdateMetadata: (metadata: { title?: string; caption?: string; tags?: string[] }) => void;
  onExport: () => void;
  onAddToBatch: () => void;
  estimatedSize: number;
  isProcessing: boolean;
  activeCropTool: boolean;
  setActiveCropTool: (active: boolean) => void;
  onOpenAiAnimeModal?: () => void;
}

type TabType = 'crop' | 'resize' | 'color' | 'anime' | 'export' | 'metadata';

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  item,
  onUpdateSettings,
  onUpdateMetadata,
  onExport,
  onAddToBatch,
  estimatedSize,
  isProcessing,
  activeCropTool,
  setActiveCropTool,
  onOpenAiAnimeModal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('resize');
  const [newTagInput, setNewTagInput] = useState('');
  const settings = item.settings;
  const adj = settings.adjustments;

  // Compute active aspect ratio in crop
  const currentRatio = settings.crop ? settings.crop.aspectRatio : null;

  // Handle Dimension changes
  const handleWidthChange = (val: number) => {
    if (val <= 0) return;
    const updates: Partial<TransformSettings> = { targetWidth: val };
    if (settings.maintainAspectRatio) {
      const currentH = settings.targetHeight || item.originalHeight;
      const currentW = settings.targetWidth || item.originalWidth;
      const ratio = currentH / currentW;
      updates.targetHeight = Math.round(val * ratio);
    }
    onUpdateSettings(updates);
  };

  const handleHeightChange = (val: number) => {
    if (val <= 0) return;
    const updates: Partial<TransformSettings> = { targetHeight: val };
    if (settings.maintainAspectRatio) {
      const currentH = settings.targetHeight || item.originalHeight;
      const currentW = settings.targetWidth || item.originalWidth;
      const ratio = currentW / currentH;
      updates.targetWidth = Math.round(val * ratio);
    }
    onUpdateSettings(updates);
  };

  // Preset scale multiplier (e.g. 0.5x, 2x)
  const handleScaleMultiplier = (factor: number) => {
    const baseW = item.originalWidth;
    const baseH = item.originalHeight;
    onUpdateSettings({
      targetWidth: Math.round(baseW * factor),
      targetHeight: Math.round(baseH * factor),
    });
  };

  // Color adjustment helper
  const updateAdj = (key: keyof ColorAdjustments, value: number) => {
    onUpdateSettings({
      adjustments: {
        ...adj,
        [key]: value,
      },
    });
  };

  const resetAdjustments = () => {
    onUpdateSettings({
      adjustments: { ...DEFAULT_ADJUSTMENTS },
    });
  };

  // Smart tag generation
  const handleAutoGenerateTags = () => {
    const tags = new Set<string>(item.tags);
    // Aspect tags
    const w = settings.targetWidth || item.originalWidth;
    const h = settings.targetHeight || item.originalHeight;
    if (w > h * 1.3) tags.add('landscape');
    else if (h > w * 1.3) tags.add('portrait');
    else tags.add('square');

    // Resolution tags
    if (w >= 3840 || h >= 2160) tags.add('4K UHD');
    else if (w >= 1920 || h >= 1080) tags.add('Full HD');
    else tags.add('web-optimized');

    // Color tone tags
    if (adj.grayscale === 100) tags.add('monochrome');
    if (adj.sepia > 30) tags.add('vintage');
    if (adj.temperature > 20) tags.add('warm-tone');
    if (adj.temperature < -20) tags.add('cool-tone');
    if (adj.vibrance > 25) tags.add('high-vibrance');
    if (adj.contrast > 25) tags.add('high-contrast');

    if (settings.animeStyle?.enabled) {
      tags.add('anime-art');
      tags.add('cel-shaded');
      tags.add(settings.animeStyle.style);
    }

    tags.add(settings.format.replace('image/', ''));
    onUpdateMetadata({ tags: Array.from(tags) });
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const trimmed = newTagInput.trim().toLowerCase();
    if (!item.tags.includes(trimmed)) {
      onUpdateMetadata({ tags: [...item.tags, trimmed] });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateMetadata({ tags: item.tags.filter((t) => t !== tagToRemove) });
  };

  const sizeDiff = estimatedSize - item.originalSize;
  const sizeDiffPercent = Math.round((Math.abs(sizeDiff) / item.originalSize) * 100);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 text-zinc-200 select-none w-80 md:w-96">
      {/* Top Tab Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/60 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab('resize')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'resize'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title="Resolution & Scaling"
        >
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Resize</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('crop');
            setActiveCropTool(true);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'crop'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title="Crop & Geometry"
        >
          <CropIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Crop</span>
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'color'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title="Color & Adjustments"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Color</span>
        </button>

        <button
          onClick={() => setActiveTab('anime')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'anime'
              ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title="Anime Art Transformation"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Anime</span>
        </button>

        <button
          onClick={() => setActiveTab('export')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'export'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title="Format & Export"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Format</span>
        </button>

        <button
          onClick={() => setActiveTab('metadata')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-lg transition-all ${
            activeTab === 'metadata'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title="Metadata & Keywords"
        >
          <Tag className="w-3.5 h-3.5 text-pink-400" />
          <span>Info</span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
        {/* TAB 1: RESIZE & RESOLUTION */}
        {activeTab === 'resize' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px]">
                  Custom Dimensions (PX)
                </span>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      maintainAspectRatio: !settings.maintainAspectRatio,
                    })
                  }
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] transition-colors ${
                    settings.maintainAspectRatio
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                  title="Lock Aspect Ratio"
                >
                  {settings.maintainAspectRatio ? (
                    <>
                      <Lock className="w-3 h-3" /> Locked Ratio
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" /> Unlocked
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-medium block mb-1">
                    WIDTH (PX)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={12000}
                    value={settings.targetWidth || item.originalWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono text-base font-semibold text-white focus:outline-none"
                  />
                </div>

                <div className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 font-medium block mb-1">
                    HEIGHT (PX)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={12000}
                    value={settings.targetHeight || item.originalHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono text-base font-semibold text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quick Scale Multipliers */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
                Scale Multipliers
              </span>
              <div className="grid grid-cols-6 gap-1">
                {[0.25, 0.5, 0.75, 1, 1.5, 2].map((factor) => {
                  const isCurrent =
                    settings.targetWidth === Math.round(item.originalWidth * factor);
                  return (
                    <button
                      key={factor}
                      onClick={() => handleScaleMultiplier(factor)}
                      className={`py-1.5 rounded text-[11px] font-mono font-medium border transition-colors ${
                        isCurrent
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {factor}x
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resampling Filter / Interpolation */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Resample Algorithm
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {settings.resampleAlgorithm === 'bicubic'
                    ? 'Bicubic Multi-Pass'
                    : settings.resampleAlgorithm === 'sharp'
                    ? 'Crisp Detail'
                    : settings.resampleAlgorithm}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'bicubic', label: 'Bicubic Smooth', desc: 'Best for photos' },
                    { id: 'sharp', label: 'Sharp Detail', desc: 'Enhanced crispness' },
                    { id: 'bilinear', label: 'Bilinear', desc: 'Standard fast' },
                    { id: 'nearest', label: 'Nearest Neighbor', desc: 'Pixel art style' },
                  ] as { id: ResampleAlgorithm; label: string; desc: string }[]
                ).map((algo) => (
                  <button
                    key={algo.id}
                    onClick={() => onUpdateSettings({ resampleAlgorithm: algo.id })}
                    className={`text-left p-2 rounded-lg border transition-all ${
                      settings.resampleAlgorithm === algo.id
                        ? 'bg-indigo-950/40 border-indigo-500 text-white'
                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="font-semibold text-[11px]">{algo.label}</div>
                    <div className="text-[9px] text-zinc-500">{algo.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Standard Resolution Presets */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
                Standard & Social Presets
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {RESOLUTION_PRESETS.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      onUpdateSettings({
                        targetWidth: res.width,
                        targetHeight: res.height,
                      });
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/70 hover:border-zinc-700 hover:bg-zinc-800/40 transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium text-zinc-200">{res.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        {res.aspectRatio} Aspect
                      </div>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {res.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Print DPI Calculation Info */}
            <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2.5">
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1">
                Print Size Estimation
              </span>
              <div className="flex justify-between text-zinc-400 text-[11px] font-mono">
                <span>
                  300 DPI (Magazine):{' '}
                  {(
                    (settings.targetWidth || item.originalWidth) / 300
                  ).toFixed(1)}
                  ″ ×{' '}
                  {(
                    (settings.targetHeight || item.originalHeight) / 300
                  ).toFixed(1)}
                  ″
                </span>
              </div>
              <div className="flex justify-between text-zinc-400 text-[11px] font-mono">
                <span>
                  150 DPI (Poster):{' '}
                  {(
                    (settings.targetWidth || item.originalWidth) / 150
                  ).toFixed(1)}
                  ″ ×{' '}
                  {(
                    (settings.targetHeight || item.originalHeight) / 150
                  ).toFixed(1)}
                  ″
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CROP & GEOMETRY */}
        {activeTab === 'crop' && (
          <div className="space-y-5">
            {/* Crop tool toggle */}
            <div className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-lg border border-zinc-800">
              <div>
                <span className="font-semibold text-zinc-200 block">
                  Interactive Crop Box
                </span>
                <span className="text-[10px] text-zinc-500">
                  Drag handles on preview to reframe
                </span>
              </div>
              <button
                onClick={() => {
                  if (activeCropTool) {
                    setActiveCropTool(false);
                  } else {
                    setActiveCropTool(true);
                    if (!settings.crop) {
                      onUpdateSettings({
                        crop: { x: 10, y: 10, width: 80, height: 80 },
                      });
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeCropTool
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {activeCropTool ? 'Active' : 'Enable Crop'}
              </button>
            </div>

            {/* Aspect Ratio Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Crop Aspect Ratio
                </span>
                {settings.crop && (
                  <button
                    onClick={() => onUpdateSettings({ crop: null })}
                    className="text-[10px] text-red-400 hover:underline"
                  >
                    Reset Crop
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {ASPECT_RATIO_PRESETS.map((preset) => {
                  const isSelected =
                    currentRatio === preset.value ||
                    (preset.value === null && currentRatio === null);
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setActiveCropTool(true);
                        const initialCrop: CropRegion = settings.crop || {
                          x: 10,
                          y: 10,
                          width: 80,
                          height: 80,
                        };
                        onUpdateSettings({
                          crop: {
                            ...initialCrop,
                            aspectRatio: preset.value,
                          },
                        });
                      }}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-semibold text-[11px]">{preset.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Geometry: Rotation & Flipping */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
                Rotate & Flip
              </span>
              <div className="grid grid-cols-4 gap-1.5 mb-3">
                <button
                  onClick={() =>
                    onUpdateSettings({
                      rotation: (settings.rotation - 90 + 360) % 360,
                    })
                  }
                  className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex flex-col items-center justify-center gap-1"
                  title="Rotate -90°"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px]">-90°</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateSettings({
                      rotation: (settings.rotation + 90) % 360,
                    })
                  }
                  className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 flex flex-col items-center justify-center gap-1"
                  title="Rotate +90°"
                >
                  <RotateCw className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px]">+90°</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateSettings({
                      flipHorizontal: !settings.flipHorizontal,
                    })
                  }
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors ${
                    settings.flipHorizontal
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Flip Horizontal"
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span className="text-[10px]">Flip H</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateSettings({
                      flipVertical: !settings.flipVertical,
                    })
                  }
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-colors ${
                    settings.flipVertical
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                  title="Flip Vertical"
                >
                  <FlipVertical className="w-4 h-4" />
                  <span className="text-[10px]">Flip V</span>
                </button>
              </div>

              {/* Fine rotation angle slider */}
              <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-400 text-[11px]">Fine Angle Adjust</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white text-[11px]">
                      {settings.rotation}°
                    </span>
                    {settings.rotation !== 0 && (
                      <button
                        onClick={() => onUpdateSettings({ rotation: 0 })}
                        className="text-[10px] text-zinc-500 hover:text-white"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={settings.rotation}
                  onChange={(e) =>
                    onUpdateSettings({ rotation: parseInt(e.target.value) })
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLOR & ADJUSTMENTS */}
        {activeTab === 'color' && (
          <div className="space-y-5">
            {/* Quick Filter Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Aesthetic Color Presets
                </span>
                <button
                  onClick={resetAdjustments}
                  className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white"
                >
                  <RefreshCw className="w-3 h-3" /> Reset All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onUpdateSettings({
                        adjustments: {
                          ...DEFAULT_ADJUSTMENTS,
                          ...(preset.adjustments || {}),
                        },
                      });
                    }}
                    className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-left hover:border-zinc-700 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="font-semibold text-zinc-200 text-[11px]">
                      {preset.name}
                    </div>
                    <div className="text-[9px] text-zinc-500 truncate">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Lighting Section */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Light & Exposure
              </span>

              {/* Exposure */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Exposure</span>
                  <span className="font-mono text-zinc-200">{adj.exposure}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.exposure}
                  onChange={(e) => updateAdj('exposure', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Brightness */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Brightness</span>
                  <span className="font-mono text-zinc-200">{adj.brightness}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.brightness}
                  onChange={(e) => updateAdj('brightness', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Contrast</span>
                  <span className="font-mono text-zinc-200">{adj.contrast}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.contrast}
                  onChange={(e) => updateAdj('contrast', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Highlights & Shadows */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Highlights</span>
                    <span className="font-mono text-zinc-200">{adj.highlights}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={adj.highlights}
                    onChange={(e) => updateAdj('highlights', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Shadows</span>
                    <span className="font-mono text-zinc-200">{adj.shadows}</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={adj.shadows}
                    onChange={(e) => updateAdj('shadows', parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Color Section */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                White Balance & Color
              </span>

              {/* Temperature */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Temperature (Cool / Warm)</span>
                  <span className="font-mono text-zinc-200">{adj.temperature}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.temperature}
                  onChange={(e) => updateAdj('temperature', parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Tint */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Tint (Green / Magenta)</span>
                  <span className="font-mono text-zinc-200">{adj.tint}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.tint}
                  onChange={(e) => updateAdj('tint', parseInt(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Saturation</span>
                  <span className="font-mono text-zinc-200">{adj.saturation}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.saturation}
                  onChange={(e) => updateAdj('saturation', parseInt(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              {/* Vibrance */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Vibrance</span>
                  <span className="font-mono text-zinc-200">{adj.vibrance}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={adj.vibrance}
                  onChange={(e) => updateAdj('vibrance', parseInt(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Effects & Filters */}
            <div className="space-y-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Details & Creative Effects
              </span>

              {/* Sharpness */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Sharpness (Unsharp Mask)</span>
                  <span className="font-mono text-zinc-200">{adj.sharpness}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adj.sharpness}
                  onChange={(e) => updateAdj('sharpness', parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Vignette */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Vignette</span>
                  <span className="font-mono text-zinc-200">{adj.vignette}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={adj.vignette}
                  onChange={(e) => updateAdj('vignette', parseInt(e.target.value))}
                  className="w-full accent-zinc-400 cursor-pointer"
                />
              </div>

              {/* Sepia & Grayscale */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Sepia</span>
                    <span className="font-mono text-zinc-200">{adj.sepia}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={adj.sepia}
                    onChange={(e) => updateAdj('sepia', parseInt(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-zinc-400">Grayscale</span>
                    <span className="font-mono text-zinc-200">{adj.grayscale}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={adj.grayscale}
                    onChange={(e) => updateAdj('grayscale', parseInt(e.target.value))}
                    className="w-full accent-zinc-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ANIME ART TRANSFORMATION */}
        {activeTab === 'anime' && (
          <div className="space-y-5">
            {/* AI Neural Model Launcher Card */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/80 via-indigo-950/80 to-pink-950/80 border border-purple-500/40 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">AI Cartoon & Anime Redraw</span>
                    <span className="text-[10px] text-purple-300">Neural Style Transfer Model</span>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold uppercase">
                  AI Model
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mb-3 leading-relaxed">
                Transform your photo into a stylized 2D anime character or cartoon avatar using deep neural style synthesis.
              </p>
              <button
                onClick={onOpenAiAnimeModal}
                className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch AI Cartoon Studio</span>
              </button>
            </div>

            {/* Master Switch Card for Real-Time Canvas Filter */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/70 to-purple-950/70 border border-indigo-500/30 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs">Real-Time Canvas Shader</h3>
                    <p className="text-[10px] text-indigo-300">
                      Instant cel-shading, inking & smoothing
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() =>
                    onUpdateSettings({
                      animeStyle: {
                        ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                        enabled: !(settings.animeStyle?.enabled),
                      },
                    })
                  }
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    settings.animeStyle?.enabled
                      ? 'bg-indigo-600 justify-end'
                      : 'bg-zinc-800 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition-transform" />
                </button>
              </div>
            </div>

            {/* Anime Sub-Style Aesthetic Presets */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
                Illustration & Cartoon Profiles
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'modern-anime',
                    name: 'Modern Anime Cel',
                    subtitle: 'Illustrated Keyframe',
                    desc: '2D anime redraw aesthetic with crisp contour line art, clean cel-shaded skin, and warm lighting.',
                    badge: 'Reference Style',
                  },
                  {
                    id: 'comic-toon',
                    name: 'Comic Graphic Novel',
                    subtitle: 'Bold Ink & Pop Art',
                    desc: 'Western graphic novel aesthetic with heavy pen strokes and vibrant primary colors.',
                    badge: 'Heavy Ink',
                  },
                  {
                    id: 'classic-2d',
                    name: 'Classic 2D Toon',
                    subtitle: 'Saturday Morning',
                    desc: 'Flat hand-drawn animation cel with uniform pen lines and simplified 3-tone color blocks.',
                    badge: 'Flat Toon',
                  },
                  {
                    id: 'shinkai',
                    name: 'Shinkai Horizon',
                    subtitle: 'Makoto Shinkai style',
                    desc: 'Luminous azure skies, golden sunset highlights & radiant atmospheric bloom.',
                    badge: 'Sky & Bloom',
                  },
                  {
                    id: 'ghibli',
                    name: 'Ghibli Pastoral',
                    subtitle: 'Hayao Miyazaki style',
                    desc: 'Hand-painted watercolor aesthetic, lush foliage greens & soft dark outlines.',
                    badge: 'Watercolor',
                  },
                  {
                    id: 'cyberpunk',
                    name: 'Cyberpunk Neo-Tokyo',
                    subtitle: 'Akira / Ghost in the Shell',
                    desc: 'Bold manga inking, saturated neon magenta & electric cyan contrasts.',
                    badge: 'Manga Ink',
                  },
                  {
                    id: 'kawaii',
                    name: 'Pastel Kawaii',
                    subtitle: 'Soft Manga Portrait',
                    desc: 'High-key illumination, soft rose-tinted blush & dreamy lifted shadows.',
                    badge: 'Soft Glow',
                  },
                ].map((s) => {
                  const currentStyle = settings.animeStyle?.style || 'modern-anime';
                  const isSelected = settings.animeStyle?.enabled && currentStyle === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() =>
                        onUpdateSettings({
                          animeStyle: {
                            ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                            enabled: true,
                            style: s.id as any,
                          },
                        })
                      }
                      className={`w-full text-left p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-950/40 text-white'
                          : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-100">
                            {s.name}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            ({s.subtitle})
                          </span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-indigo-300 font-mono">
                          {s.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2">
                        {s.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine Tuning Sliders */}
            <div className="space-y-3.5 pt-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Cartoon & Inking Parameters
              </span>

              {/* Painterly Kuwahara Cartoon Smoothing */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Painterly Smoothing (Kuwahara)</span>
                  <span className="font-mono text-indigo-300">
                    {settings.animeStyle?.painterlySmooth ?? 3} radius
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  value={settings.animeStyle?.painterlySmooth ?? 3}
                  onChange={(e) =>
                    onUpdateSettings({
                      animeStyle: {
                        ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                        painterlySmooth: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 mt-0.5">
                  <span>Raw Photo (0)</span>
                  <span>Cel-Painted (3-4)</span>
                  <span>Heavy Flat (5-6)</span>
                </div>
              </div>

              {/* Line Art Inking Strength */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Contour Ink Lines (Pen Outlines)</span>
                  <span className="font-mono text-indigo-300">
                    {settings.animeStyle?.lineArtStrength ?? 65}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.animeStyle?.lineArtStrength ?? 65}
                  onChange={(e) =>
                    onUpdateSettings({
                      animeStyle: {
                        ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                        lineArtStrength: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Line Thickness */}
              <div>
                <span className="text-zinc-400 text-[11px] block mb-1.5">
                  Contour Line Thickness
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 1, label: 'Fine (1px)' },
                    { val: 2, label: 'Medium (2px)' },
                    { val: 3, label: 'Bold (3px)' },
                  ].map((t) => (
                    <button
                      key={t.val}
                      onClick={() =>
                        onUpdateSettings({
                          animeStyle: {
                            ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                            lineArtThickness: t.val,
                          },
                        })
                      }
                      className={`py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                        (settings.animeStyle?.lineArtThickness ?? 1) === t.val
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ink Color */}
              <div>
                <span className="text-zinc-400 text-[11px] block mb-1.5">
                  Ink Outline Tone
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'black', label: 'Deep Black' },
                    { id: 'charcoal', label: 'Charcoal' },
                    { id: 'colored', label: 'Tinted' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        onUpdateSettings({
                          animeStyle: {
                            ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                            inkColor: t.id as any,
                          },
                        })
                      }
                      className={`py-1.5 rounded-lg text-[10px] font-medium border transition-colors ${
                        (settings.animeStyle?.inkColor || 'black') === t.id
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cel Shading Levels */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Cel-Shading Bands (Quantization)</span>
                  <span className="font-mono text-indigo-300">
                    {settings.animeStyle?.celShadingLevels ?? 5} levels
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={12}
                  value={settings.animeStyle?.celShadingLevels ?? 5}
                  onChange={(e) =>
                    onUpdateSettings({
                      animeStyle: {
                        ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                        celShadingLevels: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 mt-0.5">
                  <span>Graphic 2-Tone</span>
                  <span>Anime Cel (4-6)</span>
                  <span>Soft Shade (8+)</span>
                </div>
              </div>

              {/* Color Boost */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Cartoon Saturation Boost</span>
                  <span className="font-mono text-indigo-300">
                    +{settings.animeStyle?.colorBoost ?? 50}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.animeStyle?.colorBoost ?? 50}
                  onChange={(e) =>
                    onUpdateSettings({
                      animeStyle: {
                        ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                        colorBoost: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Radiant Bloom Glow */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-zinc-400">Anime Atmospheric Glow</span>
                  <span className="font-mono text-indigo-300">
                    {settings.animeStyle?.bloomGlow ?? 25}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.animeStyle?.bloomGlow ?? 25}
                  onChange={(e) =>
                    onUpdateSettings({
                      animeStyle: {
                        ...(settings.animeStyle || DEFAULT_ANIME_SETTINGS),
                        bloomGlow: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* AI Generative Anime Redraw Assistant */}
              <div className="p-3 bg-zinc-950/90 rounded-xl border border-indigo-500/30 space-y-2 mt-4">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generative 2D Anime Redraw</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  For full character draftsmanship (like redraws with anime eyes, vector dreadlocks, and custom room details), use this exact prompt in an AI image generator:
                </p>
                <div className="p-2 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 select-all leading-relaxed">
                  "High-detail 2D Japanese anime keyframe illustration of a figure in black graphic tee and floral cheeky cut underwear, muscular anatomy cel shading, clean black contour line art, detailed locs hair, vibrant anime background lighting, Studio Trigger animation style, 4k masterwork"
                </div>
              </div>

              {/* Reset Anime Settings */}
              <button
                onClick={() =>
                  onUpdateSettings({
                    animeStyle: { ...DEFAULT_ANIME_SETTINGS, enabled: false },
                  })
                }
                className="w-full py-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-zinc-700/60"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Cartoon Settings</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: FORMAT & EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-5">
            {/* Target File Format */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-2">
                Output File Format
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      id: 'image/webp',
                      label: 'WebP',
                      badge: 'Modern Web',
                      desc: 'Smallest file, superb quality',
                    },
                    {
                      id: 'image/jpeg',
                      label: 'JPEG',
                      badge: 'Universal',
                      desc: 'Compatible with all devices',
                    },
                    {
                      id: 'image/png',
                      label: 'PNG',
                      badge: 'Lossless',
                      desc: 'Preserves crispness & alpha',
                    },
                    {
                      id: 'image/bmp',
                      label: 'BMP',
                      badge: 'Uncompressed',
                      desc: 'Raw raster bitmap',
                    },
                  ] as {
                    id: ImageFormat;
                    label: string;
                    badge: string;
                    desc: string;
                  }[]
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => onUpdateSettings({ format: fmt.id })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      settings.format === fmt.id
                        ? 'bg-cyan-950/40 border-cyan-500 text-white'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-sm text-zinc-100">
                        {fmt.label}
                      </span>
                      <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-300">
                        {fmt.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 line-clamp-1">{fmt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Slider (for webp & jpeg) */}
            {(settings.format === 'image/jpeg' || settings.format === 'image/webp') && (
              <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-zinc-300 font-semibold text-[11px]">
                    Compression Quality
                  </span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {Math.round(settings.quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={Math.round(settings.quality * 100)}
                  onChange={(e) =>
                    onUpdateSettings({ quality: parseInt(e.target.value) / 100 })
                  }
                  className="w-full accent-cyan-500 cursor-pointer mb-2"
                />
                <div className="flex justify-between text-[9px] text-zinc-500">
                  <span>Maximum Compression</span>
                  <span>Balanced (80-90%)</span>
                  <span>Near-Lossless (95%+)</span>
                </div>
              </div>
            )}

            {/* Live Size & Savings Indicator */}
            <div className="bg-zinc-950/80 p-3 rounded-lg border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">
                Efficiency & Savings
              </span>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Original Size:</span>
                <span className="font-mono text-zinc-300">
                  {formatBytes(item.originalSize)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Estimated Output:</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {formatBytes(estimatedSize || item.originalSize * 0.7)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                <span className="text-zinc-400">Difference:</span>
                <span
                  className={`font-mono font-bold ${
                    sizeDiff < 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {sizeDiff < 0 ? `-${sizeDiffPercent}% Smaller` : `+${sizeDiffPercent}% Larger`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                disabled={isProcessing}
                onClick={onExport}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download Transformed Image</span>
              </button>

              <button
                onClick={onAddToBatch}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium flex items-center justify-center gap-2 border border-zinc-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add to Batch Processing Queue</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: METADATA & TAGS */}
        {activeTab === 'metadata' && (
          <div className="space-y-5">
            {/* Title & Caption */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
                  Media Title
                </label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => onUpdateMetadata({ title: e.target.value })}
                  placeholder="e.g. Pacific Coast Sunset at Dusk"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
                  Description / Caption
                </label>
                <textarea
                  rows={3}
                  value={item.caption}
                  onChange={(e) => onUpdateMetadata({ caption: e.target.value })}
                  placeholder="Provide an editorial caption or media description..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
            </div>

            {/* Smart Keyword & Tag Generator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                  Keywords & Tags
                </span>
                <button
                  onClick={handleAutoGenerateTags}
                  className="flex items-center gap-1 text-[10px] text-pink-400 hover:text-pink-300 font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Analyze Tags
                </button>
              </div>

              {/* Tag Input */}
              <div className="flex gap-1.5 mb-2.5">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add custom keyword..."
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500 text-xs"
                />
                <button
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1.5 min-h-12 p-2 bg-zinc-950/60 border border-zinc-800/80 rounded-lg">
                {item.tags.length === 0 ? (
                  <span className="text-zinc-600 text-[11px] italic">
                    No keywords assigned yet. Click "Auto-Analyze Tags" or type above.
                  </span>
                ) : (
                  item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-950/40 border border-pink-500/40 text-pink-300 text-[11px]"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-white"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Technical File Metadata Inspection */}
            <div className="bg-zinc-950/60 rounded-lg border border-zinc-800 p-3 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>File Name:</span>
                <span className="text-zinc-200 truncate max-w-[150px]">{item.name}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>MIME Type:</span>
                <span className="text-zinc-200">{item.mimeType}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Native Resolution:</span>
                <span className="text-zinc-200">
                  {item.originalWidth} × {item.originalHeight} px
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Megapixels:</span>
                <span className="text-zinc-200">
                  {((item.originalWidth * item.originalHeight) / 1_000_000).toFixed(2)} MP
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
