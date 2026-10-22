import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: string;
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'var(--primary)',
  height = 'md',
  showLabel = false,
  className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  }[height];

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs text-muted-foreground  font-medium mb-1.5">
          <span>Progresso</span>
          <span className="text-foreground  font-semibold">{Math.round(clamped)}%</span>
        </div>
      )}
      <div className={`w-full ${heightClass} bg-accent  rounded-full overflow-hidden transition-colors`}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  showPercent?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 56,
  strokeWidth = 5,
  color = 'var(--primary)',
  trackColor = 'var(--border)',
  showPercent = true,
  children,
  className = ''
}) => {
  const clamped = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground ">
        {children ? children : showPercent ? `${Math.round(clamped)}%` : null}
      </div>
    </div>
  );
};
