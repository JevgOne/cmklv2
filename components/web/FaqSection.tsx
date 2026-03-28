"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FaqSectionItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  items: FaqSectionItem[];
  title?: string;
}

export function FaqSection({ items, title = "Často kladené otázky" }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
          {title}
        </h2>
        <div className="flex flex-col">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border-b border-gray-200"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer bg-transparent border-none"
                >
                  <span className="text-[16px] font-semibold text-gray-900">
                    {item.question}
                  </span>
                  <svg
                    className={cn(
                      "w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300",
                      isOpen && "rotate-180"
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pb-5 text-[15px] text-gray-600 leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
