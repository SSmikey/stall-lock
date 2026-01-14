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

import Navbar from "@/components/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={notoSansThai.className}>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 140px)' }}>
          {children}
        </main>
        <footer className="py-4 bg-light border-top mt-5">
          <div className="container text-center">
            <p className="mb-0 text-muted small">© 2026 ระบบจองล็อคตลาด. สงวนลิขสิทธิ์.</p>
            <div className="mt-2">
              <span className="text-muted small">ช่วยเหลือ: 02-123-4567</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
