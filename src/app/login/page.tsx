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
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-6 col-lg-5">
                        <div className="card shadow-sm">
                            <div className="card-body p-4">
                                <h2 className="text-center mb-4">
                                    {isAdmin ? 'เข้าสู่ระบบ Admin' : 'เข้าสู่ระบบ'}
                                </h2>

                                {/* Toggle Admin/User Login */}
                                <div className="d-flex justify-content-center mb-4">
                                    <div className="btn-group" role="group">
                                        <button
                                            type="button"
                                            className={`btn ${!isAdmin ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setIsAdmin(false)}
                                        >
                                            ผู้ใช้งาน
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn ${isAdmin ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setIsAdmin(true)}
                                        >
                                            Admin
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor={isAdmin ? "username" : "phone"} className="form-label">
                                            {isAdmin ? 'ชื่อผู้ใช้' : 'เบอร์โทรศัพท์'}
                                        </label>
                                        {isAdmin ? (
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
                                            />
                                        ) : (
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
                                        )}
                                    </div>

                                    {isAdmin && (
                                        <div className="mb-3">
                                            <label htmlFor="password" className="form-label">
                                                รหัสผ่าน
                                            </label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="password"
                                                value={formData.password}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, password: e.target.value })
                                                }
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="btn btn-primary w-100 mb-3"
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
                                            <Link href="/register" className="text-decoration-none">
                                                สมัครสมาชิก
                                            </Link>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
