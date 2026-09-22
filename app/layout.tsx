import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Nav from "./components/Nav";
import NavV2 from "./ui/v2/NavV2";
import { UiVersionProvider } from "./version/UiVersionProvider";
import { UI_VERSION_COOKIE, parseUiVersion } from "@/lib/uiVersion";
import { LocaleProvider } from "./locale/LocaleProvider";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const { title, description } = translations[locale].metadata;
  return { title, description };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `cookies()` is async-only in Next 16. Reading it opts these routes into
  // dynamic rendering, which costs nothing here: both pages are client
  // components that fetch from route handlers anyway.
  const cookieStore = await cookies();
  const version = parseUiVersion(cookieStore.get(UI_VERSION_COOKIE)?.value);
  const locale = parseLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html
      lang={locale}
      data-ui={version}
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider value={locale}>
          <UiVersionProvider value={version}>
            {version === "v2" ? <NavV2 /> : <Nav />}
            {children}
          </UiVersionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
