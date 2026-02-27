import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth.config";
import {
  DEFAULT_LOCALE,
  detectLocaleFromHeader,
  isLocale,
  LOCALE_COOKIE,
} from "@/i18n/shared";

const publicRoutes = [
  "/sign-in",
  "/sign-up",
  // In Cloud uncomment the following lines:
  // "/reset-password",
  // "/email-verification",
  // "/set-password",
];

const isPublicRoute = (pathname: string): boolean => {
  return publicRoutes.some((route) => pathname.startsWith(route));
};

// NextAuth's auth() wrapper - renamed from middleware to proxy
export default auth((req: NextRequest & { auth: any }) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const sessionError = req.auth?.error;

  const ensureLocaleCookie = (response: NextResponse) => {
    const current = req.cookies.get(LOCALE_COOKIE)?.value;
    if (!isLocale(current)) {
      response.cookies.set(
        LOCALE_COOKIE,
        detectLocaleFromHeader(req.headers.get("accept-language")) ||
          DEFAULT_LOCALE,
        {
          path: "/",
          sameSite: "lax",
          httpOnly: false,
        },
      );
    }
    return response;
  };

  // If there's a session error (e.g., RefreshAccessTokenError), redirect to login with error info
  if (sessionError && !isPublicRoute(pathname)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("error", sessionError);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return ensureLocaleCookie(NextResponse.redirect(signInUrl));
  }

  if (!user && !isPublicRoute(pathname)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return ensureLocaleCookie(NextResponse.redirect(signInUrl));
  }

  if (user?.permissions) {
    const permissions = user.permissions;

    if (pathname.startsWith("/billing") && !permissions.manage_billing) {
      return ensureLocaleCookie(
        NextResponse.redirect(new URL("/profile", req.url)),
      );
    }

    if (
      pathname.startsWith("/integrations") &&
      !permissions.manage_integrations
    ) {
      return ensureLocaleCookie(
        NextResponse.redirect(new URL("/profile", req.url)),
      );
    }
  }

  return ensureLocaleCookie(NextResponse.next());
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - *.png, *.jpg, *.jpeg, *.svg, *.ico (image files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|css|js)$).*)",
  ],
};
