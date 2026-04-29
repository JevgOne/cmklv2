import { ImageResponse } from "next/og";
import { OG_SIZE, getLogoBase64, ORANGE } from "@/lib/og-image";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "CarMakléř Blog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const logo = await getLogoBase64();

  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      readTime: true,
      publishedAt: true,
      category: { select: { name: true, icon: true } },
      author: { select: { firstName: true, lastName: true } },
    },
  });

  if (!article) {
    return new ImageResponse(
      (
        <BlogOgFallback logo={logo} />
      ),
      { ...size },
    );
  }

  const authorName = `${article.author.firstName} ${article.author.lastName}`;
  const readTime = article.readTime ? `${article.readTime} min čtení` : null;
  const categoryLabel = article.category
    ? `${article.category.icon || "📰"} ${article.category.name}`
    : null;
  const date = article.publishedAt
    ? new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(article.publishedAt)
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background: cover image or dark gradient */}
        {article.coverImage ? (
          <img
            src={article.coverImage}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "flex",
            }}
          />
        ) : null}

        {/* Dark overlay for readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            background: article.coverImage
              ? "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 50%, rgba(0,0,0,0.92) 100%)"
              : "linear-gradient(145deg, #080818 0%, #1a1a2e 30%, #16213e 65%, #0f3460 100%)",
          }}
        />

        {/* Orange accent glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Content container */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 56px",
          }}
        >
          {/* Top bar: logo + category */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <img
              src={logo}
              alt="CarMakléř"
              style={{ height: 42 }}
            />
            {categoryLabel ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(249,115,22,0.2)",
                  border: "1px solid rgba(249,115,22,0.4)",
                  borderRadius: 20,
                  padding: "6px 18px",
                  fontSize: 16,
                  fontWeight: 600,
                  color: ORANGE,
                }}
              >
                {categoryLabel}
              </div>
            ) : null}
          </div>

          {/* Center: Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              maxWidth: 900,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: article.title.length > 50 ? 40 : 48,
                fontWeight: 800,
                color: "white",
                lineHeight: 1.2,
                textShadow: "0 2px 20px rgba(0,0,0,0.5)",
              }}
            >
              {article.title}
            </div>
            {article.excerpt ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 20,
                  color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.4,
                  maxWidth: 700,
                }}
              >
                {article.excerpt.length > 120
                  ? article.excerpt.slice(0, 117) + "..."
                  : article.excerpt}
              </div>
            ) : null}
          </div>

          {/* Bottom bar: author · date · read time · url */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                fontSize: 16,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: ORANGE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                  }}
                >
                  {article.author.firstName[0]}
                </div>
                <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
                  {authorName}
                </span>
              </div>

              {/* Separator */}
              {date ? (
                <>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                  <span>{date}</span>
                </>
              ) : null}

              {readTime ? (
                <>
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
                  <span>{readTime}</span>
                </>
              ) : null}
            </div>

            {/* URL */}
            <div
              style={{
                display: "flex",
                fontSize: 14,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              www.carmakler.cz/blog
            </div>
          </div>
        </div>

        {/* Bottom orange accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 4,
            background: `linear-gradient(90deg, ${ORANGE}, #F59E0B, ${ORANGE})`,
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}

function BlogOgFallback({ logo }: { logo: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #080818 0%, #1a1a2e 30%, #16213e 65%, #0f3460 100%)",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
          display: "flex",
        }}
      />
      <img src={logo} alt="CarMakléř" style={{ height: 64, marginBottom: 24 }} />
      <div style={{ width: 50, height: 3, background: ORANGE, marginBottom: 24, display: "flex" }} />
      <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "white" }}>
        <span>CarMakléř </span>
        <span style={{ color: ORANGE, marginLeft: 12 }}>Blog</span>
      </div>
      <div style={{ display: "flex", fontSize: 20, color: "rgba(255,255,255,0.6)", marginTop: 16 }}>
        Novinky ze světa aut, tipy a rady
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: `linear-gradient(90deg, transparent, ${ORANGE}, transparent)`,
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 40,
          fontSize: 14,
          color: "rgba(255,255,255,0.4)",
          display: "flex",
        }}
      >
        www.carmakler.cz/blog
      </div>
    </div>
  );
}
