import { getDB } from "./db";

export class OfflineStorage {
  // ============================================
  // DRAFTS
  // ============================================

  async saveDraft(id: string, data: Record<string, unknown>): Promise<void> {
    const db = await getDB();
    await db.put("drafts", { id, data, updatedAt: Date.now() });
  }

  async getDrafts(): Promise<
    Array<{ id: string; data: Record<string, unknown>; updatedAt: number }>
  > {
    const db = await getDB();
    return db.getAllFromIndex("drafts", "by-updatedAt");
  }

  async getDraft(
    id: string
  ): Promise<{
    id: string;
    data: Record<string, unknown>;
    updatedAt: number;
  } | undefined> {
    const db = await getDB();
    return db.get("drafts", id);
  }

  async deleteDraft(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("drafts", id);
    // Also delete associated images
    const images = await db.getAllFromIndex("images", "by-draftId", id);
    const tx = db.transaction("images", "readwrite");
    for (const img of images) {
      await tx.store.delete(img.id);
    }
    await tx.done;
  }

  // ============================================
  // IMAGES
  // ============================================

  async saveImage(id: string, draftId: string, blob: Blob): Promise<void> {
    const db = await getDB();
    await db.put("images", { id, draftId, blob, createdAt: Date.now() });
  }

  async getImages(
    draftId: string
  ): Promise<
    Array<{ id: string; draftId: string; blob: Blob; createdAt: number }>
  > {
    const db = await getDB();
    return db.getAllFromIndex("images", "by-draftId", draftId);
  }

  // ============================================
  // PENDING ACTIONS
  // ============================================

  async addPendingAction(
    id: string,
    type: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const db = await getDB();
    await db.put("pendingActions", {
      id,
      type,
      payload,
      createdAt: Date.now(),
      retries: 0,
    });
  }

  async getPendingActions(): Promise<
    Array<{
      id: string;
      type: string;
      payload: Record<string, unknown>;
      createdAt: number;
      retries: number;
    }>
  > {
    const db = await getDB();
    return db.getAllFromIndex("pendingActions", "by-createdAt");
  }

  async removePendingAction(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("pendingActions", id);
  }

  // ============================================
  // VIN CACHE
  // ============================================

  async cacheVin(
    vin: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const db = await getDB();
    await db.put("vinCache", { vin, data, cachedAt: Date.now() });
  }

  async getCachedVin(
    vin: string
  ): Promise<{ vin: string; data: Record<string, unknown>; cachedAt: number } | undefined> {
    const db = await getDB();
    return db.get("vinCache", vin);
  }
}

export const offlineStorage = new OfflineStorage();
