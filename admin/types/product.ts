import type { ProductBadge } from "@/types/database";

export type AdminProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  badge: ProductBadge | null;
  createdAt: string;
};

export type ProductFormInput = {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  badge: ProductBadge | null;
};
