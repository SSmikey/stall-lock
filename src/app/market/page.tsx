'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Stall } from '@/lib/db';
import { ApiResponse } from '@/lib/api';

export default function MarketPage() {
    const [stalls, setStalls] = useState<Stall[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterZone, setFilterZone] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const zones = ['A', 'B', 'C', 'D'];

    useEffect(() => {
        fetchStalls();
    }, [filterZone, filterStatus]);

    const fetchStalls = async () => {
        setLoading(true);
        try {
            let url = '/api/stalls';
            const params = new URLSearchParams();
            if (filterZone !== 'ALL') params.append('zone', filterZone);
            if (filterStatus !== 'ALL') params.append('status', filterStatus);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            const data: ApiResponse<{ stalls: Stall[] }> = await res.json();
            if (data.success && data.data) {
                setStalls(data.data.stalls);
            }
        } catch (error) {
            console.error('Failed to fetch stalls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBookStall = async () => {
        if (!selectedStall) return;

        setBookingLoading(true);
        setMessage(null);

        try {
            // Mock user ID for demonstration (user001 from seed)
            // In a real app, this would be fetched from the session/JWT
            const mockUserId = '65a3f2b4e4b0a1a2b3c4d5e6';

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stallId: selectedStall._id,
                    userId: mockUserId
                })
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'จองล็อคสำเร็จ! กำลังนำคุณไปหน้าชำระเงิน...' });

                // Redirect to booking details page after success
                setTimeout(() => {
                    router.push(`/bookings/${data.data.bookingId}`);
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.error?.message || 'เกิดข้อผิดพลาดในการจอง' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
        } finally {
            setBookingLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'badge-available';
            case 'RESERVED': return 'badge-reserved';
            case 'CONFIRMED': return 'badge-booked';
            default: return '';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'ว่าง';
            case 'RESERVED': return 'รอชำระเงิน';
            case 'CONFIRMED': return 'จองแล้ว';
            default: return status;
        }
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h1 className="h2 fw-bold mb-0">เลือกจองล็อคตลาด</h1>
                <div className="d-flex gap-2">
                    <select
                        className="form-select"
                        value={filterZone}
                        onChange={(e) => setFilterZone(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="ALL">ทุกโซน</option>
                        {zones.map(z => <option key={z} value={z}>โซน {z}</option>)}
                    </select>
                    <select
                        className="form-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="ALL">ทุกสถานะ</option>
                        <option value="AVAILABLE">ว่าง</option>
                        <option value="RESERVED">รอชำระเงิน</option>
                        <option value="CONFIRMED">จองแล้ว</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : stalls.length === 0 ? (
                <div className="text-center py-5">
                    <p className="text-muted">ไม่พบข้อมูลล็อค</p>
                </div>
            ) : (
                <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3">
                    {stalls.map((stall) => (
                        <div key={stall.stallId} className="col">
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5 }}
                                className="card-custom h-100 cursor-pointer d-flex flex-column justify-content-between"
                                onClick={() => {
                                    setSelectedStall(stall);
                                    setMessage(null);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <span className="fw-bold text-primary">{stall.stallId}</span>
                                        <span className={getStatusBadgeClass(stall.status)}>
                                            {getStatusText(stall.status)}
                                        </span>
                                    </div>
                                    <h6 className="mb-1">{stall.name}</h6>
                                    <p className="small text-muted mb-2">โซน {stall.zone} | แถว {stall.row}</p>
                                </div>
                                <div className="mt-auto pt-3 border-top">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fw-bold text-success">
                                            {stall.price.toLocaleString()}฿
                                        </span>
                                        <span className="small text-muted">{stall.size} ตร.ม.</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stall Detail Modal */}
            <AnimatePresence>
                {selectedStall && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow-lg">
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title fw-bold">ข้อมูลล็อค {selectedStall.stallId}</h5>
                                    <button type="button" className="btn-close" onClick={() => setSelectedStall(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {message && (
                                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-4`} role="alert">
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="mb-4 text-center">
                                        <div className="display-4 fw-bold text-primary mb-1">{selectedStall.stallId}</div>
                                        <div className="text-muted">{selectedStall.name}</div>
                                    </div>

                                    <div className="row g-3 mb-4">
                                        <div className="col-6">
                                            <div className="p-3 bg-light rounded-3 text-center">
                                                <div className="text-muted small">โซน</div>
                                                <div className="fw-bold h5 mb-0">{selectedStall.zone}</div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 bg-light rounded-3 text-center">
                                                <div className="text-muted small">ขนาด</div>
                                                <div className="fw-bold h5 mb-0">{selectedStall.size} ตร.ม.</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-muted small d-block mb-2">สิ่งอำนวยความสะดวก</label>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {selectedStall.features.map(f => (
                                                <span key={f} className="badge bg-white text-dark border p-2 px-3 fw-normal">
                                                    {f === 'ไฟฟ้า' && '⚡ '}
                                                    {f === 'น้ำประปา' && '💧 '}
                                                    {f}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-primary bg-opacity-10 rounded-4 d-flex justify-content-between align-items-center">
                                        <div>
                                            <div className="text-muted small">ราคาเช่ารายเดือน</div>
                                            <div className="h3 mb-0 fw-bold text-primary">{selectedStall.price.toLocaleString()}฿</div>
                                        </div>
                                        <button
                                            className="btn btn-primary-custom px-4 py-2"
                                            disabled={selectedStall.status !== 'AVAILABLE' || bookingLoading}
                                            onClick={handleBookStall}
                                        >
                                            {bookingLoading ? (
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                            ) : null}
                                            จองล็อคนี้
                                        </button>
                                    </div>

                                    {selectedStall.status !== 'AVAILABLE' && !message && (
                                        <p className="text-center text-danger small mt-3 mb-0">
                                            {selectedStall.status === 'RESERVED' ? 'ล็อคนี้อยู่ระหว่างการจอง' : 'ล็อคนี้ถูกจองไปแล้ว'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
