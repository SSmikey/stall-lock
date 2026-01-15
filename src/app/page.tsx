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
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 fw-bold text-gradient-brand mb-3">
            🔒 ระบบจองล็อคตลาด
          </h1>
          <p className="lead text-muted">
            ระบบจัดการและจองล็อคขายของในตลาดอย่างมีประสิทธิภาพ
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-md-6 col-lg-3">
          <Link href="/market" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm hover-shadow smooth">
              <div className="card-body text-center p-4">
                <div className="fs-1 mb-3">🏪</div>
                <h5 className="card-title fw-bold">ตลาด</h5>
                <p className="card-text text-muted small">
                  ดูล็อคว่างและจองล็อคของคุณ
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-6 col-lg-3">
          <Link href="/bookings" className="text-decoration-none">
            <div className="card h-100 border-0 shadow-sm hover-shadow smooth">
              <div className="card-body text-center p-4">
                <div className="fs-1 mb-3">📋</div>
                <h5 className="card-title fw-bold">การจองของฉัน</h5>
                <p className="card-text text-muted small">
                  ดูรายการจองและประวัติของคุณ
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center p-4">
              <div className="fs-1 mb-3">💰</div>
              <h5 className="card-title fw-bold">ราคาเริ่มต้น</h5>
              <p className="card-text text-brand fw-bold fs-4">
                ฿500/วัน
              </p>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-body text-center p-4">
              <div className="fs-1 mb-3">⏰</div>
              <h5 className="card-title fw-bold">เวลาทำการ</h5>
              <p className="card-text text-muted small">
                จันทร์ - อาทิตย์<br />06:00 - 18:00
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5">
        <div className="col-12">
          <div className="card border-0 shadow-sm bg-light">
            <div className="card-body p-4">
              <h4 className="fw-bold mb-3">📢 ข้อมูลสำคัญ</h4>
              <ul className="list-unstyled mb-0">
                <li className="mb-2">✅ จองล็อคได้ทุกวัน ตลอด 24 ชั่วโมง</li>
                <li className="mb-2">✅ ยกเลิกการจองได้ก่อน 1 วัน</li>
                <li className="mb-2">✅ ชำระเงินผ่านระบบปลอดภัย</li>
                <li className="mb-0">✅ ติดต่อเจ้าหน้าที่ 02-123-4567</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
