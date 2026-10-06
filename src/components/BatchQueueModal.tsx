import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import {
  X,
  Archive,
  Download,
  Trash2,
  Sliders,
  CheckCircle2,
  Loader2,
  FileImage,
  Edit3,
  Hash,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
} from 'lucide-react';
import { MediaItem, TransformSettings } from '../types';
import {
  exportCanvasToBlob,
  formatBytes,
  loadImage,
  renderTransformedCanvas,
} from '../utils/imageProcessing';

interface BatchQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: MediaItem[];
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
  currentSettings: TransformSettings;
  onApplyRecipeToAll: () => void;
  onBulkRename: (renamedMap: Record<string, string>) => void;
}

export function generatePatternFilename(
  pattern: string,
  item: MediaItem,
  index: number,
  startIndex: number = 1,
  caseOption: 'as-is' | 'lowercase' | 'uppercase' = 'as-is'
): string {
  const currentNum = startIndex + index;
  const originalBaseName = item.name.replace(/\.[^/.]+$/, '');
  const targetW = item.settings.targetWidth || item.originalWidth;
  const targetH = item.settings.targetHeight || item.originalHeight;
  const targetFormat = item.settings.format.replace('image/', '').replace('jpeg', 'jpg');
  const today = new Date().toISOString().split('T')[0];

  let result = pattern
    .replace(/\{name\}|\[name\]/gi, originalBaseName)
    .replace(/\{nnn\}|\[nnn\]/gi, String(currentNum).padStart(3, '0'))
    .replace(/\{nn\}|\[nn\]/gi, String(currentNum).padStart(2, '0'))
    .replace(/\{n\}|\[n\]/gi, String(currentNum))
    .replace(/\{date\}|\[date\]/gi, today)
    .replace(/\{res\}|\[res\]/gi, `${targetW}x${targetH}`)
    .replace(/\{format\}|\[format\]/gi, targetFormat);

  if (caseOption === 'lowercase') {
    result = result.toLowerCase();
  } else if (caseOption === 'uppercase') {
    result = result.toUpperCase();
  }

  // Clean illegal filename characters
  result = result.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return result || `media_${currentNum}`;
}

const PRESET_PATTERNS = [
  { label: 'Sequential (01, 02...)', pattern: 'Asset_{nn}' },
  { label: '3-Digit (001, 002...)', pattern: 'Image_{nnn}' },
  { label: 'Original + Index', pattern: '{name}_{n}' },
  { label: 'Date + Index', pattern: 'Shoot_{date}_{nn}' },
  { label: 'Name + Resolution', pattern: '{name}_{res}' },
];

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  onRemoveFromQueue,
  onClearQueue,
  currentSettings,
  onApplyRecipeToAll,
  onBulkRename,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [processedPercent, setProcessedPercent] = useState(0);

  // Bulk rename controls
  const [showRenamePanel, setShowRenamePanel] = useState(false);
  const [namingPattern, setNamingPattern] = useState('{name}_{nn}');
  const [startIndex, setStartIndex] = useState<number>(1);
  const [caseOption, setCaseOption] = useState<'as-is' | 'lowercase' | 'uppercase'>('as-is');
  const [renameAppliedNotice, setRenameAppliedNotice] = useState(false);

  // In-line single editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState('');

  // Computed preview map
  const previewMap = useMemo(() => {
    const map: Record<string, string> = {};
    queue.forEach((item, idx) => {
      // Retain or replace extension based on target format
      const ext =
        item.settings.format === 'image/jpeg'
          ? 'jpg'
          : item.settings.format === 'image/png'
          ? 'png'
          : item.settings.format === 'image/bmp'
          ? 'bmp'
          : 'webp';

      const base = generatePatternFilename(
        namingPattern,
        item,
        idx,
        startIndex,
        caseOption
      );
      map[item.id] = `${base}.${ext}`;
    });
    return map;
  }, [queue, namingPattern, startIndex, caseOption]);

  if (!isOpen) return null;

  // Insert token into pattern input
  const insertToken = (token: string) => {
    setNamingPattern((prev) => `${prev}${token}`);
  };

  const handleApplyBulkRename = () => {
    if (queue.length === 0) return;
    const renamedMap: Record<string, string> = {};
    queue.forEach((item, idx) => {
      const base = generatePatternFilename(
        namingPattern,
        item,
        idx,
        startIndex,
        caseOption
      );
      const originalExt = item.name.split('.').pop() || 'jpg';
      renamedMap[item.id] = `${base}.${originalExt}`;
    });

    onBulkRename(renamedMap);
    setRenameAppliedNotice(true);
    setTimeout(() => setRenameAppliedNotice(false), 2500);
  };

  const handleInlineRenameCommit = (itemId: string) => {
    if (inlineEditValue.trim()) {
      onBulkRename({ [itemId]: inlineEditValue.trim() });
    }
    setEditingItemId(null);
  };

  const handleBatchExportZip = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    setProgressText('Initializing batch pipeline...');
    setProcessedPercent(0);

    try {
      const zip = new JSZip();

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setProgressText(`Processing item ${i + 1}/${queue.length}...`);
        setProcessedPercent(Math.round(((i + 0.5) / queue.length) * 100));

        // Load image & transform
        const img = await loadImage(item.originalUrl);
        const transformedCanvas = await renderTransformedCanvas(img, item.settings);

        // Export to blob
        const blob = await exportCanvasToBlob(
          transformedCanvas,
          item.settings.format,
          item.settings.quality
        );

        // Determine filename: use pattern preview if panel active, otherwise item.name with target ext
        let filename: string;
        const ext =
          item.settings.format === 'image/jpeg'
            ? 'jpg'
            : item.settings.format === 'image/png'
            ? 'png'
            : item.settings.format === 'image/bmp'
            ? 'bmp'
            : 'webp';

        if (showRenamePanel && previewMap[item.id]) {
          filename = previewMap[item.id];
        } else {
          const baseName = item.name.replace(/\.[^/.]+$/, '');
          filename = `${baseName}_transformed.${ext}`;
        }

        zip.file(filename, blob);
      }

      setProgressText('Compressing files into ZIP archive...');
      setProcessedPercent(95);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `lumix_batch_export_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setProgressText('Completed successfully!');
      setProcessedPercent(100);
      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    } catch (err) {
      console.error('Batch export failed:', err);
      setProgressText('Failed to export batch');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Batch Transformation & Renamer</h2>
              <p className="text-xs text-zinc-400">
                {queue.length} item{queue.length === 1 ? '' : 's'} staged for bulk processing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Ribbon */}
        {queue.length > 0 && (
          <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-zinc-950/50 border-b border-zinc-800 text-xs gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRenamePanel(!showRenamePanel)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  showRenamePanel
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
                <span>Bulk Rename Tool</span>
                {showRenamePanel ? (
                  <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                )}
              </button>

              <button
                onClick={onApplyRecipeToAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors"
                title="Synchronize resolution & color recipe to all queue items"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Apply Current Recipe to All</span>
              </button>
            </div>

            <button
              onClick={onClearQueue}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          </div>
        )}

        {/* BULK RENAME CONFIGURATION PANEL */}
        {showRenamePanel && queue.length > 0 && (
          <div className="p-4 bg-zinc-950/90 border-b border-zinc-800 space-y-3.5 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                Pattern Configuration
              </span>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-zinc-500 mr-1">Presets:</span>
                {PRESET_PATTERNS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setNamingPattern(p.pattern)}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern Input & Tokens */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={namingPattern}
                    onChange={(e) => setNamingPattern(e.target.value)}
                    placeholder="e.g. Asset_{nn}_{name}"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                {/* Start Number */}
                <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1">
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap">Start #:</span>
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={startIndex}
                    onChange={(e) => setStartIndex(parseInt(e.target.value) || 1)}
                    className="w-14 bg-transparent text-xs text-white font-mono focus:outline-none"
                  />
                </div>

                {/* Case Selector */}
                <select
                  value={caseOption}
                  onChange={(e) =>
                    setCaseOption(e.target.value as 'as-is' | 'lowercase' | 'uppercase')
                  }
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                >
                  <option value="as-is">As-Is Case</option>
                  <option value="lowercase">lowercase</option>
                  <option value="uppercase">UPPERCASE</option>
                </select>

                <button
                  onClick={handleApplyBulkRename}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {renameAppliedNotice ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Renamed!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Apply to Queue</span>
                    </>
                  )}
                </button>
              </div>

              {/* Variable Tokens Helper Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-zinc-500">Insert tag:</span>
                {[
                  { tag: '{name}', desc: 'Original Name' },
                  { tag: '{n}', desc: 'Sequential (1, 2...)' },
                  { tag: '{nn}', desc: 'Two Digits (01, 02...)' },
                  { tag: '{nnn}', desc: 'Three Digits (001...)' },
                  { tag: '{date}', desc: 'Current Date' },
                  { tag: '{res}', desc: 'Resolution' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    onClick={() => insertToken(item.tag)}
                    className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-indigo-300 hover:border-indigo-500 transition-colors font-mono"
                    title={item.desc}
                  >
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {queue.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 space-y-2">
              <FileImage className="w-10 h-10 mx-auto text-zinc-600 stroke-[1.5]" />
              <p className="text-sm font-medium">Batch queue is currently empty.</p>
              <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                Add media files or click "Add to Batch Queue" in the editor to convert and
                rename multiple assets simultaneously.
              </p>
            </div>
          ) : (
            queue.map((item, idx) => {
              const previewName = previewMap[item.id] || item.name;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[11px] font-mono text-zinc-500 w-5 shrink-0 text-center">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.originalUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-800"
                    />

                    <div className="min-w-0 flex-1">
                      {/* Name or Inline Editor */}
                      {editingItemId === item.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={inlineEditValue}
                            onChange={(e) => setInlineEditValue(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === 'Enter' && handleInlineRenameCommit(item.id)
                            }
                            className="bg-zinc-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleInlineRenameCommit(item.id)}
                            className="px-2 py-0.5 bg-indigo-600 rounded text-[11px] text-white"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2">
                          <p className="text-xs font-semibold text-zinc-200 truncate">
                            {item.name}
                          </p>
                          <button
                            onClick={() => {
                              setEditingItemId(item.id);
                              setInlineEditValue(item.name);
                            }}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                            title="Edit name manually"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* Pattern preview output indicator if panel is open */}
                      {showRenamePanel && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-indigo-400 mt-0.5">
                          <span className="text-zinc-500">Output:</span>
                          <span className="truncate">{previewName}</span>
                        </div>
                      )}

                      {/* Technical specifications */}
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                        <span>{formatBytes(item.originalSize)}</span>
                        <span>•</span>
                        <span>
                          {item.settings.targetWidth || item.originalWidth} ×{' '}
                          {item.settings.targetHeight || item.originalHeight} px
                        </span>
                        <span>•</span>
                        <span className="uppercase text-cyan-400 font-bold">
                          {item.settings.format.replace('image/', '')}
                        </span>
                        {item.settings.animeStyle?.enabled && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              ANIME
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRemoveFromQueue(item.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Processing progress bar if active */}
        {isProcessing && (
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-2 text-indigo-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {progressText}
              </span>
              <span className="font-mono text-white font-bold">{processedPercent}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${processedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-between items-center gap-2.5">
          <div className="text-[11px] text-zinc-500 font-mono">
            {showRenamePanel && queue.length > 0 && (
              <span>Pattern naming will be applied during ZIP export.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              disabled={queue.length === 0 || isProcessing}
              onClick={handleBatchExportZip}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-950/50 disabled:opacity-50 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              <span>Download All as ZIP Archive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
