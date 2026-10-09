export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  badge?: "new" | "sale" | "bestseller";
};
