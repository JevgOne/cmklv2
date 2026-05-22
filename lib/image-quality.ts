/**
 * Client-side image quality analysis for photo capture.
 * All checks run on a downscaled canvas for performance (<500ms on mobile).
 */

export interface QualityHint {
  type: "blur" | "dark" | "bright" | "orientation";
  message: string;
}

export interface QualityCheckResult {
  hints: QualityHint[];
}

const BLUR_THRESHOLD = 100;
const DARK_THRESHOLD = 50;
const BRIGHT_THRESHOLD = 220;
const ANALYSIS_SIZE = 160;

const LANDSCAPE_SLOTS = new Set([
  "ext_front_34",
  "ext_front",
  "ext_right",
  "ext_rear_34",
  "ext_rear",
  "ext_left",
  "ext_front_34_left",
  "ext_rear_34_left",
  "ext_roof",
  "int_dashboard",
  "int_front_seats",
  "int_rear_seats",
  "int_trunk",
  "eng_bay",
]);

const PORTRAIT_SLOTS = new Set(["doc_tp", "doc_service"]);

function loadImg(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load failed"));
    };
    img.src = url;
  });
}

function toGrayscale(data: Uint8ClampedArray, len: number): Float32Array {
  const gray = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const off = i * 4;
    gray[i] = 0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2];
  }
  return gray;
}

function laplacianVariance(
  gray: Float32Array,
  w: number,
  h: number
): number {
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const v =
        gray[i - w] + gray[i - 1] - 4 * gray[i] + gray[i + 1] + gray[i + w];
      sum += v;
      sumSq += v * v;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
}

function avgBrightness(gray: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < gray.length; i++) sum += gray[i];
  return sum / gray.length;
}

export async function checkImageQuality(
  blob: Blob,
  slotId: string
): Promise<QualityCheckResult> {
  const img = await loadImg(blob);

  const scale = Math.min(
    ANALYSIS_SIZE / img.naturalWidth,
    ANALYSIS_SIZE / img.naturalHeight,
    1
  );
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = toGrayscale(data, w * h);

  const blur = laplacianVariance(gray, w, h);
  const bright = avgBrightness(gray);

  const hints: QualityHint[] = [];

  if (blur < BLUR_THRESHOLD) {
    hints.push({
      type: "blur",
      message: "Fotka se zdá rozmazaná. Chcete ji vyfotit znovu?",
    });
  }
  if (bright < DARK_THRESHOLD) {
    hints.push({
      type: "dark",
      message: "Fotka je příliš tmavá. Zkuste lepší osvětlení.",
    });
  }
  if (bright > BRIGHT_THRESHOLD) {
    hints.push({
      type: "bright",
      message: "Fotka je přesvětlená. Zkuste se vyhnout přímému slunci.",
    });
  }

  const ratio = img.naturalWidth / img.naturalHeight;
  if (LANDSCAPE_SLOTS.has(slotId) && ratio < 0.9) {
    hints.push({
      type: "orientation",
      message: "Tato fotka by měla být na šířku. Otočte telefon.",
    });
  }
  if (PORTRAIT_SLOTS.has(slotId) && ratio > 1.1) {
    hints.push({
      type: "orientation",
      message: "Tato fotka by měla být na výšku.",
    });
  }

  return { hints };
}
