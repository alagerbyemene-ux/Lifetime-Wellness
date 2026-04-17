import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Heart, Target, ChevronLeft, ChevronRight, Globe } from 'lucide-react';

const steps = ['welcome', 'personal', 'goals', 'activity'];

export default function Onboarding({ user, onComplete }) {
  const { t, lang, setLang, isRTL } = useLanguage();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    full_name: user?.full_name || '',
    age: '',
    height_cm: '',
    weight_kg: '',
    gender: 'male',
    goal: 'improve_fitness',
    activity_level: 'moderate',
    daily_step_goal: 5000,
    language: lang,
  });

  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const NextIcon = isRTL ? ChevronLeft : ChevronRight;
  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;

  const renderStep = () => {
    switch (steps[step]) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
              <Activity className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">{t('welcome')}</h1>
            <p className="text-muted-foreground">{t('onboardingDesc')}</p>
            <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
              <button
                onClick={() => { setLang('en'); update('language', 'en'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                English
              </button>
              <button
                onClick={() => { setLang('ar'); update('language', 'ar'); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${lang === 'ar' ? 'bg-primary text-primary-foreground' : ''}`}
              >
                العربية
              </button>
            </div>
          </div>
        );
      case 'personal':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">{lang === 'ar' ? 'معلوماتك الشخصية' : 'Personal Info'}</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>{t('age')}</Label>
                <Input type="number" value={data.age} onChange={e => update('age', e.target.value)} placeholder="25" className="bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t('height')} (cm)</Label>
                  <Input type="number" value={data.height_cm} onChange={e => update('height_cm', e.target.value)} placeholder="170" className="bg-muted" />
                </div>
                <div>
                  <Label>{t('weight')} (kg)</Label>
                  <Input type="number" value={data.weight_kg} onChange={e => update('weight_kg', e.target.value)} placeholder="70" className="bg-muted" />
                </div>
              </div>
              <div>
                <Label>{t('gender')}</Label>
                <Select value={data.gender} onValueChange={v => update('gender', v)}>
                  <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t('male')}</SelectItem>
                    <SelectItem value="female">{t('female')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 'goals':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">{t('goal')}</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['lose_weight', 'build_muscle', 'improve_fitness', 'maintain_health'].map(g => (
                <button
                  key={g}
                  onClick={() => update('goal', g)}
                  className={`p-4 rounded-xl border text-sm font-medium transition-all ${
                    data.goal === g ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted'
                  }`}
                >
                  {g === 'lose_weight' && '🏃'}
                  {g === 'build_muscle' && '💪'}
                  {g === 'improve_fitness' && '🎯'}
                  {g === 'maintain_health' && '❤️'}
                  <br />
                  {t(g === 'lose_weight' ? 'loseWeight' : g === 'build_muscle' ? 'buildMuscle' : g === 'improve_fitness' ? 'improveFitness' : 'maintainHealth')}
                </button>
              ))}
            </div>
          </div>
        );
      case 'activity':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold">{t('activityLevel')}</h2>
            </div>
            <div className="space-y-2">
              {['sedentary', 'light', 'moderate', 'active', 'very_active'].map(a => (
                <button
                  key={a}
                  onClick={() => update('activity_level', a)}
                  className={`w-full p-3 rounded-xl border text-sm font-medium transition-all text-start ${
                    data.activity_level === a ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted'
                  }`}
                >
                  {t(a === 'very_active' ? 'veryActive' : a === 'active' ? 'activeLevel' : a)}
                </button>
              ))}
            </div>
            <div>
              <Label>{t('stepGoal')}</Label>
              <Input type="number" value={data.daily_step_goal} onChange={e => update('daily_step_goal', parseInt(e.target.value) || 5000)} className="bg-muted" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
          className="flex-1"
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep(s => s - 1)}>
            <PrevIcon className="w-4 h-4" />
          </Button>
        )}
        <Button
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={() => {
            if (step < steps.length - 1) {
              setStep(s => s + 1);
            } else {
              onComplete({
                ...data,
                age: parseInt(data.age) || 25,
                height_cm: parseInt(data.height_cm) || 170,
                weight_kg: parseInt(data.weight_kg) || 70,
                daily_step_goal: parseInt(data.daily_step_goal) || 5000,
                onboarding_done: true,
                user_email: user.email,
              });
            }
          }}
        >
          {step < steps.length - 1 ? t('next') : t('getStarted')}
          {step < steps.length - 1 && <NextIcon className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
