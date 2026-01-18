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
        revenue?: number;
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
        <div className="container-fluid p-0 bg-light min-vh-100">
            {/* Brand Header */}
            <div className="home-hero pt-5 pb-5 mb-5" style={{ borderRadius: '0 0 50px 50px' }}>
                <div className="hero-circle" style={{ width: '400px', height: '400px', top: '-100px', right: '-100px', opacity: 0.2 }}></div>
                <div className="container position-relative z-1">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="text-white">
                            <h1 className="fw-bold mb-1">Dashboard</h1>
                            <p className="lead mb-0 fw-normal">ภาพรวมระบบจัดการตลาดนัด</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '-4rem' }}>
                {/* Stats Overview */}
                <div className="row g-4 mb-5">
                    {/* Users Stats */}
                    <div className="col-lg-3 col-md-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--brand-light)', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>👥</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-dark">{stats?.totalUsers || 0}</div>
                                        <div className="text-dark small fw-medium">ผู้ใช้ทั้งหมด</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-light px-4 py-2 small text-dark border-top border-light">
                                <span className="text-success fw-bold">Active</span> users
                            </div>
                        </motion.div>
                    </div>

                    {/* Stalls Stats */}
                    <div className="col-lg-3 col-md-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--brand-light)', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>🏪</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-dark">{stats?.totalStalls || 0}</div>
                                        <div className="text-dark small fw-medium">แผงทั้งหมด</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-light px-4 py-2 small text-dark border-top border-light d-flex justify-content-between">
                                <span className="text-brand fw-bold">{stats?.availableStalls || 0} ว่าง</span>
                                <span className="text-muted fw-medium">{stats?.occupiedStalls || 0} จอง</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bookings Stats */}
                    <div className="col-lg-3 col-md-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--brand-light)', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>📋</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-dark">{stats?.totalBookings || 0}</div>
                                        <div className="text-dark small fw-medium">การจองทั้งหมด</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-light px-4 py-2 small text-dark border-top border-light">
                                <span className="text-warning fw-bold">{stats?.pendingBookings || 0}</span> รอตรวจสอบ
                            </div>
                        </motion.div>
                    </div>

                    {/* Revenue Stats - Fixed Contrast */}
                    <div className="col-lg-3 col-md-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden bg-white"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-primary)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--brand-light)', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>💰</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-brand">{(stats?.totalRevenue || 0).toLocaleString()}฿</div>
                                        <div className="text-dark small fw-medium">รายได้ทั้งหมด</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-light px-4 py-2 small text-dark border-top border-light">
                                Total Income
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Premium Intelligence Dashboard */}
                <div className="row g-4 mb-5">
                    <div className="col-lg-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="card border border-2 shadow-sm h-100 p-4"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h5 className="fw-bold mb-1 text-dark">Result</h5>
                                    <p className="text-secondary small mb-0">เปรียบเทียบสถิติการจองรายเดือน</p>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center gap-2 small">
                                        <div style={{ width: 12, height: 12, backgroundColor: 'var(--brand-primary)', borderRadius: 2 }}></div>
                                        <span className="text-dark fw-medium">จองทั้งหมด</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 small">
                                        <div style={{ width: 12, height: 12, backgroundColor: '#198754', borderRadius: 2 }}></div>
                                        <span className="text-dark fw-medium">รายได้ (฿)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Bar Chart Canvas */}
                            <div className="position-relative mt-5" style={{ height: '300px' }}>
                                <div className="d-flex justify-content-around align-items-end h-100 ps-4">
                                    {(stats?.monthlyStats || []).map((data, i) => {
                                        // Max values for normalization
                                        const maxCount = Math.max(...(stats?.monthlyStats || []).map(m => m.total), 1);
                                        const maxRevenue = Math.max(...(stats?.monthlyStats || []).map(m => m.revenue || 0), 1); // Prefer revenue if available

                                        // Normalize heights (cap at 100%)
                                        const h1 = (data.total / maxCount) * 100;
                                        // Fallback logic in case revenue is missing in types (though API sends it)
                                        const revenueVal = (data as any).revenue || 0;
                                        const h2 = (revenueVal / maxRevenue) * 100;

                                        return (
                                            <div key={i} className="text-center d-flex flex-column align-items-center" style={{ width: '15%' }}>
                                                {/* Tooltip-like value above bars (optional, maybe just bars for cleaner look) */}

                                                <div className="d-flex align-items-end gap-1 mb-2" style={{ height: '200px' }}>
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(h1, data.total > 0 ? 2 : 0)}%` }}
                                                        transition={{ duration: 1, delay: 0.6 + i * 0.05 }}
                                                        className="position-relative group rounded-top"
                                                        style={{ width: 12, backgroundColor: 'var(--brand-primary)' }}
                                                        title={`Total: ${data.total}`}
                                                    />
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${Math.max(h2, revenueVal > 0 ? 2 : 0)}%` }}
                                                        transition={{ duration: 1, delay: 0.8 + i * 0.05 }}
                                                        className="position-relative rounded-top"
                                                        style={{ width: 12, backgroundColor: '#198754' }}
                                                        title={`Revenue: ${revenueVal.toLocaleString()}฿`}
                                                    />
                                                </div>
                                                <span className="text-dark small fw-medium" style={{ fontSize: '0.75rem' }}>{data.month}</span>
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
                            className="card border border-2 shadow-sm h-100 p-4"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="text-center mb-5">
                                <div className="position-relative d-inline-block">
                                    <div className="position-relative d-inline-block">
                                        <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
                                            {/* Background Circle */}
                                            <circle cx="100" cy="100" r="70" fill="transparent" stroke="var(--gray-100)" strokeWidth="20" />

                                            {(() => {
                                                const total = stats?.totalBookings || 0;
                                                const confirmed = stats?.confirmedBookings || 0;
                                                const pending = stats?.pendingBookings || 0;
                                                const cancelled = stats?.cancelledBookings || 0;

                                                if (total === 0) return null;

                                                const radius = 70;
                                                const circumference = 2 * Math.PI * radius;

                                                const segments = [
                                                    { value: confirmed, color: 'var(--brand-primary)' }, // Confirmed
                                                    { value: pending, color: '#ffc107' }, // Pending (Warning/Info) - using standard yellow
                                                    { value: cancelled, color: '#dc3545' }, // Cancelled (Danger) - using standard red
                                                ];

                                                let accumulatedOffset = 0;

                                                return segments.map((seg, i) => {
                                                    const percent = seg.value / total;
                                                    const dashArray = percent * circumference;
                                                    const dashOffset = -accumulatedOffset; // Negative because we want to start after the previous one

                                                    accumulatedOffset += dashArray;

                                                    // If value is 0, don't render or render empty
                                                    if (seg.value === 0) return null;

                                                    return (
                                                        <motion.circle
                                                            key={i}
                                                            cx="100" cy="100" r={radius}
                                                            fill="transparent"
                                                            stroke={seg.color}
                                                            strokeWidth="20"
                                                            strokeDasharray={`${dashArray} ${circumference}`}
                                                            strokeDashoffset={dashOffset}
                                                            initial={{ strokeDasharray: `0 ${circumference}` }}
                                                            animate={{ strokeDasharray: `${dashArray} ${circumference}` }}
                                                            transition={{ duration: 1, delay: 0.5 + (i * 0.2), ease: "easeOut" }}
                                                            strokeLinecap="butt" // minimal gaps
                                                        />
                                                    );
                                                });
                                            })()}
                                        </svg>
                                        {/* Center Text */}
                                        <div className="position-absolute top-50 start-50 translate-middle text-center" >
                                            <div className="h3 fw-bold mb-0 text-dark">{stats?.totalBookings || 0}</div>
                                            <div className="small text-muted">รายการ</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: 'การจองสำเร็จ', color: 'var(--brand-primary)', value: stats?.confirmedBookings || 0 },
                                    { label: 'รอการตรวจสอบ', color: '#ffc107', value: stats?.pendingBookings || 0 },
                                    { label: 'ยกเลิก/หมดอายุ', color: '#dc3545', value: stats?.cancelledBookings || 0 },
                                ].map((item, idx) => (
                                    <div key={idx} className="d-flex justify-content-between align-items-center py-3 border-bottom border-light">
                                        <div className="d-flex align-items-center gap-3">
                                            <div style={{ width: 12, height: 12, borderRadius: '4px', backgroundColor: item.color }}></div>
                                            <span className="text-dark fw-medium" style={{ fontSize: '0.9rem' }}>{item.label}</span>
                                        </div>
                                        <span className="fw-bold text-dark">{item.value}</span>
                                    </div>
                                ))}
                            </div>


                        </motion.div>
                    </div>
                </div>


            </div>
        </div>
    );
}
