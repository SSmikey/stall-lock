'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Hide navbar and footer on login and register pages
    const isAuthPage = pathname === '/login' || pathname === '/register';

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <>
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
        </>
    );
}
