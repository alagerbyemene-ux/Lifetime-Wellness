import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';

const moods = [
  { key: 'great', emoji: '😄', color: 'bg-green-500/20 border-green-500/40' },
  { key: 'good', emoji: '🙂', color: 'bg-blue-500/20 border-blue-500/40' },
  { key: 'okay', emoji: '😐', color: 'bg-yellow-500/20 border-yellow-500/40' },
  { key: 'tired', emoji: '😴', color: 'bg-orange-500/20 border-orange-500/40' },
  { key: 'bad', emoji: '😞', color: 'bg-red-500/20 border-red-500/40' },
];

export default function MoodSelector({ selected, onSelect }) {
  const { t } = useLanguage();

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <h3 className="text-sm font-semibold mb-3">{t('moodQuestion')}</h3>
      <div className="flex justify-between gap-2">
        {moods.map((mood) => (
          <motion.button
            key={mood.key}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(mood.key)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all flex-1 ${
              selected === mood.key ? mood.color : 'border-transparent hover:bg-muted'
            }`}
          >
            <span className="text-2xl">{mood.emoji}</span>
            <span className="text-[10px] text-muted-foreground">{t(mood.key)}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
