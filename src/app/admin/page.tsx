'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/lib/api';
import './admin.css';

interface Zone {
    _id: string;
    name: string;
    description?: string;
    color?: string;
}

interface StallSize {
    _id: string;
    name: string;
    label: string;
    dimensions?: string;
}

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
    const [rejectingBooking, setRejectingBooking] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showCreateStallModal, setShowCreateStallModal] = useState(false);
    const [stallFormData, setStallFormData] = useState({
        zone: '',
        size: '',
        price: '',
        priceUnit: 'DAY' as 'DAY' | 'MONTH',
        description: '',
        quantity: '1',
        startNumber: '1',
    });
    const [stallFormError, setStallFormError] = useState('');
    const [viewingBooking, setViewingBooking] = useState<any | null>(null);

    // Zone & Size management state (combined)
    const [zones, setZones] = useState<Zone[]>([]);
    const [stallSizes, setStallSizes] = useState<StallSize[]>([]);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'zones' | 'sizes' | 'market'>('zones');
    const [zoneFormData, setZoneFormData] = useState({ name: '', description: '' });
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [sizeFormData, setSizeFormData] = useState({ name: '', label: '', dimensions: '' });
    const [editingSize, setEditingSize] = useState<StallSize | null>(null);
    const [marketSettings, setMarketSettings] = useState({
        autoReturnTime: '22:00',
        isAutoReturnEnabled: false,
        maxBookingDays: 7
    });

    useEffect(() => {
        fetchBookings();
        fetchZones();
        fetchStallSizes();
        fetchSettings();
        const interval = setInterval(() => {
            fetchBookings(false); // Background refresh every 10 seconds
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.success && data.data) {
                setMarketSettings({
                    autoReturnTime: data.data.autoReturnTime || '22:00',
                    isAutoReturnEnabled: data.data.isAutoReturnEnabled || false,
                    maxBookingDays: data.data.maxBookingDays || 7
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(marketSettings)
            });
            const data = await res.json();
            if (data.success) {
                alert('บันทึกการตั้งค่าเรียบร้อย');
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleManualReturn = async () => {
        if (!confirm('ยืนยันรคืนแผง "ทั้งหมด" ที่จองสำเร็จแล้ว? การดำเนินการนี้จะเปลี่ยนสถานะแผงเป็น "ว่าง" ทันที เพื่อเริ่มรอบการจองใหม่')) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/system/cleanup?forceReturn=true', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                alert(`คืนแผงเรียบร้อย: ${data.data.returnedCount} รายการ`);
                fetchBookings();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const fetchZones = async () => {
        try {
            const res = await fetch('/api/admin/zones');
            const data: ApiResponse<Zone[]> = await res.json();
            if (data.success && data.data) {
                setZones(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch zones:', error);
        }
    };

    const fetchStallSizes = async () => {
        try {
            const res = await fetch('/api/admin/stall-sizes');
            const data: ApiResponse<StallSize[]> = await res.json();
            if (data.success && data.data) {
                setStallSizes(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch stall sizes:', error);
        }
    };

    const handleCreateZone = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const url = editingZone ? `/api/admin/zones/${editingZone._id}` : '/api/admin/zones';
            const method = editingZone ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(zoneFormData)
            });
            const data = await res.json();
            if (data.success) {
                alert(editingZone ? 'อัปเดตโซนเรียบร้อย' : 'เพิ่มโซนเรียบร้อย');
                setZoneFormData({ name: '', description: '' });
                setEditingZone(null);
                fetchZones();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteZone = async (zone: Zone) => {
        if (!confirm(`ยืนยันการลบโซน "${zone.name}"?`)) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/zones/${zone._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert('ลบโซนเรียบร้อย');
                fetchZones();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateSize = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const url = editingSize ? `/api/admin/stall-sizes/${editingSize._id}` : '/api/admin/stall-sizes';
            const method = editingSize ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sizeFormData)
            });
            const data = await res.json();
            if (data.success) {
                alert(editingSize ? 'อัปเดตขนาดเรียบร้อย' : 'เพิ่มขนาดเรียบร้อย');
                setSizeFormData({ name: '', label: '', dimensions: '' });
                setEditingSize(null);
                fetchStallSizes();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSize = async (size: StallSize) => {
        if (!confirm(`ยืนยันการลบขนาด "${size.label}"?`)) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/stall-sizes/${size._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                alert('ลบขนาดเรียบร้อย');
                fetchStallSizes();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const fetchBookings = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch('/api/admin/bookings');
            const data: ApiResponse<any[]> = await res.json();
            if (data.success && data.data) {
                setBookings(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch admin bookings:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const handleApprove = async (bookingId: string) => {
        if (!confirm('ยืนยันการอนุมัติการจองนี้?')) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            });
            const data = await res.json();
            if (data.success) {
                alert('อนุมัติเรียบร้อยแล้ว');
                fetchBookings();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectingBooking || !rejectReason) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: rejectingBooking._id,
                    reason: rejectReason
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('ปฏิเสธการจองเรียบร้อยแล้ว');
                setRejectingBooking(null);
                setRejectReason('');
                fetchBookings();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (bookingId: string) => {
        if (!confirm('ยืนยันการลบรายการจองนี้? ข้อมูลทั้งหมดรวมถึงหลักฐานการชำระเงินจะถูกลบออก และสถานะล็อคจะกลับเป็น "ว่าง"')) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                alert('ลบรายการเรียบร้อยแล้ว');
                fetchBookings();
            } else {
                alert(data.error?.message || 'เกิดข้อผิดพลาด');
            }
        } catch (error) {
            alert('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateStall = async (e: React.FormEvent) => {
        e.preventDefault();
        setStallFormError('');
        setActionLoading(true);

        try {
            const response = await fetch('/api/admin/stalls/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    zone: stallFormData.zone,
                    size: stallFormData.size,
                    price: parseFloat(stallFormData.price),
                    priceUnit: stallFormData.priceUnit,
                    description: stallFormData.description || undefined,
                    quantity: parseInt(stallFormData.quantity),
                    startNumber: parseInt(stallFormData.startNumber),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setStallFormError(data.error?.message || 'ไม่สามารถเพิ่มแผงตลาดได้');
                return;
            }

            alert(`เพิ่มแผงตลาดสำเร็จ ${data.data.count} แผง!`);

            setShowCreateStallModal(false);
            setStallFormData({
                zone: '',
                size: '',
                price: '',
                priceUnit: 'DAY',
                description: '',
                quantity: '1',
                startNumber: '1',
            });
        } catch (err) {
            setStallFormError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RESERVED': return <span className="badge bg-warning text-dark">รอชำระเงิน</span>;
            case 'AWAITING_APPROVAL': return <span className="badge bg-info text-dark">รอตรวจสอบ</span>;
            case 'CONFIRMED': return <span className="badge bg-success">จองสำเร็จ</span>;
            case 'CANCELLED': return <span className="badge bg-danger">ยกเลิก/ปฏิเสธ</span>;
            case 'EXPIRED': return <span className="badge bg-secondary">หมดอายุ</span>;
            default: return <span className="badge bg-light text-dark">{status}</span>;
        }
    };

    const filteredBookings = filterStatus === 'ALL'
        ? bookings.filter(b => b.status !== 'EXPIRED' && b.status !== 'CANCELLED')
        : bookings.filter(b => b.status === filterStatus);

    // Stats calculation
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'AWAITING_APPROVAL').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        expired: bookings.filter(b => b.status === 'EXPIRED' || b.status === 'CANCELLED').length
    };

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="fw-bold mb-1 text-gradient">ระบบหลังบ้าน (Admin)</h1>
                    <p className="text-muted mb-0">จัดการการจองและตรวจสอบการชำระเงิน</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button
                        className="btn btn-primary-custom px-4"
                        onClick={() => setShowCreateStallModal(true)}
                    >
                        ➕ เพิ่มแผงตลาด
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => setShowSettingsModal(true)}
                    >
                        ⚙️ ตั้งค่าแผงตลาด
                    </button>
                    <button
                        className="btn btn-outline-warning"
                        onClick={async () => {
                            if (!confirm('ยืนยันการเคลียร์รายการการจองที่หมดอายุ?')) return;
                            try {
                                const res = await fetch('/api/admin/system/cleanup', { method: 'POST' });
                                const data = await res.json();
                                if (data.success) {
                                    alert(`ทำความสะอาดเรียบร้อย: ${data.data.count} รายการ`);
                                    fetchBookings();
                                }
                            } catch (e) {
                                alert('เกิดข้อผิดพลาดในการ Cleanup');
                            }
                        }}
                    >
                        🧹 เคลียร์รายการหมดอายุ
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="row g-4 mb-5">
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4">
                        <div className="h3 fw-bold mb-1">{stats.total}</div>
                        <div className="text-muted small uppercase">การจองทั้งหมด</div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4 border-start border-4 border-info">
                        <div className="h3 fw-bold text-info mb-1">{stats.pending}</div>
                        <div className="text-muted small uppercase">รอตรวจสอบสลิป</div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4 border-start border-4 border-success">
                        <div className="h3 fw-bold text-success mb-1">{stats.confirmed}</div>
                        <div className="text-muted small uppercase">จองสำเร็จแล้ว</div>
                    </div>
                </div>
                <div className="col-lg-3 col-md-6">
                    <div className="card-custom text-center p-4 border-start border-4 border-secondary">
                        <div className="h3 fw-bold text-secondary mb-1">{stats.expired}</div>
                        <div className="text-muted small uppercase">รายการที่เสียสิทธิ์</div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="mb-4 d-flex gap-2">
                <button
                    className={`btn btn-sm ${filterStatus === 'ALL' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterStatus('ALL')}
                >
                    จองที่ใช้งานอยู่
                </button>
                <button
                    className={`btn btn-sm ${filterStatus === 'AWAITING_APPROVAL' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterStatus('AWAITING_APPROVAL')}
                >
                    รอตรวจสอบ ({stats.pending})
                </button>
                <button
                    className={`btn btn-sm ${filterStatus === 'CONFIRMED' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterStatus('CONFIRMED')}
                >
                    อนุมัติแล้ว
                </button>
                <button
                    className={`btn btn-sm ${filterStatus === 'EXPIRED' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterStatus('EXPIRED')}
                >
                    หมดอายุ/ยกเลิก ({stats.expired})
                </button>
            </div>

            {/* Bookings Table/Cards */}
            {loading ? (
                <div className="row g-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="col-12">
                            <div className="card-custom p-4 border-0 shadow-sm animate-pulse" style={{ background: '#f8f9fa' }}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="bg-secondary bg-opacity-10 rounded w-25" style={{ height: '20px' }}></div>
                                    <div className="bg-secondary bg-opacity-10 rounded w-10" style={{ height: '20px' }}></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="card-custom text-center py-5 text-muted">ไม่พบข้อมูลการจอง</div>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="card-custom p-0 overflow-hidden shadow-sm d-none d-lg-block">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3">รหัสการจอง</th>
                                        <th className="py-3">ผู้จอง</th>
                                        <th className="py-3">ล็อค / โซน</th>
                                        <th className="py-3">ยอดชำระ</th>
                                        <th className="py-3">วันที่จอง</th>
                                        <th className="py-3">สถานะ</th>
                                        <th className="py-3 text-center">สลิป</th>
                                        <th className="px-4 py-3 text-end">ดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((b) => (
                                        <tr key={b._id}>
                                            <td className="px-4 fw-bold text-gradient">{b.bookingId}</td>
                                            <td>
                                                <div className="fw-bold">{b.user?.username || 'N/A'}</div>
                                                <div className="small text-muted">{b.user?.phone || '-'}</div>
                                            </td>
                                            <td>
                                                <div className="fw-bold">{b.stall?.stallId || 'N/A'}</div>
                                                <div className="small text-muted">โซน {b.stall?.zone}</div>
                                            </td>
                                            <td className="fw-bold text-success">
                                                {(b.totalPrice || b.stall?.price || 0).toLocaleString()}฿
                                                {b.bookingDays > 1 && <span className="text-muted small ms-1">({b.bookingDays} วัน)</span>}
                                            </td>
                                            <td>
                                                <div className="small">{b.startDate ? new Date(b.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}</div>
                                                <div className="small text-muted">ถึง {b.endDate ? new Date(b.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}</div>
                                            </td>
                                            <td>{getStatusBadge(b.status)}</td>
                                            <td className="text-center">
                                                {b.paymentSlipUrl ? (
                                                    <button
                                                        className="btn btn-sm btn-outline-info"
                                                        onClick={() => setSelectedSlip(b.paymentSlipUrl)}
                                                    >
                                                        👁️ ดูสลิป
                                                    </button>
                                                ) : <span className="text-muted small">ยังไม่อัพโหลด</span>}
                                            </td>
                                            <td className="px-4 text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    {b.status === 'AWAITING_APPROVAL' && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-success"
                                                                onClick={() => handleApprove(b._id)}
                                                                disabled={actionLoading}
                                                            >
                                                                อนุมัติ
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => setRejectingBooking(b)}
                                                                disabled={actionLoading}
                                                            >
                                                                ปฏิเสธ
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        className="btn btn-sm btn-light border"
                                                        onClick={() => setViewingBooking(b)}
                                                    >
                                                        รายละเอียด
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(b._id)}
                                                        disabled={actionLoading}
                                                    >
                                                        ลบ
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile/Tablet View */}
                    <div className="d-lg-none">
                        <div className="row g-3">
                            {filteredBookings.map((b) => (
                                <div key={b._id} className="col-12">
                                    <div className="card-custom p-3 border-0 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="fw-bold text-gradient">{b.bookingId}</span>
                                            {getStatusBadge(b.status)}
                                        </div>
                                        <div className="row g-2 mb-3">
                                            <div className="col-6">
                                                <small className="text-muted d-block">ผู้จอง</small>
                                                <strong>{b.user?.username || 'N/A'}</strong>
                                                <div className="small text-muted">{b.user?.phone || '-'}</div>
                                            </div>
                                            <div className="col-6 text-end">
                                                <small className="text-muted d-block">ล็อค / โซน</small>
                                                <strong>{b.stall?.stallId} ({b.stall?.zone})</strong>
                                            </div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                            <div className="text-success fw-bold">
                                                {b.stall?.price.toLocaleString()}฿
                                            </div>
                                            <div className="d-flex gap-2">
                                                {b.paymentSlipUrl && (
                                                    <button
                                                        className="btn btn-sm btn-info text-white"
                                                        onClick={() => setSelectedSlip(b.paymentSlipUrl)}
                                                    >
                                                        สลิป
                                                    </button>
                                                )}
                                                {b.status === 'AWAITING_APPROVAL' ? (
                                                    <button
                                                        className="btn btn-sm btn-success px-3"
                                                        onClick={() => handleApprove(b._id)}
                                                        disabled={actionLoading}
                                                    >
                                                        อนุมัติ
                                                    </button>
                                                ) : (
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-light border px-2"
                                                            onClick={() => setViewingBooking(b)}
                                                        >
                                                            รายละเอียด
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-danger px-2"
                                                            onClick={() => handleDelete(b._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            ลบ
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Slip Viewer Modal */}
            {selectedSlip && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setSelectedSlip(null)}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 bg-transparent">
                            <div className="modal-body p-0 text-center position-relative">
                                <button className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow" onClick={() => setSelectedSlip(null)}>✕</button>
                                <img src={selectedSlip} className="img-fluid rounded shadow-lg" alt="Payment Slip" style={{ maxHeight: '90vh' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectingBooking && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold">ปฏิเสธการจอง {rejectingBooking.bookingId}</h5>
                                    <button type="button" className="btn-close" onClick={() => setRejectingBooking(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small">เหตุผลที่ปฏิเสธ</label>
                                        <textarea
                                            className="form-control"
                                            rows={3}
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="เช่น ภาพสลิปไม่ชัดเจนเงินเข้าไม่ตรงยอด..."
                                        ></textarea>
                                    </div>
                                    <div className="d-grid">
                                        <button
                                            className="btn btn-danger py-2"
                                            disabled={!rejectReason || actionLoading}
                                            onClick={handleReject}
                                        >
                                            {actionLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการปฏิเสธ'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Booking Detail Modal */}
            <AnimatePresence>
                {viewingBooking && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-dialog modal-dialog-centered modal-lg"
                        >
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header border-0 modal-header-gradient p-4">
                                    <h5 className="modal-title fw-bold">รายละเอียดการจอง {viewingBooking.bookingId}</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setViewingBooking(null)}></button>
                                </div>
                                <div className="modal-body p-0">
                                    <div className="row g-0">
                                        <div className="col-md-7 p-4">
                                            <div className="mb-4">
                                                <h6 className="text-muted small fw-bold mb-3">👤 ข้อมูลผู้เช่า</h6>
                                                <div className="p-3 bg-light rounded-3">
                                                    <div className="mb-2"><strong>ชื่อ:</strong> {viewingBooking.user?.username || 'N/A'}</div>
                                                    <div><strong>เบอร์โทรศัพท์:</strong> {viewingBooking.user?.phone || 'N/A'}</div>
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <h6 className="text-muted small fw-bold mb-3">🏪 ข้อมูลล็อค</h6>
                                                <div className="p-3 bg-light rounded-3">
                                                    <div className="mb-2"><strong>รหัสล็อค:</strong> <span className="text-gradient fw-bold">{viewingBooking.stall?.stallId}</span></div>
                                                    <div className="mb-2"><strong>โซน:</strong> {viewingBooking.stall?.zone}</div>
                                                    <div className="mb-2"><strong>ขนาด:</strong> {viewingBooking.stall?.size} ตร.ม.</div>
                                                    <div><strong>ชื่อแผง:</strong> {viewingBooking.stall?.name}</div>
                                                </div>
                                            </div>
                                            <div>
                                                <h6 className="text-muted small fw-bold mb-3">🕒 สถานะและเวลา</h6>
                                                <div className="p-3 bg-light rounded-3">
                                                    <div className="mb-2"><strong>สถานะปัจจุบัน:</strong> {getStatusBadge(viewingBooking.status)}</div>
                                                    <div className="mb-2"><strong>วันที่ทำรายการ:</strong> {new Date(viewingBooking.reservedAt).toLocaleString('th-TH')}</div>
                                                    <div className="mb-2">
                                                        <strong>ช่วงเวลาที่จอง:</strong> <br />
                                                        {viewingBooking.startDate ? new Date(viewingBooking.startDate).toLocaleDateString('th-TH') : '-'} ถึง {viewingBooking.endDate ? new Date(viewingBooking.endDate).toLocaleDateString('th-TH') : '-'}
                                                        <span className="text-muted ms-2">({viewingBooking.bookingDays || 1} วัน)</span>
                                                    </div>
                                                    {viewingBooking.paymentUploadedAt && (
                                                        <div className="mb-2"><strong>วันที่โอนเงิน:</strong> {new Date(viewingBooking.paymentUploadedAt).toLocaleString('th-TH')}</div>
                                                    )}
                                                    {viewingBooking.rejectedReason && (
                                                        <div className="text-danger mt-2 p-2 border border-danger rounded">
                                                            <strong>เหตุผลที่ปฏิเสธ:</strong> {viewingBooking.rejectedReason}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5 bg-light p-4 border-start">
                                            <h6 className="text-muted small fw-bold mb-3">💰 หลักฐานการชำระเงิน</h6>
                                            {viewingBooking.paymentSlipUrl ? (
                                                <div className="text-center">
                                                    <img
                                                        src={viewingBooking.paymentSlipUrl}
                                                        className="img-fluid rounded shadow-sm mb-3"
                                                        style={{ maxHeight: '300px', cursor: 'pointer' }}
                                                        alt="Slip"
                                                        onClick={() => setSelectedSlip(viewingBooking.paymentSlipUrl)}
                                                    />
                                                    <div className="d-grid">
                                                        <button
                                                            className="btn btn-outline-secondary btn-sm"
                                                            onClick={() => setSelectedSlip(viewingBooking.paymentSlipUrl)}
                                                        >
                                                            🔍 ขยายรูปสลิป
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-5 text-muted">
                                                    <div className="h1">💳</div>
                                                    <p>ยังไม่มีการอัพโหลดสลิป</p>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-top">
                                                <div className="d-flex justify-content-between h5 fw-bold text-success mb-3">
                                                    <span>ยอดรวม ({viewingBooking.bookingDays || 1} วัน):</span>
                                                    <span>{(viewingBooking.totalPrice || viewingBooking.stall?.price || 0).toLocaleString()}฿</span>
                                                </div>

                                                {viewingBooking.status === 'AWAITING_APPROVAL' ? (
                                                    <div className="d-grid gap-2">
                                                        <button
                                                            className="btn btn-success py-2"
                                                            onClick={() => {
                                                                handleApprove(viewingBooking._id);
                                                                setViewingBooking(null);
                                                            }}
                                                        >
                                                            อนุมัติทันที
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger py-2"
                                                            onClick={() => {
                                                                setRejectingBooking(viewingBooking);
                                                                setViewingBooking(null);
                                                            }}
                                                        >
                                                            ปฏิเสธ
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="d-grid">
                                                        <button
                                                            className="btn btn-danger py-2"
                                                            onClick={() => {
                                                                handleDelete(viewingBooking._id);
                                                                setViewingBooking(null);
                                                            }}
                                                        >
                                                            ลบรายการนี้
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Settings Modal (Zones & Sizes combined) */}
            <AnimatePresence>
                {showSettingsModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered modal-lg"
                        >
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold">⚙️ ตั้งค่าแผงตลาด</h5>
                                    <button type="button" className="btn-close" onClick={() => {
                                        setShowSettingsModal(false);
                                        setEditingZone(null);
                                        setEditingSize(null);
                                        setZoneFormData({ name: '', description: '' });
                                        setSizeFormData({ name: '', label: '', dimensions: '' });
                                    }}></button>
                                </div>
                                <div className="modal-body p-0">
                                    {/* Tabs */}
                                    <ul className="nav nav-tabs px-4 pt-2">
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${settingsTab === 'zones' ? 'active' : ''}`}
                                                onClick={() => setSettingsTab('zones')}
                                            >
                                                🗂️ โซน ({zones.length})
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${settingsTab === 'sizes' ? 'active' : ''}`}
                                                onClick={() => setSettingsTab('sizes')}
                                            >
                                                📐 ขนาด ({stallSizes.length})
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button
                                                className={`nav-link ${settingsTab === 'market' ? 'active' : ''}`}
                                                onClick={() => setSettingsTab('market')}
                                            >
                                                🏪 ตั้งค่าการคืนล็อค
                                            </button>
                                        </li>
                                    </ul>

                                    <div className="p-4">
                                        {/* Zones Tab */}
                                        {settingsTab === 'zones' && (
                                            <>
                                                <form onSubmit={handleCreateZone} className="mb-4">
                                                    <div className="row g-3">
                                                        <div className="col-md-4">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="ชื่อโซน (เช่น A, B, อาหาร)"
                                                                value={zoneFormData.name}
                                                                onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                                                                required
                                                                disabled={actionLoading}
                                                            />
                                                        </div>
                                                        <div className="col-md-5">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="คำอธิบาย (ไม่บังคับ)"
                                                                value={zoneFormData.description}
                                                                onChange={(e) => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                                                                disabled={actionLoading}
                                                            />
                                                        </div>
                                                        <div className="col-md-3">
                                                            <button type="submit" className="btn btn-primary w-100" disabled={actionLoading}>
                                                                {editingZone ? 'อัปเดต' : 'เพิ่มโซน'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {editingZone && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm text-muted mt-2"
                                                            onClick={() => {
                                                                setEditingZone(null);
                                                                setZoneFormData({ name: '', description: '' });
                                                            }}
                                                        >
                                                            ยกเลิกการแก้ไข
                                                        </button>
                                                    )}
                                                </form>

                                                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead className="bg-light sticky-top">
                                                            <tr>
                                                                <th>ชื่อโซน</th>
                                                                <th>คำอธิบาย</th>
                                                                <th className="text-end">จัดการ</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {zones.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={3} className="text-center text-muted py-4">
                                                                        ยังไม่มีโซน กรุณาเพิ่มโซนใหม่
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                zones.map(zone => (
                                                                    <tr key={zone._id}>
                                                                        <td className="fw-bold">โซน {zone.name}</td>
                                                                        <td className="text-muted">{zone.description || '-'}</td>
                                                                        <td className="text-end">
                                                                            <button
                                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                                onClick={() => {
                                                                                    setEditingZone(zone);
                                                                                    setZoneFormData({ name: zone.name, description: zone.description || '' });
                                                                                }}
                                                                                disabled={actionLoading}
                                                                            >
                                                                                แก้ไข
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-danger"
                                                                                onClick={() => handleDeleteZone(zone)}
                                                                                disabled={actionLoading}
                                                                            >
                                                                                ลบ
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}

                                        {/* Sizes Tab */}
                                        {settingsTab === 'sizes' && (
                                            <>
                                                <form onSubmit={handleCreateSize} className="mb-4">
                                                    <div className="row g-3">
                                                        <div className="col-md-3">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="รหัส (SMALL, M)"
                                                                value={sizeFormData.name}
                                                                onChange={(e) => setSizeFormData({ ...sizeFormData, name: e.target.value })}
                                                                required
                                                                disabled={actionLoading}
                                                            />
                                                        </div>
                                                        <div className="col-md-4">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="ชื่อแสดง (เล็ก 2x2)"
                                                                value={sizeFormData.label}
                                                                onChange={(e) => setSizeFormData({ ...sizeFormData, label: e.target.value })}
                                                                required
                                                                disabled={actionLoading}
                                                            />
                                                        </div>
                                                        <div className="col-md-3">
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="ขนาด (2x2 เมตร)"
                                                                value={sizeFormData.dimensions}
                                                                onChange={(e) => setSizeFormData({ ...sizeFormData, dimensions: e.target.value })}
                                                                disabled={actionLoading}
                                                            />
                                                        </div>
                                                        <div className="col-md-2">
                                                            <button type="submit" className="btn btn-primary w-100" disabled={actionLoading}>
                                                                {editingSize ? 'อัปเดต' : 'เพิ่ม'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {editingSize && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-link btn-sm text-muted mt-2"
                                                            onClick={() => {
                                                                setEditingSize(null);
                                                                setSizeFormData({ name: '', label: '', dimensions: '' });
                                                            }}
                                                        >
                                                            ยกเลิกการแก้ไข
                                                        </button>
                                                    )}
                                                </form>

                                                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                    <table className="table table-hover mb-0">
                                                        <thead className="bg-light sticky-top">
                                                            <tr>
                                                                <th>รหัส</th>
                                                                <th>ชื่อที่แสดง</th>
                                                                <th>ขนาด</th>
                                                                <th className="text-end">จัดการ</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {stallSizes.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={4} className="text-center text-muted py-4">
                                                                        ยังไม่มีขนาด กรุณาเพิ่มขนาดใหม่
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                stallSizes.map(size => (
                                                                    <tr key={size._id}>
                                                                        <td className="fw-bold">{size.name}</td>
                                                                        <td>{size.label}</td>
                                                                        <td className="text-muted">{size.dimensions || '-'}</td>
                                                                        <td className="text-end">
                                                                            <button
                                                                                className="btn btn-sm btn-outline-primary me-2"
                                                                                onClick={() => {
                                                                                    setEditingSize(size);
                                                                                    setSizeFormData({
                                                                                        name: size.name,
                                                                                        label: size.label,
                                                                                        dimensions: size.dimensions || ''
                                                                                    });
                                                                                }}
                                                                                disabled={actionLoading}
                                                                            >
                                                                                แก้ไข
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-sm btn-outline-danger"
                                                                                onClick={() => handleDeleteSize(size)}
                                                                                disabled={actionLoading}
                                                                            >
                                                                                ลบ
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </>
                                        )}

                                        {/* Market Settings Tab */}
                                        {settingsTab === 'market' && (
                                            <div className="py-2">
                                                <div className="alert alert-info mb-4">
                                                    <div className="d-flex gap-2">
                                                        <span className="fs-4">ℹ️</span>
                                                        <div>
                                                            <div className="fw-bold">ระบบคืนล็อคอัตโนมัติ</div>
                                                            <div className="small">เมื่อถึงเวลาที่กำหนด ระบบจะทำการเปลี่ยนสถานะแผงที่จองสำเร็จแล้วทั้งหมดให้กลับเป็น "ว่าง" อัตโนมัติ เพื่อรองรับการจองในรอบถัดไป</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <form onSubmit={handleSaveSettings}>
                                                    <div className="card border-0 bg-light p-4 rounded-4 mb-4">
                                                        <div className="row g-4">
                                                            <div className="col-md-6">
                                                                <label className="form-label fw-bold small mb-2">สถานะการทำงาน</label>
                                                                <div className="form-check form-switch pt-1">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        role="switch"
                                                                        id="autoReturnSwitch"
                                                                        checked={marketSettings.isAutoReturnEnabled}
                                                                        onChange={(e) => setMarketSettings({ ...marketSettings, isAutoReturnEnabled: e.target.checked })}
                                                                    />
                                                                    <label className="form-check-label ms-2" htmlFor="autoReturnSwitch">
                                                                        {marketSettings.isAutoReturnEnabled ? 'เปิดใช้งานการคืนอัตโนมัติ' : 'ปิดการใช้งาน'}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-6">
                                                                <label className="form-label fw-bold small mb-2">เวลาคืนล็อคอัตโนมัติ</label>
                                                                <input
                                                                    type="time"
                                                                    className="form-control"
                                                                    value={marketSettings.autoReturnTime}
                                                                    onChange={(e) => setMarketSettings({ ...marketSettings, autoReturnTime: e.target.value })}
                                                                    disabled={!marketSettings.isAutoReturnEnabled}
                                                                />
                                                                <div className="form-text small">แผงจะถูกคืนระบบเมื่อคนเข้าหน้าเว็บหลังจากเวลานี้</div>
                                                            </div>
                                                            <div className="col-12 border-top pt-3">
                                                                <label className="form-label fw-bold small mb-2">ระยะเวลาที่จองได้สูงสุด (วัน)</label>
                                                                <div className="d-flex align-items-center gap-3">
                                                                    <div className="input-group" style={{ maxWidth: '200px' }}>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control"
                                                                            value={marketSettings.maxBookingDays}
                                                                            onChange={(e) => setMarketSettings({ ...marketSettings, maxBookingDays: parseInt(e.target.value) || 1 })}
                                                                            min="1"
                                                                            max="30"
                                                                        />
                                                                        <span className="input-group-text">วัน</span>
                                                                    </div>
                                                                    <div className="form-text small m-0">กำหนดให้ผู้ใช้สามารถจองล่วงหน้าได้สูงสุดกี่วัน</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="mt-4 pt-3 border-top text-end">
                                                            <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                                                                บันทึกการตั้งค่า
                                                            </button>
                                                        </div>
                                                    </div>
                                                </form>

                                                <div className="card border-danger bg-danger bg-opacity-10 p-4 rounded-4">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <div className="fw-bold text-danger">คืนแผงทั้มหมด (Manual Reset)</div>
                                                            <div className="small text-danger opacity-75">สั่งคืนล็อคทั้งหมดที่จองสำเร็จแล้วให้กลับเป็น "ว่าง" ทันที โดยไม่ต้องรอเวลา</div>
                                                        </div>
                                                        <button
                                                            className="btn btn-danger px-4"
                                                            onClick={handleManualReturn}
                                                            disabled={actionLoading}
                                                        >
                                                            🔥 คืนแผงทันที
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Stall Modal */}
            <AnimatePresence>
                {showCreateStallModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered modal-lg"
                        >
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold">➕ เพิ่มแผงตลาด</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCreateStallModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {stallFormError && (
                                        <div className="alert alert-danger mb-3" role="alert">
                                            {stallFormError}
                                        </div>
                                    )}

                                    <form onSubmit={handleCreateStall}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label htmlFor="quantity" className="form-label fw-semibold small">
                                                    จำนวนแผง <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="quantity"
                                                    placeholder="เช่น 10"
                                                    min="1"
                                                    max="100"
                                                    value={stallFormData.quantity}
                                                    onChange={(e) =>
                                                        setStallFormData({ ...stallFormData, quantity: e.target.value })
                                                    }
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="startNumber" className="form-label fw-semibold small">
                                                    เลขเริ่มต้น <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    id="startNumber"
                                                    placeholder="เช่น 1"
                                                    min="1"
                                                    value={stallFormData.startNumber}
                                                    onChange={(e) =>
                                                        setStallFormData({ ...stallFormData, startNumber: e.target.value })
                                                    }
                                                    required
                                                    disabled={actionLoading}
                                                />
                                                <div className="form-text">
                                                    {stallFormData.zone && `จะสร้างรหัสแผงเป็น ${stallFormData.zone}-${String(stallFormData.startNumber).padStart(3, '0')} ถึง ${stallFormData.zone}-${String(parseInt(stallFormData.startNumber || '1') + parseInt(stallFormData.quantity || '1') - 1).padStart(3, '0')}`}
                                                </div>
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="zone" className="form-label fw-semibold small">
                                                    โซน <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    id="zone"
                                                    value={stallFormData.zone}
                                                    onChange={(e) =>
                                                        setStallFormData({ ...stallFormData, zone: e.target.value })
                                                    }
                                                    required
                                                    disabled={actionLoading}
                                                >
                                                    <option value="">เลือกโซน</option>
                                                    {zones.map(zone => (
                                                        <option key={zone._id} value={zone.name}>
                                                            โซน {zone.name} {zone.description ? `(${zone.description})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {zones.length === 0 && (
                                                    <div className="form-text text-warning">
                                                        ยังไม่มีโซน กรุณาเพิ่มโซนก่อน
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="size" className="form-label fw-semibold small">
                                                    ขนาด <span className="text-danger">*</span>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    id="size"
                                                    value={stallFormData.size}
                                                    onChange={(e) =>
                                                        setStallFormData({ ...stallFormData, size: e.target.value })
                                                    }
                                                    required
                                                    disabled={actionLoading}
                                                >
                                                    <option value="">เลือกขนาด</option>
                                                    {stallSizes.map(size => (
                                                        <option key={size._id} value={size.name}>
                                                            {size.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {stallSizes.length === 0 && (
                                                    <div className="form-text text-warning">
                                                        ยังไม่มีขนาด กรุณาเพิ่มขนาดก่อน
                                                    </div>
                                                )}
                                            </div>

                                            <div className="col-md-6">
                                                <label htmlFor="price" className="form-label fw-semibold small">
                                                    ราคา <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        id="price"
                                                        placeholder="เช่น 500"
                                                        min="0"
                                                        step="1"
                                                        value={stallFormData.price}
                                                        onChange={(e) =>
                                                            setStallFormData({ ...stallFormData, price: e.target.value })
                                                        }
                                                        required
                                                        disabled={actionLoading}
                                                    />
                                                    <span className="input-group-text bg-light text-muted">บาท/วัน</span>
                                                </div>
                                            </div>

                                            <div className="col-12">
                                                <label htmlFor="description" className="form-label fw-semibold small">
                                                    รายละเอียดเพิ่มเติม
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    id="description"
                                                    rows={3}
                                                    placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับแผง (ถ้ามี)"
                                                    value={stallFormData.description}
                                                    onChange={(e) =>
                                                        setStallFormData({ ...stallFormData, description: e.target.value })
                                                    }
                                                    disabled={actionLoading}
                                                ></textarea>
                                            </div>
                                        </div>

                                        <div className="d-grid mt-4">
                                            <button
                                                type="submit"
                                                className="btn btn-primary-custom py-2"
                                                disabled={actionLoading}
                                            >
                                                {actionLoading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        กำลังเพิ่มแผงตลาด...
                                                    </>
                                                ) : (
                                                    '✓ เพิ่มแผงตลาด'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
