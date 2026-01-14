'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
            <div className="container py-5">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">กำลังโหลด...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <div className="mb-3" style={{ fontSize: '4rem' }}>
                                    {user?.role === 'ADMIN' ? '👤' : '👨‍💼'}
                                </div>
                                <h3 className="fw-bold mb-2">{user?.username}</h3>
                                <span
                                    className={`badge ${
                                        user?.role === 'ADMIN' ? 'bg-danger' : 'bg-primary'
                                    } px-3 py-2`}
                                    style={{ fontSize: '0.9rem' }}
                                >
                                    {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                                </span>
                            </div>

                            <div className="border-top pt-4 mt-4">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <div className="d-flex align-items-center p-3 bg-light rounded">
                                            <span className="me-3" style={{ fontSize: '1.5rem' }}>👤</span>
                                            <div>
                                                <div className="text-muted small">ชื่อผู้ใช้</div>
                                                <div className="fw-semibold">{user?.username}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div className="d-flex align-items-center p-3 bg-light rounded">
                                            <span className="me-3" style={{ fontSize: '1.5rem' }}>📱</span>
                                            <div>
                                                <div className="text-muted small">เบอร์โทรศัพท์</div>
                                                <div className="fw-semibold">{user?.phone}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <div className="d-flex align-items-center p-3 bg-light rounded">
                                            <span className="me-3" style={{ fontSize: '1.5rem' }}>🎭</span>
                                            <div>
                                                <div className="text-muted small">บทบาท</div>
                                                <div className="fw-semibold">
                                                    {user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Administrator)' : 'ผู้ใช้งานทั่วไป (User)'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-top pt-4 mt-4">
                                <div className="d-grid gap-2">
                                    {user?.role === 'ADMIN' ? (
                                        <Link
                                            href="/admin"
                                            className="btn btn-outline-primary btn-lg"
                                        >
                                            📊 ไปหน้าแอดมิน
                                        </Link>
                                    ) : (
                                        <>
                                            <Link
                                                href="/bookings"
                                                className="btn btn-outline-primary btn-lg"
                                            >
                                                📋 การจองของฉัน
                                            </Link>
                                            <Link
                                                href="/market"
                                                className="btn btn-outline-primary btn-lg"
                                            >
                                                🏪 ดูตลาด
                                            </Link>
                                        </>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="btn btn-danger btn-lg mt-3"
                                    >
                                        🚪 ออกจากระบบ
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-3">
                        <Link href="/" className="text-decoration-none text-muted small">
                            ← กลับหน้าแรก
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
