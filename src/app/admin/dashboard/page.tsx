'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface DashboardStats {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalUsers: number;
    totalStalls: number;
    availableStalls: number;
    occupiedStalls: number;
    totalRevenue: number;
    monthlyStats?: {
        month: string;
        total: number;
        confirmed: number;
    }[];
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentBookings, setRecentBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, statsRes] = await Promise.all([
                fetch('/api/admin/bookings'),
                fetch('/api/admin/stats')
            ]);

            const bookingsData = await bookingsRes.json();
            const statsData = await statsRes.json();

            if (bookingsData.success && bookingsData.data) {
                setRecentBookings(bookingsData.data.slice(0, 5));
            }

            if (statsData.success && statsData.data) {
                setStats(statsData.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RESERVED': return <span className="badge bg-warning text-dark">รอชำระเงิน</span>;
            case 'AWAITING_APPROVAL': return <span className="badge bg-info text-dark">รอตรวจสอบ</span>;
            case 'CONFIRMED': return <span className="badge bg-success">จองสำเร็จ</span>;
            case 'CANCELLED': return <span className="badge bg-danger">ยกเลิก</span>;
            case 'EXPIRED': return <span className="badge bg-secondary">หมดอายุ</span>;
            default: return <span className="badge bg-light text-dark">{status}</span>;
        }
    };

    if (loading) {
        return (
            <div className="container py-5">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">กำลังโหลด...</span>
                    </div>
                    <p className="mt-3 text-muted">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="fw-bold mb-1">Dashboard</h1>
                    <p className="text-muted mb-0">ภาพรวมระบบจัดการตลาดนัด</p>
                </div>
                <div className="d-flex gap-2">
                    {/* Buttons removed as requested */}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                {/* Users Stats */}
                <div className="col-lg-3 col-md-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card-custom p-4 h-100"
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                                <span style={{ fontSize: '1.5rem' }}>👥</span>
                            </div>
                            <div>
                                <div className="h3 fw-bold mb-0">{stats?.totalUsers || 0}</div>
                                <div className="text-muted small">ผู้ใช้ทั้งหมด</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Stalls Stats */}
                <div className="col-lg-3 col-md-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card-custom p-4 h-100"
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3">
                                <span style={{ fontSize: '1.5rem' }}>🏪</span>
                            </div>
                            <div>
                                <div className="h3 fw-bold mb-0">{stats?.totalStalls || 0}</div>
                                <div className="text-muted small">แผงทั้งหมด</div>
                                <div className="small">
                                    <span className="text-success">{stats?.availableStalls || 0} ว่าง</span>
                                    {' / '}
                                    <span className="text-danger">{stats?.occupiedStalls || 0} จอง</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bookings Stats */}
                <div className="col-lg-3 col-md-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card-custom p-4 h-100"
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-info bg-opacity-10 p-3">
                                <span style={{ fontSize: '1.5rem' }}>📋</span>
                            </div>
                            <div>
                                <div className="h3 fw-bold mb-0">{stats?.totalBookings || 0}</div>
                                <div className="text-muted small">การจองทั้งหมด</div>
                                <div className="small text-info">
                                    {stats?.pendingBookings || 0} รอตรวจสอบ
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Revenue Stats */}
                <div className="col-lg-3 col-md-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="card-custom p-4 h-100 border-start border-4 border-success"
                    >
                        <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle bg-success bg-opacity-10 p-3">
                                <span style={{ fontSize: '1.5rem' }}>💰</span>
                            </div>
                            <div>
                                <div className="h3 fw-bold text-success mb-0">
                                    {(stats?.totalRevenue || 0).toLocaleString()}฿
                                </div>
                                <div className="text-muted small">รายได้ทั้งหมด</div>
                                <div className="small text-muted">จากการจองที่สำเร็จ</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Premium Intelligence Dashboard */}
            <div className="row g-4 mb-5">
                {/* Left Section: Result Bar Chart */}
                <div className="col-lg-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card-custom p-4 h-100 border-0 shadow-sm"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h5 className="fw-bold mb-1" style={{ color: '#1e293b' }}>Result</h5>
                                <p className="text-muted small mb-0">เปรียบเทียบสถิติการจองรายเดือน</p>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center gap-2 small">
                                    <div style={{ width: 12, height: 12, backgroundColor: '#fb923c', borderRadius: 2 }}></div>
                                    <span className="text-muted">จองทั้งหมด</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 small">
                                    <div style={{ width: 12, height: 12, backgroundColor: '#1e293b', borderRadius: 2 }}></div>
                                    <span className="text-muted">ชำระเงินแล้ว</span>
                                </div>
                                <button className="btn btn-sm text-white px-3 py-1 ms-2" style={{ backgroundColor: '#fb923c', borderRadius: 20, fontSize: '0.75rem' }}>
                                    Check Now
                                </button>
                            </div>
                        </div>

                        {/* Custom Bar Chart Canvas */}
                        <div className="position-relative mt-5" style={{ height: '300px' }}>
                            {/* Grid Lines */}
                            {[0, 25, 50, 75, 100].map((level) => (
                                <div key={level} className="position-absolute w-100 border-bottom border-light" style={{ bottom: `${level}%`, height: 1 }}>
                                    <span className="position-absolute small text-muted" style={{ left: -30, top: -10, fontSize: '0.65rem' }}>{level}</span>
                                </div>
                            ))}

                            {/* Bar Series */}
                            <div className="d-flex justify-content-around align-items-end h-100 ps-4">
                                {(stats?.monthlyStats || []).map((data, i) => {
                                    // Find max value to scale the bars
                                    const maxVal = Math.max(...(stats?.monthlyStats || []).map(m => m.total), 1);
                                    const h1 = (data.total / maxVal) * 100;
                                    const h2 = (data.confirmed / maxVal) * 100;

                                    return (
                                        <div key={i} className="text-center d-flex flex-column align-items-center" style={{ width: '15%' }}>
                                            <div className="d-flex align-items-end gap-1 mb-2">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h1}%` }}
                                                    transition={{ duration: 1, delay: 0.6 + i * 0.05 }}
                                                    style={{ width: 12, backgroundColor: '#fb923c', borderRadius: '4px 4px 0 0' }}
                                                />
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h2}%` }}
                                                    transition={{ duration: 1, delay: 0.8 + i * 0.05 }}
                                                    style={{ width: 12, backgroundColor: '#1e293b', borderRadius: '4px 4px 0 0' }}
                                                />
                                            </div>
                                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>{data.month}</span>
                                        </div>
                                    );
                                })}
                                {(stats?.monthlyStats?.length === 0) && (
                                    <div className="text-center w-100 text-muted small">ยังไม่มีข้อมูลรายเดือน</div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Section: Donut Chart & Status */}
                <div className="col-lg-4">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="card-custom p-4 h-100 border-0 shadow-sm"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <div className="text-center mb-5">
                            <div className="position-relative d-inline-block">
                                <svg width="200" height="200" viewBox="0 0 200 200">
                                    <circle cx="100" cy="100" r="80" fill="transparent" stroke="#f8fafc" strokeWidth="25" />
                                    {/* Donut Segment Orange (Confirmed) */}
                                    {(() => {
                                        const confirmed = stats?.confirmedBookings || 0;
                                        const total = stats?.totalBookings || 1;
                                        const percentage = Math.round((confirmed / total) * 100);
                                        const circumference = 2 * Math.PI * 80;
                                        const dashoffset = circumference - (percentage / 100) * circumference;
                                        return (
                                            <>
                                                <motion.circle
                                                    cx="100" cy="100" r="80"
                                                    fill="transparent"
                                                    stroke="#fb923c"
                                                    strokeWidth="25"
                                                    strokeDasharray={circumference}
                                                    initial={{ strokeDashoffset: circumference }}
                                                    animate={{ strokeDashoffset: dashoffset }}
                                                    transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
                                                    strokeLinecap="round"
                                                    transform="rotate(-90 100 100)"
                                                />
                                                <text x="100" y="105" textAnchor="middle" className="fw-bold" style={{ fontSize: '2.5rem', fill: '#1e293b' }}>
                                                    {percentage}%
                                                </text>
                                            </>
                                        );
                                    })()}
                                </svg>
                            </div>
                        </div>

                        {/* Status List */}
                        <div className="space-y-4">
                            {[
                                { label: 'การจองสำเร็จ', color: '#fb923c', value: stats?.confirmedBookings || 0 },
                                { label: 'รอการตรวจสอบ', color: '#1e293b', value: stats?.pendingBookings || 0 },
                                { label: 'ยกเลิก/หมดอายุ', color: '#e2e8f0', value: stats?.cancelledBookings || 0 },
                                { label: 'เป้าหมายรายเดือน', color: '#f1f5f9', value: '1,200+' }
                            ].map((item, idx) => (
                                <div key={idx} className="d-flex justify-content-between align-items-center py-3 border-bottom border-light-subtle">
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></div>
                                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>{item.label}</span>
                                    </div>
                                    <span className="fw-bold" style={{ color: '#1e293b' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5">
                            <button className="btn w-100 py-3 text-white fw-bold shadow-sm" style={{ backgroundColor: '#fb923c', borderRadius: 12 }}>
                                Check Now
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Section: Market Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="card-custom p-4 border-0 shadow-sm bg-white"
            >
                <div className="row align-items-center">
                    <div className="col-md-8">
                        <h6 className="fw-bold mb-2" style={{ color: '#1e293b' }}>ระบบบริหารจัดการแผงตลาด stalllock</h6>
                        <p className="text-muted small mb-0">
                            ข้อมูลสถิติด้านบนถูกรวบรวมแบบเรียลไทม์จากฐานข้อมูลเพื่อความแม่นยำในการวิเคราะห์ผลตอบแทนและการจัดการแผง
                        </p>
                    </div>
                    <div className="col-md-4 text-md-end mt-3 mt-md-0">
                        <Link href="/market" className="btn btn-outline-dark px-4 py-2" style={{ borderRadius: 10 }}>
                            เข้าสู่หน้าตลาดจริง
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
