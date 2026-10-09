import Link from "next/link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "@/lib/i18n/translator";

export async function SiteFooter() {
  const { t, locale } = await getTranslations();
  const year = String(new Date().getFullYear());

  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold">
            Atelier<span className="text-accent">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {t("footer.blurb")}
          </p>
          <LocaleSwitcher
            currentLocale={locale}
            label={t("locale.label")}
            className="mt-4 sm:hidden"
          />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.help")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="#" className="hover:text-foreground">
                {t("footer.shipping")}
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-foreground">
                {t("footer.returns")}
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-foreground">
                {t("footer.contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">{t("footer.newsletter")}</p>
          <p className="mt-3 text-sm text-muted">{t("footer.newsletterBody")}</p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted">
        {t("footer.copyright", { year })}
      </div>
    </footer>
  );
}
