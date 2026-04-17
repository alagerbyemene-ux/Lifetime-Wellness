import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Footprints, Heart, Flame, Droplets, Moon, Clock, TrendingUp, Zap, Brain, Target, ChevronRight, Plus, Minus, Bot, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import StepsRing from '@/components/dashboard/StepsRing';
import WeeklyChart from '@/components/dashboard/WeeklyChart';
import MoodSelector from '@/components/mood/MoodSelector';
import HealthPredictionCard from '@/components/dashboard/HealthPredictionCard';
import LevelBadge, { getLevelInfo } from '@/components/dashboard/LevelBadge';
import MicroGoals from '@/components/dashboard/MicroGoals';
import SurpriseCard from '@/components/dashboard/SurpriseCard';
import CommunityWidget from '@/components/dashboard/CommunityWidget';
import StoryProgress from '@/components/dashboard/StoryProgress';
import SmartNotificationBar from '@/components/dashboard/SmartNotificationBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Dashboard({ profile }) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [xpPopup, setXpPopup] = useState(null);

  const { data: dailyLogs = [] } = useQuery({
    queryKey: ['dailyLogs', profile?.user_email],
    queryFn: () => base44.entities.DailyLog.filter({ user_email: profile?.user_email }, '-date', 14),
    enabled: !!profile?.user_email,
  });

  const todayLog = dailyLogs.find(l => l.date === today);

  const updateLogMutation = useMutation({
    mutationFn: async (data) => {
      if (todayLog) return base44.entities.DailyLog.update(todayLog.id, data);
      return base44.entities.DailyLog.create({ user_email: profile.user_email, date: today, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] }),
  });

  const weeklyData = [0,1,2,3,4,5,6].map(i => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const log = dailyLogs.find(l => l.date === d.toISOString().split('T')[0]);
    return { steps: log?.steps || 0 };
  });

  const stepProgress = Math.min(((todayLog?.steps || 0) / (profile?.daily_step_goal || 5000)) * 100, 100);
  const levelInfo = getLevelInfo(profile?.level || 1);

  const generateAIMessage = async () => {
    setAiLoading(true);
    const steps = todayLog?.steps || 0;
    const goal = profile?.daily_step_goal || 5000;
    const pct = Math.round((steps / goal) * 100);

    const prompt = lang === 'ar'
      ? `أنت مدرب صحي ذكي يتكلم بطريقة حماسية وشخصية جداً كأنك صديق مقرب. المستخدم اسمه ${profile?.full_name?.split(' ')[0] || 'بطلنا'}، مشى ${steps.toLocaleString()} خطوة (${pct}% من هدفه)، حالته: ${todayLog?.mood || 'غير محدد'}، نومه: ${todayLog?.sleep_hours || 0} ساعة. اكتب رسالة تحفيزية قصيرة جداً (2-3 جمل فقط) تحلل أداءه بشكل شخصي جداً وتشجعه بقوة. لا تكن عاماً — اذكر الأرقام الحقيقية.`
      : `You are an AI coach who speaks like an excited personal friend. User: ${profile?.full_name?.split(' ')[0] || 'Champion'}, walked ${steps.toLocaleString()} steps (${pct}% of goal), mood: ${todayLog?.mood || 'unknown'}, sleep: ${todayLog?.sleep_hours || 0}h. Write a VERY personal (2-3 sentences) motivational message mentioning their actual numbers. Be exciting, not generic!`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setAiMessage(res);
    setAiLoading(false);
  };

  const speakMessage = () => {
    if (!aiMessage || !window.speechSynthesis) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(aiMessage);
    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  // Auto generate on mount
  useEffect(() => {
    if (profile && !aiMessage) generateAIMessage();
  }, [profile?.id, todayLog?.steps]);

  // XP popup simulation
  useEffect(() => {
    if (todayLog?.steps > 0 && todayLog?.steps % 500 === 0) {
      setXpPopup('+10 XP 🎉');
      setTimeout(() => setXpPopup(null), 2500);
    }
  }, [todayLog?.steps]);

  const greetingText = () => {
    const h = new Date().getHours();
    const name = profile?.full_name?.split(' ')[0] || (lang === 'ar' ? 'بطلنا' : 'Champion');
    if (lang === 'ar') {
      if (h < 12) return `صباح الفل، ${name} 🌅`;
      if (h < 17) return `مرحباً، ${name} ☀️`;
      if (h < 20) return `مساء الخير، ${name} 🌆`;
      return `مساء النور، ${name} 🌙`;
    } else {
      if (h < 12) return `Good morning, ${name} 🌅`;
      if (h < 17) return `Hello, ${name} ☀️`;
      if (h < 20) return `Good evening, ${name} 🌆`;
      return `Good night, ${name} 🌙`;
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* XP Popup */}
      <AnimatePresence>
        {xpPopup && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.5 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground font-black text-lg px-6 py-3 rounded-full shadow-2xl shadow-primary/50"
          >
            {xpPopup}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HERO HEADER ===== */}
      <div className={`relative overflow-hidden bg-gradient-to-br from-primary/25 via-background to-accent/10 px-4 pt-14 pb-8`}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/8 rounded-full -translate-y-36 translate-x-36 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-52 h-52 bg-accent/8 rounded-full translate-y-28 -translate-x-28 blur-3xl" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Greeting + Level */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">
                {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-2xl font-black leading-tight">{greetingText()}</h1>
              {profile?.streak_days > 0 && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                  className="inline-flex items-center gap-1.5 mt-1.5 bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black px-3 py-1 rounded-full"
                >
                  🔥 {profile.streak_days} {lang === 'ar' ? 'يوم متتالي!' : 'day streak!'}
                </motion.div>
              )}
            </div>
            <LevelBadge level={profile?.level || 1} xp={profile?.xp || 0} />
          </div>

          {/* Smart Notification */}
          <SmartNotificationBar todayLog={todayLog} profile={profile} />
        </motion.div>
      </div>

      <div className="px-4 space-y-4 pb-28 -mt-1">

        {/* ===== SURPRISE CARD ===== */}
        <SurpriseCard />

        {/* ===== MAIN STATS RING ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`bg-gradient-to-br ${levelInfo.color} p-0.5 rounded-3xl shadow-xl`}>
          <div className="bg-card rounded-3xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-black">{lang === 'ar' ? '🎯 هدف اليوم' : "🎯 Today's Goal"}</h2>
                <p className="text-[10px] text-muted-foreground">
                  {stepProgress >= 100
                    ? (lang === 'ar' ? '🎉 مكتمل! أنت بطل!' : '🎉 Completed! You\'re a champion!')
                    : `${stepProgress.toFixed(0)}% ${lang === 'ar' ? 'من هدفك' : 'of goal'}`}
                </p>
              </div>
              {stepProgress >= 100 && (
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-2xl">🏆</motion.div>
              )}
            </div>
            <div className="flex items-center gap-5">
              <StepsRing steps={todayLog?.steps || 0} goal={profile?.daily_step_goal || 5000} />
              <div className="flex-1 space-y-2.5">
                {[
                  { icon: Flame, label: lang === 'ar' ? 'سعرات' : 'Calories', value: todayLog?.calories_burned || 0, unit: lang === 'ar' ? 'سعرة' : 'kcal', color: 'text-orange-400', bg: 'bg-orange-400/10' },
                  { icon: Clock, label: lang === 'ar' ? 'نشاط' : 'Active', value: todayLog?.active_minutes || 0, unit: lang === 'ar' ? 'د' : 'min', color: 'text-accent', bg: 'bg-accent/10' },
                  { icon: Heart, label: lang === 'ar' ? 'نبض' : 'Heart', value: todayLog?.heart_rate_avg || '--', unit: lang === 'ar' ? 'ن/د' : 'bpm', color: 'text-red-400', bg: 'bg-red-400/10' },
                  { icon: Footprints, label: lang === 'ar' ? 'مسافة' : 'Distance', value: (todayLog?.distance_km || 0).toFixed(1), unit: lang === 'ar' ? 'كم' : 'km', color: 'text-primary', bg: 'bg-primary/10' },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] text-muted-foreground block">{stat.label}</span>
                      <span className="text-sm font-black">{stat.value} <span className="text-[9px] text-muted-foreground font-normal">{stat.unit}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Link to="/walking"
              className="mt-4 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-3 text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/30">
              <Footprints className="w-4 h-4" />
              {lang === 'ar' ? '🏃 ابدأ المشي الآن!' : '🏃 Start Walking Now!'}
            </Link>
          </div>
        </motion.div>

        {/* ===== AI COACH (SPEAKS) ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="relative bg-gradient-to-br from-primary/20 via-card to-accent/10 rounded-3xl p-5 border border-primary/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-12 translate-x-12" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={aiLoading ? { rotate: 360 } : speaking ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: speaking ? Infinity : 0, duration: speaking ? 0.8 : 1 }}
                className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Bot className="w-5 h-5 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-sm font-black">{lang === 'ar' ? '🤖 المدرب الذكي' : '🤖 AI Coach'}</h3>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${aiLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                  <p className="text-[10px] text-muted-foreground">
                    {aiLoading ? (lang === 'ar' ? 'يفكر...' : 'Thinking...') : (lang === 'ar' ? 'نشط' : 'Active')}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {aiMessage && window.speechSynthesis && (
                <button onClick={speakMessage}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${speaking ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                  {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
              <button onClick={generateAIMessage} disabled={aiLoading}
                className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <RefreshCw className={`w-4 h-4 text-primary ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {aiLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 py-1">
                {[0,1,2,3].map(i => (
                  <motion.div key={i} className="w-2 h-2 bg-primary/50 rounded-full"
                    animate={{ y: [0, -6, 0] }} transition={{ delay: i * 0.12, repeat: Infinity, duration: 0.7 }} />
                ))}
              </motion.div>
            ) : (
              <motion.p key={aiMessage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm leading-relaxed font-medium">
                {aiMessage || (lang === 'ar' ? '💬 جارٍ تحليل أدائك...' : '💬 Analyzing your performance...')}
              </motion.p>
            )}
          </AnimatePresence>
          {speaking && (
            <div className="mt-2 flex gap-0.5 items-end h-5">
              {[3,5,7,4,6,8,5,3,6,4].map((h, i) => (
                <motion.div key={i} className="w-1 bg-primary/60 rounded-full"
                  animate={{ height: [`${h}px`, `${h*2}px`, `${h}px`] }}
                  transition={{ delay: i * 0.08, repeat: Infinity, duration: 0.5 }} />
              ))}
            </div>
          )}
        </motion.div>

        {/* ===== MICRO GOALS ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <MicroGoals todayLog={todayLog} profile={profile} />
        </motion.div>

        {/* ===== STORY PROGRESS ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StoryProgress logs={dailyLogs} />
        </motion.div>

        {/* ===== WATER & SLEEP ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="grid grid-cols-2 gap-3">
          {/* Water */}
          <div className="bg-card rounded-3xl p-4 border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Droplets className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'ماء' : 'Water'}</p>
                <p className="text-xs font-black text-blue-400">{todayLog?.water_glasses || 0}/8</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1 mb-2">
              {[0,1,2,3,4,5,6,7].map(i => (
                <button key={i} onClick={() => updateLogMutation.mutate({ water_glasses: i + 1 })}
                  className={`h-6 rounded-full transition-all ${i < (todayLog?.water_glasses || 0) ? 'bg-blue-400' : 'bg-muted'}`} />
              ))}
            </div>
            <div className="flex gap-1">
              <button onClick={() => updateLogMutation.mutate({ water_glasses: Math.max(0, (todayLog?.water_glasses || 0) - 1) })}
                className="flex-1 h-7 rounded-xl bg-muted flex items-center justify-center text-xs"><Minus className="w-3 h-3" /></button>
              <button onClick={() => updateLogMutation.mutate({ water_glasses: Math.min(8, (todayLog?.water_glasses || 0) + 1) })}
                className="flex-1 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center"><Plus className="w-3 h-3 text-blue-400" /></button>
            </div>
          </div>

          {/* Sleep */}
          <div className="bg-card rounded-3xl p-4 border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'نوم' : 'Sleep'}</p>
                <p className="text-xs font-black text-indigo-400">{todayLog?.sleep_hours || '--'} {lang === 'ar' ? 'س' : 'h'}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[5,6,7,8,9,10,11,12].map(h => (
                <button key={h} onClick={() => updateLogMutation.mutate({ sleep_hours: h })}
                  className={`h-8 rounded-xl text-xs font-bold transition-all ${todayLog?.sleep_hours === h ? 'bg-indigo-500 text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}>
                  {h}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ===== MOOD ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <MoodSelector selected={todayLog?.mood} onSelect={(mood) => updateLogMutation.mutate({ mood })} />
        </motion.div>

        {/* ===== COMMUNITY ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <CommunityWidget profile={profile} />
        </motion.div>

        {/* ===== HEALTH PREDICTION ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <HealthPredictionCard profile={profile} todayLog={todayLog} logs={dailyLogs} />
        </motion.div>

        {/* ===== WEEKLY CHART ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <WeeklyChart data={weeklyData} />
        </motion.div>

        {/* ===== QUICK LINKS ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="grid grid-cols-2 gap-3">
          {[
            { to: '/plans', emoji: '📋', label: lang === 'ar' ? 'خططي' : 'My Plans', color: 'text-primary', bg: 'from-primary/20 to-primary/5', border: 'border-primary/20' },
            { to: '/meals', emoji: '🍽️', label: lang === 'ar' ? 'وجباتي' : 'Meals', color: 'text-orange-400', bg: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/20' },
            { to: '/challenges', emoji: '🏆', label: lang === 'ar' ? 'التحديات' : 'Challenges', color: 'text-yellow-400', bg: 'from-yellow-500/20 to-yellow-500/5', border: 'border-yellow-500/20' },
            { to: '/assistant', emoji: '🤖', label: lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant', color: 'text-accent', bg: 'from-accent/20 to-accent/5', border: 'border-accent/20' },
          ].map((item, i) => (
            <Link key={i} to={item.to}
              className={`bg-gradient-to-br ${item.bg} rounded-2xl p-4 border ${item.border} flex items-center gap-3 hover:scale-[1.02] transition-transform active:scale-95`}>
              <span className="text-2xl">{item.emoji}</span>
              <span className={`text-sm font-black ${item.color}`}>{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
