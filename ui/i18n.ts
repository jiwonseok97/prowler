import type { AbstractIntlMessages } from "next-intl";
import { cookies, headers } from "next/headers";
import {
  detectLocaleFromHeader,
  getMessagesForLocale,
  isLocale,
  LOCALE_COOKIE,
  type AppLocale,
} from "@/i18n/shared";

export type { AppLocale } from "@/i18n/shared";
export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALES,
  isLocale,
  detectLocaleFromHeader,
  getMessagesForLocale,
} from "@/i18n/shared";

export const getLocaleFromRequest = async (): Promise<AppLocale> => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;
  return detectLocaleFromHeader(headerStore.get("accept-language"));
};

export type Messages = AbstractIntlMessages;
