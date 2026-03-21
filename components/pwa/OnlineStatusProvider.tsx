"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

interface OnlineStatusContextType {
  isOnline: boolean;
}

const OnlineStatusContext = createContext<OnlineStatusContextType>({
  isOnline: true,
});

export function useOnlineStatusContext() {
  return useContext(OnlineStatusContext);
}

export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useOnlineStatus();

  return (
    <OnlineStatusContext.Provider value={{ isOnline }}>
      {children}
    </OnlineStatusContext.Provider>
  );
}
