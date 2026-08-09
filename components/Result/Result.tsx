import React from 'react';
import styles from './Result.module.css';
import { InterpretationResult, PickedCard } from '@/types/tarot';
import { TarotCard } from '../TarotCard/TarotCard';

interface ResultProps {
  question: string;
  pickedCards: PickedCard[];
  interpretation: InterpretationResult;
  onRestart: () => void;
}

export const Result: React.FC<ResultProps> = ({ question, pickedCards, interpretation, onRestart }) => {
  return (
    <div className={styles.resultContainer}>
      <div className={styles.header}>YOUR READING</div>
      
      {question && (
        <div className={styles.questionSection}>
          <div className={styles.questionLabel}>Câu hỏi của bạn</div>
          <div className={styles.questionText}>"{question}"</div>
        </div>
      )}
      
      <div className={styles.divider} />
      
      <div className={styles.cardsSection}>
        {pickedCards.map((card, idx) => {
          const meaning = interpretation.cards.find(c => c.card === card.name);
          return (
            <div key={idx} className={styles.cardResultRow}>
              <div className={styles.cardResultHeader}>CARD {idx + 1}</div>
              <div className={styles.cardResultContent}>
                <div className={styles.cardWrapper}>
                  <TarotCard
                    name={card.name}
                    image={card.image}
                    isFlipped={true}
                    orientation={card.orientation}
                    className={styles.staticCard}
                  />
                </div>
                <div className={styles.cardTextInfo}>
                  <h3 className={styles.cardTitle}>{card.name}</h3>
                  <div className={styles.cardOrientation}>
                    {card.orientation === 'UPRIGHT' ? 'Xuôi (Upright)' : 'Ngược (Reversed)'}
                  </div>
                  <p className={styles.cardMeaning}>
                    {meaning ? meaning.interpretation : (card.orientation === 'UPRIGHT' ? card.uprightMeaning : card.reversedMeaning)}
                  </p>
                </div>
              </div>
              {idx < pickedCards.length - 1 && <div className={styles.subDivider} />}
            </div>
          );
        })}
      </div>

      <div className={styles.divider} />

      <div className={styles.summarySection}>
        <h3 className={styles.sectionTitle}>THÔNG ĐIỆP CHUNG</h3>
        <p className={styles.summaryText}>{interpretation.summary}</p>
        
        {interpretation.connection && (
          <p className={styles.connectionText}>{interpretation.connection}</p>
        )}
      </div>

      <div className={styles.divider} />

      <div className={styles.guidanceSection}>
        <h3 className={styles.sectionTitle}>GỢI Ý & LỜI KHUYÊN</h3>
        <p className={styles.guidanceText}>{interpretation.guidance}</p>
        
        {interpretation.reflectionQuestion && (
          <div className={styles.reflectionBox}>
            <div className={styles.reflectionLabel}>Câu hỏi suy ngẫm dành cho bạn:</div>
            <div className={styles.reflectionText}>{interpretation.reflectionQuestion}</div>
          </div>
        )}
      </div>

      <div className={styles.actionArea}>
        <button className={styles.restartButton} onClick={onRestart}>
          Bốc bài lại
        </button>
      </div>
    </div>
  );
};
