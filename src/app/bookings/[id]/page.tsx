'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { Booking, Stall } from '@/lib/db';
import { ApiResponse } from '@/lib/api';
import CountdownTimer from '@/components/CountdownTimer';
import PaymentUpload from '@/components/PaymentUpload';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, CreditCard, User, Clock, CheckCircle, XCircle, AlertCircle, Award, Sparkles, ShieldCheck, FileText, Banknote, Store, Info, Search } from 'lucide-react';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [stall, setStall] = useState<Stall | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBookingDetails = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        console.log('[BookingDetails] Loading data for:', id, isSilent ? '(silent)' : '');
        try {
            // 1. Fetch user
            const userRes = await fetch('/api/auth/me');
            if (!userRes.ok) {
                if (!isSilent) setLoading(false);
                return;
            }
            const userData = await userRes.json();
            const userId = userData.data?.user?.id;

            if (!userId) {
                if (!isSilent) setLoading(false);
                return;
            }

            // 2. Fetch booking
            const res = await fetch(`/api/bookings?userId=${userId}`);
            const data: ApiResponse<Booking[]> = await res.json();
            if (data.success && data.data) {
                const found = data.data.find(b => b.bookingId === id || b._id?.toString() === id);
                if (found) {
                    setBooking(found);

                    // 3. Fetch stall
                    const stallRes = await fetch(`/api/stalls`);
                    const stallData = await stallRes.json();
                    const stalls = stallData.data?.stalls || [];
                    const stallFound = stalls.find((s: any) => s._id === found.stallId || s._id?.toString() === found.stallId?.toString());
                    setStall(stallFound);
                }
            }
        } catch (error) {
            console.error('[BookingDetails] Error:', error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingDetails();
    }, [id]);

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
        <div className="container-fluid p-0 bg-light min-vh-100 font-kanit">
            {/* Hero Section */}
            <div className="home-hero pt-4 pb-4 mb-4" style={{ borderRadius: '0 0 50px 50px' }}>
                <div className="container position-relative z-1">
                    <div className="text-white text-center text-md-start">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="d-inline-block mb-3">
                            <Link href="/bookings" className="text-brand fw-bold text-decoration-none d-inline-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill shadow-sm small">
                                <ArrowLeft size={16} /> กลับไปหน้าการจอง
                            </Link>
                        </motion.div>
                        <h1 className="fw-bold mb-1">รายละเอียดการจอง</h1>
                        <p className="lead mb-0 fw-normal opacity-90 font-monospace">#{booking.bookingId}</p>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '-3rem' }}>
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-lg rounded-4 overflow-hidden mb-4">
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h2 className="h4 fw-bold mb-0 text-brand">ข้อมูลการจอง</h2>
                                    <span className={`badge rounded-pill px-3 py-2 d-flex align-items-center gap-2 ${booking.status === 'RESERVED' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' :
                                        booking.status === 'AWAITING_APPROVAL' ? 'bg-info bg-opacity-10 text-info border border-info border-opacity-25' :
                                            booking.status === 'CONFIRMED' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' :
                                                'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
                                        }`}>
                                        {booking.status === 'RESERVED' ? <Clock size={14} /> :
                                            booking.status === 'AWAITING_APPROVAL' ? <Search size={14} /> :
                                                booking.status === 'CONFIRMED' ? <CheckCircle size={14} /> :
                                                    booking.status === 'EXPIRED' ? <AlertCircle size={14} /> :
                                                        <XCircle size={14} />}
                                        {booking.status === 'RESERVED' ? 'รอชำระเงิน' :
                                            booking.status === 'AWAITING_APPROVAL' ? 'รอการตรวจสอบ' :
                                                booking.status === 'CONFIRMED' ? 'จองสำเร็จ' :
                                                    booking.status === 'EXPIRED' ? 'หมดอายุ' :
                                                        booking.status === 'CANCELLED' ? 'ถูกยกเลิก' : booking.status}
                                    </span>
                                </div>

                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-4 h-100 border border-light">
                                            <div className="d-flex align-items-center gap-2 text-primary mb-2">
                                                <Store size={18} />
                                                <div className="fw-bold">ล็อคที่เลือก</div>
                                            </div>
                                            <div className="h3 fw-bold text-dark mb-1">{stall?.stallId || '---'}</div>
                                            <div className="text-muted d-flex align-items-center gap-1">
                                                <MapPin size={14} /> {stall?.name || `โซน ${stall?.zone}`}
                                            </div>
                                            {stall?.description && (
                                                <div className="mt-3 small text-muted border-top pt-2 d-flex align-items-start gap-2">
                                                    <FileText size={14} className="mt-1 flex-shrink-0" />
                                                    <span>{stall.description}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="p-3 bg-light rounded-4 h-100 border border-light">
                                            <div className="d-flex align-items-center gap-2 text-success mb-2">
                                                <Banknote size={18} />
                                                <div className="fw-bold">ยอดชำระ</div>
                                            </div>
                                            <div className="h3 fw-bold text-dark mb-1">{(booking.totalPrice || stall?.price || 0).toLocaleString()}฿</div>
                                            <div className="text-muted small d-flex align-items-center gap-1">
                                                <Calendar size={14} /> {booking.bookingDays || 1} วัน
                                                {booking.startDate && booking.endDate && (
                                                    <span className="ms-1">
                                                        ({new Date(booking.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(booking.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })})
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-4 opacity-10" />

                                <div className="mb-4">
                                    <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                        <CreditCard size={20} className="text-brand" /> ข้อมูลการชำระเงิน
                                    </h5>
                                    <div className="p-4 border rounded-4 bg-white shadow-sm position-relative overflow-hidden">
                                        <div className="row g-3 position-relative z-1">
                                            <div className="col-sm-6">
                                                <div className="text-muted small">ธนาคาร</div>
                                                <div className="fw-bold text-dark">กสิกรไทย (K-Bank)</div>
                                            </div>
                                            <div className="col-sm-6 text-sm-end">
                                                <div className="text-muted small">เลขที่บัญชี</div>
                                                <div className="fw-bold font-monospace fs-5 text-primary">123-4-56789-0</div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="text-muted small">ชื่อบัญชี</div>
                                                <div className="fw-bold">บจก. ตลาดล็อคเซ็นเตอร์</div>
                                            </div>
                                            <div className="col-sm-6 text-sm-end">
                                                <div className="text-muted small">ยอดโอน</div>
                                                <div className="fw-bold text-success fs-4">{(booking.totalPrice || stall?.price || 0).toLocaleString()}฿</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div id="payment-upload-section">
                                    {booking.status === 'RESERVED' ? (
                                        <PaymentUpload
                                            bookingId={booking.bookingId}
                                            onSuccess={() => fetchBookingDetails(true)}
                                        />
                                    ) : (
                                        <div className="p-4 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-4 text-center">
                                            <div className="mb-2 text-success">
                                                <CheckCircle size={48} />
                                            </div>
                                            <h5 className="text-success fw-bold">อัพโหลดหลักฐานแล้ว</h5>
                                            <p className="text-muted small mb-0">กรุณารอเจ้าหน้าที่ตรวจสอบความถูกต้อง</p>
                                            {booking.paymentSlipUrl && (
                                                <a href={booking.paymentSlipUrl} target="_blank" className="btn btn-sm btn-link mt-2 d-inline-flex align-items-center gap-1">
                                                    <FileText size={14} /> ดูสลิปที่อัพโหลด
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-0 shadow-lg rounded-4 overflow-hidden bg-white">
                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <h5 className="fw-bold mb-3">สถานะการจอง</h5>

                                    {booking.status === 'RESERVED' && (
                                        <>
                                            <div className="d-flex justify-content-center">
                                                <CountdownTimer
                                                    expiresAt={booking.expiresAt}
                                                    onExpire={() => fetchBookingDetails(true)}
                                                />
                                            </div>
                                            <p className="text-muted small mt-3 px-3 mb-0">
                                                กรุณาชำระเงินและอัพโหลดสลิปภายในเวลาที่กำหนด
                                            </p>
                                        </>
                                    )}

                                    {booking.status === 'AWAITING_APPROVAL' && (
                                        <div className="py-4 text-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                className="d-inline-block text-info mb-3"
                                            >
                                                <Clock size={64} />
                                            </motion.div>
                                            <span className="d-block badge rounded-pill py-2 px-3 bg-info bg-opacity-10 text-info border border-info border-opacity-25 mb-3">
                                                รอการตรวจสอบความถูกต้อง
                                            </span>
                                            <p className="text-muted small mb-0">เจ้าหน้าที่กำลังตรวจสอบหลักฐานการโอนเงินของคุณ</p>
                                        </div>
                                    )}

                                    {booking.status === 'CONFIRMED' && (
                                        <div className="py-4 text-center">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                                transition={{ duration: 0.5, delay: 0.2 }}
                                                className="d-inline-block text-success mb-3"
                                            >
                                                <Sparkles size={64} />
                                            </motion.div>
                                            <div className="px-3 py-2 rounded-pill bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-bold mb-3">
                                                ยืนยันการจองสำเร็จ
                                            </div>
                                            <div className="p-3 rounded-4 bg-light border shadow-sm text-start">
                                                <div className="text-success fw-bold mb-1 d-flex align-items-center gap-2">
                                                    <CheckCircle size={16} /> ตรวจสอบเรียบร้อยแล้ว
                                                </div>
                                                <div className="small text-muted">ข้อมูลการชำระเงินถูกต้องสิทธิการใช้งานของคุณถูกเปิดใช้งานแล้ว</div>
                                            </div>
                                        </div>
                                    )}

                                    {(booking.status === 'EXPIRED' || booking.status === 'CANCELLED') && (
                                        <div className="py-4 text-center">
                                            <div className="d-inline-block text-danger mb-3">
                                                <XCircle size={64} />
                                            </div>
                                            <span className="d-block badge rounded-pill py-2 px-3 bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 mb-3">
                                                {booking.status === 'EXPIRED' ? 'หมดเวลาการจอง' : 'การจองถูกยกเลิก'}
                                            </span>
                                            {(booking as any).rejectedReason && (
                                                <div className="p-3 bg-danger bg-opacity-5 border border-danger border-opacity-20 rounded-4 text-start mb-3">
                                                    <div className="small fw-bold text-danger mb-1 d-flex align-items-center gap-1">
                                                        <Info size={14} /> เหตุผล:
                                                    </div>
                                                    <div className="small text-muted">{(booking as any).rejectedReason}</div>
                                                </div>
                                            )}
                                            <p className="text-muted small mb-0">ขออภัย คุณไม่สามารถดำเนินการต่อสำหรับรายการนี้ได้</p>
                                        </div>
                                    )}
                                </div>


                            </div>
                        </div>
                    </div>

                    {/* Ultra-Premium Digital License Section */}
                    {booking.status === 'CONFIRMED' && (
                        <div className="col-12 mt-4 pb-5">
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
                                                <span className="badge bg-primary px-3 py-2 rounded-3 mb-2 d-inline-flex align-items-center gap-2" style={{ letterSpacing: '2px', fontSize: '0.7rem' }}>
                                                    <Award size={14} /> CERTIFIED LICENSE
                                                </span>
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
                                                <div className="small opacity-50 mb-1 d-flex align-items-center gap-2">
                                                    <User size={12} /> LICENSE HOLDER
                                                </div>
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
                                                    <ShieldCheck size={18} />
                                                    <span className="fw-bold small">VERIFIED & ACTIVE</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-4 mb-5">
                                            <div className="col-6 col-sm-4">
                                                <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Booking ID</label>
                                                <div className="h5 fw-bold text-dark mb-0 font-monospace">{booking.bookingId}</div>
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
                                                <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Total Price</label>
                                                <div className="h5 fw-bold text-dark mb-0">{(booking.totalPrice || stall?.price || 0).toLocaleString()} ฿</div>
                                                <div className="small text-muted">({booking.bookingDays || 1} Days)</div>
                                            </div>
                                            <div className="col-6 col-sm-4">
                                                <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Valid Period</label>
                                                <div className="h5 fw-bold text-dark mb-0">
                                                    {booking.startDate ? new Date(booking.startDate).toLocaleDateString('th-TH') : 'N/A'} -
                                                </div>
                                                <div className="small text-muted">
                                                    {booking.endDate ? new Date(booking.endDate).toLocaleDateString('th-TH') : 'N/A'}
                                                </div>
                                            </div>
                                            <div className="col-6 col-sm-4">
                                                <label className="text-muted small fw-bold text-uppercase d-block mb-1" style={{ letterSpacing: '1px' }}>Status</label>
                                                <div className="h5 fw-bold text-success mb-0">ACTIVE</div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-top d-flex justify-content-between align-items-end">
                                            <div className="text-muted small">
                                                <div className="fw-bold text-dark mb-1">Official Verification Policy:</div>
                                                <p className="mb-0" style={{ maxWidth: '400px', lineHeight: '1.4' }}> This digital license serves as legal proof of stall lease. Authorized personnel may request this for inspection at any time. </p>
                                            </div>
                                            <div className="text-center opacity-75 d-none d-sm-block">
                                                <Award size={64} className="text-primary opacity-50" />
                                                <div className="small fw-bold text-primary mt-1">OFFICIAL SEAL</div>
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
        </div>
    );
}
