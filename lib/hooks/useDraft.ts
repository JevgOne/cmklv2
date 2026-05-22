"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import React from "react";
import type {
  VehicleDraft,
  DraftSection,
  DraftSectionData,
  DraftStatus,
} from "@/types/vehicle-draft";
import { offlineStorage } from "@/lib/offline/storage";

// ============================================
// Types
// ============================================

export type SaveStatus = "idle" | "saving" | "saved" | "offline";

// ============================================
// Context
// ============================================

interface DraftContextValue {
  draft: VehicleDraft | null;
  loading: boolean;
  error: string | null;
  saveStatus: SaveStatus;
  createDraft: () => Promise<string>;
  loadDraft: (id: string) => Promise<void>;
  saveDraft: () => Promise<void>;
  updateSection: <S extends DraftSection>(
    section: S,
    data: DraftSectionData[S]
  ) => void;
  updateStatus: (status: DraftStatus) => void;
  updateStep: (step: number) => void;
  deleteDraft: (id: string) => Promise<void>;
}

const DraftContext = createContext<DraftContextValue | null>(null);

// ============================================
// Provider
// ============================================

interface DraftProviderProps {
  children: ReactNode;
}

export function DraftProvider({ children }: DraftProviderProps) {
  const [draft, setDraft] = useState<VehicleDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const draftRef = useRef<VehicleDraft | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSaveStatus((prev) => (prev === "offline" ? "idle" : prev));
    };
    const handleOffline = () => {
      setSaveStatus("offline");
    };

    if (typeof window !== "undefined" && !navigator.onLine) {
      setSaveStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Udržuje ref synchronizovaný se statem
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const persistDraft = useCallback(async (d: VehicleDraft) => {
    // Don't override offline status
    setSaveStatus((prev) => (prev === "offline" ? "offline" : "saving"));
    try {
      const { id, ...rest } = d;
      await offlineStorage.saveDraft(id, rest as unknown as Record<string, unknown>);

      setSaveStatus((prev) => {
        if (prev === "offline") return "offline";
        return "saved";
      });

      // Clear previous fade timer
      if (savedFadeTimerRef.current) {
        clearTimeout(savedFadeTimerRef.current);
      }
      // Fade "saved" back to "idle" after 2s
      savedFadeTimerRef.current = setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 2000);
    } catch (err) {
      console.error("Chyba při ukládání draftu:", err);
      setSaveStatus("offline");
    }
  }, []);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      const current = draftRef.current;
      if (current) {
        persistDraft({ ...current, updatedAt: Date.now() });
      }
    }, 1000);
  }, [persistDraft]);

  const createDraft = useCallback(async (): Promise<string> => {
    const id = generateId();
    const newDraft: VehicleDraft = {
      id,
      status: "draft",
      currentStep: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDraft(newDraft);
    await persistDraft(newDraft);
    return id;
  }, [persistDraft]);

  const loadDraft = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const stored = await offlineStorage.getDraft(id);
      if (!stored) {
        throw new Error("Draft nebyl nalezen");
      }
      const loaded: VehicleDraft = {
        id: stored.id,
        ...(stored.data as unknown as Omit<VehicleDraft, "id">),
        updatedAt: stored.updatedAt,
      };
      setDraft(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chyba při načítání draftu");
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDraft = useCallback(async () => {
    const current = draftRef.current;
    if (!current) return;
    const updated = { ...current, updatedAt: Date.now() };
    setDraft(updated);
    await persistDraft(updated);
  }, [persistDraft]);

  const updateSection = useCallback(
    <S extends DraftSection>(section: S, data: DraftSectionData[S]) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const updated: VehicleDraft = {
          ...prev,
          [section]: { ...(prev[section] ?? {}), ...data },
          updatedAt: Date.now(),
        };
        return updated;
      });
      debouncedSave();
    },
    [debouncedSave]
  );

  const updateStatus = useCallback(
    (status: DraftStatus) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return { ...prev, status, updatedAt: Date.now() };
      });
      debouncedSave();
    },
    [debouncedSave]
  );

  const updateStep = useCallback(
    (step: number) => {
      setDraft((prev) => {
        if (!prev) return prev;
        return { ...prev, currentStep: step, updatedAt: Date.now() };
      });
      debouncedSave();
    },
    [debouncedSave]
  );

  const deleteDraft = useCallback(async (id: string) => {
    await offlineStorage.deleteDraft(id);
    setDraft((prev) => (prev?.id === id ? null : prev));
  }, []);

  // Auto-save při unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (savedFadeTimerRef.current) {
        clearTimeout(savedFadeTimerRef.current);
      }
      const current = draftRef.current;
      if (current) {
        persistDraft({ ...current, updatedAt: Date.now() });
      }
    };
  }, [persistDraft]);

  const value: DraftContextValue = {
    draft,
    loading,
    error,
    saveStatus,
    createDraft,
    loadDraft,
    saveDraft,
    updateSection,
    updateStatus,
    updateStep,
    deleteDraft,
  };

  return React.createElement(DraftContext.Provider, { value }, children);
}

// ============================================
// Hook
// ============================================

export function useDraftContext(): DraftContextValue {
  const ctx = useContext(DraftContext);
  if (!ctx) {
    throw new Error("useDraftContext musí být použit uvnitř DraftProvider");
  }
  return ctx;
}

// ============================================
// Helpers
// ============================================

function generateId(): string {
  return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
