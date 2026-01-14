'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { Booking, Stall } from '@/lib/db';
import { ApiResponse } from '@/lib/api';
import CountdownTimer from '@/components/CountdownTimer';
import PaymentUpload from '@/components/PaymentUpload';
import Link from 'next/link';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [stall, setStall] = useState<Stall | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        setLoading(true);
        try {
            // In a real app, we'd have an API specifically for one booking
            // For now, we fetch all and find the one (or we can use searchParams)
            const res = await fetch(`/api/bookings`);
            const data: ApiResponse<Booking[]> = await res.json();

            if (data.success && data.data) {
                const found = data.data.find(b => b.bookingId === id || b._id === (id as any));
                if (found) {
                    setBooking(found);
                    // Fetch stall details
                    const stallRes = await fetch(`/api/stalls`);
                    const stallData = await stallRes.json();
                    const stallFound = stallData.data.stalls.find((s: any) => s._id === found.stallId);
                    setStall(stallFound);
                }
            }
        } catch (error) {
            console.error('Failed to fetch booking details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="container py-5 text-center">
                <h3>ไม่พบข้อมูลการจอง</h3>
                <Link href="/bookings" className="btn btn-primary-custom mt-3">กลับไปหน้าการจอง</Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="/bookings">การจองของฉัน</Link></li>
                    <li className="breadcrumb-item active">{booking.bookingId}</li>
                </ol>
            </nav>

            <div className="row g-4">
                <div className="col-lg-8">
                    <div className="card-custom mb-4 p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="h4 fw-bold mb-0">รายละเอียดการจอง</h2>
                            <span className={`badge rounded-pill px-3 py-2 ${booking.status === 'RESERVED' ? 'badge-reserved' :
                                booking.status === 'AWAITING_APPROVAL' ? 'bg-info bg-opacity-10 text-info border border-info border-opacity-25' :
                                    booking.status === 'CONFIRMED' ? 'badge-available' :
                                        'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                                }`}>
                                {booking.status === 'RESERVED' ? 'รอชำระเงิน' :
                                    booking.status === 'AWAITING_APPROVAL' ? 'รอการตรวจสอบ' :
                                        booking.status === 'CONFIRMED' ? 'จองสำเร็จ' :
                                            booking.status === 'EXPIRED' ? 'หมดอายุ' :
                                                booking.status === 'CANCELLED' ? 'ถูกยกเลิก' : booking.status}
                            </span>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded-3">
                                    <div className="text-muted small">ล็อคที่เลือก</div>
                                    <div className="h4 fw-bold text-primary mb-1">{stall?.stallId || '---'}</div>
                                    <div className="text-muted">{stall?.name || `แผงล็อค ${stall?.stallId}`}</div>
                                    {stall?.description && (
                                        <div className="mt-2 small text-muted border-top pt-2">
                                            <strong>📝 รายละเอียด:</strong> {stall.description}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-3 bg-light rounded-3">
                                    <div className="text-muted small">ยอดชำระทั้งสิ้น</div>
                                    <div className="h4 fw-bold text-success mb-1">{stall?.price.toLocaleString() || 0}฿</div>
                                    <div className="text-muted small">ขนาด {stall?.size || 0} ตร.ม.</div>
                                </div>
                            </div>
                        </div>

                        <hr className="my-4" />

                        <div className="mb-4">
                            <h5 className="fw-bold mb-3">📋 ข้อมูลการชำระเงิน</h5>
                            <div className="p-3 border rounded-3 bg-white">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">ธนาคาร</span>
                                    <span className="fw-bold">กสิกรไทย (K-Bank)</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">เลขที่บัญชี</span>
                                    <span className="fw-bold">123-4-56789-0</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">ชื่อบัญชี</span>
                                    <span className="fw-bold">บจก. ตลาดล็อคเซ็นเตอร์</span>
                                </div>
                            </div>
                        </div>

                        <div id="payment-upload-section">
                            {booking.status === 'RESERVED' ? (
                                <PaymentUpload
                                    bookingId={booking.bookingId}
                                    onSuccess={() => fetchBookingDetails()}
                                />
                            ) : (
                                <div className="p-4 bg-success bg-opacity-10 border border-success rounded-4 text-center">
                                    <div className="h2 mb-2">✅</div>
                                    <h5 className="text-success fw-bold">อัพโหลดหลักฐานแล้ว</h5>
                                    <p className="text-muted small mb-0">กรุณารอเจ้าหน้าที่ตรวจสอบความถูกต้อง</p>
                                    {booking.paymentSlipUrl && (
                                        <a href={booking.paymentSlipUrl} target="_blank" className="btn btn-sm btn-link mt-2">ดูสลิปที่อัพโหลด</a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card-custom p-4 sticky-top" style={{ top: '100px', zIndex: 10 }}>
                        <div className="text-center mb-4">
                            <h5 className="fw-bold mb-3">สถานะการจอง</h5>
                            {booking.status === 'RESERVED' ? (
                                <>
                                    <div className="d-flex justify-content-center">
                                        <CountdownTimer
                                            expiresAt={booking.expiresAt}
                                            onExpire={() => fetchBookingDetails()}
                                        />
                                    </div>
                                    <p className="text-muted small mt-3 px-3">
                                        กรุณาชำระเงินและอัพโหลดสลิปภายในเวลาที่กำหนด
                                    </p>
                                </>
                            ) : (
                                <div className="py-4 text-center">
                                    <div className="h1 text-info mb-3">🕒</div>
                                    <span className={`badge rounded-pill px-4 py-3 h5 mb-0 bg-info bg-opacity-10 text-info border border-info border-opacity-25`}>
                                        รอการตรวจสอบ
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="d-grid gap-2">
                            <Link href="/bookings" className="btn btn-outline-secondary py-2">
                                กลับไปหน้ารายการ
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
