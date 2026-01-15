'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        phone: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate phone number format
        if (!/^[0-9]{10}$/.test(formData.phone)) {
            setError('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    phone: formData.phone,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || 'สมัครสมาชิกไม่สำเร็จ');
                return;
            }

            // Redirect to market page after successful registration
            router.push('/market');
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

            {/* Right Side - Register Form */}
            <div className="auth-right">
                <div className="w-100" style={{ maxWidth: '400px' }}>
                    <div className="text-center mb-5">
                        <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                            <span className="fs-1 text-muted">👤</span>
                        </div>
                        <h4 className="text-muted mb-2">สมัครสมาชิกใหม่</h4>
                    </div>

                    {error && (
                        <div className="alert alert-danger rounded-4 border-0 mb-4" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="username" className="form-label text-muted">ชื่อผู้ใช้</label>
                            <input
                                type="text"
                                className="form-control form-control-brand"
                                id="username"
                                placeholder="ตั้งชื่อผู้ใช้ของคุณ"
                                value={formData.username}
                                onChange={(e) =>
                                    setFormData({ ...formData, username: e.target.value })
                                }
                                required
                                disabled={loading}
                                minLength={3}
                                maxLength={50}
                            />
                            <div className="form-text">3-50 ตัวอักษร</div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="phone" className="form-label text-muted">เบอร์โทรศัพท์</label>
                            <input
                                type="tel"
                                className="form-control form-control-brand"
                                id="phone"
                                placeholder="0812345678"
                                maxLength={10}
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                                required
                                disabled={loading}
                            />
                            <div className="form-text">ใช้สำหรับเข้าสู่ระบบ</div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-brand w-100 mb-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" />
                                    กำลังลงทะเบียน...
                                </>
                            ) : (
                                'สมัครสมาชิก'
                            )}
                        </button>

                        <div className="text-center">
                            <span className="text-muted">มีบัญชีอยู่แล้ว? </span>
                            <Link href="/login" className="fw-bold text-decoration-none" style={{ color: 'var(--brand-primary)' }}>
                                เข้าสู่ระบบ
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
