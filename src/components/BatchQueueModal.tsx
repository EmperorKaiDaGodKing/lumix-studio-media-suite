import React, { useState } from 'react';
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
}

export const BatchQueueModal: React.FC<BatchQueueModalProps> = ({
  isOpen,
  onClose,
  queue,
  onRemoveFromQueue,
  onClearQueue,
  currentSettings,
  onApplyRecipeToAll,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [processedPercent, setProcessedPercent] = useState(0);

  if (!isOpen) return null;

  const handleBatchExportZip = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    setProgressText('Initializing batch pipeline...');
    setProcessedPercent(0);

    try {
      const zip = new JSZip();

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setProgressText(`Processing ${item.name} (${i + 1}/${queue.length})...`);
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

        // Get extension
        const ext =
          item.settings.format === 'image/jpeg'
            ? 'jpg'
            : item.settings.format === 'image/png'
            ? 'png'
            : item.settings.format === 'image/bmp'
            ? 'bmp'
            : 'webp';

        const baseName = item.name.replace(/\.[^/.]+$/, '');
        const filename = `${baseName}_transformed.${ext}`;

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
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Batch Transformation Queue</h2>
              <p className="text-xs text-zinc-400">
                {queue.length} item{queue.length === 1 ? '' : 's'} staged for bulk export
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

        {/* Action ribbon */}
        {queue.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 text-xs">
            <button
              onClick={onApplyRecipeToAll}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Apply Current Recipe to All</span>
            </button>

            <button
              onClick={onClearQueue}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-400 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          </div>
        )}

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 space-y-2">
              <FileImage className="w-10 h-10 mx-auto text-zinc-600 stroke-[1.5]" />
              <p className="text-sm">Batch queue is currently empty.</p>
              <p className="text-xs text-zinc-600">
                Add media files or use the "Add to Batch Queue" button to convert multiple
                files simultaneously.
              </p>
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.originalUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-800"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                      <span>{formatBytes(item.originalSize)}</span>
                      <span>•</span>
                      <span>
                        {item.settings.targetWidth || item.originalWidth} ×{' '}
                        {item.settings.targetHeight || item.originalHeight} px
                      </span>
                      <span>•</span>
                      <span className="uppercase text-indigo-400 font-bold">
                        {item.settings.format.replace('image/', '')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRemoveFromQueue(item.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
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
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
          >
            Close
          </button>
          <button
            disabled={queue.length === 0 || isProcessing}
            onClick={handleBatchExportZip}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-900/40 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Download All as ZIP Archive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
