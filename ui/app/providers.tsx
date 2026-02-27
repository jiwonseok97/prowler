"use client";

// Import Sentry client-side initialization
import "@/app/instrumentation.client";

import { HeroUIProvider } from "@heroui/system";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";
import * as React from "react";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  locale?: string;
  messages?: Record<string, unknown>;
}

export function Providers({
  children,
  themeProps,
  locale = "ko",
  messages,
}: ProvidersProps) {
  const router = useRouter();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>
        <HeroUIProvider navigate={router.push}>
          <NextThemesProvider {...themeProps}>{children}</NextThemesProvider>
        </HeroUIProvider>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
