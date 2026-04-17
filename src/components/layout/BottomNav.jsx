import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Footprints, ClipboardList, UtensilsCrossed, User, Sparkles, Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/', icon: Home, key: 'dashboard' },
  { path: '/walking', icon: Footprints, key: 'walking' },
  { path: '/plans', icon: ClipboardList, key: 'plans' },
  { path: '/leaderboard', icon: Trophy, labelAr: 'تنافس', labelEn: 'Rank' },
  { path: '/assistant', icon: Sparkles, labelAr: 'ذكاء', labelEn: 'AI' },
  { path: '/profile', icon: User, key: 'profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const { t, lang } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border shadow-2xl">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const label = item.key ? t(item.key) : (lang === 'ar' ? item.labelAr : item.labelEn);
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center gap-0.5 relative px-2 py-1 min-w-0 flex-1">
              {isActive && (
                <motion.div
                  layoutId="navBg"
                  className="absolute inset-0 bg-primary/10 rounded-2xl"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="navDot"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                />
              )}
              <Icon className={`w-5 h-5 transition-all ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
              <span className={`text-[9px] font-semibold transition-all truncate ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
