import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "@/lib/i18n/translator";
import { fulfillPaidCheckout, getOrderByCheckoutSessionId } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { requireSession } from "@/lib/session";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getAppUserIdForSession } from "@/lib/users";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const session = await requireSession("/cart");
  const { t } = await getTranslations();
  const userId = await getAppUserIdForSession(session);
  if (!userId) {
    throw new Error("Could not resolve app user");
  }

  const { session_id: sessionId } = await searchParams;
  if (!sessionId) {
    redirect("/cart");
  }

  if (!isStripeConfigured()) {
    notFound();
  }

  let order = await getOrderByCheckoutSessionId(sessionId);

  if (!order) {
    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      checkoutSession.payment_status !== "paid" ||
      checkoutSession.metadata?.userId !== userId
    ) {
      notFound();
    }

    order = await fulfillPaidCheckout(userId, sessionId);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">
        {t("checkout.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {t("checkout.thankYou")}
      </h1>
      <p className="mt-4 text-muted">
        {t("checkout.paidTotal", { total: formatPrice(order.subtotal) })}
      </p>

      <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 px-6 py-4 text-sm"
          >
            <span>
              {item.productName}{" "}
              <span className="text-muted">× {item.quantity}</span>
            </span>
            <span className="tabular-nums font-medium">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          href="/orders"
          className="inline-block rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground"
        >
          {t("checkout.viewOrders")}
        </Link>
        <Link
          href="/#products"
          className="inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    </div>
  );
}
