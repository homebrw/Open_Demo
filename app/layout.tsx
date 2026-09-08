import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Nav from "./components/Nav";
import NavV2 from "./ui/v2/NavV2";
import { UiVersionProvider } from "./version/UiVersionProvider";
import { UI_VERSION_COOKIE, parseUiVersion } from "@/lib/uiVersion";
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

export const metadata: Metadata = {
  title: "Explorateur de logits",
  description:
    "Visualisez l'arbre de probabilités des tokens d'un modèle de langage, et comparez l'effet des paramètres de génération.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `cookies()` is async-only in Next 16. Reading it opts these routes into
  // dynamic rendering, which costs nothing here: both pages are client
  // components that fetch from route handlers anyway.
  const version = parseUiVersion((await cookies()).get(UI_VERSION_COOKIE)?.value);

  return (
    <html
      lang="fr"
      data-ui={version}
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UiVersionProvider value={version}>
          {version === "v2" ? <NavV2 /> : <Nav />}
          {children}
        </UiVersionProvider>
      </body>
    </html>
  );
}
