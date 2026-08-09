import React, { useEffect, useState } from 'react';
import styles from './TarotDeck.module.css';
import { TarotCard } from '../TarotCard/TarotCard';
import { PickedCard, TarotStateStatus } from '@/types/tarot';

interface TarotDeckProps {
  status: TarotStateStatus;
  deck: PickedCard[];
  pickedIndices: number[];
  spreadCount: number;
  onPickCard: (index: number) => void;
  onRevealCards: () => void;
  pickedCards: PickedCard[];
}

export const TarotDeck: React.FC<TarotDeckProps> = ({
  status,
  deck,
  pickedIndices,
  spreadCount,
  onPickCard,
  onRevealCards,
  pickedCards
}) => {
  const [isShuffling, setIsShuffling] = useState(false);

  useEffect(() => {
    if (status === 'SHUFFLING') {
      setIsShuffling(true);
    } else {
      setIsShuffling(false);
    }
  }, [status]);

  if (status === 'WELCOME' || status === 'QUESTION_READY') return null;

  // Render only picked cards during REVEALING, INTERPRETING, RESULT states
  if (['REVEALING', 'INTERPRETING', 'RESULT'].includes(status)) {
    return (
      <div className={styles.spreadContainer}>
        {pickedCards.map((card, idx) => (
          <TarotCard
            key={idx}
            name={card.name}
            image={card.image}
            isFlipped={status !== 'READY_TO_REVEAL'} // Flip during these states
            orientation={card.orientation}
            isSelected={false}
            delay={idx * 300} // Sequential flip
          />
        ))}
      </div>
    );
  }

  // Render picking table
  return (
    <div className={styles.deckArea}>
      <div className={styles.instructions}>
        {status === 'SHUFFLING' ? 'Đang xáo bài...' : `Hãy chọn ${spreadCount} lá bài (Đã chọn: ${pickedIndices.length}/${spreadCount})`}
      </div>
      
      <div className={`${styles.cardsTable} ${isShuffling ? styles.shuffling : ''}`}>
        {deck.map((card, index) => {
          const isSelected = pickedIndices.includes(index);
          const isHidden = pickedIndices.length === spreadCount && !isSelected;
          
          return (
            <div 
              key={index} 
              className={styles.cardWrapper}
              style={{
                opacity: isHidden ? 0.3 : 1,
                pointerEvents: isHidden || isShuffling ? 'none' : 'auto'
              }}
            >
              <TarotCard
                name={card.name}
                image={card.image}
                isFlipped={false}
                isSelected={isSelected}
                onClick={() => {
                  if (status === 'READY_TO_REVEAL') {
                    onRevealCards();
                  } else {
                    onPickCard(index);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      <div className={styles.actionArea}>
        <button 
          className={styles.revealButton} 
          disabled={status !== 'READY_TO_REVEAL'}
          onClick={onRevealCards}
        >
          Lật bài
        </button>
      </div>
    </div>
  );
};
