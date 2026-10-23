import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import assistantFace from '@/assets/assistant-face.png';

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
  className = '', onClick, title = 'Assistente Delux', imageUrl
}) => {
  const [waveActive, setWaveActive] = useState(false);
  useEffect(() => {
    if (!isWaving) return;
    setWaveActive(true);
    const timer = window.setTimeout(() => setWaveActive(false), 1500);
    return () => window.clearTimeout(timer);
  }, [isWaving]);
  const sizeClass = ({ xs: 'w-6 h-6', sm: 'w-[30px] h-[30px]', md: 'w-12 h-12', lg: 'w-[76px] h-[76px]', xl: 'w-[104px] h-[104px]' } as const)[size];
  // Wave only when a response arrives (isWaving pulse), never while generating.
  const waving = waveActive;
  const faceSrc = imageUrl || assistantFace;
  return (
    <motion.div {...(onClick ? { onClick, whileTap: { scale: 0.95 } } : {})} title={title}
      whileHover={onClick ? { scale: 1.06, y: -1 } : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      role="img" aria-label={title}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${sizeClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <motion.img src={faceSrc} alt={title} draggable={false}
        className="relative z-10 h-full w-full object-contain"
        style={{ filter: 'drop-shadow(0 2px 3px rgba(15, 23, 42, 0.22))' }}
        initial={false}
        animate={waving
          ? { rotate: [0, -3, 2, -2, 1, 0], y: [0, -1, 0, -1, 0, 0] }
          : { rotate: 0, y: 0 }}
        transition={waving
          ? { duration: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.12 }
          : { duration: 0.2 }} />
    </motion.div>
  );
};
