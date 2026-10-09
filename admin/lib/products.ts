import type { Translator } from "@/lib/i18n/translator";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Database } from "@/types/database";
import type { AdminProduct, ProductFormInput } from "@/types/product";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

function rowToProduct(row: ProductRow): AdminProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    category: row.category,
    badge: row.badge,
    createdAt: row.created_at,
  };
}

function formToInsert(input: ProductFormInput): ProductInsert {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    stock: input.stock,
    image_url: input.imageUrl.trim(),
    category: input.category.trim(),
    badge: input.badge,
  };
}

function formToUpdate(input: ProductFormInput): ProductUpdate {
  return formToInsert(input);
}

export async function listProducts(): Promise<AdminProduct[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`상품 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map(rowToProduct);
}

export async function getProductCount(): Promise<number> {
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`상품 개수 조회 실패: ${error.message}`);
  }

  return count ?? 0;
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`상품 조회 실패: ${error.message}`);
  }

  return data ? rowToProduct(data) : null;
}

export async function createProduct(input: ProductFormInput): Promise<AdminProduct> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .insert(formToInsert(input))
    .select("*")
    .single();

  if (error) {
    throw new Error(`상품 등록 실패: ${error.message}`);
  }

  return rowToProduct(data);
}

export async function updateProduct(
  id: string,
  input: ProductFormInput,
): Promise<AdminProduct> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .update(formToUpdate(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`상품 수정 실패: ${error.message}`);
  }

  return rowToProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(`상품 삭제 실패: ${error.message}`);
  }
}

export function formatPrice(krw: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(krw);
}

export function parseProductForm(
  formData: FormData,
  t: Translator,
): ProductFormInput {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const stockRaw = String(formData.get("stock") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const badgeRaw = String(formData.get("badge") ?? "").trim();

  const price = Number.parseInt(priceRaw, 10);
  const stock = Number.parseInt(stockRaw, 10);
  const badge =
    badgeRaw === "new" || badgeRaw === "sale" || badgeRaw === "bestseller"
      ? badgeRaw
      : null;

  if (!name) {
    throw new Error(t("errors.productName"));
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(t("errors.priceInvalid"));
  }
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error(t("errors.stockInvalid"));
  }

  return {
    name,
    description,
    price,
    stock,
    imageUrl,
    category,
    badge,
  };
}
