export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Background Sync API
    if ("sync" in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(tag);
      return true;
    }
  } catch {
    // Background sync not supported or permission denied
  }
  return false;
}

export async function requestVehicleSync(): Promise<boolean> {
  return registerBackgroundSync("sync-vehicles");
}

export async function requestImageSync(): Promise<boolean> {
  return registerBackgroundSync("sync-images");
}

export async function requestContractSync(): Promise<boolean> {
  return registerBackgroundSync("sync-contracts");
}

export async function requestContactSync(): Promise<boolean> {
  return registerBackgroundSync("sync-contacts");
}
