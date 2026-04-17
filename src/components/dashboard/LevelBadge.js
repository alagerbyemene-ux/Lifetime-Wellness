import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';

const LEVELS = [
  { min: 1, max: 4, titleEn: 'Beginner', titleAr: 'مبتدئ', emoji: '🌱', color: 'from-green-600 to-green-400', glow: 'shadow-green-500/40' },
  { min: 5, max: 9, titleEn: 'Warrior', titleAr: 'محارب', emoji: '⚔️', color: 'from-blue-600 to-blue-400', glow: 'shadow-blue-500/40' },
  { min: 10, max: 19, titleEn: 'Athlete', titleAr: 'رياضي', emoji: '🏃', color: 'from-purple-600 to-purple-400', glow: 'shadow-purple-500/40' },
  { min: 20, max: 34, titleEn: 'Champion', titleAr: 'بطل', emoji: '🏆', color: 'from-yellow-600 to-yellow-400', glow: 'shadow-yellow-500/40' },
  { min: 35, max: 49, titleEn: 'Legend', titleAr: 'أسطورة', emoji: '⭐', color: 'from-orange-600 to-orange-400', glow: 'shadow-orange-500/40' },
  { min: 50, max: 999, titleEn: 'BEAST 😎', titleAr: 'وحش 😎', emoji: '🔥', color: 'from-red-600 to-primary', glow: 'shadow-primary/60' },
];

export function getLevelInfo(level) {
  return LEVELS.find(l => level >= l.min && level <= l.max) || LEVELS[0];
}

export default function LevelBadge({ level, xp, size = 'md' }) {
  const { lang } = useLanguage();
  const info = getLevelInfo(level || 1);
  const xpInLevel = (xp || 0) % 100;
  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center gap-2 ${isSmall ? '' : ''}`}>
      <div className={`${isSmall ? 'w-8 h-8 text-base' : 'w-11 h-11 text-xl'} rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg ${info.glow} flex-shrink-0`}>
        {info.emoji}
      </div>
      <div>
        <div className={`${isSmall ? 'text-xs' : 'text-sm'} font-black`}>
          {lang === 'ar' ? info.titleAr : info.titleEn}
        </div>
        <div className={`${isSmall ? 'text-[9px]' : 'text-[10px]'} text-muted-foreground`}>
          {lang === 'ar' ? `المستوى ${level || 1}` : `Level ${level || 1}`} • {xpInLevel}/100 XP
        </div>
      </div>
    </div>
  );
}
