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

    const mockUserId = '65a3f2b4e4b0a1a2b3c4d5e6'; // Same mock user

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings?userId=${mockUserId}`);
            const data: ApiResponse<BookingWithStall[]> = await res.json();

            if (data.success && data.data) {
                setBookings(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'RESERVED': return 'badge-reserved';
            case 'AWAITING_APPROVAL': return 'bg-info bg-opacity-10 text-info border border-info border-opacity-25';
            case 'CONFIRMED': return 'badge-available';
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

    return (
        <div className="container py-5">
            <h1 className="h2 fw-bold mb-4">การจองของฉัน</h1>

            {loading ? (
                <div className="row g-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="col-md-6 col-lg-4">
                            <div className="card-custom h-100 animate-pulse bg-light" style={{ height: '200px' }}></div>
                        </div>
                    ))}
                </div>
            ) : bookings.length === 0 ? (
                <div className="card-custom text-center py-5 shadow-sm border-0">
                    <div className="mb-4 text-muted" style={{ fontSize: '4rem' }}>📋</div>
                    <h4 className="fw-bold">คุณยังไม่มีการจองในขณะนี้</h4>
                    <p className="text-muted mb-4">ค้นหาล็อคที่ถูกใจและเริ่มจองเพื่อเริ่มธุรกิจของคุณ</p>
                    <Link href="/market" className="btn btn-primary-custom px-5 py-2">ไปที่หน้าตลาด</Link>
                </div>
            ) : (
                <div className="row g-4">
                    {bookings.map((booking) => (
                        <div key={booking.bookingId} className="col-md-6 col-lg-4">
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card-custom h-100 shadow-sm border-0"
                            >
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <div className="text-muted small">รหัสการจอง</div>
                                        <div className="fw-bold text-primary">{booking.bookingId}</div>
                                    </div>
                                    <span className={`badge rounded-pill px-3 py-2 ${getStatusBadgeClass(booking.status)}`}>
                                        {getStatusText(booking.status)}
                                    </span>
                                </div>

                                <div className="p-3 bg-light rounded-3 mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted">วันที่จอง:</span>
                                        <span className="small fw-bold">{new Date(booking.reservedAt).toLocaleDateString('th-TH')}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">ชำระภายใน:</span>
                                        <span className="small text-danger fw-bold">{new Date(booking.expiresAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span>
                                    </div>
                                </div>

                                <div className="d-grid gap-2 mt-4">
                                    <Link
                                        href={`/bookings/${booking.bookingId}`}
                                        className={`btn ${booking.status === 'RESERVED' ? 'btn-primary-custom' : 'btn-outline-primary'}`}
                                    >
                                        {booking.status === 'RESERVED' ? 'แจ้งชำระเงิน' : 'ดูรายละเอียด'}
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
