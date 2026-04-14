/**
 * Client-side search history for guest users (localStorage).
 * Logged-in users use POST/GET /api/search/history (DB).
 */

const STORAGE_KEY = "carmakler_search_history";
const MAX_GUEST = 5;

export function addSearchHistory(query: string): void {
  try {
    const history = getSearchHistory();
    const filtered = history.filter((h) => h !== query);
    filtered.unshift(query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_GUEST)));
  } catch {
    // localStorage unavailable (SSR, private mode)
  }
}

export function getSearchHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
