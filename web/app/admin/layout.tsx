import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Fraunces, JetBrains_Mono, Manrope, Noto_Nastaliq_Urdu } from "next/font/google";
import "./admin.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const nastaliq = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: ["500"], variable: "--font-nastaliq", preload: false });

export const metadata: Metadata = {
  title: { default: "Aabshar admin", template: "%s · Aabshar admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/img/logo-mark.svg" },
};

export const viewport: Viewport = { themeColor: "#0d1117" };

// Every admin screen reads the session at request time, so navigations wait on the server.
export const instant = false;

/** Root layout for /admin (the shop has its own under app/[lang]). English only. */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={[fraunces.variable, manrope.variable, jetbrains.variable, nastaliq.variable].join(" ")}>
      <body className="adm">
        <Suspense fallback={<div className="main-fallback muted">Loading…</div>}>{children}</Suspense>
      </body>
    </html>
  );
}
