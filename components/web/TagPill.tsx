import Link from "next/link";
import { cn } from "@/lib/utils";

export interface TagPillProps {
  slug: string;
  label: string;
  size?: "sm" | "md";
  variant?: "default" | "muted";
  clickable?: boolean;
}

/**
 * Klikatelný hashtag pill (→ `/makleri/[slug]`).
 * Varianty: default (orange bg), muted (gray bg — pro karty makléřů).
 */
export function TagPill({
  slug,
  label,
  size = "md",
  variant = "default",
  clickable = true,
}: TagPillProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full font-medium transition-colors";
  const sizeClass =
    size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const variantClass =
    variant === "muted"
      ? "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"
      : "bg-orange-50 text-orange-700 hover:bg-orange-100";
  const className = cn(base, sizeClass, variantClass);

  const content = (
    <>
      <span className="text-orange-500">#</span>
      {label}
    </>
  );

  if (!clickable) return <span className={className}>{content}</span>;
  return (
    <Link
      href={`/makleri/${slug}`}
      className={cn(className, "no-underline")}
      aria-label={`Makléři s hashtagem ${label}`}
    >
      {content}
    </Link>
  );
}
