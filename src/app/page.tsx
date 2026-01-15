'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in by checking for token
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          // Not logged in, redirect to login
          router.push('/login');
        }
      } catch (error) {
        // Error checking auth, redirect to login
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="container py-5">
      {/* Hero Section */}
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8 text-center">
          <div className="bg-brand-gradient-subtle rounded-4 p-5 mb-5 shadow">
            <h1 className="display-4 fw-bold text-gradient-brand mb-3">
              ระบบจองล็อคตลาด
            </h1>
            <p className="lead text-muted mb-4">
              จัดการพื้นที่ขายของคุณได้ง่ายๆ จอง จ่าย จบ ในที่เดียว<br />
              ระบบที่แม่ค้าพ่อค้าไว้วางใจ
            </p>
            <Link href="/market" className="btn btn-brand btn-lg px-5 shadow-sm">
              จองล็อคเลย 🏪
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-6 col-lg-3">
          <Link href="/market" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
              <div className="card-body text-center p-4">
                <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                  <span className="fs-2 text-brand">🏪</span>
                </div>
                <h5 className="card-title fw-bold text-dark">ตลาด</h5>
                <p className="card-text text-muted small">
                  สำรวจแผนผังตลาดและเลือกทำเลทองของคุณ
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-6 col-lg-3">
          <Link href="/bookings" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
              <div className="card-body text-center p-4">
                <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                  <span className="fs-2 text-brand">📋</span>
                </div>
                <h5 className="card-title fw-bold text-dark">การจองของฉัน</h5>
                <p className="card-text text-muted small">
                  ตรวจสอบสถานะและประวัติการจองย้อนหลัง
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
            <div className="card-body text-center p-4">
              <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                <span className="fs-2 text-brand">💰</span>
              </div>
              <h5 className="card-title fw-bold text-dark">ราคาเริ่มต้น</h5>
              <p className="card-text text-brand fw-bold fs-3 my-2">
                ฿500
              </p>
              <p className="text-muted small">ต่อวัน</p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
            <div className="card-body text-center p-4">
              <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                <span className="fs-2 text-brand">⏰</span>
              </div>
              <h5 className="card-title fw-bold text-dark">เวลาทำการ</h5>
              <p className="card-text text-dark fw-semibold mb-0">
                06:00 - 18:00
              </p>
              <p className="text-muted small">เปิดทุกวัน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="row g-0">
              <div className="col-md-4 bg-brand-gradient-subtle d-flex align-items-center justify-content-center p-4">
                <div className="text-center">
                  <span className="display-1">📢</span>
                  <h3 className="fw-bold mt-3 text-gradient-brand">ข้อมูลสำคัญ</h3>
                </div>
              </div>
              <div className="col-md-8">
                <div className="card-body p-4 p-lg-5">
                  <div className="row g-4">
                    <div className="col-sm-6">
                      <div className="d-flex align-items-start">
                        <span className="me-3 fs-4">✅</span>
                        <div>
                          <h6 className="fw-bold mb-1">จองได้ 24 ชม.</h6>
                          <p className="text-muted small mb-0">ระบบออนไลน์ใช้งานได้ตลอดเวลา</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-start">
                        <span className="me-3 fs-4">✅</span>
                        <div>
                          <h6 className="fw-bold mb-1">ยกเลิกได้</h6>
                          <p className="text-muted small mb-0">แจ้งล่วงหน้าก่อน 1 วัน</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-start">
                        <span className="me-3 fs-4">✅</span>
                        <div>
                          <h6 className="fw-bold mb-1">ชำระเงินปลอดภัย</h6>
                          <p className="text-muted small mb-0">รองรับ QR Code และบัตรเครดิต</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-start">
                        <span className="me-3 fs-4">✅</span>
                        <div>
                          <h6 className="fw-bold mb-1">ช่วยเหลือ</h6>
                          <p className="text-muted small mb-0">ติดต่อเจ้าหน้าที่ 02-123-4567</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
