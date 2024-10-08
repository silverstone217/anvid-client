import type { Metadata } from "next";
import "./globals.css";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anvid - best video anonym and chat application",
  description: "Let's get fun on the best video anonym and chat application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.className} antialiased scroll-smooth max-w-6xl mx-auto`}
      >
        {children}
      </body>
    </html>
  );
}
