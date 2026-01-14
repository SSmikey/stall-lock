import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import ConditionalLayout from "@/components/ConditionalLayout";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ระบบจองล็อคตลาด",
  description: "ระบบจองล็อคขายของในตลาด",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={notoSansThai.className}>
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}
