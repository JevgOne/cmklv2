"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface VehicleImage {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface VehiclePhotoCarouselProps {
  images: VehicleImage[];
  title: string;
}

export function VehiclePhotoCarousel({ images, title }: VehiclePhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const threshold = 50;
    if (touchDeltaX.current < -threshold && currentIndex < images.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (touchDeltaX.current > threshold && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-gray-300">
          <path d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      {/* Carousel */}
      <div
        className="relative w-full h-64 bg-gray-100 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setFullscreen(true)}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img) => (
            <div key={img.id} className="w-full h-full flex-shrink-0 relative">
              <Image
                src={img.url}
                alt={`${title} - foto ${img.order + 1}`}
                fill
                className="object-cover"
                sizes="100vw"
                priority={img.order === 0}
              />
            </div>
          ))}
        </div>

        {/* Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`w-2 h-2 rounded-full transition-all border-none cursor-pointer ${
                  i === currentIndex
                    ? "bg-white w-4"
                    : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Counter */}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {currentIndex + 1}/{images.length}
        </div>
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 bg-black z-[300] flex flex-col"
          onClick={() => setFullscreen(false)}
        >
          <div className="flex items-center justify-between p-4">
            <span className="text-white text-sm">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setFullscreen(false)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white border-none cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          <div
            className="flex-1 relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {images.map((img) => (
                <div key={img.id} className="w-full h-full flex-shrink-0 relative">
                  <Image
                    src={img.url}
                    alt={`${title} - foto ${img.order + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fullscreen dots */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 p-4">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all border-none cursor-pointer ${
                    i === currentIndex ? "bg-white w-4" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
