import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Boatel — Any boat, anytime",
    template: "%s · Boatel",
  },
  description:
    "Discover floating villas, yacht suites, and boutique boatels. Sail, stay, or explore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <Providers>
          <div className="page-shell">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
