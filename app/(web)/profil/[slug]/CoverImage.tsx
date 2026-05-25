"use client";

import { useState } from "react";
import Image from "next/image";

export function CoverImage({ src }: { src: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600" />
    );
  }

  return (
    <>
      <Image
        src={src}
        alt="Cover"
        fill
        sizes="100vw"
        className="object-cover"
        priority
        onError={() => setError(true)}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </>
  );
}
