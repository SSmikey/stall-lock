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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={notoSansThai.className}>
        <Navbar />
        <main style={{
          minHeight: 'calc(100vh - 140px)',
          paddingBottom: '80px', // Space for bottom nav on mobile
        }}>
          {children}
        </main>
        <footer className="py-4 bg-white border-top mt-5 d-none d-lg-block" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="container text-center">
            <p className="mb-2 fw-semibold text-gradient">ระบบจองล็อคตลาด</p>
            <p className="mb-0 text-muted small">© 2026 สงวนลิขสิทธิ์ทุกประการ</p>
            <div className="mt-3 d-flex justify-content-center gap-4">
              <a href="tel:021234567" className="text-decoration-none text-muted small">
                📞 02-123-4567
              </a>
              <a href="mailto:support@stalllock.com" className="text-decoration-none text-muted small">
                ✉️ support@stalllock.com
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
