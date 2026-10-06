import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MediaItem,
  TransformSettings,
  CropRegion,
  HistogramChannel,
} from './types';
import {
  DEFAULT_TRANSFORM_SETTINGS,
  exportCanvasToBlob,
  loadImage,
  renderTransformedCanvas,
  computeHistogram,
} from './utils/imageProcessing';
import { SAMPLE_IMAGES } from './utils/sampleImages';
import { Header } from './components/Header';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { EditorToolbar } from './components/EditorToolbar';
import { BatchQueueModal } from './components/BatchQueueModal';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [batchQueue, setBatchQueue] = useState<MediaItem[]>([]);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [activeCropTool, setActiveCropTool] = useState(false);

  // Render pipeline state
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);
  const [histogramData, setHistogramData] = useState<HistogramChannel | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const activeItem = items.find((i) => i.id === activeItemId) || null;
  const renderTimeoutRef = useRef<number | null>(null);

  // Load sample image on initial mount
  useEffect(() => {
    loadSampleById('sample-alpine');
  }, []);

  const loadSampleById = async (sampleId: string) => {
    const sampleConfig = SAMPLE_IMAGES.find((s) => s.id === sampleId) || SAMPLE_IMAGES[0];
    setIsProcessing(true);
    try {
      const blob = await sampleConfig.generate();
      const url = URL.createObjectURL(blob);
      const newItem: MediaItem = {
        id: `sample-${Date.now()}`,
        name: `${sampleConfig.name.toLowerCase().replace(/\s+/g, '_')}.jpg`,
        originalBlob: blob,
        originalUrl: url,
        originalWidth: sampleConfig.width,
        originalHeight: sampleConfig.height,
        originalSize: blob.size,
        mimeType: 'image/jpeg',
        settings: {
          ...DEFAULT_TRANSFORM_SETTINGS,
          targetWidth: sampleConfig.width,
          targetHeight: sampleConfig.height,
        },
        title: sampleConfig.name,
        caption: `High-resolution studio asset: ${sampleConfig.category}`,
        tags: [sampleConfig.category.toLowerCase(), 'sample', 'photography'],
      };

      setItems([newItem]);
      setActiveItemId(newItem.id);
    } catch (err) {
      console.error('Failed to load sample:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle uploaded files
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    setIsProcessing(true);
    const newItems: MediaItem[] = [];

    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        const item: MediaItem = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          originalBlob: file,
          originalUrl: url,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          originalSize: file.size,
          mimeType: file.type || 'image/jpeg',
          settings: {
            ...DEFAULT_TRANSFORM_SETTINGS,
            targetWidth: img.naturalWidth,
            targetHeight: img.naturalHeight,
          },
          title: file.name.replace(/\.[^/.]+$/, ''),
          caption: '',
          tags: ['upload', 'media'],
        };
        newItems.push(item);
      } catch (err) {
        console.error('Error loading uploaded image:', err);
      }
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      setActiveItemId(newItems[0].id);

      // If multiple files uploaded, stage them into the batch queue automatically
      if (newItems.length > 1) {
        setBatchQueue((prev) => [...prev, ...newItems]);
      }
    }
    setIsProcessing(false);
  };

  // Re-render transformed output canvas whenever active item settings change
  const triggerRender = useCallback(async (item: MediaItem) => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = window.setTimeout(async () => {
      setIsProcessing(true);
      try {
        const img = await loadImage(item.originalUrl);
        const canvas = await renderTransformedCanvas(img, item.settings);

        // Compute histogram
        const hist = computeHistogram(canvas);
        setHistogramData(hist);

        // Export to blob for preview and size estimate
        const blob = await exportCanvasToBlob(
          canvas,
          item.settings.format,
          item.settings.quality
        );

        setEstimatedSize(blob.size);
        const previewUrl = URL.createObjectURL(blob);
        setTransformedUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return previewUrl;
        });
      } catch (err) {
        console.error('Render transform error:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 60);
  }, []);

  useEffect(() => {
    if (activeItem) {
      triggerRender(activeItem);
    }
  }, [activeItem?.settings, activeItem?.originalUrl, triggerRender]);

  // Update settings for active item
  const handleUpdateSettings = (updates: Partial<TransformSettings>) => {
    if (!activeItemId) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === activeItemId) {
          return {
            ...item,
            settings: {
              ...item.settings,
              ...updates,
            },
          };
        }
        return item;
      })
    );
  };

  // Update metadata for active item
  const handleUpdateMetadata = (meta: {
    title?: string;
    caption?: string;
    tags?: string[];
  }) => {
    if (!activeItemId) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === activeItemId) {
          return {
            ...item,
            ...(meta.title !== undefined ? { title: meta.title } : {}),
            ...(meta.caption !== undefined ? { caption: meta.caption } : {}),
            ...(meta.tags !== undefined ? { tags: meta.tags } : {}),
          };
        }
        return item;
      })
    );
  };

  // Crop change from overlay
  const handleUpdateCrop = (crop: CropRegion) => {
    handleUpdateSettings({ crop });
  };

  // Reset active item transformations
  const handleResetItem = () => {
    if (!activeItem) return;
    handleUpdateSettings({
      ...DEFAULT_TRANSFORM_SETTINGS,
      targetWidth: activeItem.originalWidth,
      targetHeight: activeItem.originalHeight,
    });
    setActiveCropTool(false);
  };

  // Export currently active item
  const handleExportCurrent = async () => {
    if (!activeItem) return;
    try {
      setIsProcessing(true);
      const img = await loadImage(activeItem.originalUrl);
      const canvas = await renderTransformedCanvas(img, activeItem.settings);
      const blob = await exportCanvasToBlob(
        canvas,
        activeItem.settings.format,
        activeItem.settings.quality
      );

      const ext =
        activeItem.settings.format === 'image/jpeg'
          ? 'jpg'
          : activeItem.settings.format === 'image/png'
          ? 'png'
          : activeItem.settings.format === 'image/bmp'
          ? 'bmp'
          : 'webp';

      const baseName = activeItem.name.replace(/\.[^/.]+$/, '');
      const downloadFilename = `${baseName}_lumix.${ext}`;

      const link = document.createElement('a');
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add current item to batch queue
  const handleAddToBatch = () => {
    if (!activeItem) return;
    if (!batchQueue.some((q) => q.id === activeItem.id)) {
      setBatchQueue((prev) => [...prev, activeItem]);
    }
    setIsBatchModalOpen(true);
  };

  // Apply recipe from current active item to all queue items
  const handleApplyRecipeToAll = () => {
    if (!activeItem) return;
    const currentSettings = activeItem.settings;
    setBatchQueue((prev) =>
      prev.map((item) => ({
        ...item,
        settings: {
          ...currentSettings,
          targetWidth: item.originalWidth,
          targetHeight: item.originalHeight,
        },
      }))
    );
  };

  // Drag and drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none"
    >
      {/* Top Header Navigation */}
      <Header
        onFilesSelected={handleFilesSelected}
        onSelectSample={loadSampleById}
        onResetItem={handleResetItem}
        onExportCurrent={handleExportCurrent}
        batchCount={batchQueue.length}
        onOpenBatchModal={() => setIsBatchModalOpen(true)}
        currentItem={activeItem}
      />

      {/* Main Studio Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {activeItem ? (
          <>
            {/* Center Canvas Viewport */}
            <CanvasWorkspace
              item={activeItem}
              transformedUrl={transformedUrl}
              histogramData={histogramData}
              activeCropTool={activeCropTool}
              onUpdateCrop={handleUpdateCrop}
              isProcessing={isProcessing}
            />

            {/* Right Editing Toolbar */}
            <EditorToolbar
              item={activeItem}
              onUpdateSettings={handleUpdateSettings}
              onUpdateMetadata={handleUpdateMetadata}
              onExport={handleExportCurrent}
              onAddToBatch={handleAddToBatch}
              estimatedSize={estimatedSize}
              isProcessing={isProcessing}
              activeCropTool={activeCropTool}
              setActiveCropTool={setActiveCropTool}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
            <UploadCloud className="w-16 h-16 text-zinc-700 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-zinc-300 mb-2">No Media Loaded</h2>
            <p className="text-sm max-w-md text-zinc-500 mb-6">
              Drag and drop images here, click "Upload Media" above, or load an ultra-HD
              sample scene to start editing and converting.
            </p>
            <button
              onClick={() => loadSampleById('sample-alpine')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-950 flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Load Alpine Sunset Sample</span>
            </button>
          </div>
        )}
      </div>

      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-indigo-950/80 backdrop-blur-sm border-4 border-dashed border-indigo-400 flex flex-col items-center justify-center pointer-events-none">
          <UploadCloud className="w-20 h-20 text-indigo-300 animate-pulse mb-3" />
          <h3 className="text-2xl font-bold text-white">Drop Images to Import</h3>
          <p className="text-sm text-indigo-200 mt-1">
            Supports JPEG, PNG, WebP, GIF, BMP, and SVG files
          </p>
        </div>
      )}

      {/* Batch Processing Queue Modal */}
      {activeItem && (
        <BatchQueueModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          queue={batchQueue}
          onRemoveFromQueue={(id) =>
            setBatchQueue((prev) => prev.filter((i) => i.id !== id))
          }
          onClearQueue={() => setBatchQueue([])}
          currentSettings={activeItem.settings}
          onApplyRecipeToAll={handleApplyRecipeToAll}
        />
      )}
    </div>
  );
}
