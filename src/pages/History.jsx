import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Footprints, Heart, Flame, Clock, TrendingUp, Award, Calendar, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const MOOD_EMOJI = { great: '😄', good: '🙂', okay: '😐', tired: '😴', bad: '😞' };

export default function History({ profile }) {
  const { lang } = useLanguage();
  const [view, setView] = useState('list'); // 'list' | 'chart'

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['allLogs', profile?.user_email],
    queryFn: () => base44.entities.DailyLog.filter({ user_email: profile?.user_email }, '-date', 30),
    enabled: !!profile?.user_email,
  });

  // Totals
  const totalSteps = logs.reduce((s, l) => s + (l.steps || 0), 0);
  const totalCal = logs.reduce((s, l) => s + (l.calories_burned || 0), 0);
  const activeDays = logs.filter(l => l.steps > 0).length;
  const avgSteps = activeDays > 0 ? Math.round(totalSteps / activeDays) : 0;
  const bestDay = logs.reduce((best, l) => (l.steps || 0) > (best?.steps || 0) ? l : best, null);

  const chartData = [...logs].reverse().map(l => ({
    date: l.date?.slice(5),
    steps: l.steps || 0,
    cal: l.calories_burned || 0,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent/15 via-background to-background px-4 pt-12 pb-5">
        <h1 className="text-2xl font-black mb-1">{lang === 'ar' ? '📊 سجل نشاطك' : '📊 Activity History'}</h1>
        <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'آخر 30 يوماً' : 'Last 30 days'}</p>

        {/* View Toggle */}
        <div className="flex bg-muted rounded-2xl p-1 mt-3 gap-1">
          {[
            { k: 'list', label: lang === 'ar' ? '📋 قائمة' : '📋 List' },
            { k: 'chart', label: lang === 'ar' ? '📈 رسم بياني' : '📈 Chart' },
          ].map(v => (
            <button key={v.k} onClick={() => setView(v.k)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${view === v.k ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '👣', label: lang === 'ar' ? 'إجمالي الخطوات' : 'Total Steps', value: totalSteps.toLocaleString(), color: 'text-primary', bg: 'bg-primary/10' },
            { emoji: '🔥', label: lang === 'ar' ? 'إجمالي السعرات' : 'Total Calories', value: totalCal.toLocaleString(), color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { emoji: '📅', label: lang === 'ar' ? 'أيام نشطة' : 'Active Days', value: activeDays, color: 'text-green-400', bg: 'bg-green-500/10' },
            { emoji: '📊', label: lang === 'ar' ? 'متوسط خطوات' : 'Avg Steps', value: avgSteps.toLocaleString(), color: 'text-accent', bg: 'bg-accent/10' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
              className={`${s.bg} rounded-3xl p-4 border border-border`}>
              <p className="text-2xl mb-1">{s.emoji}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Best Day */}
        {bestDay && bestDay.steps > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-3xl p-4 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-xs text-yellow-400 font-bold">{lang === 'ar' ? 'أفضل يوم لك' : 'Your Best Day'}</p>
              <p className="font-black">{bestDay.steps.toLocaleString()} {lang === 'ar' ? 'خطوة' : 'steps'}</p>
              <p className="text-xs text-muted-foreground">{bestDay.date}</p>
            </div>
          </div>
        )}

        {/* Chart View */}
        {view === 'chart' && chartData.length > 0 && (
          <div className="bg-card rounded-3xl p-5 border border-border">
            <h3 className="text-sm font-black mb-4">{lang === 'ar' ? '📈 تطور الخطوات' : '📈 Steps Trend'}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="stepsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 11 }} />
                <Area type="monotone" dataKey="steps" stroke="hsl(var(--primary))" fill="url(#stepsGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="space-y-3">
            {logs.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📭</div>
                <p className="text-muted-foreground">{lang === 'ar' ? 'لا يوجد سجل بعد' : 'No history yet'}</p>
              </div>
            )}
            {logs.map((log, i) => {
              const goal = profile?.daily_step_goal || 5000;
              const pct = Math.min(((log.steps || 0) / goal) * 100, 100);
              const achieved = pct >= 100;
              return (
                <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`bg-card rounded-3xl p-4 border ${achieved ? 'border-green-500/30' : 'border-border'} relative overflow-hidden`}>
                  {achieved && <div className="absolute top-0 right-0 bg-green-500/20 text-green-400 text-[9px] font-black px-2 py-0.5 rounded-bl-xl">🎯 {lang === 'ar' ? 'هدف مكتمل' : 'Goal!'}</div>}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{MOOD_EMOJI[log.mood] || '📅'}</span>
                      <div>
                        <p className="text-sm font-black">{log.date}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {pct.toFixed(0)}% {lang === 'ar' ? 'من الهدف' : 'of goal'}
                        </p>
                      </div>
                    </div>
                    {log.plan_completed && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">✅</span>}
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full ${achieved ? 'bg-green-400' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="grid grid-cols-4 gap-1 text-center">
                    {[
                      { emoji: '👣', value: (log.steps || 0).toLocaleString(), label: lang === 'ar' ? 'خطوة' : 'steps' },
                      { emoji: '❤️', value: log.heart_rate_avg || '--', label: lang === 'ar' ? 'نبض' : 'bpm' },
                      { emoji: '🔥', value: log.calories_burned || 0, label: lang === 'ar' ? 'سعرة' : 'kcal' },
                      { emoji: '⏱️', value: log.active_minutes || 0, label: lang === 'ar' ? 'دقيقة' : 'min' },
                    ].map((s, j) => (
                      <div key={j} className="bg-muted rounded-2xl py-2">
                        <p className="text-xs">{s.emoji}</p>
                        <p className="text-xs font-black">{s.value}</p>
                        <p className="text-[8px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
