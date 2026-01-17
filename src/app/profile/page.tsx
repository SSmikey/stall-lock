'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface UserProfile {
    id: string;
    username: string;
    phone: string;
    role: 'USER' | 'ADMIN';
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch('/api/auth/me');

            if (!response.ok) {
                router.push('/login');
                return;
            }

            const data = await response.json();
            setUser(data.data.user);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (err) {
            setError('ไม่สามารถออกจากระบบได้');
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="spinner-border text-brand" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="card border-0 shadow-lg rounded-4 p-5 text-center">
                    <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>⚠️</div>
                    <h5 className="text-danger fw-bold">{error}</h5>
                    <Link href="/login" className="btn btn-primary rounded-pill mt-3 px-4">
                        ไปหน้าเข้าสู่ระบบ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-light min-vh-100">
            {/* Hero Section */}
            <div className="home-hero pt-5 pb-5 mb-5" style={{ borderRadius: '0 0 50px 50px' }}>
                <div className="hero-circle" style={{ width: '400px', height: '400px', top: '-100px', right: '-100px', opacity: 0.2 }}></div>
                <div className="container position-relative z-1 text-center">
                    <h1 className="fw-bold mb-1 text-white">โปรไฟล์ของฉัน</h1>
                    <p className="lead mb-0 fw-normal text-white opacity-75">จัดการข้อมูลส่วนตัวและดูสิทธิการใช้งาน</p>
                </div>
            </div>

            <div className="container pb-5" style={{ marginTop: '-5rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="row justify-content-center"
                >
                    <div className="col-lg-6 col-md-8">
                        <div className="card border-0 shadow-lg overflow-hidden position-relative" style={{ borderRadius: 'var(--brand-radius)' }}>
                            {/* Decorative Top Bar */}
                            <div className="position-absolute top-0 start-0 w-100 bg-brand-gradient-subtle" style={{ height: '6px' }}></div>

                            <div className="card-body p-5">
                                <div className="text-center mb-4 position-relative">
                                    <div className="position-relative d-inline-block">
                                        <div className="bg-light rounded-circle shadow-sm p-4 d-inline-block mb-3 border border-3 border-white position-relative z-1">
                                            <span style={{ fontSize: '4rem' }}>
                                                {user?.role === 'ADMIN' ? '👑' : '🧑‍💻'}
                                            </span>
                                        </div>
                                        {/* Status Indicator */}
                                        <span className="position-absolute bottom-0 end-0 p-2 bg-success border border-2 border-white rounded-circle z-2" title="Online"></span>
                                    </div>

                                    <h3 className="fw-bold mb-1 text-dark">{user?.username}</h3>
                                    <div className="mb-3">
                                        <span className={`badge rounded-pill px-3 py-2 fw-normal ${user?.role === 'ADMIN' ? 'bg-danger bg-opacity-10 text-danger border border-danger' : 'bg-primary bg-opacity-10 text-primary border border-primary'
                                            }`}>
                                            {user?.role === 'ADMIN' ? '🛡️ ผู้ดูแลระบบ (Admin)' : '👤 ผู้ใช้งานทั่วไป (User)'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-light rounded-4 p-4 mb-4 border border-light">
                                    <div className="d-flex align-items-center mb-3 pb-3 border-bottom border-light">
                                        <div className="bg-white rounded-circle p-2 shadow-sm me-3 text-center" style={{ width: '45px', height: '45px' }}>
                                            <span className="fs-5">📧</span>
                                        </div>
                                        <div>
                                            <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>ACCOUNT</div>
                                            <div className="fw-semibold text-dark">@{user?.username}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div className="bg-white rounded-circle p-2 shadow-sm me-3 text-center" style={{ width: '45px', height: '45px' }}>
                                            <span className="fs-5">📱</span>
                                        </div>
                                        <div>
                                            <div className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>PHONE NUMBER</div>
                                            <div className="fw-semibold text-dark">{user?.phone || '-'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="d-grid gap-2">
                                    {user?.role === 'ADMIN' ? (
                                        <Link
                                            href="/admin"
                                            className="btn btn-primary-custom py-3 rounded-pill fw-bold shadow-sm"
                                        >
                                            📊 เข้าสู่ระบบหลังบ้าน
                                        </Link>
                                    ) : (
                                        <div className="row g-2">
                                            <div className="col-6">
                                                <Link
                                                    href="/bookings"
                                                    className="btn btn-outline-primary w-100 py-3 rounded-pill fw-bold"
                                                >
                                                    📋 การจองของฉัน
                                                </Link>
                                            </div>
                                            <div className="col-6">
                                                <Link
                                                    href="/market"
                                                    className="btn btn-outline-warning text-dark w-100 py-3 rounded-pill fw-bold"
                                                >
                                                    🏪 ดูตลาด
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="btn btn-light text-danger py-3 rounded-pill fw-bold mt-2 hover-bg-danger-subtle scroll-hover"
                                    >
                                        🚪 ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-4">
                            <Link href="/" className="text-secondary text-decoration-none small fw-bold hover-text-brand transition-all">
                                ← กลับหน้าแรก
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
