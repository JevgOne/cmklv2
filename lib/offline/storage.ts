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

  // ============================================
  // CONTRACTS
  // ============================================

  async saveContract(
    id: string,
    vehicleId: string,
    data: Record<string, unknown>,
    status: string = "DRAFT"
  ): Promise<void> {
    const db = await getDB();
    await db.put("contracts", {
      id,
      vehicleId,
      data,
      status,
      createdAt: Date.now(),
    });
  }

  async getContracts(): Promise<
    Array<{
      id: string;
      vehicleId: string;
      data: Record<string, unknown>;
      status: string;
      createdAt: number;
    }>
  > {
    const db = await getDB();
    const all = await db.getAll("contracts");
    // Sort by createdAt descending
    return all.sort((a, b) => b.createdAt - a.createdAt);
  }

  async getContractsByStatus(
    status: string
  ): Promise<
    Array<{
      id: string;
      vehicleId: string;
      data: Record<string, unknown>;
      status: string;
      createdAt: number;
    }>
  > {
    const db = await getDB();
    return db.getAllFromIndex("contracts", "by-status", status);
  }

  async getContract(
    id: string
  ): Promise<{
    id: string;
    vehicleId: string;
    data: Record<string, unknown>;
    status: string;
    createdAt: number;
  } | undefined> {
    const db = await getDB();
    return db.get("contracts", id);
  }

  async deleteContract(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("contracts", id);
  }

  async updateContractStatus(id: string, status: string): Promise<void> {
    const db = await getDB();
    const contract = await db.get("contracts", id);
    if (contract) {
      contract.status = status;
      await db.put("contracts", contract);
    }
  }
  // ============================================
  // CONTACTS (CRM)
  // ============================================

  async saveContact(
    id: string,
    name: string,
    phone: string,
    email?: string,
    extra?: {
      address?: string;
      city?: string;
      note?: string;
      totalVehicles?: number;
      totalSold?: number;
      lastContactAt?: number;
      nextFollowUp?: number;
      followUpNote?: string;
    }
  ): Promise<void> {
    const db = await getDB();
    await db.put("contacts", {
      id,
      name,
      phone,
      email,
      address: extra?.address,
      city: extra?.city,
      note: extra?.note,
      totalVehicles: extra?.totalVehicles ?? 0,
      totalSold: extra?.totalSold ?? 0,
      lastContactAt: extra?.lastContactAt,
      nextFollowUp: extra?.nextFollowUp,
      followUpNote: extra?.followUpNote,
      updatedAt: Date.now(),
      syncedAt: Date.now(),
    });
  }

  async getContacts(): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      syncedAt: number;
    }>
  > {
    const db = await getDB();
    const all = await db.getAll("contacts");
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getContact(
    id: string
  ): Promise<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    syncedAt: number;
  } | undefined> {
    const db = await getDB();
    return db.get("contacts", id);
  }

  async deleteContact(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("contacts", id);
  }

  async searchContacts(
    query: string
  ): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      syncedAt: number;
    }>
  > {
    const db = await getDB();
    const all = await db.getAll("contacts");
    const q = query.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }

  async syncContactsFromServer(
    contacts: Array<{
      id: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
      note?: string;
      totalVehicles?: number;
      totalSold?: number;
      lastContactAt?: string | null;
      nextFollowUp?: string | null;
      followUpNote?: string | null;
      updatedAt?: string;
    }>
  ): Promise<void> {
    const db = await getDB();
    const tx = db.transaction("contacts", "readwrite");
    // Clear old data
    await tx.store.clear();
    // Insert fresh server data
    for (const c of contacts) {
      await tx.store.put({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        note: c.note,
        totalVehicles: c.totalVehicles ?? 0,
        totalSold: c.totalSold ?? 0,
        lastContactAt: c.lastContactAt ? new Date(c.lastContactAt).getTime() : undefined,
        nextFollowUp: c.nextFollowUp ? new Date(c.nextFollowUp).getTime() : undefined,
        followUpNote: c.followUpNote ?? undefined,
        updatedAt: c.updatedAt ? new Date(c.updatedAt).getTime() : Date.now(),
        syncedAt: Date.now(),
      });
    }
    await tx.done;
  }
}

export const offlineStorage = new OfflineStorage();
