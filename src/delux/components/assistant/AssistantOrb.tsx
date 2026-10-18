import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AssistantOrbProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
  isGenerating?: boolean;
  isWaving?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
  imageUrl?: string;
}

export const AssistantOrb: React.FC<AssistantOrbProps> = ({
  size = 'md', isSpeaking = false, isGenerating = false, isWaving = false,
  className = '', onClick, title = 'Assistente Delux'
}) => {
  const [waveActive, setWaveActive] = useState(false);
  useEffect(() => {
    if (!isWaving) return;
    setWaveActive(true);
    const timer = window.setTimeout(() => setWaveActive(false), 1500);
    return () => window.clearTimeout(timer);
  }, [isWaving]);
  const sizeClass = ({ xs: 'w-6 h-6', sm: 'w-[34px] h-[34px]', md: 'w-12 h-12', lg: 'w-[76px] h-[76px]', xl: 'w-[104px] h-[104px]' } as const)[size];
  const waving = waveActive || isSpeaking || isGenerating;
  const uid = React.useId().replace(/:/g, '');
  return (
    <motion.div onClick={onClick} title={title}
      whileHover={onClick ? { scale: 1.06, y: -1 } : { scale: 1.02 }}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ overflow: 'visible' }}>
      <motion.div className="absolute inset-0 rounded-[42%] pointer-events-none"
        animate={{ opacity: waving ? [0.15, 0.4, 0.15] : [0.1, 0.2, 0.1], scale: waving ? [1, 1.14, 1] : [1, 1.04, 1] }}
        transition={{ duration: waving ? 0.8 : 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(circle, rgba(190,205,230,.75) 0%, rgba(255,255,255,0) 72%)' }} />
      <svg viewBox="0 0 220 170" role="img" aria-label={title} className="relative z-10 w-full h-full overflow-visible">
        <defs>
          <radialGradient id={`head${uid}`} cx="48%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#fff"/><stop offset="62%" stopColor="#f8f9fb"/><stop offset="88%" stopColor="#e3e6eb"/><stop offset="100%" stopColor="#bfc4cc"/>
          </radialGradient>
          <linearGradient id={`arm${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff"/><stop offset="70%" stopColor="#f2f3f6"/><stop offset="100%" stopColor="#cbd0d9"/>
          </linearGradient>
          <radialGradient id={`eye${uid}`} cx="35%" cy="20%" r="80%"><stop offset="0%" stopColor="#292929"/><stop offset="100%" stopColor="#030303"/></radialGradient>
          <filter id={`shadow${uid}`}><feGaussianBlur stdDeviation="2.5"/></filter>
        </defs>
        <ellipse cx="109" cy="151" rx="91" ry="10" fill="#7c8491" opacity=".18" filter={`url(#shadow${uid})`}/>
        <g transform="translate(11 8) scale(.9)">
          <path d="M27 48 C32 22 58 12 87 10 L135 10 C169 11 192 27 197 53 C203 77 204 111 194 132 C184 151 163 156 137 157 L82 157 C49 156 27 145 20 123 C14 100 17 69 27 48 Z" fill={`url(#head${uid})`} stroke="#d5d9e0" strokeWidth="1.5"/>
          <path d="M30 45 C39 24 60 17 88 15 L134 15 C164 16 187 31 192 55" fill="none" stroke="#fff" strokeWidth="3" opacity=".8" strokeLinecap="round"/>
          <ellipse cx="78" cy="83" rx="9.5" ry="16" fill={`url(#eye${uid})`}/><ellipse cx="145" cy="83" rx="9.5" ry="16" fill={`url(#eye${uid})`}/>
          <ellipse cx="81" cy="73" rx="2.2" ry="4" fill="#fff" opacity=".95"/><ellipse cx="148" cy="73" rx="2.2" ry="4" fill="#fff" opacity=".95"/>
        </g>
        <motion.g style={{ transformOrigin: '181px 117px' }} initial={false}
          animate={waving ? { opacity: 1, rotate: [0, -24, 13, -21, 10, 0], x: [0, 1, 2, 1, 0, 0], y: [0, -2, -5, -3, -1, 0] } : { opacity: 0, rotate: 0, x: 0, y: 0 }}
          transition={waving ? { opacity: { duration: .12 }, rotate: { duration: 1.05, ease: 'easeInOut' }, x: { duration: 1.05 }, y: { duration: 1.05 } } : { duration: .18 }}>
          <path d="M176 113 C180 96 185 76 194 60 C198 53 206 53 212 59 C218 64 216 72 213 79 L200 124 C196 135 186 138 178 131 C173 127 173 119 176 113 Z" fill={`url(#arm${uid})`} stroke="#d6dae1" strokeWidth="1.3"/>
          <path d="M197 61 C201 57 207 59 210 64" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
        </motion.g>
      </svg>
      {(size === 'lg' || size === 'xl') && <span className={`absolute -bottom-0.5 -right-0.5 z-30 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${isGenerating ? 'bg-blue-500' : 'bg-emerald-500'}`}/>}
    </motion.div>
  );
};
