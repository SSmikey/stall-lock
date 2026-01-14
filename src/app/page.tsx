'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HomePage() {
  return (
    <div className="min-vh-100 d-flex flex-column">
      {/* Hero Section */}
      <div className="container py-5">
        <div className="text-center py-5">
          <h1 className="display-4 fw-bold mb-3">ระบบจองล็อคตลาด</h1>
          <p className="lead text-muted mb-4">
            จองล็อคขายของในตลาดได้ง่ายๆ ผ่านระบบออนไลน์
          </p>

          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <Link href="/market" className="btn btn-primary-custom btn-lg">
              เริ่มจองล็อค
            </Link>
            <Link href="/bookings" className="btn btn-outline-primary btn-lg">
              ดูการจองของฉัน
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="row mt-5">
          <div className="col-md-4 mb-3">
            <div className="card-custom text-center">
              <h3 className="text-primary mb-2">128</h3>
              <p className="text-muted mb-0">ล็อคว่าง</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card-custom text-center">
              <h3 className="text-warning mb-2">45</h3>
              <p className="text-muted mb-0">รอชำระเงิน</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card-custom text-center">
              <h3 className="text-success mb-2">327</h3>
              <p className="text-muted mb-0">จองสำเร็จ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
