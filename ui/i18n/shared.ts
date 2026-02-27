import type { AbstractIntlMessages } from "next-intl";

import en from "@/messages/en.json";
import ko from "@/messages/ko.json";

export const LOCALES = ["ko", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "ko";
export const LOCALE_COOKIE = "NEXT_LOCALE";

const MESSAGES: Record<AppLocale, AbstractIntlMessages> = { ko, en };

export const isLocale = (value?: string | null): value is AppLocale =>
  !!value && (LOCALES as readonly string[]).includes(value);

export const detectLocaleFromHeader = (
  acceptLanguage?: string | null,
): AppLocale => {
  const raw = (acceptLanguage || "").toLowerCase();
  if (raw.includes("ko")) return "ko";
  if (raw.includes("en")) return "en";
  return DEFAULT_LOCALE;
};

export const getMessagesForLocale = (locale: AppLocale): AbstractIntlMessages =>
  MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];
