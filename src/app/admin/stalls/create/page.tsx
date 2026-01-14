'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateStallPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        stallId: '',
        zone: '',
        size: '',
        price: '',
        description: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/admin/stalls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stallId: formData.stallId,
                    zone: formData.zone,
                    size: formData.size,
                    price: parseFloat(formData.price),
                    description: formData.description || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || 'ไม่สามารถเพิ่มแผงตลาดได้');
                return;
            }

            alert('เพิ่มแผงตลาดสำเร็จ!');
            router.push('/admin');
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="mb-4">
                        <Link href="/admin" className="text-decoration-none text-muted small">
                            ← กลับไปหน้าแอดมิน
                        </Link>
                    </div>

                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <h2 className="text-center mb-4 fw-bold">
                                ➕ เพิ่มแผงตลาด
                            </h2>

                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="stallId" className="form-label fw-semibold">
                                        รหัสแผง <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="stallId"
                                        placeholder="เช่น A-001"
                                        value={formData.stallId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, stallId: e.target.value })
                                        }
                                        required
                                        disabled={loading}
                                    />
                                    <div className="form-text">
                                        รหัสแผงต้องไม่ซ้ำกับแผงที่มีอยู่
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="zone" className="form-label fw-semibold">
                                        โซน <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        id="zone"
                                        value={formData.zone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, zone: e.target.value })
                                        }
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">เลือกโซน</option>
                                        <option value="A">โซน A</option>
                                        <option value="B">โซน B</option>
                                        <option value="C">โซน C</option>
                                        <option value="D">โซน D</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="size" className="form-label fw-semibold">
                                        ขนาด <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        className="form-select"
                                        id="size"
                                        value={formData.size}
                                        onChange={(e) =>
                                            setFormData({ ...formData, size: e.target.value })
                                        }
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">เลือกขนาด</option>
                                        <option value="SMALL">เล็ก (2x2 เมตร)</option>
                                        <option value="MEDIUM">กลาง (3x3 เมตร)</option>
                                        <option value="LARGE">ใหญ่ (4x4 เมตร)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="price" className="form-label fw-semibold">
                                        ราคา (บาท/วัน) <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="price"
                                        placeholder="เช่น 500"
                                        min="0"
                                        step="1"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData({ ...formData, price: e.target.value })
                                        }
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="description" className="form-label fw-semibold">
                                        รายละเอียดเพิ่มเติม
                                    </label>
                                    <textarea
                                        className="form-control"
                                        id="description"
                                        rows={3}
                                        placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับแผง (ถ้ามี)"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        disabled={loading}
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 py-2"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            กำลังเพิ่มแผงตลาด...
                                        </>
                                    ) : (
                                        '✓ เพิ่มแผงตลาด'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
