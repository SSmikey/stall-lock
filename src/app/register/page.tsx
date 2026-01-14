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
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow-sm">
                            <div className="card-body p-4">
                                <h2 className="text-center mb-4">สมัครสมาชิก</h2>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="username" className="form-label">
                                            ชื่อผู้ใช้
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="username"
                                            value={formData.username}
                                            onChange={(e) =>
                                                setFormData({ ...formData, username: e.target.value })
                                            }
                                            required
                                            disabled={loading}
                                            minLength={3}
                                            maxLength={50}
                                        />
                                        <div className="form-text">ชื่อผู้ใช้ 3-50 ตัวอักษร</div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="phone" className="form-label">
                                            เบอร์โทรศัพท์
                                        </label>
                                        <input
                                            type="tel"
                                            className="form-control"
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
                                        <div className="form-text">
                                            เบอร์โทรศัพท์จะใช้ในการเข้าสู่ระบบ
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 mb-3"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                กำลังสมัครสมาชิก...
                                            </>
                                        ) : (
                                            'สมัครสมาชิก'
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <span className="text-muted">มีบัญชีอยู่แล้ว? </span>
                                        <Link href="/login" className="text-decoration-none">
                                            เข้าสู่ระบบ
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
