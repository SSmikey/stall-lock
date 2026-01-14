'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { name: 'หน้าแรก', href: '/' },
        { name: 'ตลาด', href: '/market' },
        { name: 'การจองของฉัน', href: '/bookings' },
    ];

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-3">
            <div className="container">
                <Link href="/" className="navbar-brand fw-bold text-primary fs-4">
                    MARKET LOCK
                </Link>
                <button
                    className="navbar-toggler border-0 shadow-none"
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`}>
                    <div className="navbar-nav ms-auto gap-2 mt-3 mt-lg-0">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link px-3 rounded-pill ${pathname === link.href ? 'bg-primary text-white active' : 'text-dark'}`}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            href="/admin"
                            className={`nav-link px-3 rounded-pill ms-lg-2 ${pathname === '/admin' ? 'bg-danger text-white' : 'text-danger fw-bold hover-bg-light'}`}
                            onClick={() => setIsOpen(false)}
                            style={{ border: '1px solid transparent' }}
                        >
                            ADMIN
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
