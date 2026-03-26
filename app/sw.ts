/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry } from "serwist";
import { Serwist } from "serwist";

declare const self: WorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[];
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

// Background sync handlers
self.addEventListener("sync" as string, ((event: Event) => {
  const syncEvent = event as ExtendableEvent & { tag: string; waitUntil: (p: Promise<void>) => void };
  if (syncEvent.tag === "sync-vehicles") {
    console.log("[SW] Background sync: vehicles");
  }
  if (syncEvent.tag === "sync-images") {
    console.log("[SW] Background sync: images");
  }
  if (syncEvent.tag === "sync-contracts") {
    console.log("[SW] Background sync: contracts");
  }
  if (syncEvent.tag === "sync-contacts") {
    console.log("[SW] Background sync: contacts");
    syncEvent.waitUntil(syncContacts());
  }
}) as EventListener);

async function syncContacts(): Promise<void> {
  try {
    // Open IndexedDB directly (no idb wrapper in SW context)
    const dbReq = indexedDB.open("carmakler-offline", 3);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      dbReq.onsuccess = () => resolve(dbReq.result);
      dbReq.onerror = () => reject(dbReq.error);
    });

    // Read pending contact actions
    const tx = db.transaction("pendingActions", "readonly");
    const store = tx.objectStore("pendingActions");
    const typeIndex = store.index("by-type");
    const request = typeIndex.getAll("SYNC_CONTACT");
    const pendingContacts = await new Promise<Array<{ id: string; payload: Record<string, unknown> }>>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (pendingContacts.length === 0) {
      db.close();
      return;
    }

    const changes = pendingContacts.map((p) => p.payload);

    const res = await fetch("/api/contacts/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes }),
    });

    if (res.ok) {
      // Remove synced pending actions
      const deleteTx = db.transaction("pendingActions", "readwrite");
      const deleteStore = deleteTx.objectStore("pendingActions");
      for (const p of pendingContacts) {
        deleteStore.delete(p.id);
      }
      await new Promise<void>((resolve, reject) => {
        deleteTx.oncomplete = () => resolve();
        deleteTx.onerror = () => reject(deleteTx.error);
      });
    }

    db.close();
  } catch (err) {
    console.error("[SW] Contact sync failed:", err);
  }
}

serwist.addEventListeners();
