import { intlLocale } from "@/lib/i18n/config";
import {
  formatOrderDate,
  orderStatusClass,
  orderStatusLabel,
} from "@/lib/i18n/order-status";
import { getTranslations } from "@/lib/i18n/translator";
import { listOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase-server";

export default async function AdminOrdersPage() {
  const { t, locale } = await getTranslations();
  const dateLocale = intlLocale(locale);

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("orders.title")}
        </h1>
        <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-muted">
          {t("orders.supabaseMissing")}
        </p>
      </div>
    );
  }

  const orders = await listOrders();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("orders.title")}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {t("orders.intro")} {t("orders.hintCount", { count: String(orders.length) })}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-surface px-6 py-12 text-center text-sm text-muted">
          {t("orders.empty")}
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {orders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {formatOrderDate(
                      order.paidAt ?? order.createdAt,
                      dateLocale,
                    )}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    {t("orders.orderPrefix")} #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-muted">
                    {order.customerName ? (
                      <>
                        <span className="text-foreground">
                          {order.customerName}
                        </span>
                        <span className="mx-1">·</span>
                      </>
                    ) : null}
                    {order.customerEmail}
                  </p>
                  <p
                    className="truncate font-mono text-xs text-muted"
                    title={order.stripeCheckoutSessionId}
                  >
                    {t("orders.stripePrefix")}: {order.stripeCheckoutSessionId}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${orderStatusClass(order.status)}`}
                  >
                    {orderStatusLabel(order.status, t)}
                  </span>
                  <span className="text-lg font-semibold tabular-nums text-foreground">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <span className="min-w-0 text-foreground">
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
    </div>
  );
}
