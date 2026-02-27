import { getRequestConfig } from "next-intl/server";

import { getLocaleFromRequest, getMessagesForLocale } from "@/i18n";

export default getRequestConfig(async () => {
  const locale = await getLocaleFromRequest();

  return {
    locale,
    messages: getMessagesForLocale(locale),
  };
});
