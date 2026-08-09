import React, { useState, useEffect } from 'react';
import styles from './AILoading.module.css';

const loadingTexts = [
  "Đang đọc năng lượng của các lá bài...",
  "Đang kết nối thông điệp...",
  "Lắng nghe lời thì thầm của vũ trụ...",
  "Đang hoàn thành lời giải..."
];

export const AILoading: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % loadingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.sparkle}>✦</div>
      <div className={styles.pulseRing}></div>
      <p className={styles.loadingText}>
        {loadingTexts[textIndex]}
      </p>
    </div>
  );
};
