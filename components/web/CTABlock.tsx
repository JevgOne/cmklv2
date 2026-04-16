import Link from "next/link";
import type { CTACopy } from "@/lib/landing-copy";
import { cn } from "@/lib/utils";

export interface CTABlockProps {
  copy: CTACopy;
  variant?: "mid" | "bottom";
}

export function CTABlock({ copy, variant = "mid" }: CTABlockProps) {
  const isMid = variant === "mid";

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "rounded-2xl p-8 sm:p-12 text-center",
            isMid
              ? "bg-gradient-to-r from-orange-500 to-orange-600"
              : "bg-gray-50 border border-gray-200"
          )}
        >
          <h2
            className={cn(
              "text-2xl sm:text-3xl font-extrabold",
              isMid ? "text-white" : "text-gray-900"
            )}
          >
            {copy.heading}
          </h2>
          <p
            className={cn(
              "mt-3 text-base sm:text-lg",
              isMid ? "text-white/90" : "text-gray-600"
            )}
          >
            {copy.body}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              href={copy.primary.href}
              className={cn(
                "inline-flex items-center justify-center font-semibold px-6 py-3 rounded-full no-underline transition-colors",
                isMid
                  ? "bg-white text-orange-600 hover:bg-orange-50"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              )}
            >
              {copy.primary.text}
            </Link>
            {copy.secondary && (
              <Link
                href={copy.secondary.href}
                className={cn(
                  "inline-flex items-center justify-center font-semibold px-6 py-3 rounded-full no-underline transition-colors",
                  isMid
                    ? "border-2 border-white/70 text-white hover:bg-white/10"
                    : "border border-gray-300 text-gray-700 hover:border-orange-300"
                )}
              >
                {copy.secondary.text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
