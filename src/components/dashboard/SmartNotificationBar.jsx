import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Footprints, Zap, Trophy, Heart } from 'lucide-react';

function getSmartNotification(todayLog, profile, lang) {
  const steps = todayLog?.steps || 0;
  const goal = profile?.daily_step_goal || 5000;
  const water = todayLog?.water_glasses || 0;
  const remaining = goal - steps;
  const pct = (steps / goal) * 100;

  if (steps === 0) return {
    icon: Footprints, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20',
    msg: lang === 'ar' ? '⚡ ابدأ اليوم بـ 500 خطوة فقط — الآن!' : '⚡ Start today with just 500 steps — now!',
  };
  if (pct >= 90 && pct < 100) return {
    icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20',
    msg: lang === 'ar' ? `🏆 باقي ${remaining.toLocaleString()} خطوة فقط لتكمل هدفك! يلا!!` : `🏆 Only ${remaining.toLocaleString()} steps left to hit your goal! Go!!`,
  };
  if (pct >= 100) return {
    icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20',
    msg: lang === 'ar' ? '🎉 بطل! أكملت هدفك اليوم! أنت رائع جداً!' : '🎉 Champion! You crushed your daily goal! Amazing!',
  };
  if (pct >= 50) return {
    icon: Zap, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20',
    msg: lang === 'ar' ? `⚡ نصف الطريق! باقي ${remaining.toLocaleString()} خطوة — أنت قادر!` : `⚡ Halfway there! ${remaining.toLocaleString()} steps left — you got this!`,
  };
  if (water < 3) return {
    icon: Heart, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
    msg: lang === 'ar' ? '💧 جسمك يحتاج ماء الآن — اشرب كوب ماء!' : '💧 Your body needs water now — drink a glass!',
  };

  return {
    icon: Footprints, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20',
    msg: lang === 'ar' ? `🔥 امشِ ${Math.min(500, remaining).toLocaleString()} خطوة دلوقتي — بسيطة!` : `🔥 Walk ${Math.min(500, remaining).toLocaleString()} steps right now — easy!`,
  };
}

export default function SmartNotificationBar({ todayLog, profile }) {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(true);
  const notif = getSmartNotification(todayLog, profile, lang);

  useEffect(() => { setVisible(true); }, [todayLog?.steps]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${notif.bg} border ${notif.border} rounded-2xl px-4 py-3 flex items-center gap-3`}
      >
        <notif.icon className={`w-4 h-4 ${notif.color} flex-shrink-0`} />
        <p className="text-xs font-semibold flex-1 leading-relaxed">{notif.msg}</p>
        <button onClick={() => setVisible(false)} className="flex-shrink-0 opacity-50 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
