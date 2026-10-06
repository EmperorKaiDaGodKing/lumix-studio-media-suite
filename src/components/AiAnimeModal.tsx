import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Loader2,
  Check,
  Download,
  PlusCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  Wand2,
} from 'lucide-react';
import { MediaItem } from '../types';
import { CompareSlider } from './CompareSlider';

interface AiAnimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MediaItem;
  onApplyAsActive: (blob: Blob, url: string, name: string) => void;
  onAddToQueue: (newItem: MediaItem) => void;
}

export const AI_ANIME_STYLES = [
  {
    id: 'modern-anime',
    name: 'Modern Anime Keyframe',
    icon: '🌸',
    desc: 'High-end Japanese anime film aesthetic with crisp contour line art, clean cel-shaded skin, and warm cinematic lighting.',
  },
  {
    id: 'ghibli',
    name: 'Studio Ghibli Pastoral',
    icon: '🍃',
    desc: 'Hayao Miyazaki hand-painted watercolor look with lush greens, warm earth tones, and gentle painterly shading.',
  },
  {
    id: 'shinkai',
    name: 'Makoto Shinkai Horizon',
    icon: '✨',
    desc: 'Luminous azure skies, golden sunset rim-lighting, and radiant atmospheric bloom.',
  },
  {
    id: 'comic-toon',
    name: 'Graphic Novel Cartoon',
    icon: '💥',
    desc: 'Western graphic novel aesthetic with dynamic thick pen strokes, pop art vibrance, and bold comic cel shading.',
  },
  {
    id: 'classic-2d',
    name: 'Classic Saturday Morning',
    icon: '📺',
    desc: 'Flat hand-drawn animation cel with uniform pen lines and simplified 3-tone color blocks.',
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neo-Tokyo',
    icon: '⚡',
    desc: 'Bold manga inking, saturated neon magenta and electric cyan highlights, Akira / Ghost in the Shell vibe.',
  },
  {
    id: 'kawaii',
    name: 'Pastel Kawaii Manga',
    icon: '🎀',
    desc: 'High-key illumination, soft rose-tinted blush highlights, delicate fine line art, and dreamy lifted shadows.',
  },
];

export const AiAnimeModal: React.FC<AiAnimeModalProps> = ({
  isOpen,
  onClose,
  item,
  onApplyAsActive,
  onAddToQueue,
}) => {
  const [selectedStyle, setSelectedStyle] = useState('modern-anime');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [generatedResult, setGeneratedResult] = useState<{
    url: string;
    blob: Blob;
    mimeType: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Convert Blob or Image URL to Base64
  const fileToBase64 = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusStep('Encoding image buffer...');

    try {
      const base64Data = await fileToBase64(item.originalBlob);

      setStatusStep('Transmitting to neural style transfer model...');

      const response = await fetch('/api/ai-anime-stylize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: item.mimeType || 'image/jpeg',
          stylePreset: selectedStyle,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });

      setStatusStep('Synthesizing anime cartoon render...');

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate anime cartoon rendition.');
      }

      setStatusStep('Finalizing cartoon output...');

      // Convert base64 data to blob
      const res = await fetch(data.imageBase64);
      const outputBlob = await res.blob();
      const outputUrl = URL.createObjectURL(outputBlob);

      setGeneratedResult({
        url: outputUrl,
        blob: outputBlob,
        mimeType: data.mimeType || 'image/png',
      });
    } catch (err: any) {
      console.error('Style transfer failure:', err);
      setErrorMessage(
        err.message || 'An unexpected error occurred during neural transformation.'
      );
    } finally {
      setIsLoading(false);
      setStatusStep('');
    }
  };

  const handleApply = () => {
    if (!generatedResult) return;
    const newName = `${item.name.replace(/\.[^/.]+$/, '')}_anime_${selectedStyle}.png`;
    onApplyAsActive(generatedResult.blob, generatedResult.url, newName);
    onClose();
  };

  const handleAddToQueue = () => {
    if (!generatedResult) return;
    const newName = `${item.name.replace(/\.[^/.]+$/, '')}_anime_${selectedStyle}.png`;
    const newItem: MediaItem = {
      ...item,
      id: `ai-anime-${Date.now()}`,
      name: newName,
      originalBlob: generatedResult.blob,
      originalUrl: generatedResult.url,
      mimeType: generatedResult.mimeType,
      title: `${item.title} (Anime Render)`,
      tags: [...item.tags, 'anime', 'cartoon', 'ai-style-transfer'],
    };
    onAddToQueue(newItem);
    onClose();
  };

  const handleDownload = () => {
    if (!generatedResult) return;
    const a = document.createElement('a');
    a.href = generatedResult.url;
    a.download = `${item.name.replace(/\.[^/.]+$/, '')}_cartoon_${selectedStyle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Cartoon & Anime Style Transfer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  Neural Filter
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Transform your photo into a stylized 2D anime illustration keyframe
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Style Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">
              Select Cartoon & Anime Art Direction
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {AI_ANIME_STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500'
                        : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{style.icon}</span>
                      <span className="font-semibold text-xs text-white">
                        {style.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {style.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Prompt Refinement */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Fine-Tuning Instructions (Optional)
              </label>
              <span className="text-[10px] text-zinc-500">
                e.g., &quot;Give me blue anime eyes and spiky hair&quot;
              </span>
            </div>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific character traits, hair style, or lighting direction..."
              className="w-full px-3.5 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Render Result Preview Area */}
          {generatedResult ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Stylized Result (Drag slider to compare)
                </span>
                <span className="text-[11px] text-indigo-400 font-mono">
                  Original (Left) vs Cartoon (Right)
                </span>
              </div>

              <div className="h-72 w-full rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 shadow-inner">
                <CompareSlider
                  originalSrc={item.originalUrl}
                  transformedSrc={generatedResult.url}
                  className="w-full h-full"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                  <img
                    src={item.originalUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-medium text-white truncate max-w-xs">
                    Input: {item.name}
                  </h4>
                  <p className="text-[10px] text-zinc-400">
                    {item.originalWidth} × {item.originalHeight} px •{' '}
                    {(item.originalSize / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-[10px] text-indigo-300 mt-0.5">
                    Ready to transform into a hand-drawn 2D cartoon style
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Cartoon Render</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Loading status bar */}
          {isLoading && (
            <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <p className="text-xs font-medium text-indigo-200">
                  {statusStep || 'Synthesizing artwork...'}
                </p>
                <p className="text-[10px] text-indigo-400">
                  Analyzing facial contours, extracting cel boundaries, and rendering anime line art.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">Neural Transfer Notice</p>
                <p className="text-[11px] leading-relaxed">{errorMessage}</p>
                <p className="text-[10px] text-zinc-400 pt-1">
                  Tip: You can also use the real-time Algorithmic Anime engine in the toolbar to apply cel-shading, Kuwahara smoothing, and contour inking instantly!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            {generatedResult && (
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-render</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            {generatedResult && (
              <>
                <button
                  onClick={handleDownload}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  onClick={handleAddToQueue}
                  className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-white flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Add to Batch Queue</span>
                </button>

                <button
                  onClick={handleApply}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/30"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply as Working Asset</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
