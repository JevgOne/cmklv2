import { redirect } from "next/navigation";

/**
 * /makler index — redirect na dashboard.
 *
 * Bare /makler URL nemá vlastní obsah; uživatelé/linky landí na dashboard.
 * 307 (temporary) — pro případ že později přidáme skutečný /makler index.
 *
 * Refs: #122
 */
export default function MaklerIndexPage() {
  redirect("/makler/dashboard");
}
