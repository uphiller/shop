import type { Locale } from "@/lib/i18n/config";
import { en } from "@/lib/i18n/messages/en";
import { ja } from "@/lib/i18n/messages/ja";
import { ko } from "@/lib/i18n/messages/ko";

export const messages: Record<Locale, typeof ko> = {
  ko,
  ja,
  en,
};
