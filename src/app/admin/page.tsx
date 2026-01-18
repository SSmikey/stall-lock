'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiResponse } from '@/lib/api';
import { showAlert, showConfirm } from '@/utils/sweetalert';

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

interface StallForDelete {
    _id: string;
    stallId: string;
    zone: string;
    status: string;
    price: number;
    priceUnit: string;
    hasActiveBooking: boolean;
}

interface DeletePreview {
    totalStalls: number;
    stallsWithActiveBookings: number;
    stallsAvailable: number;
    affectedBookingsCount: number;
    stalls: StallForDelete[];
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
    const [inspectingBooking, setInspectingBooking] = useState<any | null>(null);

    // Zone & Size management state (combined)
    const [zones, setZones] = useState<Zone[]>([]);
    const [stallSizes, setStallSizes] = useState<StallSize[]>([]);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'zones' | 'sizes' | 'market' | 'stalls'>('zones');
    const [zoneFormData, setZoneFormData] = useState({ name: '', description: '' });
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [sizeFormData, setSizeFormData] = useState({ name: '', label: '', dimensions: '' });
    const [editingSize, setEditingSize] = useState<StallSize | null>(null);
    const [marketSettings, setMarketSettings] = useState({
        autoReturnTime: '22:00',
        isAutoReturnEnabled: false,
        maxBookingDays: 7
    });

    // Stall deletion state
    const [stallDeleteMode, setStallDeleteMode] = useState<'ALL' | 'ZONE' | 'SPECIFIC'>('SPECIFIC');
    const [stallDeleteZone, setStallDeleteZone] = useState<string>('');
    const [selectedStallsForDelete, setSelectedStallsForDelete] = useState<string[]>([]);
    const [allStallsForDelete, setAllStallsForDelete] = useState<StallForDelete[]>([]);
    const [stallsFilter, setStallsFilter] = useState({ zone: '', status: '' });
    const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null);
    const [forceDelete, setForceDelete] = useState(false);
    const [loadingStalls, setLoadingStalls] = useState(false);

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
                showAlert('สำเร็จ', 'บันทึกการตั้งค่าเรียบร้อย', 'success');
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleManualReturn = async () => {
        if (!await showConfirm('ยืนยันการคืนแผง', 'ยืนยันคืนแผง "ทั้งหมด" ที่จองสำเร็จแล้ว? การดำเนินการนี้จะเปลี่ยนสถานะแผงเป็น "ว่าง" ทันที เพื่อเริ่มรอบการจองใหม่', 'ยืนยัน', 'warning')) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/system/cleanup?forceReturn=true', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showAlert('สำเร็จ', `คืนแผงเรียบร้อย: ${data.data.returnedCount} รายการ`, 'success');
                fetchBookings();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
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
                showAlert('สำเร็จ', editingZone ? 'อัปเดตโซนเรียบร้อย' : 'เพิ่มโซนเรียบร้อย', 'success');
                setZoneFormData({ name: '', description: '' });
                setEditingZone(null);
                fetchZones();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteZone = async (zone: Zone) => {
        if (!await showConfirm('ยืนยันการลบ', `ยืนยันการลบโซน "${zone.name}"?`, 'ลบ', 'warning')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/zones/${zone._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showAlert('สำเร็จ', 'ลบโซนเรียบร้อย', 'success');
                fetchZones();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
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
                showAlert('สำเร็จ', editingSize ? 'อัปเดตขนาดเรียบร้อย' : 'เพิ่มขนาดเรียบร้อย', 'success');
                setSizeFormData({ name: '', label: '', dimensions: '' });
                setEditingSize(null);
                fetchStallSizes();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSize = async (size: StallSize) => {
        if (!await showConfirm('ยืนยันการลบ', `ยืนยันการลบขนาด "${size.label}"?`, 'ลบ', 'warning')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/stall-sizes/${size._id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showAlert('สำเร็จ', 'ลบขนาดเรียบร้อย', 'success');
                fetchStallSizes();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Stall deletion functions
    const fetchAllStallsForDelete = async () => {
        setLoadingStalls(true);
        try {
            // First fetch all stalls from public API
            const stallsRes = await fetch('/api/stalls');
            const stallsData = await stallsRes.json();

            if (stallsData.success && stallsData.data && stallsData.data.stalls) {
                const stalls = stallsData.data.stalls;

                // Then fetch booking info to determine which stalls have active bookings
                const previewRes = await fetch('/api/admin/stalls/delete?mode=ALL');
                const previewData = await previewRes.json();

                let activeBookingStallIds = new Set<string>();
                if (previewData.success && previewData.data && previewData.data.stalls) {
                    previewData.data.stalls.forEach((s: any) => {
                        if (s.hasActiveBooking) {
                            activeBookingStallIds.add(s._id);
                        }
                    });
                }

                // Map stalls with hasActiveBooking info
                const mappedStalls: StallForDelete[] = stalls.map((s: any) => ({
                    _id: s._id.toString ? s._id.toString() : s._id,
                    stallId: s.stallId,
                    zone: s.zone,
                    status: s.status,
                    price: s.price,
                    priceUnit: s.priceUnit,
                    hasActiveBooking: activeBookingStallIds.has(s._id.toString ? s._id.toString() : s._id)
                }));

                setAllStallsForDelete(mappedStalls);
            } else {
                console.error('Failed to fetch stalls:', stallsData.error);
                setAllStallsForDelete([]);
            }
        } catch (error) {
            console.error('Failed to fetch stalls:', error);
            setAllStallsForDelete([]);
        } finally {
            setLoadingStalls(false);
        }
    };

    const fetchDeletePreview = async () => {
        // Calculate preview from local data instead of API call
        let stallsToPreview: StallForDelete[] = [];

        if (stallDeleteMode === 'ALL') {
            stallsToPreview = allStallsForDelete;
        } else if (stallDeleteMode === 'ZONE' && stallDeleteZone) {
            stallsToPreview = allStallsForDelete.filter(s => s.zone === stallDeleteZone);
        } else if (stallDeleteMode === 'SPECIFIC' && selectedStallsForDelete.length > 0) {
            stallsToPreview = allStallsForDelete.filter(s => selectedStallsForDelete.includes(s._id));
        }

        const stallsWithActiveBookings = stallsToPreview.filter(s => s.hasActiveBooking).length;
        const totalStalls = stallsToPreview.length;

        setDeletePreview({
            totalStalls,
            stallsWithActiveBookings,
            stallsAvailable: totalStalls - stallsWithActiveBookings,
            affectedBookingsCount: stallsWithActiveBookings, // Approximate
            stalls: stallsToPreview
        });
    };

    useEffect(() => {
        if (settingsTab === 'stalls' && showSettingsModal) {
            fetchAllStallsForDelete();
        }
    }, [settingsTab, showSettingsModal]);

    useEffect(() => {
        if (settingsTab === 'stalls' && showSettingsModal && allStallsForDelete.length > 0) {
            fetchDeletePreview();
        }
    }, [stallDeleteMode, stallDeleteZone, selectedStallsForDelete, settingsTab, showSettingsModal, allStallsForDelete]);

    const getFilteredStalls = () => {
        return allStallsForDelete.filter(stall => {
            if (stallsFilter.zone && stall.zone !== stallsFilter.zone) return false;
            if (stallsFilter.status && stall.status !== stallsFilter.status) return false;
            return true;
        });
    };

    const handleSelectAllStalls = (checked: boolean) => {
        if (checked) {
            const filteredIds = getFilteredStalls().map(s => s._id);
            setSelectedStallsForDelete(filteredIds);
        } else {
            setSelectedStallsForDelete([]);
        }
    };

    const handleToggleStallSelection = (stallId: string) => {
        setSelectedStallsForDelete(prev =>
            prev.includes(stallId)
                ? prev.filter(id => id !== stallId)
                : [...prev, stallId]
        );
    };

    const handleDeleteStalls = async () => {
        if (!deletePreview) return;

        const count = forceDelete ? deletePreview.totalStalls : deletePreview.stallsAvailable;
        if (count === 0) {
            showAlert('ไม่มีแผงที่สามารถลบได้', 'กรุณาเลือกแผงที่ต้องการลบ หรือเปิดใช้ "บังคับลบ"', 'warning');
            return;
        }

        let confirmMessage = '';
        if (forceDelete) {
            confirmMessage = `ยืนยันการลบ ${deletePreview.totalStalls} แผง?\n\nการดำเนินการนี้จะลบข้อมูลการจอง ${deletePreview.affectedBookingsCount} รายการด้วย`;
        } else {
            confirmMessage = `ยืนยันการลบ ${deletePreview.stallsAvailable} แผง?`;
            if (deletePreview.stallsWithActiveBookings > 0) {
                confirmMessage += `\n\n(ข้าม ${deletePreview.stallsWithActiveBookings} แผงที่มีการจองอยู่)`;
            }
        }

        if (!await showConfirm('ยืนยันการลบแผง', confirmMessage, 'ยืนยันลบ', 'warning')) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/stalls/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: stallDeleteMode,
                    zone: stallDeleteZone,
                    stallIds: selectedStallsForDelete,
                    forceDelete
                })
            });
            const data = await res.json();
            if (data.success) {
                let msg = `ลบแผงสำเร็จ ${data.data.deletedCount} แผง`;
                if (data.data.skippedCount > 0) {
                    msg += ` (ข้าม ${data.data.skippedCount} แผงที่มีการจอง)`;
                }
                showAlert('สำเร็จ', msg, 'success');
                setSelectedStallsForDelete([]);
                setForceDelete(false);
                fetchAllStallsForDelete();
                fetchDeletePreview();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
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
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            });
            const data = await res.json();
            if (data.success) {
                showAlert('สำเร็จ', 'อนุมัติเรียบร้อยแล้ว', 'success');
                fetchBookings();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
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
                showAlert('สำเร็จ', 'ปฏิเสธการจองเรียบร้อยแล้ว', 'success');
                setRejectingBooking(null);
                setRejectReason('');
                fetchBookings();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (bookingId: string) => {
        if (!await showConfirm('ยืนยันการลบ', 'ยืนยันการลบรายการจองนี้? ข้อมูลทั้งหมดรวมถึงหลักฐานการชำระเงินจะถูกลบออก และสถานะล็อคจะกลับเป็น "ว่าง"', 'ลบ', 'warning')) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showAlert('สำเร็จ', 'ลบรายการเรียบร้อยแล้ว', 'success');
                fetchBookings();
            } else {
                showAlert('ผิดพลาด', data.error?.message || 'เกิดข้อผิดพลาด', 'error');
            }
        } catch (error) {
            showAlert('ผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'error');
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

            showAlert('สำเร็จ', `เพิ่มแผงตลาดสำเร็จ ${data.data.count} แผง!`, 'success');

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
            case 'RESERVED': return <span className="badge bg-warning bg-opacity-25 text-warning-emphasis border border-warning border-opacity-25">รอชำระเงิน</span>;
            case 'AWAITING_APPROVAL': return <span className="badge bg-info bg-opacity-25 text-info-emphasis border border-info border-opacity-25">รอตรวจสอบ</span>;
            case 'CONFIRMED': return <span className="badge bg-success bg-opacity-25 text-success-emphasis border border-success border-opacity-25">จองสำเร็จ</span>;
            case 'CANCELLED': return <span className="badge bg-danger bg-opacity-25 text-danger-emphasis border border-danger border-opacity-25">ยกเลิก/ปฏิเสธ</span>;
            case 'EXPIRED': return <span className="badge bg-secondary bg-opacity-25 text-secondary-emphasis border border-secondary border-opacity-25">หมดอายุ</span>;
            default: return <span className="badge bg-light text-dark border">{status}</span>;
        }
    };

    const filteredBookings = (() => {
        if (filterStatus === 'ALL') return bookings;
        if (filterStatus === 'EXPIRED') return bookings.filter(b => b.status === 'EXPIRED' || b.status === 'CANCELLED');
        return bookings.filter(b => b.status === filterStatus);
    })();

    // Stats calculation
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'AWAITING_APPROVAL').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        expired: bookings.filter(b => b.status === 'EXPIRED' || b.status === 'CANCELLED').length
    };

    return (
        <div className="container-fluid p-0 bg-light min-vh-100 font-kanit">
            {/* Brand Header */}
            <div className="home-hero pt-5 pb-5 mb-5" style={{ borderRadius: '0 0 50px 50px' }}>
                <div className="hero-circle" style={{ width: '400px', height: '400px', top: '-100px', right: '-100px', opacity: 0.2 }}></div>
                <div className="container position-relative z-1">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div className="text-white">
                            <h1 className="fw-bold mb-1">Admin Dashboard</h1>
                            <p className="lead mb-0 fw-normal opacity-75">จัดการการจองและตรวจสอบการชำระเงิน</p>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                className="btn btn-light shadow-sm fw-bold border-0 text-brand d-flex align-items-center gap-2 hover-scale"
                                onClick={() => setShowCreateStallModal(true)}
                                style={{ borderRadius: '50px', padding: '8px 20px', fontSize: '0.9rem' }}
                            >
                                <span className="fs-6">➕</span> เพิ่มแผงตลาด
                            </button>
                            <button
                                className="btn btn-white bg-white text-dark border-0 fw-bold d-flex align-items-center gap-2 hover-scale"
                                onClick={() => setShowSettingsModal(true)}
                                style={{ borderRadius: '50px', padding: '8px 20px', fontSize: '0.9rem' }}
                            >
                                <span className="fs-6">⚙️</span> ตั้งค่า
                            </button>
                            <button
                                className="btn btn-white bg-white text-danger bg-opacity-75 border-0 fw-bold d-flex align-items-center gap-2 hover-scale shadow-sm"
                                onClick={async () => {
                                    if (!await showConfirm('ยืนยันการเคลียร์', 'ยืนยันการเคลียร์รายการการจองที่หมดอายุ?', 'ยืนยัน', 'warning')) return;
                                    try {
                                        const res = await fetch('/api/admin/system/cleanup', { method: 'POST' });
                                        const data = await res.json();
                                        if (data.success) {
                                            showAlert('สำเร็จ', `ทำความสะอาดเรียบร้อย: ${data.data.count} รายการ`, 'success');
                                            fetchBookings();
                                        }
                                    } catch (e) {
                                        showAlert('ผิดพลาด', 'เกิดข้อผิดพลาดในการ Cleanup', 'error');
                                    }
                                }}
                                style={{ borderRadius: '50px', padding: '8px 20px', fontSize: '0.9rem' }}
                            >
                                <span className="fs-6">🧹</span> เคลียร์รายการหมดอายุ
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '-4rem' }}>
                {/* Stats Overview */}
                <div className="row g-4 mb-5">
                    <div className="col-lg-3 col-md-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'var(--brand-light)', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>📋</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-dark">{stats.total}</div>
                                        <div className="text-dark small fw-medium">การจองทั้งหมด</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

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
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#E0F2F1', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>⏳</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-info">{stats.pending}</div>
                                        <div className="text-dark small fw-medium">รอตรวจสอบ</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

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
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#E8F5E9', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>✅</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-success">{stats.confirmed}</div>
                                        <div className="text-dark small fw-medium">จองสำเร็จ</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

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
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FFEBEE', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>🚫</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-secondary">{stats.expired}</div>
                                        <div className="text-dark small fw-medium">รายการที่เสียสิทธิ์</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="card border-0 shadow-sm mb-5 overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
                    <div className="card-header bg-white p-4 border-bottom border-light d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <h5 className="fw-bold mb-0 text-dark">รายการการจอง</h5>
                        <div className="d-flex gap-2 flex-wrap">
                            <button
                                className={`btn btn-sm px-3 rounded-pill fw-medium ${filterStatus === 'ALL' ? 'btn-dark' : 'btn-light text-secondary'}`}
                                onClick={() => setFilterStatus('ALL')}
                            >
                                ทั้งหมด
                            </button>
                            <button
                                className={`btn btn-sm px-3 rounded-pill fw-medium ${filterStatus === 'AWAITING_APPROVAL' ? 'btn-info text-white' : 'btn-light text-secondary'}`}
                                onClick={() => setFilterStatus('AWAITING_APPROVAL')}
                            >
                                รอตรวจสอบ
                            </button>
                            <button
                                className={`btn btn-sm px-3 rounded-pill fw-medium ${filterStatus === 'CONFIRMED' ? 'btn-success text-white' : 'btn-light text-secondary'}`}
                                onClick={() => setFilterStatus('CONFIRMED')}
                            >
                                อนุมัติแล้ว
                            </button>
                            <button
                                className={`btn btn-sm px-3 rounded-pill fw-medium ${filterStatus === 'EXPIRED' ? 'btn-secondary text-white' : 'btn-light text-secondary'}`}
                                onClick={() => setFilterStatus('EXPIRED')}
                            >
                                หมดอายุ/ยกเลิก
                            </button>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        {loading ? (
                            <div className="p-5 text-center">
                                <div className="spinner-border text-brand" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2">กำลังโหลดข้อมูล...</p>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <span style={{ fontSize: '3rem', opacity: 0.5 }}>📭</span>
                                <p className="mt-2">ไม่พบรายการจองในสถานะนี้</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="d-none d-lg-block">
                                    <table className="table align-middle mb-0 table-hover">
                                        <thead className="bg-light text-secondary text-uppercase small">
                                            <tr>
                                                <th className="px-4 py-3 fw-bold border-0">Booking ID</th>
                                                <th className="py-3 fw-bold border-0">ผู้จอง</th>
                                                <th className="py-3 fw-bold border-0">ข้อมูลแผง</th>
                                                <th className="py-3 fw-bold border-0">ยอดชำระ</th>
                                                <th className="py-3 fw-bold border-0">ช่วงเวลา</th>
                                                <th className="py-3 fw-bold border-0">สถานะ</th>
                                                <th className="py-3 fw-bold border-0 text-center">สลิป</th>
                                                <th className="px-4 py-3 fw-bold border-0 text-end">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="border-top-0">
                                            {filteredBookings.map((b) => (
                                                <tr key={b._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td className="px-4 fw-bold text-primary">{b.bookingId}</td>
                                                    <td>
                                                        <div className="fw-bold text-dark">{b.user?.username || 'N/A'}</div>
                                                        <div className="small text-muted">{b.user?.phone || '-'}</div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="badge bg-light text-dark border border-secondary border-opacity-25">
                                                                {b.stall?.stallId || 'N/A'}
                                                            </span>
                                                            <span className="small text-muted">โซน {b.stall?.zone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="fw-bold text-success">
                                                        {(b.totalPrice || b.stall?.price || 0).toLocaleString()}฿
                                                    </td>
                                                    <td>
                                                        <div className="small fw-medium text-dark">{b.startDate ? new Date(b.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '-'}</div>
                                                        <div className="small text-muted" style={{ fontSize: '0.75rem' }}>ถึง {b.endDate ? new Date(b.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '-'}</div>
                                                    </td>
                                                    <td>{getStatusBadge(b.status)}</td>
                                                    <td className="text-center">
                                                        {b.paymentSlipUrl ? (
                                                            <button
                                                                className="btn btn-sm bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-3 fw-bold"
                                                                onClick={() => setSelectedSlip(b.paymentSlipUrl)}
                                                            >
                                                                📱 ดูสลิป
                                                            </button>
                                                        ) : <span className="text-muted small">-</span>}
                                                    </td>
                                                    <td className="px-4 text-end">
                                                        <div className="d-flex gap-2 justify-content-end">
                                                            {b.status === 'AWAITING_APPROVAL' ? (
                                                                <>
                                                                    <button
                                                                        className="btn btn-sm btn-success px-3 rounded-pill fw-bold"
                                                                        onClick={() => setInspectingBooking(b)}
                                                                        disabled={actionLoading}
                                                                    >
                                                                        อนุมัติ
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-sm btn-outline-danger px-3 rounded-pill fw-bold"
                                                                        onClick={() => setRejectingBooking(b)}
                                                                        disabled={actionLoading}
                                                                    >
                                                                        ปฏิเสธ
                                                                    </button>
                                                                </>
                                                            ) : null}

                                                            <button
                                                                className="btn btn-sm btn-light px-3 text-dark rounded-pill fw-bold"
                                                                onClick={() => setViewingBooking(b)}
                                                            >
                                                                👁️ รายละเอียด
                                                            </button>

                                                            <button
                                                                className="btn btn-sm btn-outline-danger px-3 rounded-pill fw-bold"
                                                                onClick={() => handleDelete(b._id)}
                                                                disabled={actionLoading}
                                                            >
                                                                🗑️ ลบ
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile List */}
                                <div className="d-lg-none p-3">
                                    <div className="d-flex flex-column gap-3">
                                        {filteredBookings.map((b) => (
                                            <div key={b._id} className="card border border-light shadow-sm rounded-3 overflow-hidden">
                                                <div className="card-body p-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="fw-bold text-primary">#{b.bookingId}</span>
                                                        {getStatusBadge(b.status)}
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <div>
                                                            <div className="fw-bold">{b.user?.username}</div>
                                                            <div className="small text-muted">{b.user?.phone}</div>
                                                        </div>
                                                        <div className="text-end">
                                                            <div className="badge bg-light text-dark border">{b.stall?.stallId}</div>
                                                            <div className="small text-muted">โซน {b.stall?.zone}</div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light mt-2">
                                                        <div className="fw-bold text-success">{b.stall?.price?.toLocaleString() || 0}฿</div>
                                                        <div className="d-flex gap-2">
                                                            {b.paymentSlipUrl && (
                                                                <button
                                                                    className="btn btn-sm bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-3 fw-bold"
                                                                    onClick={() => setSelectedSlip(b.paymentSlipUrl)}
                                                                >
                                                                    📱 สลิป
                                                                </button>
                                                            )}
                                                            {b.status === 'AWAITING_APPROVAL' ? (
                                                                <button
                                                                    className="btn btn-sm btn-success rounded-pill px-3"
                                                                    onClick={() => setInspectingBooking(b)}
                                                                >
                                                                    อนุมัติ
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="btn btn-sm btn-light border rounded-pill"
                                                                    onClick={() => setViewingBooking(b)}
                                                                >
                                                                    รายละเอียด
                                                                </button>
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
                    </div>
                </div>
            </div>

            {/* Slip Viewer Modal */}
            {selectedSlip && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1070 }} onClick={() => setSelectedSlip(null)}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 bg-transparent">
                            <div className="modal-body p-0 text-center position-relative">
                                <button className="btn btn-light rounded-circle position-absolute top-0 end-0 m-3 shadow" onClick={() => setSelectedSlip(null)}>✕</button>
                                <img src={selectedSlip} className="img-fluid rounded-4 shadow-lg" alt="Payment Slip" style={{ maxHeight: '90vh' }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            <AnimatePresence>
                {rejectingBooking && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 pb-0">
                                    <h5 className="modal-title fw-bold">ปฏิเสธการจอง {rejectingBooking.bookingId}</h5>
                                    <button type="button" className="btn-close" onClick={() => setRejectingBooking(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold small text-muted">เหตุผลที่ปฏิเสธ</label>
                                        <textarea
                                            className="form-control bg-light"
                                            rows={3}
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            placeholder="เช่น ภาพสลิปไม่ชัดเจน, ยอดเงินไม่ถูกต้อง..."
                                            style={{ borderRadius: '12px' }}
                                        ></textarea>
                                    </div>
                                    <div className="d-grid">
                                        <button
                                            className="btn btn-danger py-2 rounded-pill fw-bold"
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

            {/* Inspect Booking Modal (For Approval) */}
            <AnimatePresence>
                {inspectingBooking && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1060 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="modal-dialog modal-dialog-centered modal-lg"
                        >
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)' }}>
                                    <h5 className="modal-title fw-bold">รายละเอียดการจอง {inspectingBooking.bookingId}</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setInspectingBooking(null)}></button>
                                </div>
                                <div className="modal-body p-0">
                                    <div className="row g-0">
                                        <div className="col-md-7 p-4 bg-white">
                                            {/* User Info */}
                                            <div className="mb-4">
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <span className="text-primary">👤</span>
                                                    <h6 className="text-secondary text-uppercase small fw-bold mb-0">ข้อมูลผู้เช่า</h6>
                                                </div>
                                                <div className="p-3 bg-light rounded-3 border border-light">
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">ชื่อ-นามสกุล:</span>
                                                        <span className="fw-bold text-dark">{inspectingBooking.user?.username || 'N/A'}</span>
                                                    </div>
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">เบอร์โทรศัพท์:</span>
                                                        <span className="fw-medium">{inspectingBooking.user?.phone || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stall Info */}
                                            <div className="mb-4">
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <span className="text-primary">🏪</span>
                                                    <h6 className="text-secondary text-uppercase small fw-bold mb-0">ข้อมูลล็อค</h6>
                                                </div>
                                                <div className="p-3 bg-light rounded-3 border border-light">
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">รหัสล็อค:</span>
                                                        <span className="text-primary fw-bold" style={{ fontSize: '1.1rem' }}>{inspectingBooking.stall?.stallId}</span>
                                                    </div>
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">โซน:</span>
                                                        <span className="badge bg-white text-dark border">{inspectingBooking.stall?.zone}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">ขนาด:</span>
                                                        <span>{inspectingBooking.stall?.size} ตร.ม.</span>
                                                    </div>
                                                    <div className="mt-2 text-muted small">
                                                        ชื่อแผง: {inspectingBooking.stall?.description || '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status & Time */}
                                            <div>
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <span className="text-primary">🕒</span>
                                                    <h6 className="text-secondary text-uppercase small fw-bold mb-0">สถานะและเวลา</h6>
                                                </div>
                                                <div className="p-3 bg-light rounded-3 border border-light">
                                                    <div className="mb-2 d-flex justify-content-between align-items-center">
                                                        <span className="text-muted">สถานะปัจจุบัน:</span>
                                                        {getStatusBadge(inspectingBooking.status)}
                                                    </div>
                                                    <div className="mb-1 text-muted small">
                                                        วันที่จอง: {new Date(inspectingBooking.reservedAt).toLocaleString('th-TH')}
                                                    </div>
                                                    <div className="text-muted small">
                                                        วันที่โอนเงิน: {inspectingBooking.uploadedAt ? new Date(inspectingBooking.uploadedAt).toLocaleString('th-TH') : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-5 bg-light p-4 border-start d-flex flex-column">
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <span className="text-primary">💰</span>
                                                <h6 className="text-secondary text-uppercase small fw-bold mb-0">หลักฐานการชำระเงิน</h6>
                                            </div>

                                            <div className="flex-grow-1 bg-white rounded-3 shadow-sm border p-2 mb-3 d-flex align-items-center justify-content-center position-relative overflow-hidden">
                                                {inspectingBooking.paymentSlipUrl ? (
                                                    <img
                                                        src={inspectingBooking.paymentSlipUrl}
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '250px', objectFit: 'contain', cursor: 'pointer' }}
                                                        alt="Slip"
                                                        onClick={() => setSelectedSlip(inspectingBooking.paymentSlipUrl)}
                                                    />
                                                ) : (
                                                    <div className="text-center text-muted">
                                                        <span className="d-block display-4 opacity-25">🖼️</span>
                                                        <small>ไม่มีสลิป</small>
                                                    </div>
                                                )}
                                            </div>

                                            {inspectingBooking.paymentSlipUrl && (
                                                <button
                                                    className="btn btn-outline-secondary btn-sm w-100 mb-4 rounded-pill bg-white"
                                                    onClick={() => setSelectedSlip(inspectingBooking.paymentSlipUrl)}
                                                >
                                                    🔍 ขยายรูปสลิป
                                                </button>
                                            )}

                                            <div className="mt-auto">
                                                <div className="d-flex justify-content-between align-items-end mb-3">
                                                    <span className="text-muted fw-bold">ยอดรวม:</span>
                                                    <span className="h3 text-success fw-bold mb-0">
                                                        {(inspectingBooking.totalPrice || inspectingBooking.stall?.price || 0).toLocaleString()}฿
                                                    </span>
                                                </div>

                                                <div className="d-grid gap-2">
                                                    <button
                                                        className="btn btn-success py-2 rounded-1 fw-bold shadow-sm"
                                                        onClick={() => {
                                                            handleApprove(inspectingBooking._id);
                                                            setInspectingBooking(null);
                                                        }}
                                                        disabled={actionLoading}
                                                        style={{ background: '#198754' }}
                                                    >
                                                        อนุมัติทันที
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger py-2 rounded-1 fw-bold bg-white"
                                                        onClick={() => {
                                                            setRejectingBooking(inspectingBooking);
                                                            setInspectingBooking(null);
                                                        }}
                                                        disabled={actionLoading}
                                                    >
                                                        ปฏิเสธ
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
                                <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)' }}>
                                    <div>
                                        <h5 className="modal-title fw-bold">รายละเอียดการจอง</h5>
                                        <p className="mb-0 opacity-75 small">ID: {viewingBooking.bookingId}</p>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setViewingBooking(null)}></button>
                                </div>
                                <div className="modal-body p-0">
                                    <div className="row g-0">
                                        <div className="col-md-7 p-4 bg-white">
                                            {/* User Info */}
                                            <div className="mb-4">
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <span className="text-primary">👤</span>
                                                    <h6 className="text-secondary text-uppercase small fw-bold mb-0">ข้อมูลผู้เช่า</h6>
                                                </div>
                                                <div className="p-3 bg-light rounded-3 border border-light">
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">ชื่อ-นามสกุล:</span>
                                                        <span className="fw-bold text-dark">{viewingBooking.user?.username || 'N/A'}</span>
                                                    </div>
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">เบอร์โทรศัพท์:</span>
                                                        <span className="fw-medium">{viewingBooking.user?.phone || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stall Info */}
                                            <div className="mb-4">
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <span className="text-primary">🏪</span>
                                                    <h6 className="text-secondary text-uppercase small fw-bold mb-0">ข้อมูลล็อค</h6>
                                                </div>
                                                <div className="p-3 bg-light rounded-3 border border-light">
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">รหัสล็อค:</span>
                                                        <span className="text-primary fw-bold" style={{ fontSize: '1.1rem' }}>{viewingBooking.stall?.stallId}</span>
                                                    </div>
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">โซน:</span>
                                                        <span className="badge bg-white text-dark border">{viewingBooking.stall?.zone}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span className="text-muted">ขนาด:</span>
                                                        <span>{viewingBooking.stall?.size} ตร.ม.</span>
                                                    </div>
                                                    <div className="mt-2 text-muted small">
                                                        ชื่อแผง: {viewingBooking.stall?.description || '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status & Time */}
                                            <div>
                                                <div className="d-flex align-items-center gap-2 mb-3">
                                                    <span className="text-primary">🕒</span>
                                                    <h6 className="text-secondary text-uppercase small fw-bold mb-0">สถานะและเวลา</h6>
                                                </div>
                                                <div className="p-3 bg-light rounded-3 border border-light">
                                                    <div className="mb-2 d-flex justify-content-between align-items-center">
                                                        <span className="text-muted">สถานะปัจจุบัน:</span>
                                                        {getStatusBadge(viewingBooking.status)}
                                                    </div>
                                                    <div className="mb-1 text-muted small">
                                                        วันที่จอง: {new Date(viewingBooking.reservedAt).toLocaleString('th-TH')}
                                                    </div>
                                                    <div className="text-muted small">
                                                        วันที่โอนเงิน: {viewingBooking.uploadedAt ? new Date(viewingBooking.uploadedAt).toLocaleString('th-TH') : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-5 bg-light p-4 border-start d-flex flex-column">
                                            <div className="d-flex align-items-center gap-2 mb-3">
                                                <span className="text-primary">💰</span>
                                                <h6 className="text-secondary text-uppercase small fw-bold mb-0">หลักฐานการชำระเงิน</h6>
                                            </div>

                                            <div className="flex-grow-1 bg-white rounded-3 shadow-sm border p-2 mb-3 d-flex align-items-center justify-content-center position-relative overflow-hidden">
                                                {viewingBooking.paymentSlipUrl ? (
                                                    <img
                                                        src={viewingBooking.paymentSlipUrl}
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '250px', objectFit: 'contain', cursor: 'pointer' }}
                                                        alt="Slip"
                                                        onClick={() => setSelectedSlip(viewingBooking.paymentSlipUrl)}
                                                    />
                                                ) : (
                                                    <div className="text-center text-muted">
                                                        <span className="d-block display-4 opacity-25">🖼️</span>
                                                        <small>ไม่มีสลิป</small>
                                                    </div>
                                                )}
                                            </div>

                                            {viewingBooking.paymentSlipUrl && (
                                                <button
                                                    className="btn btn-outline-secondary btn-sm w-100 mb-4 rounded-pill bg-white"
                                                    onClick={() => setSelectedSlip(viewingBooking.paymentSlipUrl)}
                                                >
                                                    🔍 ขยายรูปสลิป
                                                </button>
                                            )}

                                            <div className="mt-auto">
                                                <div className="d-flex justify-content-between align-items-end mb-3">
                                                    <span className="text-muted fw-bold">ยอดรวม:</span>
                                                    <span className="h3 text-success fw-bold mb-0">
                                                        {(viewingBooking.totalPrice || viewingBooking.stall?.price || 0).toLocaleString()}฿
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="modal-dialog modal-dialog-centered modal-lg"
                    >
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)' }}>
                                <div>
                                    <h5 className="modal-title fw-bold">⚙️ ตั้งค่าระบบ</h5>
                                    <p className="text-white text-opacity-75 small mb-0">จัดการโซน, ขนาดแผง, และการตั้งค่าตลาด</p>
                                </div>
                                <button className="btn-close btn-close-white" onClick={() => setShowSettingsModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <ul className="nav nav-pills mb-4 nav-fill bg-light p-1 rounded-pill">
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link rounded-pill ${settingsTab === 'zones' ? 'active bg-white text-dark shadow-sm' : 'text-muted'}`}
                                            onClick={() => setSettingsTab('zones')}
                                        >
                                            จัดการโซน
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link rounded-pill ${settingsTab === 'sizes' ? 'active bg-white text-dark shadow-sm' : 'text-muted'}`}
                                            onClick={() => setSettingsTab('sizes')}
                                        >
                                            จัดการขนาด
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link rounded-pill ${settingsTab === 'market' ? 'active bg-white text-dark shadow-sm' : 'text-muted'}`}
                                            onClick={() => setSettingsTab('market')}
                                        >
                                            ตั้งค่าตลาด
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button
                                            className={`nav-link rounded-pill ${settingsTab === 'stalls' ? 'active bg-white text-dark shadow-sm' : 'text-muted'}`}
                                            onClick={() => setSettingsTab('stalls')}
                                        >
                                            จัดการแผง
                                        </button>
                                    </li>
                                </ul>

                                {settingsTab === 'zones' && (
                                    <div>
                                        <form onSubmit={handleCreateZone} className="mb-4">
                                            <div className="row g-2">
                                                <div className="col-md-4">
                                                    <input
                                                        className="form-control"
                                                        placeholder="ชื่อโซน (เช่น A, B, C)"
                                                        value={zoneFormData.name}
                                                        onChange={e => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <input
                                                        className="form-control"
                                                        placeholder="รายละเอียด (ถ้ามี)"
                                                        value={zoneFormData.description}
                                                        onChange={e => setZoneFormData({ ...zoneFormData, description: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-2">
                                                    <button className="btn btn-primary w-100" type="submit" disabled={actionLoading}>
                                                        {editingZone ? 'บันทึก' : 'เพิ่ม'}
                                                    </button>
                                                </div>
                                            </div>
                                            {editingZone && (
                                                <div className="mt-2 text-end">
                                                    <button type="button" className="btn btn-link text-muted btn-sm text-decoration-none" onClick={() => { setEditingZone(null); setZoneFormData({ name: '', description: '' }); }}>ยกเลิกการแก้ไข</button>
                                                </div>
                                            )}
                                        </form>

                                        <div className="list-group list-group-flush rounded-3 border">
                                            {zones.length === 0 && <div className="p-4 text-center text-muted">ยังไม่มีข้อมูลโซน</div>}
                                            {zones.map(z => (
                                                <div key={z._id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                                    <div>
                                                        <div className="fw-bold text-primary">{z.name}</div>
                                                        <div className="small text-muted">{z.description}</div>
                                                    </div>
                                                    <div>
                                                        <button className="btn btn-sm btn-outline-secondary me-2 rounded-pill" onClick={() => { setEditingZone(z); setZoneFormData({ name: z.name, description: z.description || '' }); }}>แก้ไข</button>
                                                        <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDeleteZone(z)}>ลบ</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'sizes' && (
                                    <div>
                                        <form onSubmit={handleCreateSize} className="mb-4">
                                            <div className="row g-2">
                                                <div className="col-md-5">
                                                    <input className="form-control" placeholder="ชื่อ (S, M, L)" value={sizeFormData.name} onChange={e => setSizeFormData({ ...sizeFormData, name: e.target.value })} required />
                                                </div>
                                                <div className="col-md-5">
                                                    <input className="form-control" placeholder="Label (เช่น 2x2)" value={sizeFormData.label} onChange={e => setSizeFormData({ ...sizeFormData, label: e.target.value })} required />
                                                </div>
                                                <div className="col-md-2">
                                                    <button className="btn btn-primary w-100" type="submit" disabled={actionLoading}>
                                                        {editingSize ? 'บันทึก' : 'เพิ่ม'}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                        <div className="list-group list-group-flush rounded-3 border">
                                            {stallSizes.length === 0 && <div className="p-4 text-center text-muted">ยังไม่มีข้อมูลขนาด</div>}
                                            {stallSizes.map(s => (
                                                <div key={s._id} className="list-group-item d-flex justify-content-between align-items-center p-3">
                                                    <div>
                                                        <strong>{s.name}</strong> <span className="text-muted ms-2">({s.label})</span>
                                                    </div>
                                                    <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => handleDeleteSize(s)}>ลบ</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {settingsTab === 'market' && (
                                    <form onSubmit={handleSaveSettings}>
                                        <div className="p-3 border rounded-3 bg-light mb-4">
                                            <div className="form-check form-switch mb-3">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="autoReturnSwitch"
                                                    checked={marketSettings.isAutoReturnEnabled}
                                                    onChange={(e) => setMarketSettings({ ...marketSettings, isAutoReturnEnabled: e.target.checked })}
                                                />
                                                <label className="form-check-label fw-bold" htmlFor="autoReturnSwitch">เปิดใช้งานการคืนแผงอัตโนมัติ</label>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label small text-muted fw-bold">เวลาคืนแผงอัตโนมัติ (ทุกวัน)</label>
                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    value={marketSettings.autoReturnTime}
                                                    onChange={(e) => setMarketSettings({ ...marketSettings, autoReturnTime: e.target.value })}
                                                    disabled={!marketSettings.isAutoReturnEnabled}
                                                />
                                            </div>
                                            <div className="mb-0">
                                                <label className="form-label small text-muted fw-bold">จองล่วงหน้าได้สูงสุด (วัน)</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={marketSettings.maxBookingDays}
                                                    onChange={(e) => setMarketSettings({ ...marketSettings, maxBookingDays: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <button className="btn btn-primary w-100 py-2 rounded-pill fw-bold" type="submit" disabled={actionLoading}>บันทึกการตั้งค่า</button>

                                        <div className="mt-4 pt-4 border-top">
                                            <h6 className="text-danger fw-bold mb-3">⚠️ โซนอันตราย</h6>
                                            <div className="p-3 border border-danger border-opacity-25 bg-danger bg-opacity-10 rounded-3">
                                                <p className="small text-danger mb-3">การกดปุ่มนี้จะทำการคืนสถานะแผง "ทั้งหมด" ที่ถูกจองไว้ ให้กลับเป็น "ว่าง" ทันที โดยไม่ต้องรอเวลา.</p>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger w-100"
                                                    onClick={handleManualReturn}
                                                    disabled={actionLoading}
                                                >
                                                    Manual Reset (คืนแผงทั้งหมด)
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {settingsTab === 'stalls' && (
                                    <div>
                                        <div className="alert alert-danger border-danger bg-danger bg-opacity-10 mb-4">
                                            <h6 className="fw-bold text-danger mb-2">การลบแผงตลาด</h6>
                                            <p className="small text-danger mb-0">การลบแผงจะไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ</p>
                                        </div>

                                        {/* Delete Mode Selection */}
                                        <div className="mb-4">
                                            <label className="form-label small fw-bold text-muted">โหมดการลบ</label>
                                            <div className="btn-group w-100" role="group">
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="deleteMode"
                                                    id="deleteAll"
                                                    checked={stallDeleteMode === 'ALL'}
                                                    onChange={() => { setStallDeleteMode('ALL'); setSelectedStallsForDelete([]); }}
                                                />
                                                <label className="btn btn-outline-danger" htmlFor="deleteAll">ลบทั้งหมด</label>

                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="deleteMode"
                                                    id="deleteZone"
                                                    checked={stallDeleteMode === 'ZONE'}
                                                    onChange={() => { setStallDeleteMode('ZONE'); setSelectedStallsForDelete([]); }}
                                                />
                                                <label className="btn btn-outline-danger" htmlFor="deleteZone">ลบทั้งโซน</label>

                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="deleteMode"
                                                    id="deleteSpecific"
                                                    checked={stallDeleteMode === 'SPECIFIC'}
                                                    onChange={() => setStallDeleteMode('SPECIFIC')}
                                                />
                                                <label className="btn btn-outline-danger" htmlFor="deleteSpecific">เลือกแผง</label>
                                            </div>
                                        </div>

                                        {/* Zone Selector (for ZONE mode) */}
                                        {stallDeleteMode === 'ZONE' && (
                                            <div className="mb-4">
                                                <label className="form-label small fw-bold text-muted">เลือกโซนที่ต้องการลบ</label>
                                                <select
                                                    className="form-select"
                                                    value={stallDeleteZone}
                                                    onChange={e => setStallDeleteZone(e.target.value)}
                                                >
                                                    <option value="">-- เลือกโซน --</option>
                                                    {zones.map(z => (
                                                        <option key={z._id} value={z.name}>{z.name} {z.description ? `(${z.description})` : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Stall Selection (for SPECIFIC mode) */}
                                        {stallDeleteMode === 'SPECIFIC' && (
                                            <div className="mb-4">
                                                <div className="row g-2 mb-3">
                                                    <div className="col-6">
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={stallsFilter.zone}
                                                            onChange={e => setStallsFilter({ ...stallsFilter, zone: e.target.value })}
                                                        >
                                                            <option value="">ทุกโซน</option>
                                                            {zones.map(z => (
                                                                <option key={z._id} value={z.name}>{z.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-6">
                                                        <select
                                                            className="form-select form-select-sm"
                                                            value={stallsFilter.status}
                                                            onChange={e => setStallsFilter({ ...stallsFilter, status: e.target.value })}
                                                        >
                                                            <option value="">ทุกสถานะ</option>
                                                            <option value="AVAILABLE">ว่าง</option>
                                                            <option value="RESERVED">จองแล้ว</option>
                                                            <option value="CONFIRMED">ยืนยันแล้ว</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {loadingStalls ? (
                                                    <div className="text-center py-4">
                                                        <div className="spinner-border spinner-border-sm text-primary"></div>
                                                        <p className="small text-muted mt-2 mb-0">กำลังโหลด...</p>
                                                    </div>
                                                ) : (
                                                    <div className="border rounded-3" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                        <div className="list-group list-group-flush">
                                                            <div className="list-group-item bg-light sticky-top">
                                                                <div className="form-check">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input"
                                                                        id="selectAllStalls"
                                                                        checked={getFilteredStalls().length > 0 && selectedStallsForDelete.length === getFilteredStalls().length}
                                                                        onChange={e => handleSelectAllStalls(e.target.checked)}
                                                                    />
                                                                    <label className="form-check-label fw-bold small" htmlFor="selectAllStalls">
                                                                        เลือกทั้งหมด ({getFilteredStalls().length} แผง)
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            {getFilteredStalls().length === 0 ? (
                                                                <div className="list-group-item text-center text-muted py-4">
                                                                    ไม่พบแผงตามเงื่อนไข
                                                                </div>
                                                            ) : (
                                                                getFilteredStalls().map(stall => (
                                                                    <div key={stall._id} className="list-group-item">
                                                                        <div className="form-check d-flex align-items-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="form-check-input"
                                                                                id={`stall-${stall._id}`}
                                                                                checked={selectedStallsForDelete.includes(stall._id)}
                                                                                onChange={() => handleToggleStallSelection(stall._id)}
                                                                            />
                                                                            <label className="form-check-label ms-2 w-100 d-flex justify-content-between align-items-center" htmlFor={`stall-${stall._id}`}>
                                                                                <span>
                                                                                    <strong>{stall.stallId}</strong>
                                                                                    <span className="text-muted ms-2">โซน {stall.zone}</span>
                                                                                </span>
                                                                                <span className="d-flex align-items-center gap-2">
                                                                                    <span className={`badge ${stall.status === 'AVAILABLE' ? 'bg-success' : stall.status === 'RESERVED' ? 'bg-warning' : 'bg-primary'}`}>
                                                                                        {stall.status === 'AVAILABLE' ? 'ว่าง' : stall.status === 'RESERVED' ? 'จอง' : 'ยืนยัน'}
                                                                                    </span>
                                                                                    {stall.hasActiveBooking && (
                                                                                        <span className="text-warning" title="มีการจองอยู่">⚠️</span>
                                                                                    )}
                                                                                </span>
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Preview Box */}
                                        {deletePreview && (stallDeleteMode === 'ALL' || (stallDeleteMode === 'ZONE' && stallDeleteZone) || (stallDeleteMode === 'SPECIFIC' && selectedStallsForDelete.length > 0)) && (
                                            <div className="p-3 bg-light rounded-3 mb-4">
                                                <h6 className="small fw-bold text-muted mb-3">สรุปการลบ</h6>
                                                <div className="row text-center g-2 mb-3">
                                                    <div className="col-4">
                                                        <div className="p-2 bg-white rounded border">
                                                            <div className="fw-bold text-primary">{deletePreview.totalStalls}</div>
                                                            <div className="small text-muted">แผงทั้งหมด</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="p-2 bg-white rounded border">
                                                            <div className="fw-bold text-warning">{deletePreview.stallsWithActiveBookings}</div>
                                                            <div className="small text-muted">มีการจอง</div>
                                                        </div>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="p-2 bg-white rounded border">
                                                            <div className="fw-bold text-success">{deletePreview.stallsAvailable}</div>
                                                            <div className="small text-muted">ลบได้ทันที</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {deletePreview.stallsWithActiveBookings > 0 && (
                                                    <div className="form-check mb-3">
                                                        <input
                                                            type="checkbox"
                                                            className="form-check-input"
                                                            id="forceDelete"
                                                            checked={forceDelete}
                                                            onChange={e => setForceDelete(e.target.checked)}
                                                        />
                                                        <label className="form-check-label small" htmlFor="forceDelete">
                                                            <span className="text-danger fw-bold">บังคับลบ</span>
                                                            <span className="text-muted ms-1">(รวมแผงที่มีการจอง - จะลบข้อมูลการจอง {deletePreview.affectedBookingsCount} รายการด้วย)</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Delete Button */}
                                        <button
                                            className="btn btn-danger w-100 py-2 rounded-pill fw-bold"
                                            onClick={handleDeleteStalls}
                                            disabled={actionLoading || !deletePreview || (stallDeleteMode === 'ZONE' && !stallDeleteZone) || (stallDeleteMode === 'SPECIFIC' && selectedStallsForDelete.length === 0)}
                                        >
                                            {actionLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    กำลังลบ...
                                                </>
                                            ) : (
                                                <>ลบแผง</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Create Stall Modal */}
            {showCreateStallModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="modal-dialog modal-dialog-centered"
                    >
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header border-0 text-white p-4" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)' }}>
                                <h5 className="modal-title fw-bold">➕ เพิ่มแผงตลาด</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateStallModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {stallFormError && <div className="alert alert-danger rounded-3">{stallFormError}</div>}
                                <form onSubmit={handleCreateStall}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">โซน</label>
                                        <select className="form-select" value={stallFormData.zone} onChange={e => setStallFormData({ ...stallFormData, zone: e.target.value })} required>
                                            <option value="">เลือกโซน...</option>
                                            {zones.map(z => <option key={z._id} value={z.name}>{z.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">ขนาด</label>
                                        <select className="form-select" value={stallFormData.size} onChange={e => setStallFormData({ ...stallFormData, size: e.target.value })} required>
                                            <option value="">เลือกขนาด...</option>
                                            {stallSizes.map(s => <option key={s._id} value={s.label}>{s.name} ({s.label})</option>)}
                                        </select>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-6 mb-3">
                                            <label className="form-label small fw-bold text-muted">ราคา</label>
                                            <input type="number" className="form-control" value={stallFormData.price} onChange={e => setStallFormData({ ...stallFormData, price: e.target.value })} required placeholder="0.00" />
                                        </div>
                                        <div className="col-6 mb-3">
                                            <label className="form-label small fw-bold text-muted">ต่อ</label>
                                            <select className="form-select" value={stallFormData.priceUnit} onChange={e => setStallFormData({ ...stallFormData, priceUnit: e.target.value as any })}>
                                                <option value="DAY">วัน</option>
                                                <option value="MONTH">เดือน</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-muted">รายละเอียดเพิ่มเติม</label>
                                        <textarea className="form-control" value={stallFormData.description} onChange={e => setStallFormData({ ...stallFormData, description: e.target.value })} rows={2} />
                                    </div>

                                    <div className="p-3 bg-light rounded-3 mb-4">
                                        <h6 className="small fw-bold text-muted mb-3">การสร้างหลายแผง</h6>
                                        <div className="row g-3">
                                            <div className="col-6">
                                                <label className="form-label small">จำนวนที่สร้าง</label>
                                                <input type="number" className="form-control" value={stallFormData.quantity} onChange={e => setStallFormData({ ...stallFormData, quantity: e.target.value })} min="1" required />
                                            </div>
                                            <div className="col-6">
                                                <label className="form-label small">เลขเริ่มต้น</label>
                                                <input type="number" className="form-control" value={stallFormData.startNumber} onChange={e => setStallFormData({ ...stallFormData, startNumber: e.target.value })} min="1" required />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-grid">
                                        <button className="btn btn-primary py-2 rounded-pill fw-bold" type="submit" disabled={actionLoading}>
                                            {actionLoading ? 'กำลังสร้าง...' : 'ยืนยันการสร้างแผง'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
