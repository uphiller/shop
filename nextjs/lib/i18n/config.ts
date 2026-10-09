export const locales = ["ko", "ja", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export const localeCookieName = "locale";

export const localeLabels: Record<Locale, string> = {
  ko: "한국어",
  ja: "日本語",
  en: "English",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function intlLocale(locale: Locale): string {
  switch (locale) {
    case "ko":
      return "ko-KR";
    case "ja":
      return "ja-JP";
    case "en":
      return "en-US";
  }
}
