import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StoryProgress({ logs }) {
  const { lang } = useLanguage();

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const todayLog = logs.find(l => l.date === today);
  const yesterdayLog = logs.find(l => l.date === yesterday);

  const todaySteps = todayLog?.steps || 0;
  const yesterdaySteps = yesterdayLog?.steps || 0;

  const weekLogs = logs.filter(l => l.date >= lastWeek);
  const prevWeekAvg = Math.round(
    logs.filter(l => l.date < lastWeek).reduce((s, l) => s + (l.steps || 0), 0) /
    Math.max(logs.filter(l => l.date < lastWeek).length, 1)
  );
  const thisWeekAvg = Math.round(
    weekLogs.reduce((s, l) => s + (l.steps || 0), 0) / Math.max(weekLogs.length, 1)
  );

  const diff = yesterdaySteps > 0 ? Math.round(((todaySteps - yesterdaySteps) / yesterdaySteps) * 100) : 0;
  const weekDiff = prevWeekAvg > 0 ? Math.round(((thisWeekAvg - prevWeekAvg) / prevWeekAvg) * 100) : 0;

  const getStoryText = () => {
    if (logs.length === 0) return lang === 'ar' ? 'ابدأ رحلتك الصحية اليوم! 🚀' : 'Start your health journey today! 🚀';
    if (todaySteps === 0) return lang === 'ar' ? 'لم تبدأ بعد اليوم — هيا! ⚡' : "You haven't started today — let's go! ⚡";
    if (diff > 20) return lang === 'ar' ? `🔥 أنت أفضل من أمس بنسبة ${diff}%! استمر!` : `🔥 You're ${diff}% better than yesterday! Keep it up!`;
    if (diff < -20) return lang === 'ar' ? `💪 أمس كنت أقوى — استعد قوتك اليوم!` : `💪 Yesterday you were stronger — reclaim it today!`;
    if (weekDiff > 10) return lang === 'ar' ? `📈 تقدمك هذا الأسبوع ${weekDiff}% أفضل من الأسبوع الماضي!` : `📈 You improved ${weekDiff}% vs last week!`;
    if (todaySteps > 0) return lang === 'ar' ? `✅ ممتاز! مشيت ${todaySteps.toLocaleString()} خطوة اليوم — استمر!` : `✅ Great! ${todaySteps.toLocaleString()} steps today — keep going!`;
    return lang === 'ar' ? 'كل خطوة تقربك من هدفك! 🎯' : 'Every step brings you closer to your goal! 🎯';
  };

  const Icon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const iconColor = diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-3xl p-5 border border-primary/10">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-black">{lang === 'ar' ? '📖 قصة تقدمك' : '📖 Your Progress Story'}</h3>
      </div>

      <p className="text-base font-semibold leading-relaxed mb-4">{getStoryText()}</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/50 rounded-2xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            <span className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'مقارنة بالأمس' : 'vs Yesterday'}</span>
          </div>
          <p className={`text-lg font-black ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
            {diff > 0 ? '+' : ''}{diff}%
          </p>
        </div>
        <div className="bg-muted/50 rounded-2xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className={`w-3.5 h-3.5 ${weekDiff >= 0 ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'مقارنة بالأسبوع' : 'vs Last Week'}</span>
          </div>
          <p className={`text-lg font-black ${weekDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weekDiff > 0 ? '+' : ''}{weekDiff}%
          </p>
        </div>
      </div>
    </div>
  );
}
