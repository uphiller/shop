export type OrderStatus = "pending" | "paid" | "cancelled" | "failed";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  subtotal: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
};
