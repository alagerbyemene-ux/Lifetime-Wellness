import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { CheckCircle2, Circle, Footprints, Droplets, Flame, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function getMicroGoals(todayLog, profile, lang) {
  const steps = todayLog?.steps || 0;
  const goal = profile?.daily_step_goal || 5000;
  const water = todayLog?.water_glasses || 0;
  const sleep = todayLog?.sleep_hours || 0;
  const cals = todayLog?.calories_burned || 0;

  const stepMilestones = [500, 1000, 2000, 3000, goal];
  const nextStep = stepMilestones.find(m => m > steps) || goal;
  const remaining = Math.max(0, nextStep - steps);

  return [
    {
      id: 'steps_micro',
      icon: Footprints,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      done: steps >= nextStep,
      label: lang === 'ar' ? `امشِ ${remaining.toLocaleString()} خطوة الآن` : `Walk ${remaining.toLocaleString()} more steps now`,
      sub: lang === 'ar' ? `${steps.toLocaleString()} / ${nextStep.toLocaleString()} خطوة` : `${steps.toLocaleString()} / ${nextStep.toLocaleString()} steps`,
      xp: 10,
    },
    {
      id: 'water_micro',
      icon: Droplets,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      done: water >= 4,
      label: lang === 'ar' ? 'اشرب 4 أكواب ماء اليوم' : 'Drink 4 glasses of water',
      sub: lang === 'ar' ? `${water} / 4 أكواب` : `${water} / 4 cups`,
      xp: 5,
    },
    {
      id: 'cal_micro',
      icon: Flame,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      done: cals >= 200,
      label: lang === 'ar' ? 'احرق 200 سعرة اليوم' : 'Burn 200 calories today',
      sub: lang === 'ar' ? `${cals} / 200 سعرة` : `${cals} / 200 kcal`,
      xp: 15,
    },
    {
      id: 'sleep_micro',
      icon: Moon,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      done: sleep >= 7,
      label: lang === 'ar' ? 'سجّل 7 ساعات نوم' : 'Log 7 hours of sleep',
      sub: lang === 'ar' ? `${sleep || 0} / 7 ساعات` : `${sleep || 0} / 7 hours`,
      xp: 8,
    },
  ];
}

export default function MicroGoals({ todayLog, profile }) {
  const { lang } = useLanguage();
  const goals = getMicroGoals(todayLog, profile, lang);
  const done = goals.filter(g => g.done).length;

  return (
    <div className="bg-card rounded-3xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black">{lang === 'ar' ? '⚡ أهداف صغيرة = إنجازات كبيرة' : '⚡ Micro Goals'}</h3>
          <p className="text-[10px] text-muted-foreground">{done}/{goals.length} {lang === 'ar' ? 'مكتمل' : 'done'}</p>
        </div>
        <div className="flex gap-1">
          {goals.map((g, i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full ${g.done ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {goals.map((goal, i) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 border transition-all ${
                goal.done
                  ? 'bg-primary/5 border-primary/20 opacity-70'
                  : `${goal.bg} ${goal.border}`
              }`}
            >
              <div className={`w-8 h-8 rounded-xl ${goal.bg} flex items-center justify-center flex-shrink-0`}>
                {goal.done
                  ? <CheckCircle2 className="w-4 h-4 text-primary" />
                  : <goal.icon className={`w-4 h-4 ${goal.color}`} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${goal.done ? 'line-through text-muted-foreground' : ''}`}>
                  {goal.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{goal.sub}</p>
              </div>
              <span className={`text-[10px] font-black ${goal.done ? 'text-primary' : 'text-muted-foreground'}`}>
                +{goal.xp} XP
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
