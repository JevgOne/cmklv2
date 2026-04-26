"use client";

import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { offlineStorage } from "@/lib/offline/storage";
import { uploadDraftPhotos } from "@/lib/offline/upload-photos";

/**
 * Syncs pending vehicle submissions when the device comes back online.
 * Mount this component in the PWA layout or dashboard.
 */
export function OnlineSync() {
  const { isOnline } = useOnlineStatus();
  const syncing = useRef(false);

  useEffect(() => {
    if (!isOnline || syncing.current) return;

    async function syncPendingVehicles() {
      syncing.current = true;
      try {
        const pending = await offlineStorage.getPendingActions();
        const vehicleActions = pending.filter(
          (a) => a.type === "SUBMIT_VEHICLE"
        );

        for (const action of vehicleActions) {
          const payload = action.payload;
          const draftId = payload._draftId as string | undefined;
          const photos = (payload._photos ?? []) as Array<{
            id: string;
            isPrimary?: boolean;
            isMain?: boolean;
            order?: number;
          }>;

          // Remove internal fields from payload before sending to API
          const { _draftId, _photos, ...vehiclePayload } = payload;

          try {
            // 1. Create vehicle
            const res = await fetch("/api/vehicles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(vehiclePayload),
            });

            if (!res.ok) {
              console.error(
                `[OnlineSync] Failed to submit vehicle: ${res.status}`
              );
              continue;
            }

            const vehicle = (await res.json()) as { id: string };

            // 2. Upload photos from IndexedDB
            if (draftId && photos.length > 0) {
              const imageUrls = await uploadDraftPhotos(draftId, photos);
              if (imageUrls.length > 0) {
                await fetch(`/api/vehicles/${vehicle.id}/images`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ images: imageUrls }),
                });
              }
            }

            // 3. Remove pending action
            await offlineStorage.removePendingAction(action.id);

            // 4. Update draft status
            if (draftId) {
              const draft = await offlineStorage.getDraft(draftId);
              if (draft) {
                await offlineStorage.saveDraft(draftId, {
                  ...draft.data,
                  serverId: vehicle.id,
                  status: "submitted",
                });
              }
            }

            console.log(
              `[OnlineSync] Vehicle synced: ${vehicle.id}`
            );
          } catch (err) {
            console.error(`[OnlineSync] Sync error for action ${action.id}:`, err);
          }
        }
      } finally {
        syncing.current = false;
      }
    }

    syncPendingVehicles();
  }, [isOnline]);

  return null;
}
