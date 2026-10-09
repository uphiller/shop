import Link from "next/link";
import { AuthButtons } from "@/components/auth-buttons";
import { CartNavLink } from "@/components/cart-nav-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "@/lib/i18n/translator";

export async function SiteHeader() {
  const { t, locale } = await getTranslations();

  const nav = [
    { href: "/#products", label: t("nav.shop") },
    { href: "/#categories", label: t("nav.categories") },
    { href: "/#about", label: t("nav.about") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          Atelier<span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher
            currentLocale={locale}
            label={t("locale.label")}
            className="hidden sm:block"
          />
          <button
            type="button"
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
            aria-label={t("nav.searchAria")}
          >
            {t("nav.search")}
          </button>
          <AuthButtons />
          <CartNavLink />
        </div>
      </div>
    </header>
  );
}
