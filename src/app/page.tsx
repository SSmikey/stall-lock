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
      {/* Hero Section */}
      <div className="container py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-5"
        >
          <h1 className="display-4 fw-bold mb-3">ระบบจองล็อคตลาด</h1>
          <p className="lead text-muted mb-4">
            จองล็อคขายของในตลาดได้ง่ายๆ ผ่านระบบออนไลน์ ทั้งสะดวกและรวดเร็ว
          </p>

          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/market" className="btn btn-primary-custom btn-lg px-4">
              เริ่มจองล็อค
            </Link>
            <Link href="/bookings" className="btn btn-outline-primary btn-lg px-4">
              ดูการจองของฉัน
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="row mt-5">
          <div className="col-md-4 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="card-custom text-center p-4 h-100 d-flex flex-column justify-content-center"
            >
              <h3 className="text-primary fw-bold mb-2">
                {loading ? '...' : stats?.availableStalls || 0}
              </h3>
              <p className="text-muted mb-0">ล็อคว่างพร้อมจอง</p>
            </motion.div>
          </div>
          <div className="col-md-4 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="card-custom text-center p-4 h-100 d-flex flex-column justify-content-center"
            >
              <h3 className="text-warning fw-bold mb-2">
                {loading ? '...' : stats?.pendingBookings || 0}
              </h3>
              <p className="text-muted mb-0">รอการตรวจสอบสลิป</p>
            </motion.div>
          </div>
          <div className="col-md-4 mb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="card-custom text-center p-4 h-100 d-flex flex-column justify-content-center"
            >
              <h3 className="text-success fw-bold mb-2">
                {loading ? '...' : (stats?.totalStalls - stats?.availableStalls) || 0}
              </h3>
              <p className="text-muted mb-0">ล็อคที่จองแล้ว</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
