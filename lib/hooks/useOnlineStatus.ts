"use client";

import { useState, useEffect } from "react";

/**
 * Online status hook — vrací `isOnline: true` během SSR i prvního renderu na klientu
 * (aby se zabránilo hydration mismatch), pak po mount sleduje reálný `navigator.onLine`.
 */
export function useOnlineStatus(): { isOnline: boolean } {
  // Inicializace musí být stejná na serveru i klientu → vždy `true` do mountu.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Po mountu nastav reálný stav a přidej listenery.
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
