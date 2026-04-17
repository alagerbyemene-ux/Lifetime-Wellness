import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Users, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

function seededRandom(seed) {
  let x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export default function CommunityWidget({ profile }) {
  const { lang } = useLanguage();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Generate consistent "community" numbers based on date + profile
    const seed = new Date().getDate() + (profile?.level || 1) * 7;
    const activeUsers = Math.floor(seededRandom(seed) * 400 + 80);
    const userRank = Math.floor(seededRandom(seed + 5) * 50 + 5);
    const similarUsers = Math.floor(seededRandom(seed + 10) * 200 + 50);
    setStats({ activeUsers, userRank, similarUsers });
  }, [profile?.level]);

  if (!stats) return null;

  return (
    <div className="bg-card rounded-3xl p-5 border border-border overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-16 translate-x-16" />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-2xl bg-accent/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-black">{lang === 'ar' ? '👥 مجتمعك اليوم' : '👥 Community Today'}</h3>
          <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'أنت لست وحدك' : "You're not alone"}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          {
            value: stats.activeUsers,
            label: lang === 'ar' ? 'شخص نشط الآن' : 'active now',
            emoji: '🏃',
            color: 'text-primary',
          },
          {
            value: `#${stats.userRank}`,
            label: lang === 'ar' ? 'مرتبتك اليوم' : 'your rank today',
            emoji: '🏆',
            color: 'text-yellow-400',
          },
          {
            value: stats.similarUsers,
            label: lang === 'ar' ? 'مثلك بدأوا اليوم' : 'like you started',
            emoji: '💪',
            color: 'text-accent',
          },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-muted rounded-2xl p-3 text-center"
          >
            <p className="text-lg mb-0.5">{s.emoji}</p>
            <p className={`text-base font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 bg-primary/10 border border-primary/20 rounded-2xl px-3 py-2 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-foreground/80">
          {lang === 'ar'
            ? `🔥 ${stats.activeUsers} شخص يتحركون الآن — انضم إليهم!`
            : `🔥 ${stats.activeUsers} people are moving right now — join them!`}
        </p>
      </div>
    </div>
  );
}
