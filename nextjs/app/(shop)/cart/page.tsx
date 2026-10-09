import Image from "next/image";
import Link from "next/link";
import { CartLineControls } from "@/components/cart-line-controls";
import { CheckoutButton } from "@/components/checkout-button";
import { cartSubtotal, getCartLines } from "@/lib/cart";
import { isDatabaseUrlConfigured } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/translator";
import { formatPrice } from "@/lib/products";
import { requireSession } from "@/lib/session";
import { isStripeConfigured } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { getAppUserIdForSession } from "@/lib/users";

export default async function CartPage() {
  const session = await requireSession("/cart");
  const { t } = await getTranslations();
  const userId = await getAppUserIdForSession(session);
  if (!userId) {
    throw new Error("Could not resolve app user");
  }

  const lines = await getCartLines(userId);
  const subtotal = cartSubtotal(lines);
  const checkoutReady =
    isStripeConfigured() &&
    (isSupabaseConfigured() || isDatabaseUrlConfigured());
  const checkoutDisabledReason = !isStripeConfigured()
    ? t("cart.stripeDisabled")
    : !checkoutReady
      ? t("cart.dbDisabled")
      : undefined;

  const controlLabels = {
    quantity: t("cartControls.quantity"),
    update: t("cartControls.update"),
    remove: t("cartControls.remove"),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">
        {t("cart.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("cart.title")}</h1>

      {lines.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-muted">{t("cart.empty")}</p>
          <Link
            href="/#products"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            {t("cart.continueShopping")}
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
            {lines.map((line) => (
              <li
                key={line.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6"
              >
                <Link
                  href={`/products/${line.product.id}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-border/30"
                >
                  <Image
                    src={line.product.imageUrl}
                    alt={line.product.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${line.product.id}`}
                    className="font-semibold hover:text-accent"
                  >
                    {line.product.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{line.product.category}</p>
                  <p className="mt-2 font-semibold tabular-nums">
                    {formatPrice(line.product.price)}
                  </p>
                </div>
                <CartLineControls
                  productId={line.product.id}
                  quantity={line.quantity}
                  labels={controlLabels}
                />
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-end gap-4 border-t border-border pt-6">
            <p className="text-lg">
              {t("cart.subtotal")}{" "}
              <span className="font-semibold tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </p>
            <CheckoutButton
              disabled={!checkoutReady}
              disabledReason={checkoutDisabledReason}
              labels={{
                payWithCard: t("checkout.payWithCard"),
                redirecting: t("checkout.redirecting"),
              }}
            />
            <Link
              href="/#products"
              className="text-sm text-accent hover:underline"
            >
              {t("cart.continueShopping")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
