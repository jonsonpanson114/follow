import type { CSSProperties } from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg';
  style?: CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', size = 'md', style }) => {
  return (
    <div className={`glass-card${size === 'lg' ? '-lg' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
};
