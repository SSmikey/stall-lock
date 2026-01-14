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
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
          <div className="container">
            <a className="navbar-brand fw-bold text-primary" href="/">MARKET LOCK</a>
            <div className="d-flex gap-3">
              <a href="/market" className="nav-link">ตลาด</a>
              <a href="/bookings" className="nav-link">การจองของฉัน</a>
              <a href="/admin" className="nav-link text-danger fw-bold">ADMIN</a>
            </div>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
