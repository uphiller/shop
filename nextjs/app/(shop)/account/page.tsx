import Link from "next/link";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/translator";

export default async function AccountPage() {
  const session = await auth();
  const { t } = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">
        {t("account.eyebrow")}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
        {t("account.title")}
      </h1>
      <dl className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 text-sm">
        <div>
          <dt className="text-muted">{t("account.name")}</dt>
          <dd className="mt-1 font-medium text-foreground">
            {session?.user?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{t("account.email")}</dt>
          <dd className="mt-1 font-medium text-foreground">
            {session?.user?.email ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">{t("account.subject")}</dt>
          <dd className="mt-1 break-all font-mono text-xs text-foreground">
            {session?.user?.id ?? "—"}
          </dd>
        </div>
      </dl>
      <Link
        href="/orders"
        className="mt-8 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background"
      >
        {t("account.viewOrders")}
      </Link>
      <Link
        href="/"
        className="mt-4 inline-block text-sm text-accent hover:underline"
      >
        {t("account.back")}
      </Link>
    </div>
  );
}
