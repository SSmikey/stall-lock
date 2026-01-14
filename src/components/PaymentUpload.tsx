'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentUploadProps {
    bookingId: string;
    onSuccess: () => void;
}

export default function PaymentUpload({ bookingId, onSuccess }: PaymentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png']
        },
        maxFiles: 1,
        maxSize: 5242880 // 5MB
    });

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('slip', file);
        formData.append('bookingId', bookingId);

        try {
            const res = await fetch('/api/payments/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                onSuccess();
            } else {
                setError(data.error?.message || 'เกิดข้อผิดพลาดในการอัพโหลด');
            }
        } catch (err) {
            setError('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="payment-upload">
            {error && (
                <div className="alert alert-danger py-2 small mb-3">
                    {error}
                </div>
            )}

            {!preview ? (
                <div
                    {...getRootProps()}
                    className={`p-5 border-2 border-dashed rounded-4 text-center cursor-pointer smooth ${isDragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary bg-light'
                        }`}
                    style={{ cursor: 'pointer' }}
                >
                    <input {...getInputProps()} />
                    <div className="h1 mb-3">📤</div>
                    <h5 className="fw-bold">อัพโหลดสลิปชำระเงิน</h5>
                    <p className="text-muted small mb-0">
                        {isDragActive ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์'}
                    </p>
                    <p className="text-muted" style={{ fontSize: '10px' }}>JPG, PNG (สูงสุด 5MB)</p>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 border rounded-4 bg-light text-center"
                >
                    <div className="position-relative d-inline-block mb-3">
                        <img
                            src={preview}
                            alt="Slip Preview"
                            className="img-fluid rounded-3 shadow-sm"
                            style={{ maxHeight: '300px' }}
                        />
                        <button
                            className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2 rounded-circle shadow-sm"
                            onClick={() => { setFile(null); setPreview(null); }}
                            style={{ width: '30px', height: '30px', padding: 0 }}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="d-flex gap-2 justify-content-center">
                        <button
                            className="btn btn-primary-custom px-4"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <><span className="spinner-border spinner-border-sm me-2"></span>กำลังอัพโหลด...</>
                            ) : 'ยืนยันการชำระเงิน'}
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
