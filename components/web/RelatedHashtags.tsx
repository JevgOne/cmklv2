import Link from "next/link";

export interface RelatedHashtag {
  slug: string;
  label: string;
  shared: number;
}

export interface RelatedHashtagsProps {
  tags: RelatedHashtag[];
  heading?: string;
}

/**
 * Section 4 — related hashtagy (co-occurrence). Skryté pokud empty.
 */
export function RelatedHashtags({
  tags,
  heading = "Mohlo by vás zajímat",
}: RelatedHashtagsProps) {
  if (tags.length === 0) return null;

  return (
    <section className="py-10 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">{heading}</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/makleri/${tag.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gray-100 hover:bg-orange-50 hover:text-orange-700 text-gray-700 transition-colors no-underline"
              aria-label={`Makléři s hashtagem ${tag.label}, ${tag.shared} makléřů sdílí`}
            >
              <span className="font-semibold">#{tag.label}</span>
              <span className="text-xs text-gray-500">
                {tag.shared} makléřů
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
