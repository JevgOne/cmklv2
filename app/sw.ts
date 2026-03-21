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
  const syncEvent = event as ExtendableEvent & { tag: string };
  if (syncEvent.tag === "sync-vehicles") {
    console.log("[SW] Background sync: vehicles");
  }
  if (syncEvent.tag === "sync-images") {
    console.log("[SW] Background sync: images");
  }
  if (syncEvent.tag === "sync-contracts") {
    console.log("[SW] Background sync: contracts");
  }
}) as EventListener);

serwist.addEventListeners();
