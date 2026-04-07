import type { FC } from 'react';
import { Card } from './Card';
import styles from './CardSkeleton.module.css';

export const CardSkeleton: FC = () => {
  return (
    <Card>
      <div className={styles.body}>
        <div className={`${styles.bone} ${styles.title}`} />
        <div className={`${styles.bone} ${styles.descLine}`} />
        <div className={`${styles.bone} ${styles.descLineShort}`} />
        <div className={styles.meta}>
          <div className={`${styles.bone} ${styles.badge}`} />
          <div className={`${styles.bone} ${styles.time}`} />
        </div>
      </div>
    </Card>
  );
};
