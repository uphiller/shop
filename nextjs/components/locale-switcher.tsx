"use client";

import { usePathname } from "next/navigation";
import { setLocaleAction } from "@/app/actions/locale";
import { localeLabels, locales, type Locale } from "@/lib/i18n/config";

type LocaleSwitcherProps = {
  currentLocale: Locale;
  label: string;
  className?: string;
};

export function LocaleSwitcher({
  currentLocale,
  label,
  className = "",
}: LocaleSwitcherProps) {
  const pathname = usePathname();

  return (
    <form action={setLocaleAction} className={className}>
      <input type="hidden" name="returnTo" value={pathname || "/"} />
      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="sr-only">{label}</span>
        <select
          name="locale"
          defaultValue={currentLocale}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/30"
          aria-label={label}
        >
          {locales.map((locale) => (
            <option key={locale} value={locale}>
              {localeLabels[locale]}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
