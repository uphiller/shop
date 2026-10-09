"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/translator";
import {
  createProduct,
  deleteProduct,
  parseProductForm,
  updateProduct,
} from "@/lib/products";
import { requireAdmin } from "@/lib/require-admin";
import { isSupabaseConfigured } from "@/lib/supabase-server";

async function ensureSupabase() {
  const { t } = await getTranslations();
  if (!isSupabaseConfigured()) {
    throw new Error(t("errors.supabaseEnv"));
  }
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();
  const { t } = await getTranslations();
  await ensureSupabase();

  try {
    const input = parseProductForm(formData, t);
    await createProduct(input);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : t("errors.createFailed");
    redirect(`/products/new?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin();
  const { t } = await getTranslations();
  await ensureSupabase();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/products?error=" + encodeURIComponent(t("errors.missingProductId")));
  }

  try {
    const input = parseProductForm(formData, t);
    await updateProduct(id, input);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : t("errors.updateFailed");
    redirect(`/products/${id}/edit?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const { t } = await getTranslations();
  await ensureSupabase();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    redirect("/products?error=" + encodeURIComponent(t("errors.missingProductId")));
  }

  try {
    await deleteProduct(id);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : t("errors.deleteFailed");
    redirect("/products?error=" + encodeURIComponent(message));
  }

  revalidatePath("/products");
  revalidatePath("/");
  redirect("/products");
}
