'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const loginData = isAdmin
                ? { username: formData.username, password: formData.password }
                : { phone: formData.phone }; // User login with phone only

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || 'เข้าสู่ระบบไม่สำเร็จ');
                return;
            }

            // Redirect based on role
            if (data.data.user.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/market');
            }
            router.refresh();
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            {/* Left Side - Branding */}
            <div className="auth-left">
                <div className="auth-circle"></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h1 className="display-4 fw-bold mb-3">
                        STALL LOCK<br />ระบบจองล็อคตลาด
                    </h1>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="auth-right">
                <div className="w-100" style={{ maxWidth: '400px' }}>
                    <div className="text-center mb-5">
                        <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                            <span className="fs-1 text-muted">👤</span>
                        </div>
                        <h4 className="text-muted mb-2">เข้าสู่ระบบเพื่อเริ่มต้นใช้งาน</h4>
                    </div>

                    <div className="d-flex justify-content-center mb-4">
                        <div className="btn-group w-100" role="group">
                            <button
                                type="button"
                                className={`btn ${!isAdmin ? 'btn-brand text-white' : 'btn-outline-secondary border-0'}`}
                                onClick={() => setIsAdmin(false)}
                                style={{ borderRadius: '30px' }}
                            >
                                ผู้ใช้งาน
                            </button>
                            <button
                                type="button"
                                className={`btn ${isAdmin ? 'btn-brand text-white' : 'btn-outline-secondary border-0'}`}
                                onClick={() => setIsAdmin(true)}
                                style={{ borderRadius: '30px' }}
                            >
                                Admin
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger rounded-4 border-0 mb-4" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <div className="input-group">
                                <span className="input-group-text border-0 bg-transparent ps-0">
                                    <span className="text-muted">{isAdmin ? 'ชื่อผู้ใช้' : 'เบอร์โทรศัพท์'}</span>
                                </span>
                            </div>

                            {isAdmin ? (
                                <input
                                    type="text"
                                    className="form-control form-control-brand"
                                    placeholder="ชื่อผู้ใช้"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({ ...formData, username: e.target.value })
                                    }
                                    required
                                    disabled={loading}
                                />
                            ) : (
                                <input
                                    type="tel"
                                    className="form-control form-control-brand"
                                    placeholder="เบอร์โทรศัพท์ (0812345678)"
                                    maxLength={10}
                                    value={formData.phone}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phone: e.target.value })
                                    }
                                    required
                                    disabled={loading}
                                />
                            )}
                        </div>

                        {isAdmin && (
                            <div className="mb-4">
                                <input
                                    type="password"
                                    className="form-control form-control-brand"
                                    placeholder="รหัสผ่าน"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                    required
                                    disabled={loading}
                                />
                            </div>
                        )}

                        <div className="form-check mb-4">
                            <input className="form-check-input" type="checkbox" id="keepLoggedIn" />
                            <label className="form-check-label text-muted" htmlFor="keepLoggedIn">
                                จดจำการเข้าสู่ระบบ
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-brand w-100 mb-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    กำลังเข้าสู่ระบบ...
                                </>
                            ) : (
                                'เข้าสู่ระบบ'
                            )}
                        </button>

                        {!isAdmin && (
                            <div className="text-center">
                                <span className="text-muted">ยังไม่มีบัญชี? </span>
                                <Link href="/register" className="fw-bold text-decoration-none" style={{ color: 'var(--brand-primary)' }}>
                                    สมัครสมาชิก
                                </Link>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
