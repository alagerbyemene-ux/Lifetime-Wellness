import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarDays, CalendarRange, TrendingUp, Lock, CheckCircle2, Circle, Bot, Loader2, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Target, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const planTypes = [
  { key: 'daily', icon: Calendar, days: 1, titleEn: 'Daily Plan', titleAr: 'خطة يومية', color: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/20', iconColor: 'text-blue-400', emoji: '📅' },
  { key: 'weekly', icon: CalendarDays, days: 7, titleEn: 'Weekly Plan', titleAr: 'خطة أسبوعية', color: 'from-green-500/20 to-green-500/5', border: 'border-green-500/20', iconColor: 'text-green-400', emoji: '📆' },
  { key: 'monthly', icon: CalendarRange, days: 30, titleEn: 'Monthly Plan', titleAr: 'خطة شهرية', color: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/20', iconColor: 'text-purple-400', emoji: '🗓️' },
  { key: 'yearly', icon: TrendingUp, days: 90, titleEn: '3-Month Plan', titleAr: 'خطة 3 أشهر', color: 'from-primary/20 to-primary/5', border: 'border-primary/20', iconColor: 'text-primary', emoji: '📈' },
];

export default function Plans({ profile }) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [completingDay, setCompletingDay] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['plans', profile?.user_email],
    queryFn: () => base44.entities.HealthPlan.filter({ user_email: profile?.user_email }, '-created_date'),
    enabled: !!profile?.user_email,
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HealthPlan.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plans'] }),
  });

  const generatePlan = async (type) => {
    setGenerating(type.key);
    const daysToGenerate = Math.min(type.days, 30); // cap for AI
    const prompt = lang === 'ar'
      ? `أنشئ خطة صحية لـ ${daysToGenerate} يوم. المستخدم: ${profile?.age} سنة، ${profile?.weight_kg} كيلو، ${profile?.height_cm} سم، هدف: ${profile?.goal}، نشاط: ${profile?.activity_level}. لكل يوم: تمارين متنوعة وواقعية ونصائح محفزة. JSON: {"days": [{"day": 1, "exercises": [{"name": "Push-ups", "name_ar": "تمرين الضغط", "duration_min": 10, "sets": 3, "reps": 12, "type": "strength"}], "step_goal": 5000, "tips": "tip in English", "tips_ar": "نصيحة بالعربية", "motivation": "motivation EN", "motivation_ar": "تحفيز عربي"}], "ai_messages": [{"day": 1, "message": "Coach msg EN", "message_ar": "رسالة المدرب"}]}`
      : `Create a health plan for ${daysToGenerate} days. User: ${profile?.age}y, ${profile?.weight_kg}kg, ${profile?.height_cm}cm, goal: ${profile?.goal}, activity: ${profile?.activity_level}. Varied realistic exercises and motivational tips per day. JSON: {"days": [{"day": 1, "exercises": [{"name": "Push-ups", "name_ar": "تمرين الضغط", "duration_min": 10, "sets": 3, "reps": 12, "type": "strength"}], "step_goal": 5000, "tips": "tip", "tips_ar": "نصيحة", "motivation": "motivation", "motivation_ar": "تحفيز"}], "ai_messages": [{"day": 1, "message": "msg", "message_ar": "رسالة"}]}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          days: { type: 'array', items: { type: 'object', properties: { day: { type: 'number' }, exercises: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, name_ar: { type: 'string' }, duration_min: { type: 'number' }, sets: { type: 'number' }, reps: { type: 'number' }, type: { type: 'string' } } } }, step_goal: { type: 'number' }, tips: { type: 'string' }, tips_ar: { type: 'string' }, motivation: { type: 'string' }, motivation_ar: { type: 'string' } } } },
          ai_messages: { type: 'array', items: { type: 'object', properties: { day: { type: 'number' }, message: { type: 'string' }, message_ar: { type: 'string' } } } },
        }
      }
    });

    const daysContent = (res.days || []).map((d, i) => ({
      ...d,
      unlocked: i === 0,
      completed: false,
    }));

    await base44.entities.HealthPlan.create({
      user_email: profile.user_email,
      plan_type: type.key,
      title: type.titleEn,
      title_ar: type.titleAr,
      start_date: new Date().toISOString().split('T')[0],
      total_days: type.days,
      current_day: 1,
      status: 'active',
      days_content: daysContent,
      ai_coach_messages: res.ai_messages || [],
    });

    queryClient.invalidateQueries({ queryKey: ['plans'] });
    setGenerating(null);
  };

  const completeDay = async (plan, dayIndex) => {
    setCompletingDay(dayIndex);
    const updated = plan.days_content.map((d, i) => ({
      ...d,
      completed: i === dayIndex ? true : d.completed,
      unlocked: i === dayIndex + 1 ? true : d.unlocked,
    }));
    await updatePlanMutation.mutateAsync({
      id: plan.id,
      data: {
        days_content: updated,
        current_day: dayIndex + 2,
        status: dayIndex + 1 >= updated.length ? 'completed' : 'active',
      },
    });
    setCompletingDay(null);
  };

  const resetPlan = async (plan) => {
    const reset = plan.days_content.map((d, i) => ({ ...d, unlocked: i === 0, completed: false }));
    await updatePlanMutation.mutateAsync({ id: plan.id, data: { days_content: reset, current_day: 1, status: 'active' } });
  };

  const activePlan = selectedPlan ? plans.find(p => p.id === selectedPlan) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/15 via-background to-background px-4 pt-12 pb-5">
        <div className="flex items-center justify-between">
          {activePlan ? (
            <>
              <button onClick={() => setSelectedPlan(null)} className="flex items-center gap-1 text-muted-foreground">
                {lang === 'ar' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                <span className="text-sm">{lang === 'ar' ? 'رجوع' : 'Back'}</span>
              </button>
              <h1 className="text-base font-bold">{lang === 'ar' ? activePlan.title_ar : activePlan.title}</h1>
              <button onClick={() => resetPlan(activePlan)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </button>
            </>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-black">{lang === 'ar' ? '📋 خططي الصحية' : '📋 My Health Plans'}</h1>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مدعومة بالذكاء الاصطناعي' : 'AI-powered plans'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {!activePlan && (
          <>
            {/* Plan Type Grid */}
            <div className="grid grid-cols-2 gap-3">
              {planTypes.map((type) => {
                const existing = plans.find(p => p.plan_type === type.key && p.status === 'active');
                const completed = plans.filter(p => p.plan_type === type.key && p.status === 'completed').length;
                const isGenerating = generating === type.key;
                return (
                  <motion.div
                    key={type.key}
                    whileTap={{ scale: 0.97 }}
                    className={`bg-gradient-to-br ${type.color} rounded-3xl p-4 border ${type.border} cursor-pointer`}
                    onClick={() => existing && setSelectedPlan(existing.id)}
                  >
                    <div className="text-3xl mb-2">{type.emoji}</div>
                    <h3 className="text-sm font-black mb-1">{lang === 'ar' ? type.titleAr : type.titleEn}</h3>
                    <p className="text-[10px] text-muted-foreground mb-3">{type.days} {t('days')}</p>

                    {existing ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 bg-background/50 rounded-full overflow-hidden">
                            <div className="h-full bg-current rounded-full" style={{ width: `${((existing.current_day - 1) / existing.total_days) * 100}%` }} />
                          </div>
                          <span className={`text-[9px] ${type.iconColor} font-bold`}>{existing.current_day - 1}/{existing.total_days}</span>
                        </div>
                        <Badge className="bg-background/50 text-xs font-bold border-0">{lang === 'ar' ? '▶ متابعة' : '▶ Continue'}</Badge>
                      </div>
                    ) : (
                      <Button size="sm" disabled={isGenerating}
                        className="w-full h-8 text-xs bg-background/30 hover:bg-background/50 text-foreground border-0 rounded-xl font-bold"
                        onClick={(e) => { e.stopPropagation(); generatePlan(type); }}>
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                        {isGenerating ? (lang === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...') : (lang === 'ar' ? 'إنشاء' : 'Create')}
                      </Button>
                    )}
                    {completed > 0 && <p className="text-[9px] text-muted-foreground mt-1">✅ {completed} {lang === 'ar' ? 'مكتملة' : 'completed'}</p>}
                  </motion.div>
                );
              })}
            </div>

            {/* Completed Plans */}
            {plans.filter(p => p.status === 'completed').length > 0 && (
              <div>
                <h2 className="text-sm font-bold text-muted-foreground mb-3">✅ {lang === 'ar' ? 'الخطط المكتملة' : 'Completed Plans'}</h2>
                {plans.filter(p => p.status === 'completed').map(plan => (
                  <div key={plan.id} className="bg-card rounded-2xl p-4 border border-green-500/20 flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold">{lang === 'ar' ? plan.title_ar : plan.title}</p>
                      <p className="text-xs text-green-400">{lang === 'ar' ? 'مكتملة' : 'Completed'} 🎉</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => resetPlan(plan)} className="h-8 text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" /> {lang === 'ar' ? 'إعادة' : 'Restart'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Plan Detail View */}
        {activePlan && (
          <AnimatePresence>
            {activePlan.days_content?.map((day, i) => {
              const coachMsg = activePlan.ai_coach_messages?.find(m => m.day === day.day);
              const totalTime = day.exercises?.reduce((s, e) => s + (e.duration_min || 0), 0) || 0;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`rounded-3xl border overflow-hidden ${
                    day.completed ? 'border-green-500/30 bg-green-500/5' :
                    day.unlocked ? 'border-primary/30 bg-card' :
                    'border-border bg-card/50 opacity-60'
                  }`}>
                  {/* Day Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        day.completed ? 'bg-green-500/20' : day.unlocked ? 'bg-primary/20' : 'bg-muted'
                      }`}>
                        {day.completed ? <CheckCircle2 className="w-5 h-5 text-green-400" /> :
                         day.unlocked ? <Circle className="w-5 h-5 text-primary" /> :
                         <Lock className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-black">{lang === 'ar' ? `اليوم ${day.day}` : `Day ${day.day}`}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {day.exercises?.length || 0} {lang === 'ar' ? 'تمارين' : 'exercises'} • {totalTime} {lang === 'ar' ? 'د' : 'min'} • 👣 {day.step_goal?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {day.completed && <span className="text-xs text-green-400 font-bold">✅ {lang === 'ar' ? 'مكتمل' : 'Done'}</span>}
                  </div>

                  {day.unlocked && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* Exercises */}
                      <div className="space-y-2">
                        {day.exercises?.map((ex, j) => (
                          <div key={j} className={`flex items-center justify-between rounded-2xl px-3 py-2.5 ${
                            ex.type === 'cardio' ? 'bg-blue-500/10' : ex.type === 'strength' ? 'bg-orange-500/10' : 'bg-muted'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{ex.type === 'cardio' ? '🏃' : ex.type === 'strength' ? '💪' : '🧘'}</span>
                              <div>
                                <p className="text-sm font-semibold">{lang === 'ar' ? ex.name_ar : ex.name}</p>
                                {(ex.sets || ex.reps) && (
                                  <p className="text-[10px] text-muted-foreground">{ex.sets && `${ex.sets} ${lang === 'ar' ? 'جولات' : 'sets'}`} {ex.reps && `× ${ex.reps} ${lang === 'ar' ? 'تكرار' : 'reps'}`}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs">{ex.duration_min}{lang === 'ar' ? 'د' : 'm'}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tip */}
                      {(day.tips_ar || day.tips) && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-3 py-2.5">
                          <p className="text-[10px] text-yellow-400 font-bold mb-0.5">💡 {lang === 'ar' ? 'نصيحة اليوم' : "Today's Tip"}</p>
                          <p className="text-xs text-foreground/80">{lang === 'ar' ? day.tips_ar : day.tips}</p>
                        </div>
                      )}

                      {/* AI Coach Message */}
                      {coachMsg && (
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl px-3 py-2.5 flex items-start gap-2">
                          <Bot className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[10px] text-primary font-bold mb-0.5">{lang === 'ar' ? 'رسالة المدرب الذكي' : 'AI Coach Message'}</p>
                            <p className="text-xs text-foreground/80">{lang === 'ar' ? coachMsg.message_ar : coachMsg.message}</p>
                          </div>
                        </div>
                      )}

                      {/* Motivation */}
                      {(day.motivation_ar || day.motivation) && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-3 py-2.5">
                          <p className="text-xs text-green-400">🚀 {lang === 'ar' ? day.motivation_ar : day.motivation}</p>
                        </div>
                      )}

                      {/* Complete Button */}
                      {!day.completed && (
                        <Button
                          className="w-full h-12 bg-primary hover:bg-primary/90 rounded-2xl font-black shadow-lg shadow-primary/20"
                          onClick={() => completeDay(activePlan, i)}
                          disabled={completingDay === i}
                        >
                          {completingDay === i ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                          {lang === 'ar' ? '✅ إنهاء اليوم' : '✅ Complete Day'}
                        </Button>
                      )}
                    </div>
                  )}

                  {!day.unlocked && (
                    <div className="px-4 pb-4 text-center">
                      <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'أكمل اليوم السابق لفتح هذا اليوم' : 'Complete previous day to unlock'}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
