export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/bmp';

export interface ColorAdjustments {
  brightness: number;   // -100 to 100 (0 default)
  contrast: number;     // -100 to 100 (0 default)
  saturation: number;   // -100 to 100 (0 default)
  exposure: number;     // -100 to 100 (0 default)
  temperature: number;  // -100 to 100 (0 default, cool blue to warm orange)
  tint: number;         // -100 to 100 (0 default, green to magenta)
  vibrance: number;     // -100 to 100 (0 default)
  highlights: number;   // -100 to 100 (0 default)
  shadows: number;      // -100 to 100 (0 default)
  sharpness: number;    // 0 to 100 (0 default)
  blur: number;         // 0 to 25 px (0 default)
  vignette: number;     // 0 to 100 (0 default)
  sepia: number;        // 0 to 100 (0 default)
  grayscale: number;    // 0 to 100 (0 default)
  invert: number;       // 0 to 100 (0 default)
  hueRotate: number;    // -180 to 180 (0 default)
}

export interface CropRegion {
  x: number;       // percentage 0 to 100
  y: number;       // percentage 0 to 100
  width: number;   // percentage 0 to 100
  height: number;  // percentage 0 to 100
  aspectRatio?: number | null; // e.g. 1 (1:1), 16/9, 4/3, etc.
}

export type ResampleAlgorithm = 'bicubic' | 'bilinear' | 'sharp' | 'nearest';

export interface TransformSettings {
  crop: CropRegion | null;
  rotation: number;     // degrees: -180 to 180 or 90 steps
  flipHorizontal: boolean;
  flipVertical: boolean;
  targetWidth: number;
  targetHeight: number;
  maintainAspectRatio: boolean;
  resampleAlgorithm: ResampleAlgorithm;
  adjustments: ColorAdjustments;
  format: ImageFormat;
  quality: number;      // 0.05 to 1.0 (for jpeg/webp)
}

export interface MediaItem {
  id: string;
  name: string;
  originalBlob: Blob;
  originalUrl: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  mimeType: string;
  settings: TransformSettings;
  // Generated metadata/tags
  title: string;
  caption: string;
  tags: string[];
}

export interface PresetFilter {
  id: string;
  name: string;
  category: 'color' | 'social' | 'web';
  description: string;
  adjustments?: Partial<ColorAdjustments>;
  format?: ImageFormat;
  quality?: number;
  resolution?: { width?: number; height?: number };
}

export interface HistogramChannel {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
}
