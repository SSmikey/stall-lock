'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface User {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    phone?: string;
    role: 'USER' | 'ADMIN';
    bookingCount: number;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<any | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'USER' as 'USER' | 'ADMIN'
    });
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success && data.data) {
                setUsers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setActionLoading(true);

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error?.message || 'ไม่สามารถสร้างผู้ใช้ได้');
                return;
            }

            alert('สร้างผู้ใช้สำเร็จ');
            setShowCreateModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setFormError('');
        setActionLoading(true);

        try {
            const updateData: any = {
                username: formData.username,
                email: formData.email,
                fullName: formData.fullName,
                phone: formData.phone,
                role: formData.role
            };

            // Only include password if it's been changed
            if (formData.password) {
                updateData.password = formData.password;
            }

            const res = await fetch(`/api/admin/users/${editingUser._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const data = await res.json();

            if (!res.ok) {
                setFormError(data.error?.message || 'ไม่สามารถอัปเดตผู้ใช้ได้');
                return;
            }

            alert('อัปเดตผู้ใช้สำเร็จ');
            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (error) {
            setFormError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('ยืนยันการลบผู้ใช้นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.error?.message || 'ไม่สามารถลบผู้ใช้ได้');
                return;
            }

            alert('ลบผู้ใช้สำเร็จ');
            fetchUsers();
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setActionLoading(false);
        }
    };

    const handleViewUser = async (userId: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}`);
            const data = await res.json();
            if (data.success && data.data) {
                setViewingUser(data.data);
            }
        } catch (error) {
            alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        }
    };

    const openEditModal = (user: User) => {
        setFormData({
            username: user.username,
            email: user.email,
            password: '',
            fullName: user.fullName,
            phone: user.phone || '',
            role: user.role
        });
        setEditingUser(user);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            fullName: '',
            phone: '',
            role: 'USER'
        });
        setFormError('');
    };

    const getRoleBadge = (role: string) => {
        if (role === 'ADMIN') {
            return <span className="badge bg-danger">Admin</span>;
        }
        return <span className="badge bg-secondary">User</span>;
    };

    // Filter users
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (user.fullName || '').toLowerCase().includes(searchLower) ||
            (user.username || '').toLowerCase().includes(searchLower) ||
            (user.email || '').toLowerCase().includes(searchLower);

        const matchesRole = filterRole === 'ALL' || user.role === filterRole;

        return matchesSearch && matchesRole;
    });

    // Stats
    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        users: users.filter(u => u.role === 'USER').length
    };

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-5">
                <div>
                    <h1 className="fw-bold mb-1">จัดการผู้ใช้</h1>
                    <p className="text-muted mb-0">จัดการข้อมูลผู้ใช้ในระบบ</p>
                </div>
                <div className="d-flex gap-2">
                    <Link href="/admin/dashboard" className="btn btn-outline-secondary">
                        Dashboard
                    </Link>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                        }}
                    >
                        + เพิ่มผู้ใช้
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <div className="card-custom p-3 text-center">
                        <div className="h4 fw-bold mb-0">{stats.total}</div>
                        <div className="text-muted small">ผู้ใช้ทั้งหมด</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-custom p-3 text-center border-start border-4 border-danger">
                        <div className="h4 fw-bold text-danger mb-0">{stats.admins}</div>
                        <div className="text-muted small">Admin</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card-custom p-3 text-center border-start border-4 border-secondary">
                        <div className="h4 fw-bold text-secondary mb-0">{stats.users}</div>
                        <div className="text-muted small">User ทั่วไป</div>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="card-custom p-3 mb-4">
                <div className="row g-3">
                    <div className="col-md-8">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="ค้นหาด้วยชื่อ, username หรืออีเมล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value as 'ALL' | 'USER' | 'ADMIN')}
                        >
                            <option value="ALL">ทุก Role</option>
                            <option value="ADMIN">Admin</option>
                            <option value="USER">User</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users List */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">กำลังโหลด...</span>
                    </div>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="card-custom text-center py-5 text-muted">
                    ไม่พบข้อมูลผู้ใช้
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="card-custom p-0 overflow-hidden d-none d-lg-block">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                                        <th className="py-3">Username</th>
                                        <th className="py-3">อีเมล</th>
                                        <th className="py-3">เบอร์โทร</th>
                                        <th className="py-3">Role</th>
                                        <th className="py-3 text-center">การจอง</th>
                                        <th className="px-4 py-3 text-end">ดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user._id}>
                                            <td className="px-4">
                                                <div className="fw-bold">{user.fullName}</div>
                                                <div className="small text-muted">
                                                    สมัคร: {new Date(user.createdAt).toLocaleDateString('th-TH')}
                                                </div>
                                            </td>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || '-'}</td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td className="text-center">
                                                <span className="badge bg-light text-dark">
                                                    {user.bookingCount} รายการ
                                                </span>
                                            </td>
                                            <td className="px-4 text-end">
                                                <div className="d-flex gap-2 justify-content-end">
                                                    <button
                                                        className="btn btn-sm btn-outline-info"
                                                        onClick={() => handleViewUser(user._id)}
                                                    >
                                                        ดู
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => openEditModal(user)}
                                                    >
                                                        แก้ไข
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteUser(user._id)}
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

                    {/* Mobile Cards */}
                    <div className="d-lg-none">
                        <div className="row g-3">
                            {filteredUsers.map((user) => (
                                <div key={user._id} className="col-12">
                                    <div className="card-custom p-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <div className="fw-bold">{user.fullName}</div>
                                            {getRoleBadge(user.role)}
                                        </div>
                                        <div className="small text-muted mb-2">
                                            @{user.username} | {user.email}
                                        </div>
                                        <div className="small text-muted mb-3">
                                            {user.phone || 'ไม่มีเบอร์โทร'} | {user.bookingCount} การจอง
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-sm btn-outline-info flex-fill"
                                                onClick={() => handleViewUser(user._id)}
                                            >
                                                ดู
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-primary flex-fill"
                                                onClick={() => openEditModal(user)}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDeleteUser(user._id)}
                                                disabled={actionLoading}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold">เพิ่มผู้ใช้ใหม่</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {formError && (
                                        <div className="alert alert-danger mb-3">{formError}</div>
                                    )}
                                    <form onSubmit={handleCreateUser}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">ชื่อ-นามสกุล *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">Username *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">อีเมล *</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">รหัสผ่าน *</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">เบอร์โทรศัพท์</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">Role *</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.role}
                                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                                                    disabled={actionLoading}
                                                >
                                                    <option value="USER">User</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="d-grid mt-4">
                                            <button type="submit" className="btn btn-primary py-2" disabled={actionLoading}>
                                                {actionLoading ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit User Modal */}
            <AnimatePresence>
                {editingUser && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0">
                                    <h5 className="modal-title fw-bold">แก้ไขผู้ใช้</h5>
                                    <button type="button" className="btn-close" onClick={() => setEditingUser(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {formError && (
                                        <div className="alert alert-danger mb-3">{formError}</div>
                                    )}
                                    <form onSubmit={handleUpdateUser}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">ชื่อ-นามสกุล *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">Username *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">อีเมล *</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">รหัสผ่านใหม่</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยน"
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">เบอร์โทรศัพท์</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-semibold">Role *</label>
                                                <select
                                                    className="form-select"
                                                    value={formData.role}
                                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                                                    disabled={actionLoading}
                                                >
                                                    <option value="USER">User</option>
                                                    <option value="ADMIN">Admin</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="d-grid mt-4">
                                            <button type="submit" className="btn btn-primary py-2" disabled={actionLoading}>
                                                {actionLoading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View User Modal */}
            <AnimatePresence>
                {viewingUser && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-dialog modal-dialog-centered modal-lg"
                        >
                            <div className="modal-content border-0 shadow">
                                <div className="modal-header border-0 bg-primary text-white">
                                    <h5 className="modal-title fw-bold">รายละเอียดผู้ใช้</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setViewingUser(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6 className="text-muted small fw-bold mb-3">ข้อมูลส่วนตัว</h6>
                                            <div className="bg-light rounded-3 p-3">
                                                <div className="mb-2"><strong>ชื่อ-นามสกุล:</strong> {viewingUser.fullName}</div>
                                                <div className="mb-2"><strong>Username:</strong> {viewingUser.username}</div>
                                                <div className="mb-2"><strong>อีเมล:</strong> {viewingUser.email}</div>
                                                <div className="mb-2"><strong>เบอร์โทร:</strong> {viewingUser.phone || '-'}</div>
                                                <div className="mb-2"><strong>Role:</strong> {getRoleBadge(viewingUser.role)}</div>
                                                <div><strong>วันที่สมัคร:</strong> {new Date(viewingUser.createdAt).toLocaleString('th-TH')}</div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <h6 className="text-muted small fw-bold mb-3">ประวัติการจอง ({viewingUser.bookings?.length || 0} รายการ)</h6>
                                            <div className="bg-light rounded-3 p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                {viewingUser.bookings?.length > 0 ? (
                                                    viewingUser.bookings.map((booking: any) => (
                                                        <div key={booking._id} className="border-bottom pb-2 mb-2">
                                                            <div className="d-flex justify-content-between">
                                                                <strong>{booking.bookingId}</strong>
                                                                <span className={`badge ${booking.status === 'CONFIRMED' ? 'bg-success' :
                                                                    booking.status === 'AWAITING_APPROVAL' ? 'bg-info' :
                                                                        booking.status === 'RESERVED' ? 'bg-warning' : 'bg-secondary'
                                                                    }`}>
                                                                    {booking.status}
                                                                </span>
                                                            </div>
                                                            <div className="small text-muted">
                                                                ล็อค: {booking.stall?.stallId || 'N/A'} | {new Date(booking.createdAt).toLocaleDateString('th-TH')}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted text-center py-3">ยังไม่มีการจอง</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => {
                                            openEditModal(viewingUser);
                                            setViewingUser(null);
                                        }}
                                    >
                                        แก้ไขข้อมูล
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setViewingUser(null)}>
                                        ปิด
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
