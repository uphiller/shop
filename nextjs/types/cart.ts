import type { Product } from "@/types/product";

export type CartLine = {
  id: string;
  quantity: number;
  product: Product;
};
