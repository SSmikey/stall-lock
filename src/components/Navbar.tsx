'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navLinks = [
        { name: 'หน้าแรก', href: '/', icon: '🏠' },
        { name: 'ตลาด', href: '/market', icon: '🏪' },
        { name: 'การจองของฉัน', href: '/bookings', icon: '📋' },
    ];

    return (
        <>
            {/* Desktop & Mobile Top Navbar */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top" style={{ boxShadow: 'var(--shadow-sm)' }}>
                <div className="container">
                    <Link href="/" className="navbar-brand fw-bold text-gradient fs-4 d-flex align-items-center gap-2">
                        <span className="d-inline-block" style={{ fontSize: '1.5rem' }}>🔒</span>
                        <span className="d-none d-sm-inline">STALL LOCK</span>
                        <span className="d-inline d-sm-none">SL</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="d-none d-lg-flex navbar-nav ms-auto gap-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`nav-link px-4 py-2 rounded-pill fw-medium smooth ${
                                    pathname === link.href
                                        ? 'bg-primary text-white'
                                        : 'text-dark hover-shadow'
                                }`}
                                style={{
                                    ...(pathname === link.href && {
                                        boxShadow: 'var(--shadow-md)'
                                    })
                                }}
                            >
                                <span className="me-2">{link.icon}</span>
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            href="/admin"
                            className={`nav-link px-4 py-2 rounded-pill ms-2 fw-bold smooth ${
                                pathname === '/admin'
                                    ? 'bg-danger text-white'
                                    : 'text-danger'
                            }`}
                            style={{
                                border: pathname === '/admin' ? 'none' : '2px solid var(--danger)',
                                ...(pathname === '/admin' && {
                                    boxShadow: 'var(--shadow-md)'
                                })
                            }}
                        >
                            👤 ADMIN
                        </Link>
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button
                        className="btn btn-light d-lg-none border-0 tap-target"
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Toggle navigation"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M3 12h18M3 6h18M3 18h18" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="w-100 d-lg-none border-top"
                            style={{ overflow: 'hidden', background: 'white' }}
                        >
                            <div className="container py-3">
                                <div className="d-flex flex-column gap-2">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={`btn btn-lg text-start ps-4 ${
                                                pathname === link.href
                                                    ? 'btn-primary'
                                                    : 'btn-light'
                                            }`}
                                            onClick={() => setIsOpen(false)}
                                            style={{ borderRadius: 'var(--radius-md)' }}
                                        >
                                            <span className="me-3 fs-5">{link.icon}</span>
                                            {link.name}
                                        </Link>
                                    ))}
                                    <Link
                                        href="/admin"
                                        className={`btn btn-lg text-start ps-4 ${
                                            pathname === '/admin'
                                                ? 'btn-danger'
                                                : 'btn-outline-danger'
                                        }`}
                                        onClick={() => setIsOpen(false)}
                                        style={{ borderRadius: 'var(--radius-md)' }}
                                    >
                                        <span className="me-3 fs-5">👤</span>
                                        ADMIN
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Bottom Navigation for Mobile */}
            <div className="bottom-nav d-lg-none safe-bottom">
                <div className="d-flex justify-content-around align-items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`d-flex flex-column align-items-center gap-1 text-decoration-none smooth tap-target px-3 ${
                                pathname === link.href ? 'text-primary' : 'text-muted'
                            }`}
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: pathname === link.href ? 700 : 500,
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>
                                {link.icon}
                            </span>
                            <span>{link.name.split('ของ')[0]}</span>
                            {pathname === link.href && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="position-absolute"
                                    style={{
                                        bottom: 0,
                                        width: '40px',
                                        height: '3px',
                                        background: 'var(--primary)',
                                        borderRadius: '3px 3px 0 0',
                                    }}
                                />
                            )}
                        </Link>
                    ))}
                    <Link
                        href="/admin"
                        className={`d-flex flex-column align-items-center gap-1 text-decoration-none smooth tap-target px-3 ${
                            pathname === '/admin' ? 'text-danger' : 'text-muted'
                        }`}
                        style={{
                            fontSize: '0.75rem',
                            fontWeight: pathname === '/admin' ? 700 : 500,
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>👤</span>
                        <span>Admin</span>
                        {pathname === '/admin' && (
                            <motion.div
                                layoutId="activeTab"
                                className="position-absolute"
                                style={{
                                    bottom: 0,
                                    width: '40px',
                                    height: '3px',
                                    background: 'var(--danger)',
                                    borderRadius: '3px 3px 0 0',
                                }}
                            />
                        )}
                    </Link>
                </div>
            </div>
        </>
    );
}
