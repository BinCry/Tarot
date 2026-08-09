import React from 'react';
import styles from './Result.module.css';
import { PickedCard, InterpretationResult } from '@/types/tarot';
import { motion, Variants } from 'framer-motion';

interface ResultProps {
  question: string;
  pickedCards: PickedCard[];
  interpretation: InterpretationResult;
  onRestart: () => void;
}

export const Result: React.FC<ResultProps> = ({ question, pickedCards, interpretation, onRestart }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      className={styles.container}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div className={styles.header} variants={itemVariants}>
        <div className={styles.eyebrow}>LUẬN GIẢI CỦA BẠN</div>
        <h2 className={styles.question}>&ldquo;{question}&rdquo;</h2>
      </motion.div>

      <motion.div className={styles.divider} variants={itemVariants} />

      {interpretation.notice && (
        <>
          <motion.div className={styles.noticeBox} variants={itemVariants}>
            {interpretation.notice}
          </motion.div>
          <motion.div className={styles.divider} variants={itemVariants} />
        </>
      )}

      <motion.div className={styles.section} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>TỔNG QUAN</h3>
        <p className={styles.bodyText}>{interpretation.summary}</p>
      </motion.div>

      <motion.div className={styles.divider} variants={itemVariants} />

      <div className={styles.cardsList}>
        {interpretation.cards.map((cardData, idx) => {
          // Attempt to match the interpreted card with the picked card to show the image
          const pickedCard = pickedCards[idx];
          
          return (
            <motion.div key={idx} className={styles.cardDetail} variants={itemVariants}>
              <div className={styles.cardVisual}>
                {pickedCard ? (
                  <div className={styles.imageWrapper}>
                    <img 
                      src={pickedCard.image} 
                      alt={pickedCard.name} 
                      className={styles.cardImage}
                      style={{
                        transform: pickedCard.orientation === 'REVERSED' ? 'rotate(180deg)' : 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className={styles.imagePlaceholder}>✦</div>
                )}
              </div>
              <div className={styles.cardContent}>
                <h4 className={styles.cardName}>{cardData.card}</h4>
                <div className={styles.cardOrientation}>
                  {pickedCard?.orientation === 'UPRIGHT' ? 'Xuôi' : 'Ngược'}
                </div>
                <p className={styles.bodyText}>{cardData.interpretation}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div className={styles.divider} variants={itemVariants} />

      <motion.div className={styles.section} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>SỰ KẾT NỐI & TƯƠNG TÁC</h3>
        <p className={styles.bodyText}>{interpretation.connection}</p>
      </motion.div>

      <motion.div className={styles.divider} variants={itemVariants} />

      <motion.div className={styles.section} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>LỜI KHUYÊN DÀNH CHO BẠN</h3>
        <p className={styles.bodyText}>{interpretation.guidance}</p>
      </motion.div>

      <motion.div className={styles.divider} variants={itemVariants} />

      <motion.div className={styles.section} variants={itemVariants}>
        <h3 className={styles.sectionTitle}>GỢI Ý SUY NGẪM</h3>
        <p className={styles.reflectionText}>&ldquo;{interpretation.reflectionQuestion}&rdquo;</p>
      </motion.div>
      
      <motion.div className={styles.footer} variants={itemVariants}>
        <p className={styles.disclaimer}>Tarot được sử dụng như một công cụ gợi mở và suy ngẫm.</p>
        <button className={styles.restartBtn} onClick={onRestart}>
          Trải bài mới
        </button>
      </motion.div>
    </motion.div>
  );
};
