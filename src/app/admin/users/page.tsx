'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { User as UserIcon, Shield, Search, Users } from 'lucide-react';
import { showAlert, showConfirm } from '@/utils/sweetalert';

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
                showAlert('ผิดพลาด', data.error?.message || 'ไม่สามารถสร้างผู้ใช้ได้', 'error');
                return;
            }

            showAlert('สำเร็จ', 'สร้างผู้ใช้สำเร็จ', 'success');
            setShowCreateModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            showAlert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
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
                showAlert('ผิดพลาด', data.error?.message || 'ไม่สามารถอัปเดตผู้ใช้ได้', 'error');
                return;
            }

            showAlert('สำเร็จ', 'อัปเดตผู้ใช้สำเร็จ', 'success');
            setEditingUser(null);
            resetForm();
            fetchUsers();
        } catch (error) {
            showAlert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!await showConfirm('ยืนยันการลบ', 'ยืนยันการลบผู้ใช้นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้', 'ลบผู้ใช้', 'warning')) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                showAlert('ผิดพลาด', data.error?.message || 'ไม่สามารถลบผู้ใช้ได้', 'error');
                return;
            }

            showAlert('สำเร็จ', 'ลบผู้ใช้สำเร็จ', 'success');
            fetchUsers();
        } catch (error) {
            showAlert('ผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ', 'error');
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
            showAlert('ผิดพลาด', 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้', 'error');
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
            return <span className="badge bg-danger shadow-sm">Admin</span>;
        }
        return <span className="badge bg-secondary shadow-sm">User</span>;
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

    // Loading State
    if (loading && !users.length) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-0 bg-light min-vh-100">
            {/* Hero Section */}
            <div className="home-hero pt-5 pb-5 mb-5" style={{ borderRadius: '0 0 50px 50px' }}>
                <div className="hero-circle" style={{ width: '400px', height: '400px', top: '-100px', right: '-100px', opacity: 0.2 }}></div>
                <div className="container position-relative z-1">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        <div className="text-white">
                            <h1 className="fw-bold mb-1">จัดการผู้ใช้</h1>
                            <p className="lead mb-0 fw-normal">จัดการข้อมูลผู้ใช้งานและสิทธิ์การเข้าถึง</p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-light px-4 fw-bold rounded-pill shadow-sm text-brand border-0 hover-scale"
                                onClick={() => {
                                    resetForm();
                                    setShowCreateModal(true);
                                }}
                                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                            >
                                <span className="fs-6 me-2">➕</span> เพิ่มผู้ใช้
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '-4rem' }}>
                {/* Stats Cards */}
                <div className="row g-4 mb-5">
                    <div className="col-md-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#E3F2FD', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>👥</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-dark">{stats.total}</div>
                                        <div className="text-dark small fw-medium">ผู้ใช้ทั้งหมด</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <div className="col-md-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#FFEBEE', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-danger">{stats.admins}</div>
                                        <div className="text-dark small fw-medium">ผู้ดูแล (Admin)</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    <div className="col-md-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card border border-2 shadow-sm h-100 overflow-hidden"
                            style={{ borderRadius: 'var(--radius-lg)', borderColor: 'var(--brand-light)' }}
                        >
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="rounded-circle p-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#F5F5F5', width: '60px', height: '60px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>👤</span>
                                    </div>
                                    <div>
                                        <div className="h3 fw-bold mb-0 text-secondary">{stats.users}</div>
                                        <div className="text-dark small fw-medium">ผู้ใช้ทั่วไป (User)</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Main Content Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card border-0 shadow-sm mb-5 overflow-hidden"
                    style={{ borderRadius: 'var(--radius-lg)' }}
                >
                    <div className="card-body p-4">
                        {/* Filters */}
                        <div className="row g-3 mb-4">
                            <div className="col-md-8">
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">🔍</span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 rounded-end-pill py-2 bg-light shadow-sm"
                                        placeholder="ค้นหาด้วยชื่อ, username หรืออีเมล..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ boxShadow: 'none' }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div style={{ minWidth: '200px' }}>
                                    <CustomDropdown
                                        value={filterRole}
                                        onChange={(val) => setFilterRole(val as 'ALL' | 'USER' | 'ADMIN')}
                                        options={[
                                            { value: 'ALL', label: 'แสดงทุก Role', icon: <Users size={18} className="text-primary" /> },
                                            { value: 'ADMIN', label: 'เฉพาะ Admin', icon: <Shield size={18} className="text-danger" /> },
                                            { value: 'USER', label: 'เฉพาะ User', icon: <UserIcon size={18} className="text-secondary" /> }
                                        ]}
                                        placeholder="แสดงทุก Role"
                                        className="w-100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="display-1 mb-3">🤷‍♂️</div>
                                <h5 className="text-muted">ไม่พบข้อมูลผู้ใช้</h5>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="table-responsive d-none d-lg-block">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="px-4 py-3 border-bottom-0 text-secondary small text-uppercase">วันที่สมัคร</th>
                                                <th className="py-3 border-bottom-0 text-secondary small text-uppercase">Username</th>
                                                <th className="py-3 border-bottom-0 text-secondary small text-uppercase">เบอร์โทร</th>
                                                <th className="py-3 border-bottom-0 text-secondary small text-uppercase">Role</th>
                                                <th className="py-3 text-center border-bottom-0 text-secondary small text-uppercase">การจอง</th>
                                                <th className="px-4 py-3 text-end border-bottom-0 text-secondary small text-uppercase">จัดการ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map((user) => (
                                                <tr key={user._id}>
                                                    <td className="px-4 text-muted">
                                                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                                                    </td>
                                                    <td>
                                                        <div className="fw-bold text-dark">{user.username}</div>
                                                        <div className="small text-muted">{user.email}</div>
                                                    </td>
                                                    <td>{user.phone || '-'}</td>
                                                    <td>{getRoleBadge(user.role)}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-light text-dark border">
                                                            {user.bookingCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 text-end">
                                                        <div className="d-flex gap-2 justify-content-end">
                                                            <button
                                                                className="btn btn-sm btn-light rounded-pill px-3"
                                                                onClick={() => handleViewUser(user._id)}
                                                            >
                                                                👁️ รายละเอียด
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                                onClick={() => openEditModal(user)}
                                                            >
                                                                ✏️ แก้ไข
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                                                onClick={() => handleDeleteUser(user._id)}
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

                                {/* Mobile Cards */}
                                <div className="d-lg-none">
                                    <div className="row g-3">
                                        {filteredUsers.map((user) => (
                                            <div key={user._id} className="col-12">
                                                <div className="card border-0 shadow-sm p-3 rounded-4 bg-light">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div className="fw-bold text-primary">@{user.username}</div>
                                                        {getRoleBadge(user.role)}
                                                    </div>
                                                    <div className="small text-muted mb-2">
                                                        {user.fullName} | {user.email}
                                                    </div>
                                                    <div className="small text-muted mb-3 d-flex justify-content-between">
                                                        <span>📞 {user.phone || '-'}</span>
                                                        <span>📅 {new Date(user.createdAt).toLocaleDateString('th-TH')}</span>
                                                    </div>
                                                    <div className="d-grid gap-2 d-flex">
                                                        <button
                                                            className="btn btn-sm btn-light flex-fill rounded-pill"
                                                            onClick={() => handleViewUser(user._id)}
                                                        >
                                                            👁️ รายละเอียด
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary flex-fill rounded-pill"
                                                            onClick={() => openEditModal(user)}
                                                        >
                                                            ✏️ แก้ไข
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger flex-fill rounded-pill"
                                                            onClick={() => handleDeleteUser(user._id)}
                                                            disabled={actionLoading}
                                                        >
                                                            🗑️ ลบ
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Create User Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 text-white rounded-top-4 p-4" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)' }}>
                                    <h5 className="modal-title fw-bold">เพิ่มผู้ใช้ใหม่</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {formError && (
                                        <div className="alert alert-danger mb-3 rounded-3">{formError}</div>
                                    )}
                                    <form onSubmit={handleCreateUser}>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">ชื่อ-นามสกุล *</label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Username *</label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">อีเมล *</label>
                                                <input
                                                    type="email"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">รหัสผ่าน *</label>
                                                <input
                                                    type="password"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">เบอร์โทรศัพท์</label>
                                                <input
                                                    type="tel"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Role *</label>
                                                <CustomDropdown
                                                    value={formData.role}
                                                    onChange={(val) => setFormData({ ...formData, role: val as 'USER' | 'ADMIN' })}
                                                    options={[
                                                        { value: 'USER', label: 'User', icon: <UserIcon size={18} className="text-secondary" /> },
                                                        { value: 'ADMIN', label: 'Admin', icon: <Shield size={18} className="text-danger" /> }
                                                    ]}
                                                    placeholder="เลือก Role"
                                                    className="w-100 basic-dropdown"
                                                />
                                            </div>
                                        </div>
                                        <div className="d-grid mt-4">
                                            <button type="submit" className="btn btn-brand text-white py-2 shadow-sm fw-bold" disabled={actionLoading}>
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
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-dialog modal-dialog-centered"
                        >
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 text-white rounded-top-4 p-4" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)' }}>
                                    <h5 className="modal-title fw-bold">แก้ไขผู้ใช้</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setEditingUser(null)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {formError && (
                                        <div className="alert alert-danger mb-3 rounded-3">{formError}</div>
                                    )}
                                    <form onSubmit={handleUpdateUser}>
                                        <div className="row g-3">
                                            <div className="col-md-12">
                                                <label className="form-label small fw-bold text-secondary">Username *</label>
                                                <input
                                                    type="text"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    value={formData.username}
                                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                    required
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">เบอร์โทรศัพท์</label>
                                                <input
                                                    type="tel"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Role *</label>
                                                <CustomDropdown
                                                    value={formData.role}
                                                    onChange={(val) => setFormData({ ...formData, role: val as 'USER' | 'ADMIN' })}
                                                    options={[
                                                        { value: 'USER', label: 'User', icon: <UserIcon size={18} className="text-secondary" /> },
                                                        { value: 'ADMIN', label: 'Admin', icon: <Shield size={18} className="text-danger" /> }
                                                    ]}
                                                    placeholder="เลือก Role"
                                                    className="w-100 basic-dropdown"
                                                />
                                            </div>
                                            <div className="col-12">
                                                <div className="alert alert-light border small text-muted">
                                                    <i className="me-2">ℹ️</i>
                                                    รหัสผ่าน: เว้นว่างไว้หากไม่ต้องการเปลี่ยน
                                                </div>
                                                <input
                                                    type="password"
                                                    className="form-control rounded-pill bg-light border-0 shadow-sm"
                                                    placeholder="ตั้งรหัสผ่านใหม่ (ถ้ามี)"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    disabled={actionLoading}
                                                />
                                            </div>
                                        </div>
                                        <div className="d-grid mt-4">
                                            <button type="submit" className="btn btn-primary py-2 rounded-pill shadow-sm fw-bold" style={{ backgroundColor: '#FF6B35', borderColor: '#FF6B35' }} disabled={actionLoading}>
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
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="modal-dialog modal-dialog-centered modal-lg"
                        >
                            <div className="modal-content border-0 shadow-lg rounded-4">
                                <div className="modal-header border-0 text-white rounded-top-4 p-4" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 100%)' }}>
                                    <h5 className="modal-title fw-bold">รายละเอียดผู้ใช้</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setViewingUser(null)}></button>
                                </div>
                                <div className="modal-body p-4 bg-light">
                                    <div className="row g-4">
                                        <div className="col-md-5">
                                            <div className="card border-0 shadow-sm p-3 h-100 rounded-4">
                                                <div className="text-center mb-3">
                                                    <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-2">
                                                        <span className="display-6">👤</span>
                                                    </div>
                                                    <h5 className="fw-bold">{viewingUser.fullName}</h5>
                                                    <p className="text-muted small">@{viewingUser.username}</p>
                                                    {getRoleBadge(viewingUser.role)}
                                                </div>
                                                <hr className="text-muted opacity-25" />
                                                <div className="small">
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">อีเมล:</span>
                                                        <span className="fw-medium text-end text-break ms-2">{viewingUser.email}</span>
                                                    </div>
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">โทร:</span>
                                                        <span className="fw-medium">{viewingUser.phone || '-'}</span>
                                                    </div>
                                                    <div className="mb-2 d-flex justify-content-between">
                                                        <span className="text-muted">วันที่สมัคร:</span>
                                                        <span className="fw-medium">{new Date(viewingUser.createdAt).toLocaleDateString('th-TH')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-7">
                                            <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
                                                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                                    <span>📋</span> ประวัติการจอง ({viewingUser.bookings?.length || 0})
                                                </h6>
                                                <div className="overflow-auto pe-2" style={{ maxHeight: '300px' }}>
                                                    {viewingUser.bookings?.length > 0 ? (
                                                        <div className="d-flex flex-column gap-2">
                                                            {viewingUser.bookings.map((booking: any) => (
                                                                <div key={booking._id} className="p-3 bg-light rounded-3 border border-light">
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <span className="fw-bold text-primary small">#{booking.bookingId}</span>
                                                                        <span className={`badge rounded-pill ${booking.status === 'CONFIRMED' ? 'bg-success' :
                                                                            booking.status === 'AWAITING_APPROVAL' ? 'bg-info' :
                                                                                booking.status === 'RESERVED' ? 'bg-warning' : 'bg-secondary'
                                                                            }`}>
                                                                            {booking.status}
                                                                        </span>
                                                                    </div>
                                                                    <div className="small text-muted d-flex justify-content-between">
                                                                        <span>ล็อค {booking.stall?.stallId || '?'}</span>
                                                                        <span>{new Date(booking.createdAt).toLocaleDateString('th-TH')}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-5 text-muted bg-light rounded-3 h-100 d-flex flex-column justify-content-center">
                                                            <div className="fs-3 mb-2">📭</div>
                                                            ยังไม่มีประวัติการจอง
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 p-4 pt-0 bg-light">
                                    <button
                                        className="btn btn-outline-danger rounded-pill px-4"
                                        style={{ borderColor: '#FF6B35', color: '#FF6B35' }}
                                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FF6B35', e.currentTarget.style.color = '#fff')}
                                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent', e.currentTarget.style.color = '#FF6B35')}
                                        onClick={() => {
                                            openEditModal(viewingUser);
                                            setViewingUser(null);
                                        }}
                                    >
                                        ✏️ แก้ไขข้อมูล
                                    </button>
                                    <button className="btn btn-secondary rounded-pill px-4" onClick={() => setViewingUser(null)}>
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
