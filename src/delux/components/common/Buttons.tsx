import React from 'react';
import { motion } from 'motion/react';
import { playButtonSound } from '../../services/sound';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'min-h-10 px-4 py-2 text-xs rounded-xl',
    md: 'min-h-12 px-5 py-2.5 text-sm rounded-2xl',
    lg: 'min-h-14 px-6 py-3 text-base rounded-2xl'
  }[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      playButtonSound();
    }
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`delux-primary-button relative inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors ${sizeClasses} ${className}`}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-card/30 border-t-card rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span className="min-w-0 text-center leading-snug">{children}</span>
    </motion.button>
  );
};

export const SecondaryButton: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'min-h-10 px-4 py-2 text-xs rounded-xl',
    md: 'min-h-12 px-5 py-2.5 text-sm rounded-2xl',
    lg: 'min-h-14 px-6 py-3 text-base rounded-2xl'
  }[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      playButtonSound();
    }
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.965 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`delux-secondary-button relative inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none transition-colors ${sizeClasses} ${className}`}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-border border-t-border  rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span className="min-w-0 text-center leading-snug">{children}</span>
    </motion.button>
  );
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  label: string;
  variant?: 'surface' | 'ghost' | 'primary';
}

export const IconButton: React.FC<IconButtonProps> = ({
  size = 'md',
  label,
  variant = 'surface',
  className = '',
  children,
  disabled,
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-2xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base'
  }[size];

  const variantClasses = {
    surface: 'bg-card  hover:bg-card  border border-border  text-foreground  shadow-2xs',
    ghost: 'hover:bg-muted  text-muted-foreground  hover:text-foreground ',
    primary: 'bg-gradient-to-r from-primary via-primary to-primary hover:from-primary hover:to-primary text-primary-foreground shadow-md shadow-primary/25'
  }[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playButtonSound();
    }
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
};
