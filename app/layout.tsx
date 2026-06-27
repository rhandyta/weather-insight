import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// ── Read from env vars ──────────────────────────────────────────
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "CuacaKini";
const SITE_TAGLINE = process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Prakiraan Cuaca Indonesia";
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
  "Prakiraan cuaca terkini untuk seluruh kelurahan dan desa di Indonesia. Data cuaca 3 harian dengan pembaruan setiap 3 jam dari BMKG.";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cuacakini.id";
const SITE_LOCALE = process.env.NEXT_PUBLIC_SITE_LOCALE ?? "id_ID";
const SEO_KEYWORDS = process.env.NEXT_PUBLIC_SEO_KEYWORDS ?? "";
const SEO_AUTHOR = process.env.NEXT_PUBLIC_SEO_AUTHOR ?? SITE_NAME;
const TWITTER_HANDLE = process.env.NEXT_PUBLIC_SEO_TWITTER_HANDLE ?? "";
const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

const siteTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1120",
};

export const metadata: Metadata = {
  title: {
    default: siteTitle,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: SEO_KEYWORDS ? SEO_KEYWORDS.split(",").map((k) => k.trim()) : undefined,
  authors: [{ name: "BMKG", url: "https://www.bmkg.go.id" }, { name: SEO_AUTHOR }],
  creator: SEO_AUTHOR,
  publisher: SEO_AUTHOR,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  ...(GOOGLE_VERIFICATION && {
    verification: { google: GOOGLE_VERIFICATION },
  }),
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: siteTitle,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: SITE_DESCRIPTION,
    ...(TWITTER_HANDLE && { site: TWITTER_HANDLE, creator: TWITTER_HANDLE }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
