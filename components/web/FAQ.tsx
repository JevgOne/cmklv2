"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQProps {
  items: FAQItem[];
  title?: string;
  variant?: "card" | "divider";
}

export function FAQ({ items, title, variant = "card" }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  if (items.length === 0) return null;

  const isDivider = variant === "divider";

  const list = (
    <div className={cn(!isDivider && "flex flex-col gap-3")}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={cn(
              isDivider
                ? "border-b border-gray-200"
                : "bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className={cn(
                "w-full flex items-center justify-between gap-3 sm:gap-4 text-left cursor-pointer bg-transparent border-none min-h-[44px]",
                isDivider ? "py-5" : "px-4 sm:px-6 py-4 sm:py-5"
              )}
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
                <div
                  className={cn(
                    "text-[15px] text-gray-600 leading-relaxed",
                    isDivider ? "pb-5" : "px-4 sm:px-6 pb-4 sm:pb-5"
                  )}
                >
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (title) {
    return (
      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            {title}
          </h2>
          {list}
        </div>
      </section>
    );
  }

  return list;
}
