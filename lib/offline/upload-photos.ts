import { offlineStorage } from "./storage";

interface DraftPhoto {
  id: string;
  isMain?: boolean;
  isPrimary?: boolean;
  order?: number;
}

interface UploadedImage {
  url: string;
  isPrimary: boolean;
  order: number;
}

/**
 * Upload draft photos from IndexedDB to Cloudinary via /api/upload.
 * Returns array of Cloudinary URLs ready for POST /api/vehicles/[id]/images.
 */
export async function uploadDraftPhotos(
  draftId: string,
  draftPhotos: DraftPhoto[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<UploadedImage[]> {
  if (draftPhotos.length === 0) return [];

  // Load blobs from IndexedDB
  const storedImages = await offlineStorage.getImages(draftId);
  const blobMap = new Map(storedImages.map((img) => [img.id, img.blob]));

  const results: UploadedImage[] = [];
  let uploaded = 0;

  for (let i = 0; i < draftPhotos.length; i++) {
    const photo = draftPhotos[i];
    const blob = blobMap.get(photo.id);

    if (!blob) {
      console.warn(`[upload-photos] No blob found for photo ${photo.id}, skipping`);
      continue;
    }

    try {
      const formData = new FormData();
      formData.append(
        "file",
        new File([blob], `photo-${i}.jpg`, { type: "image/jpeg" })
      );
      formData.append("upload_preset", "vehicles");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        results.push({
          url,
          isPrimary: photo.isPrimary || photo.isMain || i === 0,
          order: photo.order ?? i,
        });
      } else {
        console.error(`[upload-photos] Upload failed for photo ${i}: ${res.status}`);
      }
    } catch (err) {
      console.error(`[upload-photos] Upload error for photo ${i}:`, err);
    }

    uploaded++;
    onProgress?.(uploaded, draftPhotos.length);
  }

  return results;
}

/**
 * Upload specific images by their IDs from IndexedDB.
 * Returns a Map of localId → cloudinaryUrl.
 */
export async function uploadImagesByIds(
  draftId: string,
  imageIds: string[],
  onProgress?: (uploaded: number, total: number) => void
): Promise<Map<string, string>> {
  if (imageIds.length === 0) return new Map();

  const storedImages = await offlineStorage.getImages(draftId);
  const blobMap = new Map(storedImages.map((img) => [img.id, img.blob]));
  const result = new Map<string, string>();

  let uploaded = 0;
  for (const id of imageIds) {
    const blob = blobMap.get(id);
    if (!blob) {
      console.warn(`[upload-photos] No blob found for image ${id}, skipping`);
      continue;
    }

    try {
      const formData = new FormData();
      formData.append(
        "file",
        new File([blob], `${id}.jpg`, { type: "image/jpeg" })
      );
      formData.append("upload_preset", "vehicles");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        result.set(id, url);
      }
    } catch (err) {
      console.error(`[upload-photos] Upload error for image ${id}:`, err);
    }

    uploaded++;
    onProgress?.(uploaded, imageIds.length);
  }

  return result;
}

/**
 * Replace local imageId references with Cloudinary URLs in inspection data.
 */
export function replaceLocalIdsWithUrls(
  inspection: Record<string, unknown>,
  urlMap: Map<string, string>
): Record<string, unknown> {
  const updated = { ...inspection };

  // Replace defect imageIds
  if (Array.isArray(updated.defects)) {
    updated.defects = (updated.defects as Array<Record<string, unknown>>).map((d) => {
      const imageId = d.imageId as string | undefined;
      if (imageId && urlMap.has(imageId)) {
        return { ...d, imageId: urlMap.get(imageId), imageUrl: urlMap.get(imageId) };
      }
      return d;
    });
  }

  // Replace wheel photo IDs
  if (updated.wheelPhotos && typeof updated.wheelPhotos === "object") {
    const wp = { ...(updated.wheelPhotos as Record<string, string>) };
    for (const key of ["LP", "PP", "LZ", "PZ"]) {
      if (wp[key] && urlMap.has(wp[key])) {
        wp[key] = urlMap.get(wp[key])!;
      }
    }
    updated.wheelPhotos = wp;
  }

  return updated;
}
