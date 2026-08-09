"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './FlyingCard.module.css';
import { PickedCard } from '@/types/tarot';

interface FlyingCardProps {
  card: PickedCard;
  isFlipped: boolean;
  layoutId: string;
  onClick?: () => void;
  className?: string;
  onLayoutAnimationComplete?: () => void;
  delayFlip?: boolean;
}

export const FlyingCard: React.FC<FlyingCardProps> = ({ 
  card, 
  isFlipped, 
  layoutId, 
  onClick, 
  className = '',
  onLayoutAnimationComplete,
  delayFlip = false
}) => {
  const [delayedFlipReady, setDelayedFlipReady] = useState(false);

  // We use this to trigger the CSS flip only AFTER the layout animation (fly) settles.
  useEffect(() => {
    if (!isFlipped || !delayFlip) return;

    // Safety timeout in case the shared-layout completion callback is skipped.
    const timer = setTimeout(() => setDelayedFlipReady(true), 400);
    return () => clearTimeout(timer);
  }, [isFlipped, delayFlip]);

  const internalFlip = isFlipped && (!delayFlip || delayedFlipReady);

  const handleLayoutAnimationComplete = () => {
    if (onLayoutAnimationComplete) {
      onLayoutAnimationComplete();
    }
    if (isFlipped) {
      setDelayedFlipReady(true);
    }
  };

  return (
    <motion.div 
      layoutId={layoutId}
      className={`${styles.cardWrapper} ${className}`}
      onClick={onClick}
      onLayoutAnimationComplete={handleLayoutAnimationComplete}
      transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
    >
      <div 
        className={`${styles.cardInner} ${internalFlip ? styles.isFlipped : ''}`}
        style={internalFlip ? {
          transform: card.orientation === 'REVERSED' ? 'rotateY(180deg) rotateZ(180deg)' : 'rotateY(180deg)'
        } : undefined}
      >
        <div className={styles.cardBack}>
          <div className={styles.backPattern}></div>
        </div>
        <div className={styles.cardFront}>
          <img src={card.image} alt={card.name} className={styles.cardImage} loading="lazy" />
          <div className={styles.cardLabel}>
            {card.name} <br/> 
            <span className={styles.orientation}>{card.orientation === 'UPRIGHT' ? 'Xuôi' : 'Ngược'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
