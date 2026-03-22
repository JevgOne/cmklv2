/**
 * Client-side image processing utilities using Canvas API.
 */

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Nepodařilo se načíst obrázek"));
    };
    img.src = URL.createObjectURL(blob);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = "image/jpeg",
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Nepodařilo se převést canvas na blob"));
      },
      type,
      quality
    );
  });
}

/**
 * Resize image to max width while maintaining aspect ratio.
 * Output is JPEG at given quality. If result exceeds maxSizeBytes,
 * quality is reduced iteratively.
 */
export async function resizeImage(
  blob: Blob,
  maxWidth = 1920,
  maxSizeBytes = 2 * 1024 * 1024
): Promise<Blob> {
  const img = await loadImage(blob);

  let width = img.naturalWidth;
  let height = img.naturalHeight;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context nedostupný");

  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.8;
  let result = await canvasToBlob(canvas, "image/jpeg", quality);

  // Reduce quality if file is too large
  while (result.size > maxSizeBytes && quality > 0.3) {
    quality -= 0.1;
    result = await canvasToBlob(canvas, "image/jpeg", quality);
  }

  return result;
}

/**
 * Create a square thumbnail of given size.
 */
export async function createThumbnail(
  blob: Blob,
  size = 200
): Promise<Blob> {
  const img = await loadImage(blob);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context nedostupný");

  // Center-crop to square
  const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
  const srcX = (img.naturalWidth - srcSize) / 2;
  const srcY = (img.naturalHeight - srcSize) / 2;

  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

  return canvasToBlob(canvas, "image/jpeg", 0.7);
}

/**
 * Get dimensions of an image blob.
 */
export async function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  const img = await loadImage(blob);
  return { width: img.naturalWidth, height: img.naturalHeight };
}
