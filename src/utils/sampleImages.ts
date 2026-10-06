/**
 * Generates high-definition sample images locally in-memory
 * so users can immediately test all transformation features.
 */

export interface SampleImageConfig {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  generate: () => Promise<Blob>;
}

export const SAMPLE_IMAGES: SampleImageConfig[] = [
  {
    id: 'sample-alpine',
    name: 'Alpine Sunset Vista',
    category: 'Landscape',
    width: 2400,
    height: 1600,
    generate: () => renderAlpineSunset(2400, 1600),
  },
  {
    id: 'sample-cyber',
    name: 'Neo Tokyo Cyberpunk',
    category: 'Cityscape',
    width: 2400,
    height: 1600,
    generate: () => renderCyberpunkCity(2400, 1600),
  },
  {
    id: 'sample-minimal',
    name: 'Architectural Geometric',
    category: 'Abstract & Architecture',
    width: 2000,
    height: 2000,
    generate: () => renderMinimalArchitecture(2000, 2000),
  },
];

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
  });
}

function renderAlpineSunset(width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  skyGrad.addColorStop(0, '#1a103c');
  skyGrad.addColorStop(0.3, '#3c1855');
  skyGrad.addColorStop(0.55, '#a4325a');
  skyGrad.addColorStop(0.75, '#ea5444');
  skyGrad.addColorStop(0.92, '#fca34d');
  skyGrad.addColorStop(1, '#fed276');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Glowing Sun
  const sunX = width * 0.62;
  const sunY = height * 0.65;
  const sunRadius = height * 0.18;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius * 2);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.2, '#fff1b0');
  sunGrad.addColorStop(0.5, 'rgba(255, 140, 50, 0.7)');
  sunGrad.addColorStop(1, 'rgba(255, 80, 50, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountain layer (Purple haze)
  ctx.fillStyle = '#481d4a';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  const mountain1 = [
    [0.15, 0.52], [0.28, 0.64], [0.42, 0.48], [0.55, 0.62],
    [0.72, 0.44], [0.85, 0.58], [1.0, 0.5]
  ];
  for (const [xPct, yPct] of mountain1) {
    ctx.lineTo(width * xPct, height * yPct);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // Mid-ground mountain layer (Dark ruby / pine)
  ctx.fillStyle = '#221028';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.82);
  const mountain2 = [
    [0.1, 0.68], [0.22, 0.76], [0.35, 0.58], [0.5, 0.72],
    [0.65, 0.56], [0.8, 0.68], [0.94, 0.62], [1.0, 0.7]
  ];
  for (const [xPct, yPct] of mountain2) {
    ctx.lineTo(width * xPct, height * yPct);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // Lake reflection surface
  const lakeGrad = ctx.createLinearGradient(0, height * 0.78, 0, height);
  lakeGrad.addColorStop(0, 'rgba(15, 8, 28, 0.95)');
  lakeGrad.addColorStop(0.5, 'rgba(65, 20, 50, 0.85)');
  lakeGrad.addColorStop(1, 'rgba(15, 8, 20, 0.98)');
  ctx.fillStyle = lakeGrad;
  ctx.fillRect(0, height * 0.78, width, height * 0.22);

  // Foreground pine silhouettes & rocky shoreline
  ctx.fillStyle = '#0a0410';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.88);
  ctx.bezierCurveTo(width * 0.2, height * 0.86, width * 0.4, height * 0.96, width * 0.6, height * 0.92);
  ctx.bezierCurveTo(width * 0.8, height * 0.89, width * 0.95, height * 0.94, width, height * 0.9);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // Pine trees
  function drawTree(tx: number, ty: number, th: number) {
    ctx.fillStyle = '#08030e';
    ctx.beginPath();
    ctx.moveTo(tx, ty - th);
    ctx.lineTo(tx + th * 0.3, ty);
    ctx.lineTo(tx - th * 0.3, ty);
    ctx.closePath();
    ctx.fill();
  }

  for (let i = 0; i < 28; i++) {
    const px = width * (0.02 + i * 0.035);
    const py = height * 0.89 + Math.sin(i * 1.5) * (height * 0.03);
    const ph = height * (0.08 + Math.abs(Math.sin(i * 2.2)) * 0.1);
    drawTree(px, py, ph);
  }

  return canvasToBlob(canvas);
}

function renderCyberpunkCity(width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep night backdrop
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#050212');
  bgGrad.addColorStop(0.6, '#0b0c26');
  bgGrad.addColorStop(1, '#020008');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Futuristic neon grid/haze in distance
  const neonHaze = ctx.createRadialGradient(width * 0.5, height * 0.6, 50, width * 0.5, height * 0.6, width * 0.7);
  neonHaze.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
  neonHaze.addColorStop(0.4, 'rgba(255, 0, 128, 0.2)');
  neonHaze.addColorStop(1, 'transparent');
  ctx.fillStyle = neonHaze;
  ctx.fillRect(0, 0, width, height);

  // Cyberpunk skyscrapers
  const buildings = 24;
  for (let i = 0; i < buildings; i++) {
    const bx = (width / buildings) * i + (Math.sin(i) * 30);
    const bw = width / buildings * (0.8 + (i % 3) * 0.3);
    const bh = height * (0.35 + ((i * 7) % 11) * 0.04);
    const by = height - bh;

    // Building body
    const bGrad = ctx.createLinearGradient(bx, by, bx + bw, height);
    bGrad.addColorStop(0, '#101426');
    bGrad.addColorStop(1, '#05060d');
    ctx.fillStyle = bGrad;
    ctx.fillRect(bx, by, bw, bh);

    // Illuminated windows & neon signage
    const isNeonSign = i % 4 === 0;
    if (isNeonSign) {
      ctx.fillStyle = i % 2 === 0 ? '#00f0ff' : '#ff007f';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 18;
      ctx.fillRect(bx + bw * 0.2, by + bh * 0.15, bw * 0.6, 6);
      ctx.shadowBlur = 0;
    }

    // Window grid
    ctx.fillStyle = 'rgba(255, 230, 160, 0.4)';
    const winCols = 4;
    const winRows = Math.floor(bh / 28);
    for (let r = 2; r < winRows; r += 2) {
      if ((r + i) % 3 === 0) continue; // random unlit windows
      for (let c = 0; c < winCols; c++) {
        const wx = bx + 8 + c * ((bw - 16) / winCols);
        const wy = by + r * 22;
        ctx.fillRect(wx, wy, 4, 8);
      }
    }
  }

  // Wet reflective asphalt street
  const roadY = height * 0.82;
  const roadGrad = ctx.createLinearGradient(0, roadY, 0, height);
  roadGrad.addColorStop(0, '#090a14');
  roadGrad.addColorStop(0.5, '#121626');
  roadGrad.addColorStop(1, '#06070e');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, roadY, width, height - roadY);

  // Neon road reflections
  for (let r = 0; r < 8; r++) {
    const rx = width * (0.1 + r * 0.11);
    const rw = 40 + r * 15;
    const color = r % 2 === 0 ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 0, 128, 0.3)';
    const rGrad = ctx.createLinearGradient(rx, roadY, rx, height);
    rGrad.addColorStop(0, color);
    rGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rGrad;
    ctx.fillRect(rx, roadY, rw, height - roadY);
  }

  return canvasToBlob(canvas);
}

function renderMinimalArchitecture(width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Clean studio background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#f2ece4');
  bg.addColorStop(1, '#ded5c7');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Warm sunlight angle
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(width * 0.15, 0);
  ctx.lineTo(width * 0.85, 0);
  ctx.lineTo(width, height * 0.7);
  ctx.lineTo(width * 0.3, height);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 245, 0.45)';
  ctx.fill();
  ctx.restore();

  // Architectural arches & sharp shadow casting
  // Arch 1 - Foreground Terracotta
  ctx.fillStyle = '#b85d43';
  ctx.beginPath();
  const aX = width * 0.32;
  const aY = height * 0.28;
  const aW = width * 0.36;
  const aH = height * 0.58;
  ctx.moveTo(aX, aY + aW / 2);
  ctx.arc(aX + aW / 2, aY + aW / 2, aW / 2, Math.PI, 0, false);
  ctx.lineTo(aX + aW, aY + aH);
  ctx.lineTo(aX, aY + aH);
  ctx.closePath();
  ctx.fill();

  // Shadow inside Arch
  ctx.fillStyle = 'rgba(35, 20, 25, 0.25)';
  ctx.beginPath();
  ctx.moveTo(aX + aW * 0.25, aY + aW / 2);
  ctx.arc(aX + aW * 0.5, aY + aW / 2, aW * 0.3, Math.PI, 0, false);
  ctx.lineTo(aX + aW * 0.8, aY + aH);
  ctx.lineTo(aX + aW * 0.2, aY + aH);
  ctx.closePath();
  ctx.fill();

  // Spherical concrete sculpture
  const sX = width * 0.68;
  const sY = height * 0.74;
  const sR = height * 0.14;
  const sphereGrad = ctx.createRadialGradient(sX - sR * 0.35, sY - sR * 0.35, sR * 0.1, sX, sY, sR);
  sphereGrad.addColorStop(0, '#faf6f0');
  sphereGrad.addColorStop(0.65, '#b0a698');
  sphereGrad.addColorStop(1, '#564d42');
  ctx.fillStyle = sphereGrad;
  ctx.beginPath();
  ctx.arc(sX, sY, sR, 0, Math.PI * 2);
  ctx.fill();

  // Sphere ground shadow
  ctx.fillStyle = 'rgba(40, 30, 25, 0.32)';
  ctx.beginPath();
  ctx.ellipse(sX - sR * 0.2, sY + sR * 0.88, sR * 1.3, sR * 0.35, -0.15, 0, Math.PI * 2);
  ctx.fill();

  return canvasToBlob(canvas);
}
