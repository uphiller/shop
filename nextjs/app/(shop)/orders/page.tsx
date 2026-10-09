import Link from "next/link";
import { intlLocale } from "@/lib/i18n/config";
import {
  formatOrderDate,
  orderStatusLabel,
} from "@/lib/i18n/order-status";
import { getTranslations } from "@/lib/i18n/translator";
import { getOrdersForUser } from "@/lib/orders";
import { isDatabaseUrlConfigured } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { requireSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { getAppUserIdForSession } from "@/lib/users";

function statusClass(status: string): string {
  switch (status) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "pending":
      return "bg-amber-500/10 text-amber-800 dark:text-amber-300";
    case "cancelled":
    case "failed":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "bg-border/50 text-muted";
  }
}

export default async function OrdersPage() {
  const session = await requireSession("/orders");
  const { t, locale } = await getTranslations();
  const userId = await getAppUserIdForSession(session);
  if (!userId) {
    throw new Error("Could not resolve app user");
  }

  const ordersConfigured = isSupabaseConfigured() || isDatabaseUrlConfigured();
  const orders = ordersConfigured ? await getOrdersForUser(userId) : [];
  const dateLocale = intlLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">
        {t("orders.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("orders.title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("orders.hint")}</p>

      {!ordersConfigured ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          {t("orders.unavailable")}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-muted">{t("orders.empty")}</p>
          <Link
            href="/#products"
            className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
          >
            {t("orders.startShopping")}
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {orders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {formatOrderDate(order.paidAt ?? order.createdAt, dateLocale)}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    #{order.id.slice(0, 8)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(order.status)}`}
                  >
                    {orderStatusLabel(order.status, t)}
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-6 py-3 text-sm"
                  >
                    <span>
                      {item.productName}{" "}
                      <span className="text-muted">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 tabular-nums font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <Link href="/account" className="text-accent hover:underline">
          {t("nav.account")}
        </Link>
        <Link href="/" className="text-accent hover:underline">
          {t("orders.back")}
        </Link>
      </div>
    </div>
  );
}
