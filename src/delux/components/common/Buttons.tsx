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
    sm: 'h-9 px-3.5 text-xs rounded-2xl font-medium',
    md: 'h-11 px-5 text-sm rounded-2xl font-medium',
    lg: 'h-12 px-6 text-base rounded-2xl font-semibold'
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
      className={`relative inline-flex items-center justify-center gap-2 text-white bg-gradient-to-r from-[#25865A] via-[#25865A] to-[#25865A] hover:from-[#1D7049] hover:via-[#1D7049] hover:to-[#1D7049] cursor-pointer shadow-md shadow-[#25865A]/25 hover:shadow-lg hover:shadow-[#25865A]/35 active:shadow-sm disabled:opacity-50 disabled:pointer-events-none overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:opacity-75 before:pointer-events-none ${sizeClasses} ${className}`}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
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
    sm: 'h-9 px-3.5 text-xs rounded-2xl font-medium',
    md: 'h-11 px-5 text-sm rounded-2xl font-medium',
    lg: 'h-12 px-6 text-base rounded-2xl font-semibold'
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
      className={`relative inline-flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-[#25865A] dark:hover:text-[#65B982] cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-xs transition-colors ${sizeClasses} ${className}`}
      {...(props as any)}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 dark:border-t-white rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
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
    surface: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-2xs',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
    primary: 'bg-gradient-to-r from-[#25865A] via-[#25865A] to-[#25865A] hover:from-[#1D7049] hover:to-[#1D7049] text-white shadow-md shadow-[#25865A]/25'
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
