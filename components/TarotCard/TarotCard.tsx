import React, { useState } from 'react';
import Image from 'next/image';
import styles from './TarotCard.module.css';

interface TarotCardProps {
  name: string;
  image: string;
  isFlipped: boolean;
  orientation?: 'UPRIGHT' | 'REVERSED';
  isSelected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  delay?: number; // for sequential flip
}

export const TarotCard: React.FC<TarotCardProps> = ({
  name,
  image,
  isFlipped,
  orientation = 'UPRIGHT',
  isSelected = false,
  onClick,
  style,
  className = '',
  delay = 0,
}) => {
  const [imgError, setImgError] = useState(false);

  const containerClasses = [
    styles.cardContainer,
    isSelected ? styles.selected : '',
    className
  ].filter(Boolean).join(' ');

  const innerStyle = {
    transitionDelay: `${isFlipped ? delay : 0}ms`,
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  };

  const frontStyle = {
    // We will rotate the front image 180 degrees if orientation is REVERSED
    transform: orientation === 'REVERSED' ? 'rotate(180deg)' : 'none',
  };

  return (
    <div className={containerClasses} onClick={onClick} style={style}>
      <div className={styles.cardInner} style={innerStyle}>
        <div className={styles.cardBack}>
          {/* Default back design */}
          <div className={styles.backPattern}>✦</div>
        </div>
        <div className={styles.cardFront}>
          <div className={styles.cardImageWrapper} style={frontStyle}>
             {!imgError ? (
               <Image
                  src={image}
                  alt={name}
                  className={styles.realImage}
                  fill
                  sizes="(max-width: 767px) 80px, 120px"
                  onError={() => setImgError(true)}
                />
             ) : (
               <div className={styles.imagePlaceholder}>{name}</div>
             )}
          </div>
          {isFlipped && (
            <div className={styles.cardLabel}>
              {name}
              {orientation === 'REVERSED' && <span className={styles.reversedBadge}> (Rev)</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
