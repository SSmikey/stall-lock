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
                    <div className="card-custom p-4">
                        <div className="text-center mb-4">
                            <h5 className="fw-bold mb-3">สถานะการจอง</h5>

                            {booking.status === 'RESERVED' && (
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
                            )}

                            {booking.status === 'AWAITING_APPROVAL' && (
                                <div className="py-4 text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="display-4 text-info mb-3"
                                    >
                                        🕒
                                    </motion.div>
                                    <span className="badge rounded-pill px-4 py-3 h5 mb-0 bg-info bg-opacity-10 text-info border border-info border-opacity-25 w-100">
                                        รอการตรวจสอบความถูกต้อง
                                    </span>
                                    <p className="text-muted small mt-3 mb-0">เจ้าหน้าที่กำลังตรวจสอบหลักฐานการโอนเงินของคุณ</p>
                                </div>
                            )}

                            {booking.status === 'CONFIRMED' && (
                                <div className="py-4 text-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1, y: [0, -10, 0] }}
                                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
                                        className="display-4 text-success mb-3"
                                    >
                                        ✨
                                    </motion.div>
                                    <div className="px-3 py-2 rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-bold mb-3">
                                        ยืนยันการจองสำเร็จ
                                    </div>
                                    <div className="p-3 rounded-4 bg-light border shadow-sm">
                                        <div className="text-success fw-bold mb-1">ตรวจสอบเรียบร้อยแล้ว ✅</div>
                                        <div className="small text-muted">ข้อมูลการชำระเงินถูกต้องสิทธิการใช้งานของคุณถูกเปิดใช้งานแล้ว</div>
                                    </div>
                                </div>
                            )}

                            {(booking.status === 'EXPIRED' || booking.status === 'CANCELLED') && (
                                <div className="py-4 text-center">
                                    <div className="display-4 text-danger mb-3">❌</div>
                                    <span className="badge rounded-pill px-4 py-3 h5 mb-0 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 w-100">
                                        {booking.status === 'EXPIRED' ? 'หมดเวลาการจอง' : 'การจองถูกยกเลิก'}
                                    </span>
                                    <p className="text-muted small mt-3">ขออภัย คุณไม่สามารถดำเนินการต่อสำหรับรายการนี้ได้</p>
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

                {/* Ultra-Premium Digital License Section */}
                {booking.status === 'CONFIRMED' && (
                    <div className="col-12 mt-4">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="position-relative overflow-hidden"
                            style={{
                                borderRadius: '30px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                                background: '#fff'
                            }}
                        >
                            {/* Decorative Background Elements */}
                            <div className="position-absolute" style={{ top: '-10%', right: '-5%', width: '40%', height: '120%', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.1) 100%)', transform: 'skewX(-15deg)', zIndex: 0 }}></div>

                            <div className="row g-0 position-relative" style={{ zIndex: 1 }}>
                                {/* Left Side: Branding & Identification */}
                                <div className="col-md-4 bg-dark p-5 text-white d-flex flex-column justify-content-between border-end border-light border-opacity-10"
                                    style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)' }}>
                                    <div>
                                        <div className="mb-4">
                                            <span className="badge bg-primary px-3 py-2 rounded-3 mb-2" style={{ letterSpacing: '2px', fontSize: '0.7rem' }}>CERTIFIED LICENSE</span>
                                            <h2 className="fw-bold mb-0">STALL LOCK</h2>
                                            <p className="small opacity-50">Market Intelligence System</p>
                                        </div>
                                        <div className="py-5 text-center">
                                            <div className="display-4 fw-bold text-gradient mb-1" style={{ fontSize: '4rem' }}>{stall?.stallId}</div>
                                            <div className="h5 fw-light text-uppercase opacity-75" style={{ letterSpacing: '4px' }}>Authorized Stall</div>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                                            <div className="small opacity-50 mb-1">LICENSE HOLDER</div>
                                            <div className="fw-bold">{(booking as any).user?.fullName || 'ผู้จองแผงล็อค'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Details & Verification */}
                                <div className="col-md-8 p-5">
                                    <div className="d-flex justify-content-between align-items-start mb-5">
                                        <div>
                                            <h3 className="fw-bold text-dark mb-1">ใบอนุญาตใช้พื้นที่แผงล็อค</h3>
                                            <p className="text-muted small mb-0">STALL LEASE AUTHORIZATION</p>
                                        </div>
                                        <div className="text-end text-success">
                                            <div className="d-flex align-items-center gap-2 px-3 py-2 bg-success bg-opacity-10 rounded-pill border border-success border-opacity-20">
                                                <div className="spinner-grow spinner-grow-sm text-success" role="status"></div>
                                                <span className="fw-bold small">VERIFIED & ACTIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row g-4 mb-5">
                                        <div className="col-6 col-sm-4">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Booking ID</label>
                                            <div className="h5 fw-bold text-dark mb-0">{booking.bookingId}</div>
                                        </div>
                                        <div className="col-6 col-sm-4">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Zone / Area</label>
                                            <div className="h5 fw-bold text-dark mb-0">ZONE {stall?.zone}</div>
                                        </div>
                                        <div className="col-6 col-sm-4">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Stall Size</label>
                                            <div className="h5 fw-bold text-dark mb-0">{stall?.size} Sq.m.</div>
                                        </div>
                                        <div className="col-6 col-sm-4">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Price/Day</label>
                                            <div className="h5 fw-bold text-dark mb-0">{stall?.price?.toLocaleString()} ฿</div>
                                        </div>
                                        <div className="col-6 col-sm-4">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Issued Date</label>
                                            <div className="h5 fw-bold text-dark mb-0">{new Date(booking.updatedAt || new Date()).toLocaleDateString('th-TH')}</div>
                                        </div>
                                        <div className="col-6 col-sm-4">
                                            <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Status</label>
                                            <div className="h5 fw-bold text-success mb-0">PERMANENT</div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-top d-flex justify-content-between align-items-end">
                                        <div className="text-muted small">
                                            <div className="fw-bold text-dark mb-1">Official Verification Policy:</div>
                                            <p className="mb-0" style={{ maxWidth: '400px', lineHeight: '1.4' }}> This digital license serves as legal proof of stall lease. Authorized personnel may request this for inspection at any time. </p>
                                        </div>
                                        <div className="text-center opacity-75 d-none d-sm-block">
                                            <div className="display-6 mb-1">🎖️</div>
                                            <div className="small fw-bold text-primary">OFFICIAL SEAL</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Holographic Security Bar */}
                            <div style={{ height: '6px', width: '100%', background: 'linear-gradient(90deg, #4f46e5, #0ea5e9, #10b981, #f59e0b, #ef4444, #4f46e5)', backgroundSize: '200% auto', animation: 'gradientMove 3s linear infinite' }}></div>
                            <style jsx global>{`
                                @keyframes gradientMove {
                                    0% { background-position: 0% 50%; }
                                    100% { background-position: 200% 50%; }
                                }
                            `}</style>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
