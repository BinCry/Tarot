"use client";

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useTarotLogic } from '@/hooks/useTarotLogic';
import { TarotDeck } from '@/components/TarotDeck/TarotDeck';
import { AILoading } from '@/components/AILoading/AILoading';
import { Result } from '@/components/Result/Result';

export default function Home() {
  const [cardsData, setCardsData] = useState<any[]>([]);
  const tarot = useTarotLogic(cardsData);
  const { state, setQuestion, setSpreadCount, startReading, pickCard, revealCards, fetchInterpretation, restart, getPickedCards } = tarot;

  useEffect(() => {
    // In a real app this could be fetched from an API or imported directly
    // Since we're in Next.js App Router and this is a client component, 
    // importing the JSON is easiest if it's in the app directory, but since it's in data/ 
    // we can either fetch it or move it to a place where we can import it.
    // Let's dynamically import it to keep it simple.
    import('../data/tarot-cards.json')
      .then(module => setCardsData(module.default))
      .catch(err => console.error("Failed to load tarot data", err));
  }, []);

  const handleStart = () => {
    if (!state.question.trim()) return;
    startReading();
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.logo}>✦ Arcana</h1>
      </header>

      <div className={styles.content}>
        {/* WELCOME / QUESTION_READY State */}
        {(state.status === 'WELCOME' || state.status === 'QUESTION_READY') && (
          <div className={styles.welcomeSection}>
            <h2 className={styles.title}>Tìm kiếm câu trả lời từ vũ trụ</h2>
            <textarea
              className={styles.questionInput}
              placeholder="Mối quan hệ hiện tại của mình sẽ phát triển như thế nào?"
              value={state.question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              rows={4}
            />
            
            <div className={styles.spreadSelector}>
              <div className={styles.spreadLabel}>Chọn kiểu trải bài:</div>
              <div className={styles.spreadOptions}>
                <button 
                  className={`${styles.spreadBtn} ${state.spreadCount === 1 ? styles.active : ''}`}
                  onClick={() => setSpreadCount(1)}
                >
                  1 Lá
                </button>
                <button 
                  className={`${styles.spreadBtn} ${state.spreadCount === 3 ? styles.active : ''}`}
                  onClick={() => setSpreadCount(3)}
                >
                  3 Lá
                </button>
              </div>
              <div className={styles.spreadDesc}>
                {state.spreadCount === 1 ? 'Dùng cho câu hỏi nhanh, xin lời khuyên hoặc năng lượng hiện tại.' : 'Dùng cho câu hỏi chi tiết: Hiện tại, Thử thách, Lời khuyên.'}
              </div>
            </div>

            <button 
              className={styles.startBtn} 
              disabled={state.status === 'WELCOME' || cardsData.length === 0}
              onClick={handleStart}
            >
              Bắt đầu trải bài
            </button>
          </div>
        )}

        {/* Deck, Picking, Revealing States */}
        {['SHUFFLING', 'PICKING', 'READY_TO_REVEAL', 'REVEALING'].includes(state.status) && (
          <TarotDeck 
            status={state.status}
            deck={state.deck}
            pickedIndices={state.pickedIndices}
            spreadCount={state.spreadCount}
            onPickCard={pickCard}
            onRevealCards={revealCards}
            pickedCards={getPickedCards()}
          />
        )}

        {/* AI Loading State */}
        {state.status === 'INTERPRETING' && (
          <AILoading />
        )}

        {/* Result State */}
        {state.status === 'RESULT' && state.interpretation && (
          <Result 
            question={state.question}
            pickedCards={getPickedCards()}
            interpretation={state.interpretation}
            onRestart={restart}
          />
        )}

        {/* Error State */}
        {state.status === 'ERROR' && (
          <div className={styles.errorSection}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>Kết nối bị gián đoạn</h3>
            <p className={styles.errorText}>
              Không thể đọc thông điệp lúc này.<br/>
              Các lá bài của bạn vẫn được giữ nguyên.
            </p>
            <p className={styles.errorDetail}>{state.error}</p>
            <div className={styles.errorActions}>
              <button className={styles.retryBtn} onClick={fetchInterpretation}>
                Thử giải nghĩa lại
              </button>
              <button className={styles.cancelBtn} onClick={restart}>
                Bắt đầu lại
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
