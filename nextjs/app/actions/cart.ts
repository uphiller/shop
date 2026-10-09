"use server";

import { revalidatePath } from "next/cache";
import { addToCart, removeFromCart, setCartQuantity } from "@/lib/cart";
import { getTranslations } from "@/lib/i18n/translator";
import { requireSession } from "@/lib/session";
import { getAppUserIdForSession } from "@/lib/users";

function revalidateCartSurfaces() {
  revalidatePath("/cart");
  revalidatePath("/", "layout");
}

async function userIdAfterAuth(callbackUrl: string) {
  const session = await requireSession(callbackUrl);
  const userId = await getAppUserIdForSession(session);
  if (!userId) {
    throw new Error("Could not resolve app user");
  }
  return userId;
}

export type CartActionState = { error?: string; ok?: true } | null;

export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const { t } = await getTranslations();
  const productId = String(formData.get("productId") ?? "");
  const rawQty = Number(formData.get("quantity") ?? 1);
  const quantity = Number.isFinite(rawQty) ? Math.max(1, Math.floor(rawQty)) : 1;

  if (!productId) {
    return { error: t("errors.missingProduct") };
  }

  const userId = await userIdAfterAuth(`/products/${productId}`);
  try {
    await addToCart(userId, productId, quantity);
    revalidateCartSurfaces();
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : t("errors.addToCart");
    return { error: message };
  }
}

export async function updateCartQuantityAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const { t } = await getTranslations();
  const productId = String(formData.get("productId") ?? "");
  const rawQty = Number(formData.get("quantity") ?? 0);
  const quantity = Number.isFinite(rawQty) ? Math.floor(rawQty) : 0;

  if (!productId) {
    return { error: t("errors.missingProduct") };
  }

  const userId = await userIdAfterAuth("/cart");
  try {
    await setCartQuantity(userId, productId, quantity);
    revalidateCartSurfaces();
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : t("errors.updateCart");
    return { error: message };
  }
}

export async function removeFromCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const { t } = await getTranslations();
  const productId = String(formData.get("productId") ?? "");
  if (!productId) {
    return { error: t("errors.missingProduct") };
  }

  const userId = await userIdAfterAuth("/cart");
  try {
    await removeFromCart(userId, productId);
    revalidateCartSurfaces();
    return { ok: true as const };
  } catch (e) {
    const message = e instanceof Error ? e.message : t("errors.removeFromCart");
    return { error: message };
  }
}
