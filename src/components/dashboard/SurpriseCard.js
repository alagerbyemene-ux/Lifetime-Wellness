import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, Zap, Star } from 'lucide-react';

const SURPRISES_AR = [
  { emoji: '🎁', title: 'مفاجأة اليوم!', msg: 'لقد فتحنا لك خطة تدريب مجانية اليوم. استمر في مسيرتك! 🚀', color: 'from-purple-600/30 to-pink-600/20', border: 'border-purple-500/30' },
  { emoji: '🔥', title: 'Boost قوة!', msg: 'جسمك جاهز الآن — هذا اليوم مثالي لتكسر رقمك الشخصي! ⚡', color: 'from-orange-600/30 to-red-600/20', border: 'border-orange-500/30' },
  { emoji: '⭐', title: 'أنت نجم اليوم!', msg: 'أداؤك اليوم أفضل من 80% من المستخدمين. استحق هذه النجمة! 🌟', color: 'from-yellow-600/30 to-amber-600/20', border: 'border-yellow-500/30' },
  { emoji: '🏆', title: 'تحدي مخفي!', msg: 'تحدٍ سري: امشِ 1000 خطوة الآن واكسب 50 نقطة إضافية!', color: 'from-green-600/30 to-teal-600/20', border: 'border-green-500/30' },
  { emoji: '💎', title: 'مكافأة خاصة!', msg: 'أنت على بُعد يوم واحد فقط من فتح مستوى جديد. يلا! 💪', color: 'from-blue-600/30 to-cyan-600/20', border: 'border-blue-500/30' },
];

const SURPRISES_EN = [
  { emoji: '🎁', title: "Today's Surprise!", msg: 'We unlocked a free training plan for you today. Keep going! 🚀', color: 'from-purple-600/30 to-pink-600/20', border: 'border-purple-500/30' },
  { emoji: '🔥', title: 'Power Boost!', msg: "Your body is ready NOW — today is perfect to break your personal record! ⚡", color: 'from-orange-600/30 to-red-600/20', border: 'border-orange-500/30' },
  { emoji: '⭐', title: "You're Today's Star!", msg: "Your performance is better than 80% of users today. You earned this! 🌟", color: 'from-yellow-600/30 to-amber-600/20', border: 'border-yellow-500/30' },
  { emoji: '🏆', title: 'Hidden Challenge!', msg: 'Secret challenge: Walk 1000 steps right now and earn 50 bonus XP!', color: 'from-green-600/30 to-teal-600/20', border: 'border-green-500/30' },
  { emoji: '💎', title: 'Special Reward!', msg: "You're just 1 day away from unlocking a new level. Let's go! 💪", color: 'from-blue-600/30 to-cyan-600/20', border: 'border-blue-500/30' },
];

export default function SurpriseCard() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [surprise, setSurprise] = useState(null);

  useEffect(() => {
    const key = 'surprise_' + new Date().toISOString().split('T')[0];
    const shown = localStorage.getItem(key);
    if (!shown) {
      const surprises = lang === 'ar' ? SURPRISES_AR : SURPRISES_EN;
      const pick = surprises[Math.floor(Math.random() * surprises.length)];
      setSurprise(pick);
      const timer = setTimeout(() => { setVisible(true); localStorage.setItem(key, '1'); }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <AnimatePresence>
      {visible && surprise && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`relative bg-gradient-to-br ${surprise.color} rounded-3xl p-5 border ${surprise.border} overflow-hidden`}
        >
          {/* Sparkles */}
          <div className="absolute top-2 right-10 text-yellow-400/30 text-xs">✨</div>
          <div className="absolute bottom-3 left-8 text-yellow-400/20 text-xs">⭐</div>

          <button onClick={() => setVisible(false)}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/30 flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-3">
            <div className="text-3xl mt-0.5">{surprise.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-black text-yellow-400">{surprise.title}</span>
              </div>
              <p className="text-sm font-medium leading-relaxed">{surprise.msg}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
