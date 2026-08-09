"use client";

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useTarotLogic } from '@/hooks/useTarotLogic';
import { ReadingStage } from '@/components/ReadingStage/ReadingStage';
import { Result } from '@/components/Result/Result';
import { PickedCard } from '@/types/tarot';

export default function Home() {
  const [cardsData, setCardsData] = useState<any[]>([]);
  const tarot = useTarotLogic(cardsData);
  const { state, setQuestion, setSpreadCount, startReading, pickCard, startInterpretation, restart } = tarot;

  useEffect(() => {
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
        <h1 className={styles.logo}>✦ ARCANA</h1>
      </header>

      <div className={styles.content}>
        {/* Màn hình nhập câu hỏi ban đầu */}
        {(state.status === 'WELCOME' || (state.status === 'ERROR' && state.pickedCards.length === 0)) && (
          <div className={styles.questionScreen}>
            <div className={styles.eyebrow}>AI TAROT READING</div>
            <h2 className={styles.title}>Hôm nay bạn muốn hỏi điều gì?</h2>
            <p className={styles.description}>Hãy tập trung vào một câu hỏi và để những lá bài gợi mở một góc nhìn mới.</p>
            
            <textarea
              className={styles.questionInput}
              placeholder="Ví dụ: Mình nên nhìn nhận mối quan hệ hiện tại như thế nào?"
              value={state.question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              rows={3}
            />
            
            <div className={styles.spreadSelector}>
              {[
                { count: 1, label: '1 lá', desc: 'Nhanh • Một thông điệp' },
                { count: 3, label: '3 lá', desc: 'Tình huống • Thử thách • Gợi ý' },
                { count: 6, label: '6 lá', desc: 'Chi tiết • Đa chiều' },
                { count: 12, label: '12 lá', desc: 'Tổng quan • Chuyên sâu' }
              ].map(opt => (
                <div 
                  key={opt.count}
                  className={`${styles.spreadOption} ${state.spreadCount === opt.count ? styles.active : ''}`}
                  onClick={() => setSpreadCount(opt.count)}
                >
                  <div className={styles.spreadLabel}>{opt.label}</div>
                  <div className={styles.spreadDesc}>{opt.desc}</div>
                </div>
              ))}
            </div>

            <button 
              className={styles.startBtn} 
              disabled={!state.question.trim() || cardsData.length === 0}
              onClick={handleStart}
            >
              Bắt đầu trải bài
            </button>
          </div>
        )}

        {/* Màn hình trải bài */}
        {['SHUFFLING', 'PICKING', 'INTERPRETING', 'ERROR'].includes(state.status) && state.pickedCards.length >= 0 && (
          <ReadingStage 
            status={state.status}
            question={state.question}
            deck={state.deck}
            pickedCards={state.pickedCards}
            spreadCount={state.spreadCount}
            onPickCard={pickCard}
            onAllRevealed={startInterpretation}
            error={state.error}
            onRetry={startInterpretation}
            onRestart={restart}
          />
        )}

        {/* Kết quả giải bài */}
        {state.status === 'RESULT' && state.interpretation && (
          <Result 
            question={state.question}
            pickedCards={state.pickedCards}
            interpretation={state.interpretation}
            onRestart={restart}
          />
        )}
      </div>
    </main>
  );
}
