/**
 * SEO audit engine — page-level validation + aggregate health score.
 *
 * STOP-3: Audit NEVER modifies metadata — only reports issues.
 */

export interface AuditIssue {
  pagePath: string;
  severity: "ERROR" | "WARNING";
  rule: string;
  message: string;
}

export interface AuditResult {
  score: number; // 0-100
  ok: number;
  warnings: number;
  errors: number;
  issues: AuditIssue[];
}

interface AuditablePage {
  pagePath: string;
  pageType: string;
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  noIndex: boolean;
  schemaTypesJson: string | null;
}

/**
 * Audit a single SeoPageMeta record against SEO rules.
 * Returns an array of issues (empty = page is OK).
 */
export function auditPage(meta: AuditablePage): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const p = meta.pagePath;

  // ERROR: Missing title (only for indexable pages)
  if (!meta.title && !meta.noIndex) {
    issues.push({
      pagePath: p,
      severity: "ERROR",
      rule: "MISSING_TITLE",
      message: "Stránka nemá meta title",
    });
  }

  // ERROR: Missing description (only for indexable pages)
  if (!meta.description && !meta.noIndex) {
    issues.push({
      pagePath: p,
      severity: "ERROR",
      rule: "MISSING_DESCRIPTION",
      message: "Stránka nemá meta description",
    });
  }

  // WARNING: Title too long (> 60 chars)
  if (meta.title && meta.title.length > 60) {
    issues.push({
      pagePath: p,
      severity: "WARNING",
      rule: "TITLE_TOO_LONG",
      message: `Title má ${meta.title.length} znaků (max 60)`,
    });
  }

  // WARNING: Title too short (< 20 chars)
  if (meta.title && meta.title.length < 20) {
    issues.push({
      pagePath: p,
      severity: "WARNING",
      rule: "TITLE_TOO_SHORT",
      message: `Title má jen ${meta.title.length} znaků (min 20)`,
    });
  }

  // WARNING: Description too long (> 160 chars)
  if (meta.description && meta.description.length > 160) {
    issues.push({
      pagePath: p,
      severity: "WARNING",
      rule: "DESC_TOO_LONG",
      message: `Description má ${meta.description.length} znaků (max 160)`,
    });
  }

  // WARNING: Description too short (< 50 chars)
  if (meta.description && meta.description.length < 50) {
    issues.push({
      pagePath: p,
      severity: "WARNING",
      rule: "DESC_TOO_SHORT",
      message: `Description má jen ${meta.description.length} znaků (min 50)`,
    });
  }

  // WARNING: Missing OG title — only if title is also missing (OG falls back to title)
  if (!meta.ogTitle && !meta.title && meta.pageType !== "STATIC") {
    issues.push({
      pagePath: p,
      severity: "WARNING",
      rule: "MISSING_OG_TITLE",
      message: "Chybí OG title pro social sharing",
    });
  }

  // WARNING: No schema types tracked
  if (!meta.schemaTypesJson || meta.schemaTypesJson === "[]") {
    issues.push({
      pagePath: p,
      severity: "WARNING",
      rule: "NO_SCHEMA",
      message: "Stránka nemá tracked JSON-LD schema",
    });
  }

  return issues;
}

/**
 * Compute aggregate health score from all pages.
 * Score formula: ((ok * 1 + warnings * 0.5) / total) * 100
 */
export function computeHealthScore(pages: AuditablePage[]): AuditResult {
  let ok = 0;
  let warnings = 0;
  let errors = 0;
  const allIssues: AuditIssue[] = [];

  for (const page of pages) {
    const issues = auditPage(page);
    if (issues.some((i) => i.severity === "ERROR")) errors++;
    else if (issues.length > 0) warnings++;
    else ok++;
    allIssues.push(...issues);
  }

  const total = pages.length || 1;
  const score = Math.round(((ok * 1 + warnings * 0.5) / total) * 100);

  return { score, ok, warnings, errors, issues: allIssues };
}
