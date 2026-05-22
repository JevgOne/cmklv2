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
          const retries = (payload._retries as number) || 0;

          // Remove internal fields from payload before sending to API
          const { _draftId, _photos, _retries, _vehicleId, ...vehiclePayload } = payload;

          try {
            let vehicleId = _vehicleId as string | undefined;

            // STEP 1: Create vehicle (skip if already created in prior attempt)
            if (!vehicleId) {
              const res = await fetch("/api/vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vehiclePayload),
              });

              if (!res.ok) {
                if (res.status === 409) {
                  // VIN duplicate — vehicle already exists, remove action
                  console.log(`[OnlineSync] VIN duplicate, removing action ${action.id}`);
                  await offlineStorage.removePendingAction(action.id);
                  continue;
                }
                // Other error — retry up to 3 times
                if (retries >= 3) {
                  console.error(`[OnlineSync] Max retries reached for action ${action.id}`);
                  await offlineStorage.removePendingAction(action.id);
                  continue;
                }
                // Increment retry counter
                await offlineStorage.updatePendingAction(action.id, {
                  ...payload,
                  _retries: retries + 1,
                });
                continue;
              }

              const result = (await res.json()) as { id: string };
              vehicleId = result.id;
            }

            // STEP 2: Upload photos from IndexedDB
            let photosOk = true;
            if (draftId && photos.length > 0) {
              try {
                const imageUrls = await uploadDraftPhotos(draftId, photos);
                if (imageUrls.length > 0) {
                  await fetch(`/api/vehicles/${vehicleId}/images`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ images: imageUrls }),
                  });
                }
              } catch (photoErr) {
                console.error("[OnlineSync] Photo upload failed:", photoErr);
                photosOk = false;
                // Save vehicleId for retry — skip vehicle creation next time
                await offlineStorage.updatePendingAction(action.id, {
                  ...payload,
                  _vehicleId: vehicleId,
                  _retries: retries + 1,
                });
                if (retries + 1 >= 3) {
                  // Max retries — remove action, vehicle exists but without photos
                  await offlineStorage.removePendingAction(action.id);
                }
                continue;
              }
            }

            // STEP 3: DRAFT → PENDING transition (BUG 1 FIX)
            const statusRes = await fetch(`/api/vehicles/${vehicleId}/status`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "PENDING" }),
            });

            if (!statusRes.ok) {
              console.error(`[OnlineSync] PATCH PENDING failed (${statusRes.status}) for ${vehicleId}`);
              // Save vehicleId for retry — don't remove action
              await offlineStorage.updatePendingAction(action.id, {
                ...payload,
                _vehicleId: vehicleId,
                _retries: retries + 1,
              });
              if (retries + 1 >= 3) {
                await offlineStorage.removePendingAction(action.id);
              }
              continue;
            }

            // STEP 4: Cleanup — only if everything succeeded
            if (photosOk) {
              await offlineStorage.removePendingAction(action.id);

              if (draftId) {
                const draft = await offlineStorage.getDraft(draftId);
                if (draft) {
                  await offlineStorage.saveDraft(draftId, {
                    ...draft.data,
                    serverId: vehicleId,
                    status: "submitted",
                  });
                }
              }
            }

            console.log(`[OnlineSync] Vehicle synced: ${vehicleId}`);
          } catch (err) {
            console.error(`[OnlineSync] Sync error for action ${action.id}:`, err);
            // Pending action stays — will retry on next online event
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
