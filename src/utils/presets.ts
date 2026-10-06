import { PresetFilter } from '../types';

export const COLOR_PRESETS: PresetFilter[] = [
  {
    id: 'cinema-teal-orange',
    name: 'Teal & Orange',
    category: 'color',
    description: 'Blockbuster cinematic look with cool cyan shadows and warm skin tones.',
    adjustments: {
      temperature: 25,
      tint: -15,
      contrast: 22,
      saturation: 15,
      highlights: -15,
      shadows: 10,
      vignette: 25,
    },
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'color',
    description: 'Lush sunset amber warmth, elevated vibrance, and soft glowing contrast.',
    adjustments: {
      temperature: 42,
      tint: 8,
      brightness: 6,
      exposure: 8,
      vibrance: 28,
      contrast: 12,
      highlights: -20,
    },
  },
  {
    id: 'nordic-cool',
    name: 'Nordic Chill',
    category: 'color',
    description: 'Crisp scandinavian mood with subdued saturation and cool clean whites.',
    adjustments: {
      temperature: -35,
      tint: -5,
      contrast: 18,
      saturation: -18,
      sharpness: 24,
      highlights: 12,
    },
  },
  {
    id: 'film-noir',
    name: 'Film Noir B&W',
    category: 'color',
    description: 'Dramatic black & white with rich deep blacks and unsharp film texture.',
    adjustments: {
      grayscale: 100,
      contrast: 40,
      brightness: -5,
      shadows: -25,
      sharpness: 35,
      vignette: 45,
    },
  },
  {
    id: 'vintage-fade',
    name: 'Vintage 70s',
    category: 'color',
    description: 'Warm nostalgic sepia tone with lifted shadows and retro vignette.',
    adjustments: {
      sepia: 35,
      temperature: 20,
      shadows: 25,
      contrast: -10,
      vignette: 35,
      saturation: -10,
    },
  },
  {
    id: 'vivid-nature',
    name: 'Vivid Nature',
    category: 'color',
    description: 'Ultra-crisp landscape punch with dynamic color depth and boosted vibrance.',
    adjustments: {
      vibrance: 40,
      saturation: 18,
      contrast: 20,
      sharpness: 30,
      shadows: 15,
      highlights: -12,
    },
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    category: 'color',
    description: 'Electric night vibes with intense magenta/blue shifts and punchy contrast.',
    adjustments: {
      temperature: -20,
      tint: 45,
      saturation: 45,
      contrast: 32,
      vignette: 30,
      sharpness: 20,
    },
  },
];

export interface ResolutionPreset {
  id: string;
  name: string;
  category: 'standard' | 'social' | 'print';
  width: number;
  height: number;
  aspectRatio: string;
  badge: string;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  // Standards
  { id: '4k-uhd', name: '4K Ultra HD', category: 'standard', width: 3840, height: 2160, aspectRatio: '16:9', badge: '3840×2160' },
  { id: '2k-qhd', name: '2K QHD', category: 'standard', width: 2560, height: 1440, aspectRatio: '16:9', badge: '2560×1440' },
  { id: '1080p-fhd', name: 'Full HD 1080p', category: 'standard', width: 1920, height: 1080, aspectRatio: '16:9', badge: '1920×1080' },
  { id: '720p-hd', name: 'HD 720p', category: 'standard', width: 1280, height: 720, aspectRatio: '16:9', badge: '1280×720' },
  
  // Social Media
  { id: 'ig-square', name: 'Square Post', category: 'social', width: 1080, height: 1080, aspectRatio: '1:1', badge: '1080×1080' },
  { id: 'ig-portrait', name: 'Portrait Post', category: 'social', width: 1080, height: 1350, aspectRatio: '4:5', badge: '1080×1350' },
  { id: 'story-reel', name: 'Story / Reel / Shorts', category: 'social', width: 1080, height: 1920, aspectRatio: '9:16', badge: '1080×1920' },
  { id: 'twitter-header', name: 'Header / Banner', category: 'social', width: 1500, height: 500, aspectRatio: '3:1', badge: '1500×500' },
  { id: 'yt-thumb', name: 'YouTube Thumbnail', category: 'social', width: 1280, height: 720, aspectRatio: '16:9', badge: '1280×720' },
];

export const ASPECT_RATIO_PRESETS = [
  { label: 'Original', value: null },
  { label: '1:1 Square', value: 1 },
  { label: '16:9 Widescreen', value: 16 / 9 },
  { label: '9:16 Story', value: 9 / 16 },
  { label: '4:3 Standard', value: 4 / 3 },
  { label: '3:2 Classic', value: 3 / 2 },
  { label: '4:5 Portrait', value: 4 / 5 },
  { label: '21:9 Ultrawide', value: 21 / 9 },
];
