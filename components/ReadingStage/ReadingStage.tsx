"use client";

import React, { useState, useEffect } from 'react';
import styles from './ReadingStage.module.css';
import { PickedCard, TarotStateStatus } from '@/types/tarot';
import { FlyingCard } from '../FlyingCard/FlyingCard';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingStageProps {
  status: TarotStateStatus;
  question: string;
  deck: PickedCard[];
  pickedCards: PickedCard[];
  spreadCount: number;
  onPickCard: (card: PickedCard) => void;
  onAllRevealed: () => void;
  error: string | null;
  onRetry: () => void;
  onRestart: () => void;
}

export const ReadingStage: React.FC<ReadingStageProps> = ({
  status,
  question,
  deck,
  pickedCards,
  spreadCount,
  onPickCard,
  onAllRevealed,
  error,
  onRetry,
  onRestart
}) => {
  const [locked, setLocked] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

  // When all picked cards finish revealing, trigger AI
  useEffect(() => {
    if (revealedCount === spreadCount && status === 'PICKING') {
      const timer = setTimeout(() => {
        onAllRevealed();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, spreadCount, status, onAllRevealed]);

  const handlePick = (card: PickedCard) => {
    if (locked || status !== 'PICKING' || pickedCards.length >= spreadCount) return;
    setLocked(true);
    onPickCard(card);
    
    // We unlock AFTER the layout animation (flying) + flip is mostly done
    // Flying ~400ms, Flip ~600ms. We can unlock slightly early so it feels responsive.
    setTimeout(() => {
      setLocked(false);
      setRevealedCount(prev => prev + 1);
    }, 800); 
  };

  // Generate fan positions for the deck
  const renderDeck = () => {
    if (deck.length === 0) return null;
    return (
      <div className={styles.deckContainer}>
        {deck.map((card, idx) => {
          // Calculate fan spread
          const total = deck.length;
          const offset = idx - total / 2;
          const rotate = offset * 1.5; // Fan out
          
          return (
            <motion.div
              key={card.id}
              className={styles.deckCardWrapper}
              style={{
                transformOrigin: "bottom center",
                rotate: `${rotate}deg`,
                zIndex: idx
              }}
              whileHover={{ y: -10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePick(card)}
            >
              <FlyingCard 
                card={card}
                isFlipped={false}
                layoutId={`card-${card.id}`}
              />
            </motion.div>
          );
        })}
      </div>
    );
  };

  const getSlotLabel = (idx: number, count: number) => {
    if (count === 1) return 'Thông điệp';
    if (count === 3) return ['Tình huống', 'Thử thách', 'Gợi ý'][idx];
    return `Lá ${idx + 1}`;
  };

  return (
    <div className={styles.container}>
      {/* 1. Context Area */}
      <div className={styles.contextArea}>
        <div className={styles.questionLabel}>Bạn đang hỏi</div>
        <div className={styles.questionText}>"{question}"</div>
      </div>

      {/* 2. Reveal Area */}
      <div className={`${styles.revealArea} ${styles[`spread${spreadCount}`]}`}>
        {Array.from({ length: spreadCount }).map((_, idx) => {
          const pickedCard = pickedCards[idx];
          
          return (
            <div key={idx} className={styles.slot}>
              <div className={styles.slotOutline}>
                <span className={styles.slotIcon}>✦</span>
              </div>
              
              {pickedCard && (
                <div className={styles.revealedCardWrapper}>
                  <FlyingCard 
                    card={pickedCard}
                    isFlipped={true}
                    layoutId={`card-${pickedCard.id}`}
                    delayFlip={true}
                  />
                </div>
              )}

              <div className={styles.slotLabel}>
                {getSlotLabel(idx, spreadCount)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Progress & Status */}
      <div className={styles.statusArea}>
        {status === 'PICKING' && (
          <div className={styles.progress}>
            Đã chọn {pickedCards.length} / {spreadCount}
          </div>
        )}
        {status === 'INTERPRETING' && (
          <div className={styles.loadingArea}>
            <span className={styles.pulsingStar}>✦</span>
            <div className={styles.loadingText}>Đang kết nối thông điệp từ các lá bài...</div>
          </div>
        )}
        {status === 'ERROR' && (
          <div className={styles.errorArea}>
            <span className={styles.errorStar}>✦</span>
            <div className={styles.errorMsg}>{error || "Thông điệp chưa thể hoàn thành. Hãy thử lại."}</div>
            <div className={styles.errorActions}>
              <button className={styles.retryBtn} onClick={onRetry}>Thử lại</button>
              <button className={styles.newBtn} onClick={onRestart}>Trải bài mới</button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Deck Area */}
      <div className={styles.bottomDeckArea}>
         {status === 'SHUFFLING' && (
           <div className={styles.shufflingMsg}>Đang xáo bài...</div>
         )}
         {(status === 'PICKING' || status === 'INTERPRETING' || status === 'ERROR') && renderDeck()}
      </div>
    </div>
  );
};
