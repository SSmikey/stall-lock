'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/lib/api';

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
    const [rejectingBooking, setRejectingBooking] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/bookings');
            const data: ApiResponse<any[]> = await res.json();
            if (data.success && data.data) {
                setBookings(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch admin bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (bookingId: string) => {
        if (!confirm('ยืนยันการอนุมัติการจองนี้?')) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            });
            const data = await res.json();
            if (data.success) {
                alert('อนุมัติเรียบร้อยแล้ว');
                fetchBookings();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectingBooking || !rejectReason) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: rejectingBooking._id,
                    reason: rejectReason
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('ปฏิเสธการจองเรียบร้อยแล้ว');
                setRejectingBooking(null);
                setRejectReason('');
                fetchBookings();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RESERVED': return <span className="badge bg-warning text-dark">รอชำระเงิน</span>;
            case 'AWAITING_APPROVAL': return <span className="badge bg-info text-dark">รอตรวจสอบ</span>;
            case 'CONFIRMED': return <span className="badge bg-success">จองสำเร็จ</span>;
            case 'CANCELLED': return <span className="badge bg-danger">ยกเลิก/ปฏิเสธ</span>;
            case 'EXPIRED': return <span className="badge bg-secondary">หมดอายุ</span>;
            default: return <span className="badge bg-light text-dark">{status}</span>;
        }
    };

    const filteredBookings = filterStatus === 'ALL'
        ? bookings
        : bookings.filter(b => b.status === filterStatus);

    // Stats calculation
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'AWAITING_APPROVAL').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        expired: bookings.filter(b => b.status === 'EXPIRED' || b.status === 'CANCELLED').length
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="fw-bold mb-1">ระบบหลังบ้าน (Admin)</h1>
                    <p className="text-muted mb-0">จัดการการจองและตรวจสอบการชำระเงิน</p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-warning"
                        onClick={async () => {
                            if (!confirm('ยืนยันการเคลียร์รายการการจองที่หมดอายุ?')) return;
                            try {
                                const res = await fetch('/api/admin/system/cleanup', { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                    alert(`ทำความสะอาดเรียบร้อย: ${data.data.count} รายการ`);
                                    fetchBookings();
                                }
                            } catch (e) {
                                alert('เกิดข้อผิดพลาดในการ Cleanup');
                            }
                        }}
                    >
                        🧹 เคลียร์รายการหมดอายุ
                    </button>
                    <button className="btn btn-outline-primary" onClick={fetchBookings}>
                        🔄 รีเฟรชข้อมูล
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4">
                        <div className="h3 fw-bold mb-1">{stats.total}</div>
                        <div className="text-muted small uppercase">การจองทั้งหมด</div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4 border-start border-4 border-info">
                        <div className="h3 fw-bold text-info mb-1">{stats.pending}</div>
                        <div className="text-muted small uppercase">รอตรวจสอบสลิป</div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4 border-start border-4 border-success">
                        <div className="h3 fw-bold text-success mb-1">{stats.confirmed}</div>
                        <div className="text-muted small uppercase">จองสำเร็จแล้ว</div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4 border-start border-4 border-secondary">
                        <div className="h3 fw-bold text-secondary mb-1">{stats.expired}</div>
                        <div className="text-muted small uppercase">รายการที่เสียสิทธิ์</div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-4 d-flex gap-2">
                <button
                    className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterStatus('ALL')}
                >
                    ทั้งหมด
                </button>
                <button
                    className={`btn btn-sm ${filterStatus === 'AWAITING_APPROVAL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterStatus('AWAITING_APPROVAL')}
                >
                    รอตรวจสอบ ({stats.pending})
                </button>
                <button
                    className={`btn btn-sm ${filterStatus === 'CONFIRMED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterStatus('CONFIRMED')}
                >
                    อนุมัติแล้ว
                </button>
            </div>

            {/* Bookings Table/Cards */}
            {loading ? (
                <div className="row g-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="col-12">
                            <div className="card-custom p-4 border-0 shadow-sm animate-pulse" style={{ background: '#f8f9fa' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="bg-secondary bg-opacity-10 rounded w-25" style={{ height: '20px' }}></div>
                                    <div className="bg-secondary bg-opacity-10 rounded w-10" style={{ height: '20px' }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="card-custom text-center py-5 text-muted">ไม่พบข้อมูลการจอง</div>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="card-custom p-0 overflow-hidden shadow-sm d-none d-lg-block">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3">รหัสการจอง</th>
                                        <th className="py-3">ผู้จอง</th>
                                        <th className="py-3">ล็อค / โซน</th>
                                        <th className="py-3">ยอดชำระ</th>
                                        <th className="py-3">สถานะ</th>
                                        <th className="py-3 text-center">สลิป</th>
                                        <th className="px-4 py-3 text-end">ดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((b) => (
                                        <tr key={b._id}>
                                            <td className="px-4 fw-bold text-primary">{b.bookingId}</td>
                                            <td>
                                                <div className="fw-bold">{b.user?.fullName || 'N/A'}</div>
                                                <div className="small text-muted">{b.user?.phone || b.user?.username}</div>
                                            </td>
                                            <td>
                                                <div className="fw-bold">{b.stall?.stallId || 'N/A'}</div>
                                                <div className="small text-muted">โซน {b.stall?.zone}</div>
                                            </td>
                                            <td className="fw-bold text-success">
                                                {b.stall?.price.toLocaleString() || 0}฿
                                            </td>
                                            <td>{getStatusBadge(b.status)}</td>
                                            <td className="text-center">
                                                {b.paymentSlipUrl ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-info"
                                                        onClick={() => setSelectedSlip(b.paymentSlipUrl)}
                                                    >
                                                        👁️ ดูสลิป
                                                    </button>
                                                ) : <span className="text-muted small">ยังไม่อัพโหลด</span>}
                                            </td>
                                            <td className="px-4 text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    {b.status === 'AWAITING_APPROVAL' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => handleApprove(b._id)}
                                                                disabled={actionLoading}
                                                            >
                                                                อนุมัติ
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => setRejectingBooking(b)}
                                                                disabled={actionLoading}
                                                            >
                                                                ปฏิเสธ
                                                            </button>
                                                        </>
                                                    )}
                                                    <button className="btn btn-sm btn-light border">รายละเอียด</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile/Tablet View */}
                    <div className="d-lg-none">
                        <div className="row g-3">
                            {filteredBookings.map((b) => (
                                <div key={b._id} className="col-12">
                                    <div className="card-custom p-3 border-0 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="fw-bold text-primary">{b.bookingId}</span>
                                            {getStatusBadge(b.status)}
                                        </div>
                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <small className="text-muted d-block">ผู้จอง</small>
                                                <strong>{b.user?.fullName || 'N/A'}</strong>
                                            </div>
                                            <div className="col-6 text-end">
                                                <small className="text-muted d-block">ล็อค / โซน</small>
                                                <strong>{b.stall?.stallId} ({b.stall?.zone})</strong>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                            <div className="text-success fw-bold">
                                                {b.stall?.price.toLocaleString()}฿
                                            </div>
                                            <div className="d-flex gap-2">
                                                {b.paymentSlipUrl && (
                                                    <button
                                                        className="btn btn-sm btn-info text-white"
                                                        onClick={() => setSelectedSlip(b.paymentSlipUrl)}
                                                    >
                                                        สลิป
                                                    </button>
                                                )}
                                                {b.status === 'AWAITING_APPROVAL' ? (
                                                    <button
                                                        className="btn btn-sm btn-success px-3"
                                                        onClick={() => handleApprove(b._id)}
                                                        disabled={actionLoading}
                                                    >
                                                        อนุมัติ
                                                    </button>
                                                ) : (
                                                    <button className="btn btn-sm btn-light border px-3">รายละเอียด</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Slip Viewer Modal */}
            {selectedSlip && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setSelectedSlip(null)}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 bg-transparent">
                            <div className="modal-body p-0 text-center position-relative">
                                <button className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow" onClick={() => setSelectedSlip(null)}>✕</button>
                                <img src={selectedSlip} className="img-fluid rounded shadow-lg" alt="Payment Slip" style={{ maxHeight: '90vh' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectingBooking && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold">ปฏิเสธการจอง {rejectingBooking.bookingId}</h5>
                                    <button type="button" className="btn-close" onClick={() => setRejectingBooking(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">เหตุผลที่ปฏิเสธ</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="เช่น ภาพสลิปไม่ชัดเจนเงินเข้าไม่ตรงยอด..."
                                        ></textarea>
                                    </div>
                                    <div className="d-grid">
                                        <button
                                            className="btn btn-danger py-2"
                                            disabled={!rejectReason || actionLoading}
                                            onClick={handleReject}
                                        >
                                            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการปฏิเสธ'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
