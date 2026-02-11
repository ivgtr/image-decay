import { SAMPLE_OPTIONS, type SampleId } from './constants';

export interface SampleOption {
  id: SampleId;
  title: string;
}

const SAMPLE_WIDTH = 1600;
const SAMPLE_HEIGHT = 1000;
const SAMPLE_MIME = 'image/jpeg';
const SAMPLE_QUALITY = 0.94;

export const sampleOptions: SampleOption[] = SAMPLE_OPTIONS.map((sample) => ({ ...sample }));

export const isSampleId = (id: string): id is SampleId => {
  return SAMPLE_OPTIONS.some((sample) => sample.id === id);
};

const toSampleFile = async (canvas: HTMLCanvasElement, sampleId: SampleId): Promise<File> => {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('サンプル画像の生成に失敗しました。'));
          return;
        }
        resolve(result);
      },
      SAMPLE_MIME,
      SAMPLE_QUALITY,
    );
  });

  return new File([blob], `${sampleId}.jpg`, { type: SAMPLE_MIME });
};

const drawNeonCity = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#140b3b');
  sky.addColorStop(0.55, '#1f134c');
  sky.addColorStop(1, '#040811');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 20; i += 1) {
    const x = (i * width) / 20;
    const buildingWidth = width * (0.035 + (i % 5) * 0.01);
    const h = height * (0.25 + ((i * 37) % 40) / 100);
    const y = height - h;
    ctx.fillStyle = i % 2 === 0 ? '#1f2937' : '#0f172a';
    ctx.fillRect(x, y, buildingWidth, h);

    ctx.fillStyle = i % 2 === 0 ? '#22d3ee' : '#38bdf8';
    for (let w = 0; w < 6; w += 1) {
      ctx.fillRect(x + 4, y + 10 + w * 18, Math.max(3, buildingWidth - 8), 4);
    }
  }

  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = '#67e8f9';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.quadraticCurveTo(width * 0.45, height * 0.68, width, height * 0.74);
  ctx.stroke();
  ctx.globalAlpha = 1;
};

const drawPortraitLight = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#fef3c7');
  bg.addColorStop(0.5, '#fed7aa');
  bg.addColorStop(1, '#fca5a5');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.52, width * 0.2, height * 0.27, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fcd5b5';
  ctx.beginPath();
  ctx.ellipse(width * 0.52, height * 0.48, width * 0.14, height * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width * 0.34, height * 0.74, width * 0.36, height * 0.22);

  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(width * 0.43, height * 0.53);
  ctx.quadraticCurveTo(width * 0.52, height * 0.59, width * 0.61, height * 0.53);
  ctx.stroke();
};

const drawPaperTexture = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, '#f8fafc');
  base.addColorStop(0.5, '#e2e8f0');
  base.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.25;
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      const tone = 190 + ((x * 13 + y * 17) % 45);
      ctx.fillStyle = `rgb(${tone},${tone},${tone})`;
      ctx.fillRect(x, y, 4, 4);
    }
  }

  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i += 1) {
    const y = height * (0.08 + i * 0.05);
    ctx.beginPath();
    ctx.moveTo(width * 0.06, y);
    ctx.bezierCurveTo(width * 0.2, y - 8, width * 0.8, y + 8, width * 0.94, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
};

type SampleDrawer = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

const sampleDrawers: Record<SampleId, SampleDrawer> = {
  'neon-city': drawNeonCity,
  'portrait-light': drawPortraitLight,
  'paper-texture': drawPaperTexture,
};

export const createSampleImageFile = async (sampleId: SampleId): Promise<File> => {
  const canvas = document.createElement('canvas');
  canvas.width = SAMPLE_WIDTH;
  canvas.height = SAMPLE_HEIGHT;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('サンプル画像の生成に失敗しました。');
  }

  sampleDrawers[sampleId](ctx, canvas.width, canvas.height);
  return toSampleFile(canvas, sampleId);
};
