"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface SignatureCanvasProps {
  onConfirm: (base64: string) => void;
  width?: number;
  height?: number;
}

export function SignatureCanvas({
  onConfirm,
  width = 320,
  height = 200,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext("2d") ?? null;
  }, []);

  const getPoint = useCallback(
    (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  // Initialize canvas with white background
  useEffect(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
  }, [getCtx, width, height]);

  const startDrawing = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const point = getPoint(e);
      lastPointRef.current = point;

      const ctx = getCtx();
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [getPoint, getCtx]
  );

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;

      const ctx = getCtx();
      if (!ctx || !lastPointRef.current) return;

      const point = getPoint(e);
      const last = lastPointRef.current;

      // Quadratic bezier for smooth drawing
      const midX = (last.x + point.x) / 2;
      const midY = (last.y + point.y) / 2;

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.quadraticCurveTo(last.x, last.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);

      lastPointRef.current = point;
      if (!hasDrawn) setHasDrawn(true);
    },
    [getPoint, getCtx, hasDrawn]
  );

  const stopDrawing = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      isDrawingRef.current = false;
      lastPointRef.current = null;
    },
    []
  );

  const clear = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);
    setHasDrawn(false);
  }, [getCtx, width, height]);

  const confirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL("image/png");
    onConfirm(base64);
  }, [onConfirm]);

  return (
    <div className="flex flex-col gap-3">
      <div className="border-2 border-gray-200 rounded-lg overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full"
          style={{ aspectRatio: `${width}/${height}` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-xs text-gray-400 text-center">
        Podepište se prstem nebo myší
      </p>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={clear} className="flex-1">
          Vymazat
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={confirm}
          disabled={!hasDrawn}
          className="flex-1"
        >
          Potvrdit
        </Button>
      </div>
    </div>
  );
}
