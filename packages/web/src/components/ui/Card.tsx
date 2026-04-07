import type { FC, HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card: FC<CardProps> = ({ children, onClick, className, ...rest }) => {
  const cls = [styles.card, onClick ? styles.clickable : '', className].filter(Boolean).join(' ');
  return (
    <div className={cls} onClick={onClick} {...rest}>
      {children}
    </div>
  );
};
