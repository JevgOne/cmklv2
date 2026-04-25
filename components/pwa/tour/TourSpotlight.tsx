"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TourSpotlightProps {
  targetSelector: string;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourSpotlight({
  targetSelector,
  title,
  description,
  step,
  totalSteps,
  onNext,
  onSkip,
}: TourSpotlightProps) {
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.querySelector(targetSelector);
    if (!el) {
      // Element not found — skip this step
      onNext();
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait for scroll to finish
    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [targetSelector, onNext]);

  if (!targetRect) return null;

  const padding = 8;
  const holeTop = targetRect.top - padding;
  const holeLeft = targetRect.left - padding;
  const holeWidth = targetRect.width + padding * 2;
  const holeHeight = targetRect.height + padding * 2;

  // Tooltip position: below target if there's room, otherwise above
  const spaceBelow = window.innerHeight - (targetRect.top + targetRect.height);
  const placeBelow = spaceBelow > 160;

  const tooltipStyle: React.CSSProperties = {
    position: "fixed",
    left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 300)),
    ...(placeBelow
      ? { top: targetRect.top + targetRect.height + padding + 12 }
      : { bottom: window.innerHeight - targetRect.top + padding + 12 }),
    maxWidth: "calc(100vw - 32px)",
    width: 280,
    zIndex: 52,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Overlay with hole */}
        <div
          className="absolute inset-0"
          style={{
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.7)`,
            position: "fixed",
            top: holeTop,
            left: holeLeft,
            width: holeWidth,
            height: holeHeight,
            borderRadius: 12,
            zIndex: 51,
            pointerEvents: "none",
          }}
        />

        {/* Clickable backdrop */}
        <div className="fixed inset-0 z-50" onClick={onNext} />

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: placeBelow ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={tooltipStyle}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-500">
                {step}/{totalSteps}
              </span>
              <button
                onClick={onSkip}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Preskocit
              </button>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-xs text-gray-500 mb-3">{description}</p>
            <button
              onClick={onNext}
              className="w-full py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              {step === totalSteps ? "Hotovo" : "Dalsi"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
