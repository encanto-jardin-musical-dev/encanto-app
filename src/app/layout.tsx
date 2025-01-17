import type { Metadata } from "next";
import { Asap } from "next/font/google";
import "@/styles/globals.css";
import { Providers } from "./providers";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const asap = Asap({
  weight: ["100", "300", "400", "700", "900"],
  variable: "--font-asap",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Encanto - App",
  description: "Aplicación para la comunicación con la comunidad educativa",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className="encanto">
      <body className={`${asap.variable} antialiased`}>
        <Providers>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
