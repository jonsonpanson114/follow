import { useRef } from 'react';
import './RippleEffect.css';

interface RippleEffectProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const RippleEffect: React.FC<RippleEffectProps> = ({ children, onClick, className = '' }) => {
  const rippleRef = useRef<HTMLDivElement>(null);

  const createRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = rippleRef.current;
    if (!button) return;

    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const ripples = button.getElementsByClassName('ripple');
    Array.from(ripples).forEach(r => r.remove());

    button.appendChild(circle);

    // Create particles
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('span');
      particle.classList.add('ripple-particle');

      const angle = (Math.PI * 2 * i) / 8;
      const distance = 50 + Math.random() * 30;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      particle.style.left = `${event.clientX - rect.left}px`;
      particle.style.top = `${event.clientY - rect.top}px`;

      button.appendChild(particle);

      setTimeout(() => particle.remove(), 800);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    createRipple(event);
    if (onClick) onClick();
  };

  return (
    <div
      ref={rippleRef}
      className={`ripple-container ${className}`}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};
