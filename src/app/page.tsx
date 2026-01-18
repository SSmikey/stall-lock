'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, ClipboardList, Coins, Clock, Megaphone, CheckCircle } from 'lucide-react';

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
    <main>
      {/* Hero Section */}
      {/* Hero Section */}
      <div className="home-hero">
        <div className="hero-circle"></div>
        <div className="container position-relative z-1">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h1 className="display-4 fw-bold mb-3 text-white">
                ระบบจองล็อคตลาด
              </h1>
              <p className="lead text-white mb-4 fw-normal">
                จัดการพื้นที่ขายของคุณได้ง่ายๆ จอง จ่าย จบ ในที่เดียว<br />
                ระบบที่แม่ค้าพ่อค้าไว้วางใจ
              </p>
              <div className="btn btn-brand-inverse btn-lg px-5 shadow-lg fw-bold d-inline-flex align-items-center gap-2">
                <span>จองล็อคเลย</span> <Store size={20} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        {/* Feature Cards */}
        <div className="row g-4 mb-5" style={{ marginTop: '-4rem' }}>
          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
              <div className="card-body text-center p-4">
                <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                  <Store size={32} className="text-brand" />
                </div>
                <h5 className="card-title fw-bold text-dark">ตลาด</h5>
                <p className="card-text text-muted small">
                  สำรวจแผนผังตลาดและเลือกทำเลทองของคุณ
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
              <div className="card-body text-center p-4">
                <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                  <ClipboardList size={32} className="text-brand" />
                </div>
                <h5 className="card-title fw-bold text-dark">การจองของฉัน</h5>
                <p className="card-text text-muted small">
                  ตรวจสอบสถานะและประวัติการจองย้อนหลัง
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
              <div className="card-body text-center p-4">
                <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                  <Coins size={32} className="text-brand" />
                </div>
                <h5 className="card-title fw-bold text-dark">ราคาเริ่มต้น</h5>
                <p className="card-text text-brand fw-bold fs-3 my-2">
                  ฿200
                </p>
                <p className="text-muted small">ต่อวัน</p>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card h-100 border-0 shadow-sm hover-lift card-brand-accent">
              <div className="card-body text-center p-4">
                <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                  <Clock size={32} className="text-brand" />
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
                    <Megaphone size={48} className="text-brand mb-3" />
                    <h3 className="fw-bold text-dark">ข้อมูลสำคัญ</h3>
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="card-body p-4 p-lg-5 h-100 d-flex flex-column justify-content-center">
                    <div className="row g-4">
                      <div className="col-sm-6">
                        <div className="d-flex align-items-start">
                          <CheckCircle size={24} className="text-success me-3 mt-1" />
                          <div>
                            <h6 className="fw-bold mb-1">จองได้ 24 ชม.</h6>
                            <p className="text-muted small mb-0">ระบบออนไลน์ใช้งานได้ตลอดเวลา</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="d-flex align-items-start">
                          <CheckCircle size={24} className="text-success me-3 mt-1" />
                          <div>
                            <h6 className="fw-bold mb-1">ยกเลิกได้</h6>
                            <p className="text-muted small mb-0">แจ้งล่วงหน้าก่อน 1 วัน</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="d-flex align-items-start">
                          <CheckCircle size={24} className="text-success me-3 mt-1" />
                          <div>
                            <h6 className="fw-bold mb-1">ชำระเงินผ่านระบบปลอดภัย</h6>
                          </div>
                        </div>
                      </div>
                      <div className="col-sm-6">
                        <div className="d-flex align-items-start">
                          <CheckCircle size={24} className="text-success me-3 mt-1" />
                          <div>
                            <h6 className="fw-bold mb-1">ติดต่อเจ้าหน้าที่ 02-123-4567</h6>
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
    </main>
  );
}
