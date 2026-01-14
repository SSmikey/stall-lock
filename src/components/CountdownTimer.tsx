'use client';

import { useState, useEffect } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface CountdownTimerProps {
    expiresAt: string | Date;
    onExpire?: () => void;
    size?: number;
}

export default function CountdownTimer({ expiresAt, onExpire, size = 120 }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [percentage, setPercentage] = useState<number>(100);
    const totalTime = 3600; // 1 hour in seconds

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const difference = Math.max(0, Math.floor((expiry - now) / 1000));

            setTimeLeft(difference);
            setPercentage((difference / totalTime) * 100);

            if (difference === 0 && onExpire) {
                onExpire();
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [expiresAt, onExpire]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getColor = () => {
        if (percentage > 50) return '#10b981'; // Success
        if (percentage > 20) return '#f59e0b'; // Warning
        return '#ef4444'; // Danger
    };

    return (
        <div style={{ width: size, height: size }}>
            <CircularProgressbar
                value={percentage}
                text={formatTime(timeLeft)}
                styles={buildStyles({
                    textSize: '20px',
                    pathTransitionDuration: 0.5,
                    pathColor: getColor(),
                    textColor: '#111827',
                    trailColor: '#f3f4f6',
                })}
            />
        </div>
    );
}
