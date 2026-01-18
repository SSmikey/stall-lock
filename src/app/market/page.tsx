'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Stall } from '@/lib/db';
import { ApiResponse } from '@/lib/api';
import './market.css';
import CustomDropdown, { DropdownOption } from '@/components/ui/CustomDropdown';
import { Home, MapPin, BarChart3, CheckSquare, Hourglass, Lock, Calendar, Search, FileText, Info, Store, CheckCircle, XCircle } from 'lucide-react';

interface Zone {
    _id: string;
    name: string;
    description?: string;
}

export default function MarketPage() {
    const [stalls, setStalls] = useState<Stall[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterZone, setFilterZone] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
    const [bookingDays, setBookingDays] = useState(1);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [zones, setZones] = useState<Zone[]>([]);
    const [maxBookingDays, setMaxBookingDays] = useState(7);
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const itemsPerPage = 20;

    // Fetch current user and zones on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                if (data.success && data.data?.user) {
                    setCurrentUserId(data.data.user.id);
                }
            } catch (error) {
                console.error('Failed to fetch user', error);
            }
        };
        const fetchZones = async () => {
            try {
                const res = await fetch('/api/zones');
                const data: ApiResponse<Zone[]> = await res.json();
                if (data.success && data.data) {
                    setZones(data.data);
                }
            } catch (error) {
                console.error('[MarketPage] Failed to fetch zones:', error);
            }
        };

        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                const data = await res.json();
                if (data.success && data.data) {
                    setMaxBookingDays(data.data.maxBookingDays || 7);
                }
            } catch (error) {
                console.error('[MarketPage] Failed to fetch settings:', error);
            }
        };

        checkAuth();
        fetchZones();
        fetchSettings();
    }, []);

    useEffect(() => {
        fetchStalls();
    }, [filterZone, filterStatus]);

    const fetchStalls = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        console.log('[MarketPage] Fetching stalls... Zone:', filterZone, 'Status:', filterStatus, 'isSilent:', isSilent);
        try {
            let url = '/api/stalls';
            const params = new URLSearchParams();
            if (filterZone !== 'ALL') params.append('zone', filterZone);
            if (filterStatus !== 'ALL') params.append('status', filterStatus);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await fetch(url);
            const data: ApiResponse<{ stalls: Stall[] }> = await res.json();
            if (data.success && data.data) {
                setStalls(data.data.stalls);
            }
        } catch (error) {
            console.error('[MarketPage] Failed to fetch stalls:', error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    useEffect(() => {
        // Use silent fetch if we already have stalls to prevent flickering
        fetchStalls(stalls.length > 0);
    }, [filterZone, filterStatus]);

    const handleBookStall = async () => {
        if (!selectedStall) return;

        if (!currentUserId) {
            setMessage({ type: 'error', text: 'กรุณาเข้าสู่ระบบก่อนทำการจอง' });
            router.push('/login');
            return;
        }

        setBookingLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stallId: selectedStall._id,
                    userId: currentUserId,
                    days: bookingDays
                })
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'จองล็อคสำเร็จ! กำลังนำคุณไปหน้าชำระเงิน...' });

                // Redirect to booking details page after success
                setTimeout(() => {
                    router.push(`/bookings/${data.data.bookingId}`);
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.error?.message || 'เกิดข้อผิดพลาดในการจอง' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้' });
        } finally {
            setBookingLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'badge-available';
            case 'RESERVED': return 'badge-reserved';
            case 'CONFIRMED': return 'badge-booked';
            default: return '';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'ว่าง';
            case 'RESERVED': return 'รอชำระเงิน';
            case 'CONFIRMED': return 'จองแล้ว';
            default: return status;
        }
    };

    // Pagination Logic
    const filteredStalls = stalls.filter(stall =>
        (stall.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (stall.stallId || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const indexOfLastStall = currentPage * itemsPerPage;
    const indexOfFirstStall = indexOfLastStall - itemsPerPage;
    const currentStalls = filteredStalls.slice(indexOfFirstStall, indexOfLastStall);
    const totalPages = Math.ceil(filteredStalls.length / itemsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container-fluid p-0 bg-light min-vh-100 font-kanit">
            {/* Hero Section */}
            <div className="home-hero pt-5 pb-5 mb-5" style={{ borderRadius: '0 0 50px 50px' }}>
                <div className="container position-relative z-1">
                    <div className="text-center text-white mb-4">
                        <h1 className="fw-bold mb-2 display-5">เลือกจองแผงตลาด</h1>
                        <p className="lead opacity-90 mx-auto" style={{ maxWidth: '600px' }}>
                            ค้นหาและจับจองทำเลทองสำหรับการค้าขายของคุณได้ง่ายๆ ตลอด 24 ชั่วโมง
                        </p>
                    </div>
                </div>

            </div>

            <div className="container position-relative z-2" style={{ marginTop: '-6rem' }}>
                {/* Search & Filter Bar */}
                <div className="card border-0 shadow-lg rounded-4 p-3 mb-5 bg-white bg-opacity-90 backdrop-blur">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        {/* Left: Search Bar */}
                        <div style={{ minWidth: '300px', flex: 1 }}>
                            <div className="input-group border rounded-pill overflow-hidden bg-light">
                                <span className="input-group-text bg-transparent border-0 ps-3 text-muted">
                                    <Search size={18} />
                                </span>
                                <input
                                    type="text"
                                    className="form-control bg-transparent border-0 shadow-none ps-0"
                                    placeholder="ค้นหาชื่อล็อค หรือรหัสแผง..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ fontSize: '0.95rem' }}
                                />
                            </div>
                        </div>

                        {/* Right: Filters */}
                        <div className="d-flex gap-2">
                            <div style={{ minWidth: '200px' }}>
                                <CustomDropdown
                                    value={filterZone}
                                    onChange={setFilterZone}
                                    options={[
                                        { value: 'ALL', label: 'ทุกโซนพื้นที่', icon: <Home size={18} /> },
                                        ...zones.map(z => ({
                                            value: z.name,
                                            label: `โซน ${z.name}`,
                                            description: z.description,
                                            icon: <MapPin size={18} className="text-danger" />
                                        }))
                                    ]}
                                    placeholder="เลือกโซน..."
                                />
                            </div>

                            <div style={{ minWidth: '180px' }}>
                                <CustomDropdown
                                    value={filterStatus}
                                    onChange={setFilterStatus}
                                    options={[
                                        { value: 'ALL', label: 'ทุกสถานะ', icon: <BarChart3 size={18} className="text-primary" /> },
                                        { value: 'AVAILABLE', label: 'ว่าง', icon: <CheckSquare size={18} className="text-success" /> },
                                        { value: 'RESERVED', label: 'รอชำระเงิน', icon: <Hourglass size={18} className="text-warning" /> },
                                        { value: 'CONFIRMED', label: 'จองแล้ว', icon: <Lock size={18} className="text-secondary" /> }
                                    ]}
                                    placeholder="สถานะ..."
                                />
                            </div>


                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="row g-4 pb-5">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="col-6 col-md-4 col-lg-3">
                                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                                    <div className="card-body p-3">
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-8 mb-2 rounded"></span>
                                            <span className="placeholder col-4 mb-3 rounded"></span>
                                            <div style={{ height: '60px' }} className="placeholder w-100 rounded mb-3"></div>
                                            <span className="placeholder col-12 rounded btn-lg"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : stalls.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-5"
                    >
                        <div className="mb-3 d-flex justify-content-center">
                            <Store size={80} className="text-secondary opacity-50" />
                        </div>
                        <h4 className="fw-bold text-muted">ไม่พบข้อมูลแผงตลาด</h4>
                        <p className="text-muted">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่นดูนะครับ</p>
                    </motion.div>
                ) : (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="fw-bold mb-0 text-dark">
                                ผลลัพธ์การค้นหา <span className="text-brand fs-4 ms-2">{filteredStalls.length}</span> <small className="text-muted fw-normal ms-1">รายการ</small>
                            </h5>
                            {filteredStalls.length === 0 && (
                                <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setSearchQuery('')}>
                                    ล้างคำค้นหา
                                </button>
                            )}
                        </div>

                        {/* Stalls Grid */}
                        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-3 pb-5">
                            {currentStalls.map((stall, index) => (
                                <div key={stall.stallId} className="col">
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden cursor-pointer bg-white"
                                        onClick={() => {
                                            setSelectedStall(stall);
                                            setBookingDays(1);
                                            setMessage(null);
                                        }}
                                        style={{ transition: 'all 0.2s ease' }}
                                    >
                                        <div className="card-body p-3 d-flex flex-column h-100">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="badge bg-light text-dark border fw-normal px-2 py-1">Code: {stall.stallId}</div>
                                                <span className={`small fw-bold ${getStatusBadgeClass(stall.status)}`}>
                                                    {getStatusText(stall.status)}
                                                </span>
                                            </div>

                                            <h6 className="fw-bold mb-1 text-dark text-truncate" title={stall.name}>{stall.name}</h6>
                                            <div className="small text-muted mb-3">โซน {stall.zone} • {stall.size} ตร.ม.</div>

                                            {stall.description && (
                                                <div className="p-2 bg-light rounded-3 mb-3 small text-muted flex-grow-1" style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {stall.description}
                                                </div>
                                            )}

                                            <div className="mt-auto border-top pt-3 d-flex justify-content-between align-items-end">
                                                <div>
                                                    <span className="d-block tiny text-muted" style={{ fontSize: '0.7rem' }}>ราคาต่อวัน</span>
                                                    <span className="fw-bold text-success fs-5">{stall.price.toLocaleString()}฿</span>
                                                </div>
                                                <button className="btn btn-sm btn-outline-custom px-3 d-flex align-items-center gap-1 justify-content-center" style={{ height: '32px', fontSize: '0.8rem' }}>
                                                    <FileText size={14} /> ดูรายละเอียด
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 0 && (
                            <div className="d-flex justify-content-center pb-5">
                                <nav>
                                    <ul className="pagination pagination-lg">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link rounded-start-pill border-0 shadow-sm" onClick={() => handlePageChange(currentPage - 1)}>
                                                &laquo;
                                            </button>
                                        </li>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                <button
                                                    className={`page-link border-0 shadow-sm mx-1 rounded ${currentPage === page ? 'bg-brand text-white' : ''}`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link rounded-end-pill border-0 shadow-sm" onClick={() => handlePageChange(currentPage + 1)}>
                                                &raquo;
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Premium Booking Modal */}
            <AnimatePresence>
                {selectedStall && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1050 }} onClick={() => setSelectedStall(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-dialog modal-dialog-centered"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content border-0 shadow-lg rounded-5 overflow-hidden">
                                <div className="modal-header bg-brand text-white border-0 p-4">
                                    <div>
                                        <h5 className="modal-title fw-bold mb-1 d-flex align-items-center gap-2">
                                            <Store size={24} /> จองแผงตลาด
                                        </h5>
                                        <p className="mb-0 opacity-75 small">ยืนยันข้อมูลและระยะเวลาที่ต้องการ</p>
                                    </div>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStall(null)}></button>
                                </div>
                                <div className="modal-body p-4 bg-light">
                                    {message && (
                                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} rounded-3 border-0 shadow-sm mb-4 d-flex align-items-center gap-2`}>
                                            {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                            <span>{message.text}</span>
                                        </div>
                                    )}

                                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                                        <div className="card-body p-3">
                                            <div className="d-flex align-items-center gap-3 mb-3">
                                                <div className="bg-brand-light text-brand rounded-3 p-3 display-6 fw-bold">
                                                    {selectedStall.stallId}
                                                </div>
                                                <div>
                                                    <h5 className="fw-bold mb-1">{selectedStall.name}</h5>
                                                    <span className="badge bg-light text-dark border">โซน {selectedStall.zone}</span>
                                                    <span className="badge bg-light text-dark border ms-2">ขนาด {selectedStall.size} ตร.ม.</span>
                                                </div>
                                            </div>
                                            {selectedStall.description && (
                                                <div className="p-3 bg-light rounded-3 small text-muted d-flex align-items-start gap-2">
                                                    <Info size={16} className="mt-1 flex-shrink-0" />
                                                    <span>{selectedStall.description}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-muted small text-uppercase">ระยะเวลาการจอง (วัน)</label>
                                        <div className="d-flex gap-2 mb-2 overflow-auto pb-2">
                                            {Array.from({ length: Math.min(maxBookingDays, 7) }, (_, i) => i + 1).map(days => (
                                                <button
                                                    key={days}
                                                    className={`btn btn-lg flex-grow-1 fw-bold ${bookingDays === days ? 'btn-brand text-white shadow' : 'btn-white border'}`}
                                                    onClick={() => setBookingDays(days)}
                                                    style={{ minWidth: '50px' }}
                                                >
                                                    {days}
                                                </button>
                                            ))}
                                        </div>
                                        {maxBookingDays > 7 && (
                                            <div className="mt-3">
                                                <CustomDropdown
                                                    value={bookingDays > 7 ? bookingDays.toString() : ''}
                                                    onChange={(val) => setBookingDays(Number(val))}
                                                    options={Array.from({ length: maxBookingDays - 7 }, (_, i) => i + 8).map(d => ({
                                                        value: d.toString(),
                                                        label: `${d} วัน`
                                                    }))}
                                                    placeholder="เลือกจำนวนวันเพิ่มเติม..."
                                                    className="w-100"
                                                />
                                            </div>
                                        )}
                                        <div className="text-end small text-muted mt-1">
                                            ถึงวันที่: {new Date(Date.now() + (bookingDays * 24 * 60 * 60 * 1000)).toLocaleDateString('th-TH')}
                                        </div>
                                    </div>

                                    <div className="d-grid gap-2">
                                        <div className="card border-0 bg-white shadow-sm rounded-4 p-3 d-flex flex-row justify-content-between align-items-center">
                                            <div>
                                                <div className="small text-muted">ยอดชำระรวม</div>
                                                <div className="h3 fw-bold text-brand mb-0">{(selectedStall.price * bookingDays).toLocaleString()}฿</div>
                                            </div>
                                            <button
                                                className="btn btn-brand btn-lg rounded-pill px-5 shadow fw-bold"
                                                onClick={handleBookStall}
                                                disabled={bookingLoading || selectedStall.status !== 'AVAILABLE'}
                                            >
                                                {bookingLoading ? 'กำลังดำเนินการ...' : 'ยืนยันการจอง'}
                                            </button>
                                        </div>
                                        <button
                                            className="btn btn-light text-muted rounded-pill py-2"
                                            onClick={() => setSelectedStall(null)}
                                        >
                                            ย้อนกลับ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
