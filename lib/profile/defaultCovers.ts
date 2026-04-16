export const DEFAULT_COVERS = [
  "/images/covers/cover-1.jpg",
  "/images/covers/cover-2.jpg",
  "/images/covers/cover-3.jpg",
  "/images/covers/cover-4.jpg",
] as const;

/**
 * Vrátí deterministicky jeden default cover podle user.id.
 * Stejný uživatel = stejná fotka při každém reloadu.
 */
export function getDefaultCover(userId: string): string {
  if (!userId) return DEFAULT_COVERS[0];
  // Součet char codes → modulo N. Stabilní napříč procesy.
  let sum = 0;
  for (let i = 0; i < userId.length; i++) {
    sum = (sum + userId.charCodeAt(i)) % 1000;
  }
  return DEFAULT_COVERS[sum % DEFAULT_COVERS.length];
}
