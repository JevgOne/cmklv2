/**
 * Plausible custom event tracking.
 * Pouziti: trackEvent("Listing Created", { type: "PRIVATE" });
 *
 * Funkce je safe — pokud Plausible neni nacteny, nic se nestane.
 */
export function trackEvent(name: string, props?: Record<string, string | number>) {
  if (typeof window !== "undefined" && (window as unknown as { plausible?: (name: string, opts?: { props: Record<string, string | number> }) => void }).plausible) {
    (window as unknown as { plausible: (name: string, opts?: { props: Record<string, string | number> }) => void }).plausible(name, props ? { props } : undefined);
  }
}
