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
                    <Link href="/admin" className="btn btn-outline-primary">
                        📋 จัดการการจอง
                    </Link>
                    <Link href="/admin/users" className="btn btn-outline-primary">
                        👥 จัดการผู้ใช้
                    </Link>
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

            {/* Booking Status Breakdown */}
            <div className="row g-4 mb-5">
                <div className="col-lg-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card-custom p-4 h-100"
                    >
                        <h5 className="fw-bold mb-4">สถานะการจอง</h5>
                        <div className="row g-3">
                            <div className="col-6 col-md-3">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="h4 fw-bold text-warning mb-1">
                                        {stats?.pendingBookings || 0}
                                    </div>
                                    <div className="small text-muted">รอตรวจสอบ</div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="h4 fw-bold text-success mb-1">
                                        {stats?.confirmedBookings || 0}
                                    </div>
                                    <div className="small text-muted">จองสำเร็จ</div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="h4 fw-bold text-danger mb-1">
                                        {stats?.cancelledBookings || 0}
                                    </div>
                                    <div className="small text-muted">ยกเลิก/หมดอายุ</div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="text-center p-3 bg-light rounded-3">
                                    <div className="h4 fw-bold text-primary mb-1">
                                        {stats?.totalBookings || 0}
                                    </div>
                                    <div className="small text-muted">ทั้งหมด</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="col-lg-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="card-custom p-4 h-100"
                    >
                        <h5 className="fw-bold mb-4">ลิงก์ด่วน</h5>
                        <div className="d-grid gap-2">
                            <Link href="/admin" className="btn btn-outline-primary text-start">
                                <span className="me-2">📋</span> จัดการการจอง
                            </Link>
                            <Link href="/admin/users" className="btn btn-outline-primary text-start">
                                <span className="me-2">👥</span> จัดการผู้ใช้
                            </Link>
                            <Link href="/market" className="btn btn-outline-secondary text-start">
                                <span className="me-2">🏪</span> ดูหน้าตลาด
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Recent Bookings */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="card-custom p-4"
            >
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">การจองล่าสุด</h5>
                    <Link href="/admin" className="btn btn-sm btn-outline-primary">
                        ดูทั้งหมด
                    </Link>
                </div>

                {recentBookings.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        ยังไม่มีข้อมูลการจอง
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-3 py-3">รหัสการจอง</th>
                                    <th className="py-3">ผู้จอง</th>
                                    <th className="py-3">ล็อค</th>
                                    <th className="py-3">สถานะ</th>
                                    <th className="py-3">วันที่</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBookings.map((booking) => (
                                    <tr key={booking._id}>
                                        <td className="px-3 fw-bold text-primary">{booking.bookingId}</td>
                                        <td>{booking.user?.fullName || 'N/A'}</td>
                                        <td>{booking.stall?.stallId || 'N/A'}</td>
                                        <td>{getStatusBadge(booking.status)}</td>
                                        <td className="text-muted small">
                                            {new Date(booking.createdAt).toLocaleDateString('th-TH')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
