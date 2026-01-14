'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ApiResponse } from '@/lib/api';

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/stats');
        const data: ApiResponse<any> = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Hero Section - Mobile Optimized */}
      <div className="container py-3 py-md-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-4 py-md-5"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-4"
          >
            <span style={{ fontSize: 'clamp(3rem, 10vw, 5rem)' }}>🏪</span>
          </motion.div>

          {/* Title */}
          <h1 className="fw-bold mb-3 text-gradient" style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}>
            ระบบจองล็อคตลาด
          </h1>

          {/* Subtitle */}
          <p className="lead text-muted mb-4 px-3" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            จองล็อคขายของในตลาดได้ง่ายๆ<br className="d-md-none" />
            ผ่านระบบออนไลน์ ทั้งสะดวกและรวดเร็ว
          </p>

          {/* CTA Buttons - Stack on mobile */}
          <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center px-3" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-100 w-sm-auto"
            >
              <Link href="/market" className="btn btn-primary-custom btn-lg d-flex align-items-center justify-content-center gap-2">
                <span>🔒</span>
                <span>เริ่มจองล็อค</span>
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-100 w-sm-auto"
            >
              <Link
                href="/bookings"
                className="btn btn-outline-primary btn-lg d-flex align-items-center justify-content-center gap-2"
                style={{
                  borderWidth: '2px',
                  borderRadius: 'var(--radius-lg)',
                  fontWeight: 600,
                }}
              >
                <span>📋</span>
                <span>ดูการจองของฉัน</span>
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section - Mobile Responsive */}
        <div className="row g-3 g-md-4 mt-3 mt-md-5">
          {/* Stat Card 1 */}
          <div className="col-12 col-sm-6 col-md-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -8 }}
              className="card-custom text-center p-4 h-100 position-relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(79, 70, 229, 0.05) 100%)',
                borderLeft: '4px solid var(--primary)',
              }}
            >
              <div className="mb-3">
                <span style={{ fontSize: '2.5rem' }}>✅</span>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: '3rem', width: '80px', margin: '0 auto 0.5rem' }}></div>
              ) : (
                <motion.h2
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  className="fw-bold mb-2 text-gradient"
                  style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}
                >
                  {stats?.availableStalls || 0}
                </motion.h2>
              )}
              <p className="text-muted mb-0 fw-medium">ล็อคว่างพร้อมจอง</p>
            </motion.div>
          </div>

          {/* Stat Card 2 */}
          <div className="col-12 col-sm-6 col-md-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -8 }}
              className="card-custom text-center p-4 h-100 position-relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%)',
                borderLeft: '4px solid var(--warning)',
              }}
            >
              <div className="mb-3">
                <span style={{ fontSize: '2.5rem' }}>⏳</span>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: '3rem', width: '80px', margin: '0 auto 0.5rem' }}></div>
              ) : (
                <motion.h2
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                  className="fw-bold mb-2"
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    background: 'linear-gradient(135deg, var(--warning) 0%, var(--warning-light) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stats?.pendingBookings || 0}
                </motion.h2>
              )}
              <p className="text-muted mb-0 fw-medium">รอการตรวจสอบสลิป</p>
            </motion.div>
          </div>

          {/* Stat Card 3 */}
          <div className="col-12 col-sm-12 col-md-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -8 }}
              className="card-custom text-center p-4 h-100 position-relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(52, 211, 153, 0.05) 100%)',
                borderLeft: '4px solid var(--success)',
              }}
            >
              <div className="mb-3">
                <span style={{ fontSize: '2.5rem' }}>🔒</span>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: '3rem', width: '80px', margin: '0 auto 0.5rem' }}></div>
              ) : (
                <motion.h2
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.6 }}
                  className="fw-bold mb-2"
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    background: 'linear-gradient(135deg, var(--success) 0%, var(--success-light) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {(stats?.totalStalls - stats?.availableStalls) || 0}
                </motion.h2>
              )}
              <p className="text-muted mb-0 fw-medium">ล็อคที่จองแล้ว</p>
            </motion.div>
          </div>
        </div>

        {/* Feature Highlights - Mobile Friendly */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 text-center"
        >
          <div className="row g-3 justify-content-center">
            <div className="col-6 col-md-3">
              <div className="p-3">
                <div style={{ fontSize: '2rem' }}>⚡</div>
                <p className="small text-muted mb-0 mt-2">จองได้ทันที</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3">
                <div style={{ fontSize: '2rem' }}>🔒</div>
                <p className="small text-muted mb-0 mt-2">ปลอดภัย 100%</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3">
                <div style={{ fontSize: '2rem' }}>📱</div>
                <p className="small text-muted mb-0 mt-2">ใช้งานง่าย</p>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3">
                <div style={{ fontSize: '2rem' }}>💰</div>
                <p className="small text-muted mb-0 mt-2">ราคาชัดเจน</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
