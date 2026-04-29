export type MenuCategory = "kota" | "chips" | "extras" | "drinks";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "collected"
  | "rejected";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl: string | null;
  available: boolean;
  sortOrder: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
}

export interface Order {
  id: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentRef: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: "customer" | "kitchen" | "admin";
  createdAt: string;
}

export interface SocketEvents {
  "order:new": Order;
  "order:updated": Pick<Order, "id" | "status" | "updatedAt">;
}
