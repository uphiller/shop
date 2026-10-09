import Link from "next/link";
import { getOrderCount } from "@/lib/orders";
import { getProductCount } from "@/lib/products";
import { getTranslations } from "@/lib/i18n/translator";
import { isSupabaseConfigured } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminDashboardPage() {
  const session = await requireAdmin();
  const { t } = await getTranslations();
  const supabaseReady = isSupabaseConfigured();
  const productCount = supabaseReady ? await getProductCount() : null;
  const orderCount = supabaseReady ? await getOrderCount() : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">
        {t("dashboard.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {t("dashboard.title")}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {t("dashboard.signedInAs", { email: session.user.email })}
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("dashboard.products")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {productCount ?? "—"}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            {t("dashboard.manageProducts")}
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("dashboard.orders")}
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {orderCount ?? "—"}
          </p>
          <Link
            href="/orders"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            {t("dashboard.manageOrders")}
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {t("dashboard.settings")}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t("dashboard.settingsBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
