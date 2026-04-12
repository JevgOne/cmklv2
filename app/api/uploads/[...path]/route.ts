/**
 * DEV ONLY: Serviruje lokalne ulozene soubory.
 * V produkci toto obsluhuje Nginx (files.carmakler.cz).
 */
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { path } = await params;
  const filePath = join(
    process.env.UPLOAD_DIR || "/tmp/carmakler-uploads",
    ...path
  );

  try {
    const buffer = await readFile(filePath);
    const ext = filePath.split(".").pop();
    const contentType =
      ext === "webp"
        ? "image/webp"
        : ext === "pdf"
          ? "application/pdf"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : ext === "png"
              ? "image/png"
              : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
