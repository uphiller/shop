import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { shopOrigin } from "@/lib/hosts";
import { getTranslations } from "@/lib/i18n/translator";
import { requireAdmin } from "@/lib/require-admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const { t, locale } = await getTranslations();

  const adminNav = [
    { href: "/", label: t("nav.dashboard") },
    { href: "/products", label: t("nav.products") },
    { href: "/orders", label: t("nav.orders") },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface px-4 py-8 sm:block">
        <Link
          href="/"
          className="block text-sm font-semibold tracking-tight text-foreground"
        >
          Atelier Admin
        </Link>
        <p className="mt-1 text-xs text-muted">{t("nav.consoleSubtitle")}</p>
        <nav className="mt-8 space-y-1">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LocaleSwitcher
          currentLocale={locale}
          label={t("locale.label")}
          className="mt-6"
        />
        <a
          href={shopOrigin()}
          className="mt-8 inline-block text-xs text-accent hover:underline"
        >
          {t("nav.backToShop")}
        </a>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
