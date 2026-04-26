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
