export type PartCategory =
  | "ENGINE"
  | "TRANSMISSION"
  | "BRAKES"
  | "SUSPENSION"
  | "BODY"
  | "ELECTRICAL"
  | "INTERIOR"
  | "WHEELS"
  | "EXHAUST"
  | "COOLING"
  | "FUEL"
  | "OTHER";

export type PartCondition =
  | "NEW"
  | "USED_GOOD"
  | "USED_FAIR"
  | "USED_POOR"
  | "REFURBISHED";

export type PartStatus = "DRAFT" | "ACTIVE" | "SOLD" | "INACTIVE";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentMethod = "BANK_TRANSFER" | "COD";

export type PaymentStatus = "PENDING" | "PAID";

export type OrderItemStatus = "PENDING" | "CONFIRMED" | "SHIPPED";

export interface PartImage {
  id: string;
  partId: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

export interface Part {
  id: string;
  slug: string;
  supplierId: string;
  category: PartCategory;
  name: string;
  description: string | null;
  partNumber: string | null;
  oemNumber: string | null;
  condition: PartCondition;
  price: number;
  currency: string;
  vatIncluded: boolean;
  stock: number;
  weight: number | null;
  dimensions: string | null;
  compatibleBrands: string | null;
  compatibleModels: string | null;
  compatibleYearFrom: number | null;
  compatibleYearTo: number | null;
  universalFit: boolean;
  status: PartStatus;
  viewCount: number;
  images: PartImage[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  partId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderItemStatus;
  part?: Part;
}

export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string | null;
  status: OrderStatus;
  deliveryName: string;
  deliveryPhone: string;
  deliveryEmail: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryZip: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totalPrice: number;
  shippingPrice: number;
  note: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  partId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string | null;
  stock: number;
}

export interface Cart {
  items: CartItem[];
}
