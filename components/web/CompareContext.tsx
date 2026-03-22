"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CompareVehicle {
  id: string;
  name: string;
  photo: string;
  slug: string;
}

interface CompareContextValue {
  vehicles: CompareVehicle[];
  addVehicle: (vehicle: CompareVehicle) => void;
  removeVehicle: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearAll: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

const STORAGE_KEY = "carmakler_compare";
const MAX_VEHICLES = 3;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<CompareVehicle[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CompareVehicle[];
        setVehicles(parsed.slice(0, MAX_VEHICLES));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    } catch {
      // ignore
    }
  }, [vehicles]);

  const addVehicle = useCallback((vehicle: CompareVehicle) => {
    setVehicles((prev) => {
      if (prev.length >= MAX_VEHICLES) return prev;
      if (prev.some((v) => v.id === vehicle.id)) return prev;
      return [...prev, vehicle];
    });
  }, []);

  const removeVehicle = useCallback((id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const isInCompare = useCallback(
    (id: string) => vehicles.some((v) => v.id === id),
    [vehicles],
  );

  const clearAll = useCallback(() => {
    setVehicles([]);
  }, []);

  return (
    <CompareContext.Provider value={{ vehicles, addVehicle, removeVehicle, isInCompare, clearAll }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
