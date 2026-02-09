import { RippleEffect } from './RippleEffect';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'gold';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  return (
    <RippleEffect onClick={disabled ? undefined : onClick}>
      <button
        className={`btn btn-${variant} ${disabled ? 'btn-disabled' : ''} ${className}`}
        disabled={disabled}
      >
        {children}
      </button>
    </RippleEffect>
  );
};
