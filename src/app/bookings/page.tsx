'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Booking, Stall } from '@/lib/db';
import { ApiResponse } from '@/lib/api';

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
                // For each booking, fetch stall details (in a real app, use populate/lookup)
                const bookingsWithStalls = await Promise.all(data.data.map(async (booking) => {
                    const stallRes = await fetch(`/api/stalls?stallId=${booking.stallId}`);
                    const stallData = await stallRes.json();
                    return {
                        ...booking,
                        stall: stallData.success ? stallData.data.stalls.find((s: any) => s._id === booking.stallId) : null
                    };
                }));
                // Note: The /api/stalls currently returns all stalls if filter is empty. 
                // Since I don't have a single stall fetcher yet, I'll just show the booking data.
                // Actually, let's just use what's returned.
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
            case 'AWAITING_PAYMENT': return 'badge-reserved';
            case 'AWAITING_APPROVAL': return 'badge-booked';
            case 'CONFIRMED': return 'badge-available'; // Using existing colors or custom
            case 'EXPIRED':
            case 'CANCELLED': return 'bg-secondary text-white';
            default: return 'bg-light text-dark';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'RESERVED': return 'รอการชำระเงิน';
            case 'AWAITING_PAYMENT': return 'รอตรวจสอบสลิป';
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
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : bookings.length === 0 ? (
                <div className="card-custom text-center py-5">
                    <div className="mb-3 text-muted" style={{ fontSize: '3rem' }}>📋</div>
                    <h5>คุณยังไม่มีการจองในขณะนี้</h5>
                    <p className="text-muted">ไปที่หน้าตลาดเพื่อเลือกจองล็อคที่ต้องการ</p>
                    <a href="/market" className="btn btn-primary-custom mt-2">ไปที่หน้าตลาด</a>
                </div>
            ) : (
                <div className="row g-4">
                    {bookings.map((booking) => (
                        <div key={booking.bookingId} className="col-md-6 col-lg-4">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="card-custom h-100"
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
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">รหัสล็อค:</span>
                                        <span className="fw-bold">{booking.stallId.toString().slice(-6).toUpperCase()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-1">
                                        <span className="text-muted">วันที่จอง:</span>
                                        <span className="small">{new Date(booking.reservedAt).toLocaleDateString('th-TH')}</span>
                                    </div>
                                </div>

                                {booking.status === 'RESERVED' && (
                                    <div className="alert alert-warning py-2 small mb-3">
                                        <strong>⚠️ กรุณาชำระเงิน</strong><br />
                                        ภายใน {new Date(booking.expiresAt).toLocaleTimeString('th-TH')}
                                    </div>
                                )}

                                <div className="d-grid gap-2">
                                    {booking.status === 'RESERVED' && (
                                        <button className="btn btn-primary-custom w-100">
                                            อัพโหลดสลิปชำระเงิน
                                        </button>
                                    )}
                                    <button className="btn btn-outline-secondary btn-sm">
                                        รายละเอียดเพิ่มเติม
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
