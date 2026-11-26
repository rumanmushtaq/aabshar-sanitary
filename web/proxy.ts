import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, LANG_COOKIE, LOCALES, hasLang } from "@/lib/i18n/config";

/** Sends paths without a language to the saved language, or Urdu when the browser prefers it. */
function pickLang(req: NextRequest): string {
  const saved = req.cookies.get(LANG_COOKIE)?.value;
  if (saved && hasLang(saved)) return saved;
  const accept = req.headers.get("accept-language") ?? "";
  return /(^|,)\s*ur\b/i.test(accept) ? "ur" : DEFAULT_LANG;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLang(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, the admin panel, API routes, images and files with an extension.
  matcher: ["/((?!_next|admin|api|img|favicon.ico|.*\\..*).*)"],
};
