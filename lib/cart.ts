"use client";

// ============================================
// Košík — localStorage persistence + event-driven reactivity
// ============================================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
  supplierId?: string;
  supplierName?: string;
  stock?: number;
}

const CART_KEY = "carmakler_cart";
const CART_EVENT = "cart-updated";

// ---- Helpers ----

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

// ---- Public API ----

export function getCart(): CartItem[] {
  return read();
}

export function addToCart(item: Omit<CartItem, "quantity"> & { quantity?: number }) {
  const items = read();
  const existing = items.find((i) => i.id === item.id);

  if (existing) {
    existing.quantity += item.quantity ?? 1;
  } else {
    items.push({ ...item, quantity: item.quantity ?? 1 });
  }

  write(items);
}

export function removeFromCart(id: string) {
  const items = read().filter((i) => i.id !== id);
  write(items);
}

export function updateQuantity(id: string, quantity: number) {
  const items = read();
  const item = items.find((i) => i.id === id);
  if (!item) return;

  if (quantity <= 0) {
    write(items.filter((i) => i.id !== id));
  } else {
    item.quantity = quantity;
    write(items);
  }
}

export function clearCart() {
  write([]);
}

export function getCartTotal(): number {
  return read().reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function getCartCount(): number {
  return read().reduce((sum, i) => sum + i.quantity, 0);
}

/** Subscribe to cart changes. Returns cleanup function. */
export function onCartChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CART_EVENT, handler);
  return () => window.removeEventListener(CART_EVENT, handler);
}
