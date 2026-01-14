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
        <div className="container py-3 py-md-5">
            {/* Header Section - Mobile Optimized */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
            >
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                    <div>
                        <h1 className="h3 h2-md fw-bold mb-1 text-gradient">เลือกจองล็อคตลาด</h1>
                        <p className="text-muted small mb-0">เลือกล็อคที่คุณต้องการได้เลย 🏪</p>
                    </div>

                    {/* Filter Controls - Stack on mobile */}
                    <div className="d-flex flex-column flex-sm-row gap-2 w-100 w-md-auto">
                        <select
                            className="form-select form-select-lg"
                            value={filterZone}
                            onChange={(e) => setFilterZone(e.target.value)}
                            style={{
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--gray-200)',
                            }}
                        >
                            <option value="ALL">🏘️ ทุกโซน</option>
                            {zones.map(z => <option key={z} value={z}>📍 โซน {z}</option>)}
                        </select>
                        <select
                            className="form-select form-select-lg"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--gray-200)',
                            }}
                        >
                            <option value="ALL">🔍 ทุกสถานะ</option>
                            <option value="AVAILABLE">✅ ว่าง</option>
                            <option value="RESERVED">⏳ รอชำระเงิน</option>
                            <option value="CONFIRMED">🔒 จองแล้ว</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="text-muted mt-3">กำลังโหลดข้อมูล...</p>
                </div>
            ) : stalls.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-5"
                >
                    <div style={{ fontSize: '4rem' }}>🔍</div>
                    <h5 className="text-muted mt-3">ไม่พบข้อมูลล็อค</h5>
                    <p className="text-muted small">ลองเปลี่ยนตัวกรองดูนะครับ</p>
                </motion.div>
            ) : (
                <>
                    {/* Results Count */}
                    <div className="mb-3">
                        <p className="text-muted small mb-0">
                            พบ <span className="fw-bold text-primary">{stalls.length}</span> ล็อค
                        </p>
                    </div>

                    {/* Responsive Grid - Mobile First */}
                    <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-2 g-md-3 justify-content-center">
                        {stalls.map((stall, index) => (
                            <div key={stall.stallId} className="col">
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="card-custom h-100 d-flex flex-column"
                                    onClick={() => {
                                        setSelectedStall(stall);
                                        setMessage(null);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        WebkitTapHighlightColor: 'transparent',
                                    }}
                                >
                                    {/* Card Header */}
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <span className="fw-bold text-primary fs-6">{stall.stallId}</span>
                                            <span className={getStatusBadgeClass(stall.status)}>
                                                {getStatusText(stall.status)}
                                            </span>
                                        </div>
                                        <h6 className="mb-1 fw-semibold">{stall.name}</h6>
                                        <p className="small text-muted mb-0">
                                            <span className="d-inline-block me-2">📍 {stall.zone}</span>
                                            <span className="d-inline-block">#{stall.row}</span>
                                        </p>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="mt-auto pt-3 border-top d-flex flex-column gap-2">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="small text-muted mb-0">ราคา/เดือน</div>
                                                <div className="fw-bold text-success fs-6">
                                                    {stall.price.toLocaleString()}฿
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <div className="small text-muted mb-0">ขนาด</div>
                                                <div className="fw-semibold">{stall.size} ตร.ม.</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Stall Detail Modal - Mobile Optimized */}
            <AnimatePresence>
                {selectedStall && (
                    <div
                        className="modal show d-block"
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 1050,
                        }}
                        onClick={() => setSelectedStall(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxWidth: '500px', margin: 'auto' }}
                        >
                            <div className="modal-content border-0" style={{
                                borderRadius: 'var(--radius-xl)',
                                boxShadow: 'var(--shadow-2xl)',
                            }}>
                                {/* Modal Header */}
                                <div className="modal-header border-0 pb-2" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span style={{ fontSize: '1.5rem' }}>🏪</span>
                                        <h5 className="modal-title fw-bold text-white mb-0">ข้อมูลล็อค</h5>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white tap-target"
                                        onClick={() => setSelectedStall(null)}
                                        aria-label="Close"
                                    ></button>
                                </div>

                                {/* Modal Body */}
                                <div className="modal-body p-3 p-md-4">
                                    {/* Alert Message */}
                                    <AnimatePresence>
                                        {message && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mb-3 d-flex align-items-center gap-2`}
                                                role="alert"
                                                style={{ borderRadius: 'var(--radius-md)' }}
                                            >
                                                <span>{message.type === 'success' ? '✅' : '❌'}</span>
                                                {message.text}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Stall ID & Name */}
                                    <div className="mb-4 text-center py-3" style={{
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                                        borderRadius: 'var(--radius-lg)',
                                    }}>
                                        <div className="display-6 fw-bold text-gradient mb-1">{selectedStall.stallId}</div>
                                        <div className="text-muted fw-medium">{selectedStall.name}</div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="row g-2 mb-4">
                                        <div className="col-6">
                                            <div className="p-3 text-center" style={{
                                                background: 'var(--gray-50)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '2px solid var(--gray-100)',
                                            }}>
                                                <div className="text-muted small mb-1">📍 โซน</div>
                                                <div className="fw-bold h5 mb-0 text-primary">{selectedStall.zone}</div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="p-3 text-center" style={{
                                                background: 'var(--gray-50)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '2px solid var(--gray-100)',
                                            }}>
                                                <div className="text-muted small mb-1">📏 ขนาด</div>
                                                <div className="fw-bold h5 mb-0 text-primary">{selectedStall.size} ตร.ม.</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="mb-4">
                                        <label className="text-muted small fw-semibold d-block mb-2">🎯 สิ่งอำนวยความสะดวก</label>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {selectedStall.features && selectedStall.features.length > 0 ? (
                                                selectedStall.features.map(f => (
                                                    <span
                                                        key={f}
                                                        className="badge text-dark p-2 px-3 fw-medium"
                                                        style={{
                                                            background: 'white',
                                                            border: '2px solid var(--gray-200)',
                                                            borderRadius: 'var(--radius-md)',
                                                        }}
                                                    >
                                                        {f === 'ไฟฟ้า' && '⚡ '}
                                                        {f === 'น้ำประปา' && '💧 '}
                                                        {f}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted small">ไม่มีข้อมูล</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price & Action */}
                                    <div className="p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3" style={{
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.05) 100%)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '2px solid rgba(99, 102, 241, 0.2)',
                                    }}>
                                        <div className="text-center text-md-start">
                                            <div className="text-muted small mb-1">💰 ราคาเช่ารายเดือน</div>
                                            <div className="h3 mb-0 fw-bold text-gradient">{selectedStall.price.toLocaleString()}฿</div>
                                        </div>
                                        <button
                                            className="btn btn-primary-custom px-4 py-3 d-flex align-items-center gap-2"
                                            disabled={selectedStall.status !== 'AVAILABLE' || bookingLoading}
                                            onClick={handleBookStall}
                                            style={{
                                                minWidth: '160px',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {bookingLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm"></span>
                                                    <span>กำลังจอง...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>🔒</span>
                                                    <span>จองล็อคนี้</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Status Warning */}
                                    {selectedStall.status !== 'AVAILABLE' && !message && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="alert alert-warning d-flex align-items-center gap-2 mt-3 mb-0"
                                            style={{ borderRadius: 'var(--radius-md)' }}
                                        >
                                            <span>⚠️</span>
                                            <span className="small">
                                                {selectedStall.status === 'RESERVED' ? 'ล็อคนี้อยู่ระหว่างการจอง' : 'ล็อคนี้ถูกจองไปแล้ว'}
                                            </span>
                                        </motion.div>
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
