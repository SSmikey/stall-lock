'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Booking, Stall } from '@/lib/db';
import { ApiResponse } from '@/lib/api';
import Link from 'next/link';

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
            case 'RESERVED': return '⏳';
            case 'AWAITING_APPROVAL': return '🔍';
            case 'CONFIRMED': return '✅';
            case 'EXPIRED': return '⏰';
            case 'CANCELLED': return '❌';
            default: return '📋';
        }
    };

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
                ) : bookings.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card border-0 shadow-lg rounded-4 overflow-hidden text-center py-5"
                    >
                        <div className="card-body p-5">
                            <div className="mb-4 bg-brand-light d-inline-block rounded-circle p-4">
                                <span style={{ fontSize: '4rem' }}>🎫</span>
                            </div>
                            <h2 className="fw-bold mb-2">คุณยังไม่มีการจอง</h2>
                            <p className="text-muted mb-4 fs-5">ค้นหาทำเลค้าขายที่ใช่ แล้วเริ่มธุรกิจของคุณได้เลย</p>
                            <Link href="/market" className="btn btn-brand btn-lg rounded-pill px-5 shadow-sm hover-scale">
                                ไปที่ตลาด 🏪
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <div className="row g-4 pb-5">
                        {bookings.map((booking, index) => (
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
                                                <span style={{ fontSize: '1rem' }}>{getStatusIcon(booking.status)}</span>
                                                {getStatusText(booking.status)}
                                            </span>
                                        </div>

                                        <div className="bg-light rounded-3 p-3 mb-4 flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="text-muted small">วันที่จอง</span>
                                                <span className="fw-medium">{new Date(booking.reservedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                            </div>
                                            {booking.expiresAt && (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="text-muted small">ชำระ/หมดอายุภายใน</span>
                                                    <span className="text-danger fw-bold">{new Date(booking.expiresAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                                </div>
                                            )}
                                        </div>

                                        <Link
                                            href={`/bookings/${booking.bookingId}`}
                                            className={`btn w-100 rounded-pill fw-bold py-2 ${booking.status === 'RESERVED'
                                                ? 'btn-brand shadow-sm text-white'
                                                : 'btn-outline-primary border-2'
                                                }`}
                                        >
                                            {booking.status === 'RESERVED' ? '💸 แจ้งชำระเงิน' : '📄 ดูรายละเอียด'}
                                        </Link>
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
