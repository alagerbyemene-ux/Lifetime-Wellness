import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Loader2, Flame, Footprints, Droplets, Dumbbell, Star, Zap, Crown, Shield, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LevelBadge, { getLevelInfo } from '@/components/dashboard/LevelBadge';

const typeIcons = { steps: Footprints, exercise: Dumbbell, water: Droplets, streak: Flame, custom: Trophy };
const typeColors = {
  steps: { bg: 'from-primary/20 to-primary/5', border: 'border-primary/30', icon: 'bg-primary/20 text-primary' },
  exercise: { bg: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30', icon: 'bg-orange-500/20 text-orange-400' },
  water: { bg: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30', icon: 'bg-blue-500/20 text-blue-400' },
  streak: { bg: 'from-red-500/20 to-red-500/5', border: 'border-red-500/30', icon: 'bg-red-500/20 text-orange-400' },
  custom: { bg: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30', icon: 'bg-purple-500/20 text-purple-400' },
};

const LEVEL_TITLES = [
  { min: 1, max: 4, emoji: '🌱', en: 'Beginner', ar: 'مبتدئ' },
  { min: 5, max: 9, emoji: '⚔️', en: 'Warrior', ar: 'محارب' },
  { min: 10, max: 19, emoji: '🏃', en: 'Athlete', ar: 'رياضي' },
  { min: 20, max: 34, emoji: '🏆', en: 'Champion', ar: 'بطل' },
  { min: 35, max: 49, emoji: '⭐', en: 'Legend', ar: 'أسطورة' },
  { min: 50, max: 999, emoji: '🔥', en: 'BEAST', ar: 'وحش' },
];

export default function Challenges({ profile }) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [claimingId, setClaimingId] = useState(null);

  const { data: challenges = [] } = useQuery({
    queryKey: ['challenges', profile?.user_email],
    queryFn: () => base44.entities.Challenge.filter({ user_email: profile?.user_email }, '-created_date'),
    enabled: !!profile?.user_email,
  });

  const updateChallengeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Challenge.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] }),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.entities.UserProfile.update(profile.id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const generateChallenges = async () => {
    setGenerating(true);
    const prompt = lang === 'ar'
      ? `أنشئ 4 تحديات صحية ممتعة ومتنوعة للمستخدم. هدفه: ${profile?.goal}، مستواه: ${profile?.level || 1}. اجعلها متدرجة (سهل، متوسط، صعب، خاص). JSON: {"challenges": [{"title": "...", "title_ar": "...", "description": "...", "description_ar": "...", "type": "steps", "target_value": 5000, "reward_xp": 50, "days": 3, "badge_icon": "🏆"}]}`
      : `Create 4 fun varied health challenges. Goal: ${profile?.goal}, level: ${profile?.level || 1}. Make them progressive (easy, medium, hard, special). JSON: {"challenges": [{"title": "...", "title_ar": "...", "description": "...", "description_ar": "...", "type": "steps", "target_value": 5000, "reward_xp": 50, "days": 3, "badge_icon": "🏆"}]}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          challenges: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, title_ar: { type: 'string' }, description: { type: 'string' }, description_ar: { type: 'string' }, type: { type: 'string' }, target_value: { type: 'number' }, reward_xp: { type: 'number' }, days: { type: 'number' }, badge_icon: { type: 'string' } } } },
        }
      }
    });

    const today = new Date();
    for (const ch of (res.challenges || [])) {
      const end = new Date(today);
      end.setDate(end.getDate() + (ch.days || 7));
      await base44.entities.Challenge.create({
        user_email: profile.user_email,
        ...ch,
        start_date: today.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
        current_value: 0,
        status: 'active',
      });
    }
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    setGenerating(false);
  };

  const claimReward = async (ch) => {
    setClaimingId(ch.id);
    await updateChallengeMutation.mutateAsync({ id: ch.id, data: { status: 'completed' } });
    const newXp = (profile?.xp || 0) + ch.reward_xp;
    const newLevel = Math.floor(newXp / 100) + 1;
    await updateProfileMutation.mutateAsync({ xp: newXp, level: newLevel });
    setClaimingId(null);
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  const levelInfo = getLevelInfo(profile?.level || 1);
  const xpInLevel = (profile?.xp || 0) % 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-br ${levelInfo.color} px-4 pt-12 pb-6 relative overflow-hidden`}>
        <div className="absolute inset-0 bg-background/60" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black">{lang === 'ar' ? '🏆 التحديات' : '🏆 Challenges'}</h1>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'تحدَّ نفسك وارتقِ' : 'Challenge yourself & level up'}</p>
            </div>
            <Button size="sm" className="bg-primary h-10 px-4 rounded-2xl font-black shadow-lg shadow-primary/30" onClick={generateChallenges} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Zap className="w-4 h-4 mr-1" />}
              {lang === 'ar' ? 'جديد' : 'New'}
            </Button>
          </div>

          {/* Level Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-4 border border-border">
            <LevelBadge level={profile?.level || 1} xp={profile?.xp || 0} />
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{xpInLevel} / 100 XP</span>
                <span>{lang === 'ar' ? `${100 - xpInLevel} نقطة للمستوى التالي` : `${100 - xpInLevel} XP to next level`}</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${levelInfo.color} rounded-full`}
                  initial={{ width: 0 }} animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: lang === 'ar' ? 'تحديات مكتملة' : 'Completed', value: completedChallenges.length, emoji: '✅' },
                { label: lang === 'ar' ? 'نقاط إجمالية' : 'Total XP', value: profile?.xp || 0, emoji: '⚡' },
                { label: lang === 'ar' ? 'أيام متتالية' : 'Streak', value: profile?.streak_days || 0, emoji: '🔥' },
              ].map((s, i) => (
                <div key={i} className="bg-muted rounded-2xl p-2 text-center">
                  <p className="text-base">{s.emoji}</p>
                  <p className="text-sm font-black text-primary">{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* Levels Road Map */}
        <div className="bg-card rounded-3xl p-4 border border-border">
          <h3 className="text-sm font-black mb-3">{lang === 'ar' ? '🗺️ خارطة المستويات' : '🗺️ Level Roadmap'}</h3>
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {LEVEL_TITLES.map((lv, i) => {
              const current = profile?.level || 1;
              const isActive = current >= lv.min && current <= lv.max;
              const isDone = current > lv.max;
              return (
                <React.Fragment key={i}>
                  <div className={`flex flex-col items-center flex-shrink-0 ${isDone ? 'opacity-60' : ''}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                      isActive ? 'bg-primary/20 border-2 border-primary shadow-lg shadow-primary/30' :
                      isDone ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted border border-border'
                    }`}>
                      {lv.emoji}
                    </div>
                    <p className={`text-[9px] mt-1 font-bold text-center leading-tight ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {lang === 'ar' ? lv.ar : lv.en}
                    </p>
                    <p className="text-[8px] text-muted-foreground">{lv.min}-{lv.max === 999 ? '∞' : lv.max}</p>
                  </div>
                  {i < LEVEL_TITLES.length - 1 && (
                    <div className={`flex-1 h-0.5 min-w-3 ${isDone ? 'bg-green-500/50' : 'bg-muted'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Active Challenges */}
        {activeChallenges.length === 0 && !generating && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎯</div>
            <h3 className="font-bold mb-1">{lang === 'ar' ? 'لا تحديات نشطة' : 'No active challenges'}</h3>
            <p className="text-sm text-muted-foreground mb-4">{lang === 'ar' ? 'أنشئ تحديات جديدة وابدأ!' : 'Create new challenges and start!'}</p>
            <Button className="bg-primary rounded-2xl h-11 px-6 font-black shadow-lg shadow-primary/30" onClick={generateChallenges}>
              <Zap className="w-4 h-4 mr-2" /> {lang === 'ar' ? 'إنشاء تحديات' : 'Create Challenges'}
            </Button>
          </div>
        )}

        <AnimatePresence>
          {activeChallenges.map((ch, i) => {
            const Icon = typeIcons[ch.type] || Trophy;
            const colors = typeColors[ch.type] || typeColors.custom;
            const progress = ch.target_value > 0 ? Math.min((ch.current_value / ch.target_value) * 100, 100) : 0;
            const canClaim = progress >= 100;

            return (
              <motion.div
                key={ch.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`bg-gradient-to-br ${colors.bg} rounded-3xl p-5 border ${colors.border} relative overflow-hidden`}
              >
                {canClaim && (
                  <div className="absolute top-0 right-0 bg-yellow-400 text-black text-[9px] font-black px-3 py-1 rounded-bl-2xl">
                    ✨ {lang === 'ar' ? 'مكتمل!' : 'Done!'}
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-2xl ${colors.icon} flex items-center justify-center text-xl`}>
                    {ch.badge_icon || <Icon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black">{lang === 'ar' ? ch.title_ar : ch.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{lang === 'ar' ? ch.description_ar : ch.description}</p>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold">{ch.current_value.toLocaleString()} / {ch.target_value.toLocaleString()}</span>
                        <span className="text-primary font-black">+{ch.reward_xp} XP ⚡</span>
                      </div>
                      <div className="h-2.5 bg-background/50 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{progress.toFixed(0)}%</span>
                        <span className="text-[10px] text-muted-foreground">
                          {lang === 'ar' ? `ينتهي: ${ch.end_date}` : `Ends: ${ch.end_date}`}
                        </span>
                      </div>
                    </div>

                    {canClaim && (
                      <Button
                        size="sm"
                        className="mt-3 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-xl h-10 shadow-lg shadow-yellow-500/30"
                        onClick={() => claimReward(ch)}
                        disabled={claimingId === ch.id}
                      >
                        {claimingId === ch.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : '🎁'}
                        {lang === 'ar' ? `احصل على ${ch.reward_xp} نقطة!` : `Claim ${ch.reward_xp} XP!`}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Completed */}
        {completedChallenges.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-muted-foreground mb-3">🏆 {lang === 'ar' ? 'التحديات المكتملة' : 'Completed Challenges'}</h2>
            <div className="space-y-2">
              {completedChallenges.map(ch => (
                <div key={ch.id} className="bg-card rounded-2xl p-3 border border-green-500/20 flex items-center gap-3">
                  <span className="text-xl">{ch.badge_icon || '🏆'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{lang === 'ar' ? ch.title_ar : ch.title}</p>
                    <p className="text-[10px] text-green-400">+{ch.reward_xp} XP ✅</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
