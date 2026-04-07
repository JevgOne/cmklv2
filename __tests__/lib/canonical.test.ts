import { describe, it, expect, vi } from "vitest";

// Mock seo-data BASE_URL for deterministic tests across env vars.
vi.mock("@/lib/seo-data", () => ({
  BASE_URL: "https://carmakler.cz",
}));

import { pageCanonical } from "@/lib/canonical";

describe("pageCanonical", () => {
  it("returns root URL bez trailing slash pro path '/'", () => {
    expect(pageCanonical("/")).toEqual({ canonical: "https://carmakler.cz" });
  });

  it("kompletuje BASE_URL + sub-path", () => {
    expect(pageCanonical("/dily")).toEqual({
      canonical: "https://carmakler.cz/dily",
    });
  });

  it("zachová nested path s víc segmenty", () => {
    expect(pageCanonical("/dily/znacka/skoda")).toEqual({
      canonical: "https://carmakler.cz/dily/znacka/skoda",
    });
  });

  it("zachová 3-segment routing pro [brand]/[model]/[rok]", () => {
    expect(pageCanonical("/dily/znacka/skoda/octavia/2018")).toEqual({
      canonical: "https://carmakler.cz/dily/znacka/skoda/octavia/2018",
    });
  });

  it("normalizuje trailing slash (odstraní)", () => {
    expect(pageCanonical("/dily/")).toEqual({
      canonical: "https://carmakler.cz/dily",
    });
  });

  it("strip-uje query string", () => {
    expect(pageCanonical("/dily?utm_source=foo")).toEqual({
      canonical: "https://carmakler.cz/dily",
    });
  });

  it("strip-uje hash fragment", () => {
    expect(pageCanonical("/dily#section")).toEqual({
      canonical: "https://carmakler.cz/dily",
    });
  });

  it("strip-uje query I hash dohromady", () => {
    expect(pageCanonical("/dily?foo=bar#anchor")).toEqual({
      canonical: "https://carmakler.cz/dily",
    });
  });

  it("hodí Error pokud path nezačíná /", () => {
    expect(() => pageCanonical("dily")).toThrowError(
      /must be a string starting with "\/"/
    );
  });

  it("hodí Error pro empty string", () => {
    expect(() => pageCanonical("")).toThrowError(
      /must be a string starting with "\/"/
    );
  });

  it("hodí Error pro absolute URL místo path", () => {
    expect(() => pageCanonical("https://carmakler.cz/dily")).toThrowError(
      /must be a string starting with "\/"/
    );
  });

  it("hodí Error pro non-string input", () => {
    // @ts-expect-error — testujeme runtime guard pro JS callers
    expect(() => pageCanonical(null)).toThrowError(
      /must be a string starting with "\/"/
    );
  });

  it("zachová diakritika v path (raw, bez encoding)", () => {
    expect(pageCanonical("/dily/značka/škoda")).toEqual({
      canonical: "https://carmakler.cz/dily/značka/škoda",
    });
  });

  it("returns object — ne string — pro Metadata.alternates type", () => {
    const result = pageCanonical("/o-nas");
    expect(typeof result).toBe("object");
    expect(result).toHaveProperty("canonical");
    expect(typeof result.canonical).toBe("string");
  });
});
