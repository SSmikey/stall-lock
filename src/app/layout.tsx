import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';

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
      <body className={notoSansThai.className}>
        {children}
      </body>
    </html>
  );
}
