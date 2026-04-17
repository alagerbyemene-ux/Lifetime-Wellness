import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';

export default function StepsRing({ steps, goal }) {
  const { t } = useLanguage();
  const progress = Math.min((steps / goal) * 100, 100);
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle
          cx="90" cy="90" r="70"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        <motion.circle
          cx="90" cy="90" r="70"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{steps.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">/ {goal.toLocaleString()} {t('steps')}</span>
      </div>
    </div>
  );
}
