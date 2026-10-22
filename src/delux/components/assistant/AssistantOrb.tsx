import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

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
  const sizeClass = ({ xs: 'w-6 h-6', sm: 'w-[34px] h-[34px]', md: 'w-12 h-12', lg: 'w-[76px] h-[76px]', xl: 'w-[104px] h-[104px]' } as const)[size];
  const active = isWaving || isSpeaking || isGenerating;
  return (
    <motion.div {...(onClick ? { onClick, whileTap: { scale: 0.95 } } : {})} title={title}
      whileHover={onClick ? { scale: 1.06, y: -1 } : { scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      role="img" aria-label={title}
      className={`relative inline-flex items-center justify-center rounded-2xl bg-accent text-primary border border-success-border shrink-0 select-none ${sizeClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}>
      <Sparkles className={`w-1/2 h-1/2 stroke-[2.2] ${active ? 'animate-pulse' : ''}`} />
      {(size === 'lg' || size === 'xl') && <span className={`absolute -bottom-0.5 -right-0.5 z-30 h-3.5 w-3.5 rounded-full border-2 border-card shadow-sm ${isGenerating ? 'bg-primary' : 'bg-success'}`}/>}
    </motion.div>
  );
};
