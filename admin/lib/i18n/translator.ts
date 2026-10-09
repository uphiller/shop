import { getLocale } from "@/lib/i18n/get-locale";
import { messages } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/config";

export type Translator = (key: string, params?: Record<string, string>) => string;

function resolveMessage(dict: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof cur === "string" ? cur : key;
}

export function createTranslator(locale: Locale): Translator {
  const dict = messages[locale] as Record<string, unknown>;
  return (key, params) => {
    let text = resolveMessage(dict, key);
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, value);
      }
    }
    return text;
  };
}

export async function getTranslations(): Promise<{
  t: Translator;
  locale: Locale;
}> {
  const locale = await getLocale();
  return { t: createTranslator(locale), locale };
}
