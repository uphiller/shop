import { getDb, isDatabaseUrlConfigured } from "@/lib/db";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { Product } from "@/types/product";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

/** Placeholder catalog when Supabase env is not configured. */
const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Merino Crew Sweater",
    description: "Soft merino wool, relaxed fit for everyday layering.",
    price: 89000,
    imageUrl:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
    category: "Apparel",
    badge: "bestseller",
  },
  {
    id: "2",
    name: "Canvas Day Tote",
    description: "Sturdy organic cotton with interior pocket.",
    price: 42000,
    imageUrl:
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80",
    category: "Bags",
    badge: "new",
  },
  {
    id: "3",
    name: "Ceramic Pour-Over Set",
    description: "Hand-glazed dripper and carafe for slow mornings.",
    price: 68000,
    imageUrl:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80",
    category: "Home",
  },
  {
    id: "4",
    name: "Minimal Leather Sneakers",
    description: "Vegetable-tanned leather, cushioned sole.",
    price: 128000,
    imageUrl:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    category: "Footwear",
    badge: "sale",
  },
  {
    id: "5",
    name: "Studio Desk Lamp",
    description: "Warm dimmable LED, matte aluminum arm.",
    price: 95000,
    imageUrl:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
    category: "Home",
  },
  {
    id: "6",
    name: "Linen Sheet Set",
    description: "Breathable European flax, stone-washed finish.",
    price: 156000,
    imageUrl:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    category: "Home",
    badge: "new",
  },
];

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    imageUrl: row.image_url,
    category: row.category,
    badge: row.badge ?? undefined,
  };
}

function hasLiveCatalog(): boolean {
  return isSupabaseConfigured() || isDatabaseUrlConfigured();
}

async function fetchProductsViaSupabase(limit: number): Promise<Product[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Supabase products query failed: ${error.message}`);
  }

  return (data ?? []).map(rowToProduct);
}

async function fetchProductsViaPostgres(limit: number): Promise<Product[]> {
  const sql = getDb();
  const rows = await sql<ProductRow[]>`
    select *
    from public.products
    order by created_at desc
    limit ${limit}
  `;
  return rows.map(rowToProduct);
}

async function fetchProducts(limit: number): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    return fetchProductsViaSupabase(limit);
  }
  return fetchProductsViaPostgres(limit);
}

export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  if (!hasLiveCatalog()) {
    return MOCK_PRODUCTS.slice(0, limit);
  }
  return fetchProducts(limit);
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!hasLiveCatalog()) {
    return MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
  }

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase product query failed: ${error.message}`);
    }

    return data ? rowToProduct(data) : null;
  }

  const sql = getDb();
  const rows = await sql<ProductRow[]>`
    select *
    from public.products
    where id = ${id}::uuid
    limit 1
  `;
  return rows[0] ? rowToProduct(rows[0]) : null;
}

export function formatPrice(krw: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(krw);
}
