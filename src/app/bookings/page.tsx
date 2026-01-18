'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Booking, Stall } from '@/lib/db';
import { ApiResponse } from '@/lib/api';
import Link from 'next/link';
import { Clock, Search, CheckCircle, AlertCircle, XCircle, ClipboardList, ScrollText, Ticket, Store, Banknote, FileText, Trash2, History } from 'lucide-react';

interface BookingWithStall extends Booking {
    stall?: Stall;
}

export default function BookingsPage() {
    const [bookings, setBookings] = useState<BookingWithStall[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        console.log('[BookingsPage] Fetching data...');
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data?.user?.id) {
                    const userId = data.data.user.id;
                    setCurrentUserId(userId);

                    const bookingsRes = await fetch(`/api/bookings?userId=${userId}`);
                    const bookingsData = await bookingsRes.json();
                    if (bookingsData.success && bookingsData.data) {
                        setBookings(bookingsData.data);
                    }
                }
            }
        } catch (error) {
            console.error('[BookingsPage] Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'RESERVED': return 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25';
            case 'AWAITING_APPROVAL': return 'bg-info bg-opacity-10 text-info border border-info border-opacity-25';
            case 'CONFIRMED': return 'bg-success bg-opacity-10 text-success border border-success border-opacity-25';
            case 'CANCELLED':
            case 'EXPIRED': return 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
            default: return 'bg-light text-dark';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'RESERVED': return 'รอการชำระเงิน';
            case 'AWAITING_APPROVAL': return 'รอการอนุมัติ';
            case 'CONFIRMED': return 'จองสำเร็จ';
            case 'EXPIRED': return 'หมดอายุ';
            case 'CANCELLED': return 'ยกเลิกแล้ว';
            default: return status;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'RESERVED': return <Clock size={16} />;
            case 'AWAITING_APPROVAL': return <Search size={16} />;
            case 'CONFIRMED': return <CheckCircle size={16} />;
            case 'EXPIRED': return <AlertCircle size={16} />;
            case 'CANCELLED': return <XCircle size={16} />;
            default: return <ClipboardList size={16} />;
        }
    };

    const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'HISTORY'>('ACTIVE');

    const getFilteredBookings = () => {
        return bookings.filter(booking => {
            if (filterType === 'ALL') return true;

            const isHistory = ['EXPIRED', 'CANCELLED', 'REJECTED', 'COMPLETED'].includes(booking.status);

            if (filterType === 'HISTORY') return isHistory;
            // ACTIVE = Reserved, Awaiting Approval, Confirmed
            return !isHistory;
        });
    };

    const handleDelete = async (bookingId: string) => {
        if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการจองนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
            return;
        }

        try {
            const res = await fetch(`/api/bookings?bookingId=${bookingId}&userId=${currentUserId}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                // Remove from local state
                setBookings(prev => prev.filter(b => b.bookingId !== bookingId));
                alert('ลบรายการสำเร็จ');
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาดในการลบรายการ');
            }
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const canDelete = (status: string) => {
        return ['EXPIRED', 'CANCELLED', 'REJECTED', 'COMPLETED'].includes(status);
    };

    const filteredBookings = getFilteredBookings();

    const handleCleanup = async () => {
        if (!confirm('คุณต้องการลบประวัติการจองทั้งหมดที่เสร็จสิ้นหรือยกเลิกแล้วใช่หรือไม่?')) {
            return;
        }

        try {
            const res = await fetch(`/api/bookings?userId=${currentUserId}&mode=cleanup`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                // Refresh data
                fetchData();
                alert(data.data?.message || 'ล้างประวัติสำเร็จ');
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            console.error('Error cleanup:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    };

    const hasHistoryItems = bookings.some(b => ['EXPIRED', 'CANCELLED', 'REJECTED', 'COMPLETED'].includes(b.status));

    return (
        <div className="container-fluid p-0 bg-light min-vh-100 font-kanit">
            {/* Hero Section */}
            <div className="home-hero pt-5 pb-5 mb-5" style={{ borderRadius: '0 0 50px 50px' }}>
                <div className="container position-relative z-1">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        <div className="text-white text-center text-md-start">
                            <h1 className="fw-bold mb-1">การจองของฉัน</h1>
                            <p className="lead mb-0 fw-normal opacity-90">ตรวจสอบสถานะและประวัติการจองแผงของคุณ</p>
                        </div>

                        {/* Filter Tabs in Hero (Top Right) */}
                        <div className="d-flex align-items-center gap-2">
                            <div className="bg-white/20 backdrop-blur-sm p-1 rounded-pill d-inline-flex border border-white/20">
                                <button
                                    onClick={() => setFilterType('ACTIVE')}
                                    className={`btn rounded-pill px-3 fw-medium transition-all ${filterType === 'ACTIVE' ? 'bg-white text-brand shadow-sm' : 'text-white hover-bg-white-10'}`}
                                >
                                    กำลังดำเนินการ
                                </button>
                                <button
                                    onClick={() => setFilterType('HISTORY')}
                                    className={`btn rounded-pill px-3 fw-medium transition-all ${filterType === 'HISTORY' ? 'bg-white text-brand shadow-sm' : 'text-white hover-bg-white-10'}`}
                                >
                                    ประวัติ
                                </button>
                                <button
                                    onClick={() => setFilterType('ALL')}
                                    className={`btn rounded-pill px-3 fw-medium transition-all ${filterType === 'ALL' ? 'bg-white text-brand shadow-sm' : 'text-white hover-bg-white-10'}`}
                                >
                                    ทั้งหมด
                                </button>
                            </div>

                            {filterType === 'HISTORY' && hasHistoryItems && (
                                <button
                                    onClick={handleCleanup}
                                    className="btn btn-danger bg-danger bg-opacity-75 border-0 text-white rounded-pill px-3 d-flex align-items-center gap-2 hover-scale shadow-sm backdrop-blur-sm"
                                    title="ล้างประวัติทั้งหมด"
                                >
                                    <Trash2 size={16} />
                                    <span className="d-none d-sm-inline">ล้างประวัติ</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '-4rem' }}>


                {loading ? (
                    <div className="row g-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                                    <div className="card-body p-4 bg-white">
                                        <div className="placeholder-glow">
                                            <div className="d-flex justify-content-between mb-4">
                                                <span className="placeholder col-4 rounded-pill"></span>
                                                <span className="placeholder col-3 rounded-pill"></span>
                                            </div>
                                            <span className="placeholder col-12 mb-2 rounded"></span>
                                            <span className="placeholder col-8 mb-4 rounded"></span>
                                            <span className="placeholder col-12 rounded btn-lg"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card border-0 shadow-lg rounded-4 overflow-hidden text-center py-5"
                    >
                        <div className="card-body p-5">
                            <div className="mb-4 bg-brand-light d-inline-block rounded-circle p-4">
                                {filterType === 'HISTORY' ? (
                                    <History size={64} className="text-secondary opacity-50" />
                                ) : (
                                    <Ticket size={64} className="text-brand opacity-50" />
                                )}
                            </div>
                            <h2 className="fw-bold mb-2">ไม่พบรายการ{filterType === 'HISTORY' ? 'ประวัติการจอง' : 'การจอง'}</h2>
                            <p className="text-muted mb-4 fs-5">
                                {filterType === 'HISTORY'
                                    ? 'คุณยังไม่มีประวัติการจองที่เสร็จสิ้นหรือยกเลิก'
                                    : 'ค้นหาทำเลค้าขายที่ใช่ แล้วเริ่มธุรกิจของคุณได้เลย'}
                            </p>
                            {filterType !== 'HISTORY' && (
                                <Link href="/market" className="btn btn-brand btn-lg rounded-pill px-5 shadow-sm hover-scale d-inline-flex align-items-center gap-2">
                                    ไปที่ตลาด <Store size={20} />
                                </Link>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <div className="row g-4 pb-5">
                        {filteredBookings.map((booking, index) => (
                            <div key={booking.bookingId} className="col-md-6 col-lg-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden hover-card"
                                >
                                    <div className="card-body p-4 d-flex flex-column">
                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                            <div>
                                                <div className="text-muted small mb-1">รหัสการจอง</div>
                                                <div className="fw-bold font-monospace bg-light px-2 py-1 rounded text-primary">
                                                    #{booking.bookingId.substring(0, 8)}...
                                                </div>
                                            </div>
                                            <span className={`badge rounded-pill px-3 py-2 d-flex align-items-center gap-2 ${getStatusBadgeClass(booking.status)}`}>
                                                {getStatusIcon(booking.status)}
                                                {getStatusText(booking.status)}
                                            </span>
                                        </div>

                                        <div className="bg-light rounded-3 p-3 mb-4 flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="text-muted small">วันที่จอง</span>
                                                <span className="fw-medium">{new Date(booking.reservedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>
                                            {booking.expiresAt && booking.status === 'RESERVED' && (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small">ชำระภายใน</span>
                                                    <span className="text-danger fw-bold">{new Date(booking.expiresAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                                </div>
                                            )}
                                            {(booking.status === 'EXPIRED' || booking.status === 'CANCELLED') && (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small">สถานะ</span>
                                                    <span className="text-danger fw-bold">{getStatusText(booking.status)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Link
                                                href={`/bookings/${booking.bookingId}`}
                                                className={`btn flex-grow-1 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-1 ${booking.status === 'RESERVED'
                                                    ? 'btn-brand shadow-sm text-white'
                                                    : 'btn-outline-primary border-2'
                                                    }`}
                                            >
                                                {booking.status === 'RESERVED' ? <><Banknote size={16} /> แจ้งชำระเงิน</> : <><FileText size={16} /> ดูรายละเอียด</>}
                                            </Link>

                                            {canDelete(booking.status) && (
                                                <button
                                                    onClick={() => handleDelete(booking.bookingId)}
                                                    className="btn btn-outline-danger rounded-circle p-2 d-flex align-items-center justify-content-center"
                                                    style={{ width: '42px', height: '42px' }}
                                                    title="ลบรายการ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
