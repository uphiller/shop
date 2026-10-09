import type { Translator } from "@/lib/i18n/translator";
import type { OrderStatus } from "@/types/order";

export function orderStatusLabel(
  status: OrderStatus,
  t: Translator,
): string {
  switch (status) {
    case "paid":
      return t("orders.statusPaid");
    case "pending":
      return t("orders.statusPending");
    case "cancelled":
      return t("orders.statusCancelled");
    case "failed":
      return t("orders.statusFailed");
    default:
      return status;
  }
}

export function formatOrderDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
