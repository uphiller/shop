import { getDb, isDatabaseUrlConfigured } from "@/lib/db";
import { getProductById } from "@/lib/products";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { CartLine } from "@/types/cart";
import type { Product } from "@/types/product";

type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

function hasCartStore(): boolean {
  return isSupabaseConfigured() || isDatabaseUrlConfigured();
}

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

type CartItemWithProduct = CartItemRow & { products: ProductRow };

async function fetchCartLinesViaSupabase(userId: string): Promise<CartLine[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select(
      `
      id,
      quantity,
      product_id,
      products (
        id,
        name,
        description,
        price,
        stock,
        image_url,
        category,
        badge
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Cart query failed: ${error.message}`);
  }

  return (data ?? [])
    .filter(
      (row): row is CartItemWithProduct =>
        row.products != null && !Array.isArray(row.products),
    )
    .map((row) => ({
      id: row.id,
      quantity: row.quantity,
      product: rowToProduct(row.products),
    }));
}

async function fetchCartLinesViaPostgres(userId: string): Promise<CartLine[]> {
  const sql = getDb();
  const rows = await sql<
    (CartItemRow & {
      p_id: string;
      p_name: string;
      p_description: string;
      p_price: number;
      p_stock: number;
      p_image_url: string;
      p_category: string;
      p_badge: ProductRow["badge"];
    })[]
  >`
    select
      c.*,
      p.id as p_id,
      p.name as p_name,
      p.description as p_description,
      p.price as p_price,
      p.stock as p_stock,
      p.image_url as p_image_url,
      p.category as p_category,
      p.badge as p_badge
    from public.cart_items c
    inner join public.products p on p.id = c.product_id
    where c.user_id = ${userId}::uuid
    order by c.created_at asc
  `;

  return rows.map((row) => ({
    id: row.id,
    quantity: row.quantity,
    product: {
      id: row.p_id,
      name: row.p_name,
      description: row.p_description,
      price: row.p_price,
      imageUrl: row.p_image_url,
      category: row.p_category,
      badge: row.p_badge ?? undefined,
    },
  }));
}

export async function getCartLines(userId: string): Promise<CartLine[]> {
  if (!hasCartStore()) {
    return [];
  }
  if (isSupabaseConfigured()) {
    return fetchCartLinesViaSupabase(userId);
  }
  return fetchCartLinesViaPostgres(userId);
}

export async function getCartItemCount(userId: string): Promise<number> {
  if (!hasCartStore()) {
    return 0;
  }
  const lines = await getCartLines(userId);
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
}

async function addViaSupabase(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Cart read failed: ${fetchError.message}`);
  }

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({
        quantity: existing.quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      throw new Error(`Cart update failed: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from("cart_items").insert({
    user_id: userId,
    product_id: productId,
    quantity,
  });
  if (error) {
    throw new Error(`Cart insert failed: ${error.message}`);
  }
}

async function addViaPostgres(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const sql = getDb();
  await sql`
    insert into public.cart_items (user_id, product_id, quantity)
    values (${userId}::uuid, ${productId}::uuid, ${quantity})
    on conflict (user_id, product_id) do update set
      quantity = public.cart_items.quantity + excluded.quantity,
      updated_at = now()
  `;
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  if (!hasCartStore()) {
    throw new Error("Cart is not configured");
  }
  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const product = await getProductById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  const lines = await getCartLines(userId);
  const existing = lines.find((l) => l.product.id === productId);
  const nextQty = (existing?.quantity ?? 0) + quantity;

  const stockRow = await getProductStock(productId);
  if (nextQty > stockRow) {
    throw new Error(`Only ${stockRow} in stock`);
  }

  if (isSupabaseConfigured()) {
    await addViaSupabase(userId, productId, quantity);
  } else {
    await addViaPostgres(userId, productId, quantity);
  }
}

async function getProductStock(productId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .maybeSingle();
    if (error || !data) {
      throw new Error("Could not read product stock");
    }
    return data.stock;
  }
  const sql = getDb();
  const rows = await sql<{ stock: number }[]>`
    select stock from public.products where id = ${productId}::uuid limit 1
  `;
  if (!rows[0]) {
    throw new Error("Could not read product stock");
  }
  return rows[0].stock;
}

async function setQuantityViaSupabase(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  if (quantity <= 0) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId);
    if (error) {
      throw new Error(`Cart delete failed: ${error.message}`);
    }
    return;
  }

  const stock = await getProductStock(productId);
  if (quantity > stock) {
    throw new Error(`Only ${stock} in stock`);
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    throw new Error(`Cart update failed: ${error.message}`);
  }
}

async function setQuantityViaPostgres(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  const sql = getDb();
  if (quantity <= 0) {
    await sql`
      delete from public.cart_items
      where user_id = ${userId}::uuid and product_id = ${productId}::uuid
    `;
    return;
  }

  const stock = await getProductStock(productId);
  if (quantity > stock) {
    throw new Error(`Only ${stock} in stock`);
  }

  await sql`
    update public.cart_items
    set quantity = ${quantity}, updated_at = now()
    where user_id = ${userId}::uuid and product_id = ${productId}::uuid
  `;
}

export async function setCartQuantity(
  userId: string,
  productId: string,
  quantity: number,
): Promise<void> {
  if (!hasCartStore()) {
    throw new Error("Cart is not configured");
  }
  if (isSupabaseConfigured()) {
    await setQuantityViaSupabase(userId, productId, quantity);
  } else {
    await setQuantityViaPostgres(userId, productId, quantity);
  }
}

export async function removeFromCart(
  userId: string,
  productId: string,
): Promise<void> {
  await setCartQuantity(userId, productId, 0);
}

export async function clearCartForUser(userId: string): Promise<void> {
  if (!hasCartStore()) {
    return;
  }
  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", userId);
    if (error) {
      throw new Error(`Cart clear failed: ${error.message}`);
    }
    return;
  }
  const sql = getDb();
  await sql`
    delete from public.cart_items where user_id = ${userId}::uuid
  `;
}
