"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { getCartLines } from "@/lib/cart";
import { getTranslations } from "@/lib/i18n/translator";
import { appOrigin, getStripe, isStripeConfigured } from "@/lib/stripe";
import { requireSession } from "@/lib/session";
import { getAppUserIdForSession } from "@/lib/users";

export type CheckoutActionState = { error?: string } | null;

export async function startCheckoutAction(
  prev: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  void prev;
  void formData;

  const { t } = await getTranslations();

  if (!isStripeConfigured()) {
    return { error: t("errors.stripeNotConfigured") };
  }

  const session = await requireSession("/cart");
  const userId = await getAppUserIdForSession(session);
  if (!userId) {
    return { error: t("errors.resolveUser") };
  }

  const lines = await getCartLines(userId);
  if (lines.length === 0) {
    return { error: t("errors.cartEmpty") };
  }

  const origin = appOrigin();
  const stripe = getStripe();

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user?.email ?? undefined,
      line_items: lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: "krw",
          unit_amount: line.product.price,
          product_data: {
            name: line.product.name,
            images: [line.product.imageUrl],
          },
        },
      })),
      metadata: {
        userId,
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    if (!checkoutSession.url) {
      return { error: t("errors.checkoutStart") };
    }

    redirect(checkoutSession.url);
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }
    const message = e instanceof Error ? e.message : t("errors.checkoutStart");
    return { error: message };
  }
}
