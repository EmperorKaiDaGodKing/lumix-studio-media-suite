import { ColorAdjustments, HistogramChannel, ImageFormat, ResampleAlgorithm, TransformSettings } from '../types';

export const DEFAULT_ADJUSTMENTS: ColorAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  temperature: 0,
  tint: 0,
  vibrance: 0,
  highlights: 0,
  shadows: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  hueRotate: 0,
};

export const DEFAULT_TRANSFORM_SETTINGS: TransformSettings = {
  crop: null,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  targetWidth: 0,
  targetHeight: 0,
  maintainAspectRatio: true,
  resampleAlgorithm: 'bicubic',
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  format: 'image/webp',
  quality: 0.9,
};

/**
 * Format bytes to readable string (e.g., 2.4 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Helper to compute gcd for aspect ratios
 */
export function getAspectRatioLabel(width: number, height: number): string {
  if (!width || !height) return '';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(Math.round(width), Math.round(height));
  const wRatio = Math.round(width) / divisor;
  const hRatio = Math.round(height) / divisor;

  // Check common approximations
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.05) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(ratio - 3 / 4) < 0.05) return '3:4';
  if (Math.abs(ratio - 1) < 0.02) return '1:1';
  if (Math.abs(ratio - 3 / 2) < 0.05) return '3:2';
  if (Math.abs(ratio - 2 / 3) < 0.05) return '2:3';
  if (Math.abs(ratio - 21 / 9) < 0.05) return '21:9';

  return `${wRatio}:${hRatio}`;
}

/**
 * Creates an HTMLImageElement from a Blob or URL
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Multi-step smooth downscaler to avoid pixel aliasing and preserve crispness
 */
export function downscaleSmoothly(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  algorithm: ResampleAlgorithm
): HTMLCanvasElement {
  if (algorithm === 'nearest') {
    const out = document.createElement('canvas');
    out.width = targetWidth;
    out.height = targetHeight;
    const ctx = out.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    return out;
  }

  let curCanvas = sourceCanvas;
  let curW = sourceCanvas.width;
  let curH = sourceCanvas.height;

  // Step down in halves if downsizing significantly
  if (algorithm === 'bicubic' || algorithm === 'sharp') {
    while (curW * 0.5 > targetWidth && curH * 0.5 > targetHeight) {
      curW = Math.round(curW * 0.5);
      curH = Math.round(curH * 0.5);
      const stepCanvas = document.createElement('canvas');
      stepCanvas.width = curW;
      stepCanvas.height = curH;
      const stepCtx = stepCanvas.getContext('2d')!;
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(curCanvas, 0, 0, curW, curH);
      curCanvas = stepCanvas;
    }
  }

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = targetWidth;
  resultCanvas.height = targetHeight;
  const ctx = resultCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = algorithm === 'sharp' ? 'high' : 'high';
  ctx.drawImage(curCanvas, 0, 0, targetWidth, targetHeight);

  return resultCanvas;
}

/**
 * Apply 3x3 unsharp convolution kernel for sharpness
 */
function applySharpenKernel(data: Uint8ClampedArray, width: number, height: number, amount: number) {
  if (amount <= 0) return;
  const factor = amount / 100; // 0 to 1
  const copy = new Uint8ClampedArray(data);

  // Unsharp mask center weight increases with factor
  // Kernel: [ 0, -f, 0; -f, 1 + 4f, -f; 0, -f, 0 ]
  const c = 1 + 4 * factor;
  const n = -factor;

  for (let y = 1; y < height - 1; y++) {
    const yOffset = y * width;
    const upOffset = (y - 1) * width;
    const downOffset = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = (yOffset + x) * 4;
      const up = (upOffset + x) * 4;
      const down = (downOffset + x) * 4;
      const left = (yOffset + (x - 1)) * 4;
      const right = (yOffset + (x + 1)) * 4;

      for (let ch = 0; ch < 3; ch++) {
        const val =
          copy[idx + ch] * c +
          (copy[up + ch] + copy[down + ch] + copy[left + ch] + copy[right + ch]) * n;
        data[idx + ch] = Math.min(255, Math.max(0, val));
      }
    }
  }
}

/**
 * Applies color and tonal modifications pixel-by-pixel
 */
export function processPixelAdjustments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  adj: ColorAdjustments
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const len = data.length;

  const bVal = adj.brightness * 1.5; // -150 to 150
  const cFactor = (259 * (adj.contrast + 100)) / (100 * (259 - adj.contrast)); // contrast multiplier
  const expMult = Math.pow(2, adj.exposure / 50); // exposure multiplier
  const satFactor = (adj.saturation + 100) / 100;
  const vibFactor = adj.vibrance / 100;
  const tempShift = adj.temperature; // -100 to 100: negative = cool, positive = warm
  const tintShift = adj.tint; // -100 to 100: negative = green, positive = magenta
  const highShift = adj.highlights / 100;
  const shadowShift = adj.shadows / 100;
  const sepiaFactor = adj.sepia / 100;
  const grayFactor = adj.grayscale / 100;
  const invertFactor = adj.invert / 100;

  // Temperature pre-coefficients
  const rTemp = tempShift > 0 ? 1 + (tempShift / 100) * 0.25 : 1 - (Math.abs(tempShift) / 100) * 0.15;
  const bTemp = tempShift > 0 ? 1 - (tempShift / 100) * 0.25 : 1 + (Math.abs(tempShift) / 100) * 0.25;
  // Tint pre-coefficients
  const gTint = tintShift > 0 ? 1 - (tintShift / 100) * 0.2 : 1 + (Math.abs(tintShift) / 100) * 0.2;
  const rTint = tintShift > 0 ? 1 + (tintShift / 100) * 0.1 : 1;
  const bTint = tintShift > 0 ? 1 + (tintShift / 100) * 0.1 : 1;

  const hasAdjustments =
    adj.brightness !== 0 ||
    adj.contrast !== 0 ||
    adj.saturation !== 0 ||
    adj.exposure !== 0 ||
    adj.temperature !== 0 ||
    adj.tint !== 0 ||
    adj.vibrance !== 0 ||
    adj.highlights !== 0 ||
    adj.shadows !== 0 ||
    adj.sepia !== 0 ||
    adj.grayscale !== 0 ||
    adj.invert !== 0;

  if (hasAdjustments) {
    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. Exposure
      if (adj.exposure !== 0) {
        r *= expMult;
        g *= expMult;
        b *= expMult;
      }

      // 2. Temperature & Tint
      if (adj.temperature !== 0) {
        r *= rTemp;
        b *= bTemp;
      }
      if (adj.tint !== 0) {
        g *= gTint;
        r *= rTint;
        b *= bTint;
      }

      // 3. Brightness
      if (adj.brightness !== 0) {
        r += bVal;
        g += bVal;
        b += bVal;
      }

      // 4. Contrast
      if (adj.contrast !== 0) {
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
      }

      // 5. Highlights and Shadows
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (adj.highlights !== 0 && lum > 128) {
        const factor = (lum - 128) / 127;
        const shift = highShift * 50 * factor;
        r += shift;
        g += shift;
        b += shift;
      }
      if (adj.shadows !== 0 && lum < 128) {
        const factor = (128 - lum) / 128;
        const shift = shadowShift * 50 * factor;
        r += shift;
        g += shift;
        b += shift;
      }

      // 6. Saturation & Vibrance
      if (adj.saturation !== 0 || adj.vibrance !== 0) {
        const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
        let effectiveSat = satFactor;

        // Vibrance targets less saturated colors more
        if (adj.vibrance !== 0) {
          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const currentSpread = (maxChannel - minChannel) / (maxChannel || 1);
          effectiveSat += (1 - currentSpread) * vibFactor;
        }

        r = currentLum + (r - currentLum) * effectiveSat;
        g = currentLum + (g - currentLum) * effectiveSat;
        b = currentLum + (b - currentLum) * effectiveSat;
      }

      // 7. Grayscale
      if (grayFactor > 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = r * (1 - grayFactor) + gray * grayFactor;
        g = g * (1 - grayFactor) + gray * grayFactor;
        b = b * (1 - grayFactor) + gray * grayFactor;
      }

      // 8. Sepia
      if (sepiaFactor > 0) {
        const tr = 0.393 * r + 0.769 * g + 0.189 * b;
        const tg = 0.349 * r + 0.686 * g + 0.168 * b;
        const tb = 0.272 * r + 0.534 * g + 0.131 * b;
        r = r * (1 - sepiaFactor) + tr * sepiaFactor;
        g = g * (1 - sepiaFactor) + tg * sepiaFactor;
        b = b * (1 - sepiaFactor) + tb * sepiaFactor;
      }

      // 9. Invert
      if (invertFactor > 0) {
        r = r * (1 - invertFactor) + (255 - r) * invertFactor;
        g = g * (1 - invertFactor) + (255 - g) * invertFactor;
        b = b * (1 - invertFactor) + (255 - b) * invertFactor;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i + 1] = Math.min(255, Math.max(0, g));
      data[i + 2] = Math.min(255, Math.max(0, b));
    }
  }

  // 10. Sharpness Kernel
  if (adj.sharpness > 0) {
    applySharpenKernel(data, width, height, adj.sharpness);
  }

  ctx.putImageData(imgData, 0, 0);

  // 11. Vignette overlay if applicable
  if (adj.vignette > 0) {
    const vignetteStrength = adj.vignette / 100;
    const radius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.4,
      width / 2,
      height / 2,
      radius
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, `rgba(0,0,0,${0.3 * vignetteStrength})`);
    gradient.addColorStop(1, `rgba(0,0,0,${0.85 * vignetteStrength})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // 12. Blur if applicable
  if (adj.blur > 0) {
    // Quick Gaussian-style multi-pass box blur or filter blur
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.filter = `blur(${adj.blur}px)`;
    tempCtx.drawImage(ctx.canvas, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0);
  }
}

/**
 * Calculates RGB and Luminance histogram distribution (256 bins each)
 */
export function computeHistogram(canvas: HTMLCanvasElement): HistogramChannel {
  const ctx = canvas.getContext('2d');
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const lum = new Array(256).fill(0);

  if (!ctx) return { r, g, b, lum };

  // Sample with step to remain ultra fast even on 4K images
  const sampleW = Math.min(canvas.width, 320);
  const sampleH = Math.min(canvas.height, 240);
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const sampleCtx = sampleCanvas.getContext('2d');
  if (!sampleCtx) return { r, g, b, lum };

  sampleCtx.drawImage(canvas, 0, 0, sampleW, sampleH);
  const imgData = sampleCtx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;
  const totalPixels = sampleW * sampleH;

  for (let i = 0; i < data.length; i += 4) {
    const red = data[i];
    const green = data[i + 1];
    const blue = data[i + 2];
    const l = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

    r[red]++;
    g[green]++;
    b[blue]++;
    lum[l]++;
  }

  // Normalize by max value for easy SVG plotting
  const maxVal = Math.max(...r, ...g, ...b, ...lum) || 1;
  return {
    r: r.map((v) => v / maxVal),
    g: g.map((v) => v / maxVal),
    b: b.map((v) => v / maxVal),
    lum: lum.map((v) => v / maxVal),
  };
}

/**
 * Renders full transformation pipeline:
 * 1. Base image
 * 2. Rotate & Flip (geometry)
 * 3. Crop
 * 4. Scale to target width/height (with specified resample algorithm)
 * 5. Color adjustments and enhancements
 */
export async function renderTransformedCanvas(
  img: HTMLImageElement,
  settings: TransformSettings
): Promise<HTMLCanvasElement> {
  // Step 1: Geometry (Rotate & Flip)
  const rotRad = (settings.rotation * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rotRad));
  const absSin = Math.abs(Math.sin(rotRad));

  // Compute rotated bounding box
  const rotW = Math.round(img.width * absCos + img.height * absSin);
  const rotH = Math.round(img.width * absSin + img.height * absCos);

  const geomCanvas = document.createElement('canvas');
  geomCanvas.width = rotW;
  geomCanvas.height = rotH;
  const geomCtx = geomCanvas.getContext('2d')!;

  geomCtx.save();
  geomCtx.translate(rotW / 2, rotH / 2);
  geomCtx.rotate(rotRad);
  geomCtx.scale(settings.flipHorizontal ? -1 : 1, settings.flipVertical ? -1 : 1);
  geomCtx.drawImage(img, -img.width / 2, -img.height / 2);
  geomCtx.restore();

  // Step 2: Crop
  let croppedCanvas = geomCanvas;
  if (settings.crop) {
    const crop = settings.crop;
    const cropX = Math.max(0, Math.round((crop.x / 100) * rotW));
    const cropY = Math.max(0, Math.round((crop.y / 100) * rotH));
    const cropW = Math.max(1, Math.min(rotW - cropX, Math.round((crop.width / 100) * rotW)));
    const cropH = Math.max(1, Math.min(rotH - cropY, Math.round((crop.height / 100) * rotH)));

    const cCanvas = document.createElement('canvas');
    cCanvas.width = cropW;
    cCanvas.height = cropH;
    const cCtx = cCanvas.getContext('2d')!;
    cCtx.drawImage(geomCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    croppedCanvas = cCanvas;
  }

  // Step 3: Resizing to Target Resolution
  let finalW = settings.targetWidth || croppedCanvas.width;
  let finalH = settings.targetHeight || croppedCanvas.height;

  // Protect against 0
  finalW = Math.max(1, Math.round(finalW));
  finalH = Math.max(1, Math.round(finalH));

  let scaledCanvas: HTMLCanvasElement;
  if (finalW !== croppedCanvas.width || finalH !== croppedCanvas.height) {
    scaledCanvas = downscaleSmoothly(
      croppedCanvas,
      finalW,
      finalH,
      settings.resampleAlgorithm
    );
  } else {
    scaledCanvas = croppedCanvas;
  }

  // Step 4: Color and Tonal Adjustments
  const outCanvas = document.createElement('canvas');
  outCanvas.width = finalW;
  outCanvas.height = finalH;
  const outCtx = outCanvas.getContext('2d')!;
  outCtx.drawImage(scaledCanvas, 0, 0);

  processPixelAdjustments(outCtx, finalW, finalH, settings.adjustments);

  return outCanvas;
}

/**
 * Exports canvas to Blob with requested format & quality
 */
export async function exportCanvasToBlob(
  canvas: HTMLCanvasElement,
  format: ImageFormat,
  quality: number
): Promise<Blob> {
  if (format === 'image/bmp') {
    return canvasToBmpBlob(canvas);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image blob'));
      },
      format,
      quality
    );
  });
}

/**
 * BMP encoder for lossless BMP export fallback
 */
function canvasToBmpBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const extraBytes = (width * 3) % 4;
  const padding = extraBytes === 0 ? 0 : 4 - extraBytes;
  const rowSize = width * 3 + padding;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // Bitmap Header (14 bytes)
  view.setUint16(0, 0x424d, false); // "BM"
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true);
  view.setUint32(10, 54, true); // Offset to pixel data

  // DIB Header (40 bytes - BITMAPINFOHEADER)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // Positive height = bottom-up
  view.setUint16(26, 1, true); // Planes
  view.setUint16(28, 24, true); // 24 bits per pixel (BGR)
  view.setUint32(30, 0, true); // Compression (none)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // Horizontal resolution ~72 DPI
  view.setInt32(42, 2835, true); // Vertical resolution ~72 DPI
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Pixels (stored bottom to top)
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    const rowOffset = y * width * 4;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x * 4;
      view.setUint8(offset++, data[idx + 2]); // B
      view.setUint8(offset++, data[idx + 1]); // G
      view.setUint8(offset++, data[idx]);     // R
    }
    for (let p = 0; p < padding; p++) {
      view.setUint8(offset++, 0);
    }
  }

  return Promise.resolve(new Blob([buffer], { type: 'image/bmp' }));
}
