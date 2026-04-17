import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, Loader2, ChevronDown, ChevronUp, Sparkles, Flame, Dumbbell, Wheat, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const mealIcons = { breakfast: '🍳', lunch: '🍗', dinner: '🥗', snack: '🍎' };
const mealColors = {
  breakfast: 'from-orange-500/20 to-yellow-500/10 border-orange-500/20',
  lunch: 'from-green-500/20 to-emerald-500/10 border-green-500/20',
  dinner: 'from-blue-500/20 to-indigo-500/10 border-blue-500/20',
  snack: 'from-purple-500/20 to-pink-500/10 border-purple-500/20',
};

const MEAL_IMAGES = {
  breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&q=80',
  lunch: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80',
  dinner: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
  snack: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
};

export default function Meals({ profile }) {
  const { t, lang } = useLanguage();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [generating, setGenerating] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);

  const { data: mealPlans = [] } = useQuery({
    queryKey: ['meals', profile?.user_email, today],
    queryFn: () => base44.entities.MealPlan.filter({ user_email: profile?.user_email, date: today }),
    enabled: !!profile?.user_email,
  });

  const todayMeals = mealPlans[0];

  const generateMeals = async () => {
    setGenerating(true);
    const bmi = profile?.weight_kg && profile?.height_cm
      ? (profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1)
      : 22;

    const prompt = lang === 'ar'
      ? `أنشئ خطة وجبات صحية يومية مخصصة. المستخدم: عمره ${profile?.age} سنة، وزنه ${profile?.weight_kg} كيلو، طوله ${profile?.height_cm} سم، كتلة الجسم ${bmi}، هدفه ${profile?.goal}. 4 وجبات بتفاصيل كاملة. JSON: {"meals": [{"type": "breakfast", "name": "...", "name_ar": "...", "description": "...", "description_ar": "...", "calories": 350, "protein_g": 25, "carbs_g": 40, "fat_g": 12, "alternatives": [{"name": "...", "name_ar": "...", "calories": 300}]}], "total_calories": 1800, "daily_water_liters": 2.5}`
      : `Create a personalized healthy daily meal plan. User: ${profile?.age}y, ${profile?.weight_kg}kg, ${profile?.height_cm}cm, BMI ${bmi}, goal: ${profile?.goal}. 4 detailed meals. JSON: {"meals": [{"type": "breakfast", "name": "...", "name_ar": "...", "description": "...", "description_ar": "...", "calories": 350, "protein_g": 25, "carbs_g": 40, "fat_g": 12, "alternatives": [{"name": "...", "name_ar": "...", "calories": 300}]}], "total_calories": 1800, "daily_water_liters": 2.5}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          meals: { type: 'array', items: { type: 'object', properties: { type: { type: 'string' }, name: { type: 'string' }, name_ar: { type: 'string' }, description: { type: 'string' }, description_ar: { type: 'string' }, calories: { type: 'number' }, protein_g: { type: 'number' }, carbs_g: { type: 'number' }, fat_g: { type: 'number' }, alternatives: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, name_ar: { type: 'string' }, calories: { type: 'number' } } } } } } },
          total_calories: { type: 'number' },
          daily_water_liters: { type: 'number' },
        }
      }
    });

    const mealsWithImages = (res.meals || []).map(meal => ({
      ...meal,
      image_url: MEAL_IMAGES[meal.type] || MEAL_IMAGES.snack,
    }));

    if (todayMeals) {
      await base44.entities.MealPlan.update(todayMeals.id, { meals: mealsWithImages, total_calories: res.total_calories });
    } else {
      await base44.entities.MealPlan.create({
        user_email: profile.user_email,
        date: today,
        meals: mealsWithImages,
        total_calories: res.total_calories || 0,
        water_goal: Math.round((res.daily_water_liters || 2.5) * 4),
      });
    }
    queryClient.invalidateQueries({ queryKey: ['meals'] });
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500/20 via-background to-background px-4 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">{lang === 'ar' ? '🍽️ وجباتي' : '🍽️ My Meals'}</h1>
            <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <Button size="sm" className="bg-primary h-10 px-4 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={generateMeals} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {lang === 'ar' ? 'توليد' : 'Generate'}
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Summary Card */}
        {todayMeals?.total_calories > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-3xl p-5 border border-border">
            <div className="text-center mb-4">
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'إجمالي السعرات اليوم' : "Today's Total Calories"}</p>
              <p className="text-4xl font-black text-primary">{todayMeals.total_calories?.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('kcal')}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Flame, label: lang === 'ar' ? 'سعرات' : 'Calories', value: todayMeals.total_calories, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                { icon: Dumbbell, label: lang === 'ar' ? 'وجبات' : 'Meals', value: todayMeals.meals?.length || 0, color: 'text-primary', bg: 'bg-primary/10' },
                { icon: Droplets, label: lang === 'ar' ? 'هدف ماء' : 'Water Goal', value: `${todayMeals.water_goal || 8} 🥤`, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-3 text-center`}>
                  <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                  <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Meal Cards */}
        <AnimatePresence>
          {todayMeals?.meals?.map((meal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-gradient-to-br ${mealColors[meal.type] || mealColors.snack} rounded-3xl border overflow-hidden`}
            >
              <div className="relative h-40 overflow-hidden">
                <img src={meal.image_url || MEAL_IMAGES[meal.type]} alt={meal.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = MEAL_IMAGES.snack; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{mealIcons[meal.type]}</span>
                    <div>
                      <p className="text-xs text-white/70 font-medium">{lang === 'ar' ? (meal.type === 'breakfast' ? 'فطور' : meal.type === 'lunch' ? 'غداء' : meal.type === 'dinner' ? 'عشاء' : 'وجبة خفيفة') : meal.type}</p>
                      <h3 className="text-white font-black text-base leading-tight">{lang === 'ar' ? meal.name_ar : meal.name}</h3>
                    </div>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-xs font-bold">{meal.calories} {t('kcal')}</span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-foreground/80 mb-3">{lang === 'ar' ? meal.description_ar : meal.description}</p>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: lang === 'ar' ? 'بروتين' : 'Protein', value: `${meal.protein_g}g`, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                    { label: lang === 'ar' ? 'كربو' : 'Carbs', value: `${meal.carbs_g}g`, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
                    { label: lang === 'ar' ? 'دهون' : 'Fat', value: `${meal.fat_g}g`, color: 'text-orange-400', bg: 'bg-orange-400/10' },
                  ].map((m, j) => (
                    <div key={j} className={`${m.bg} rounded-2xl p-2 text-center`}>
                      <p className={`text-sm font-black ${m.color}`}>{m.value}</p>
                      <p className="text-[9px] text-muted-foreground">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Alternatives Toggle */}
                {meal.alternatives?.length > 0 && (
                  <>
                    <button onClick={() => setExpandedMeal(expandedMeal === i ? null : i)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground py-2">
                      <span>{lang === 'ar' ? '🔄 بدائل صحية' : '🔄 Healthy Alternatives'}</span>
                      {expandedMeal === i ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {expandedMeal === i && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                          {meal.alternatives.map((alt, j) => (
                            <div key={j} className="bg-background/50 rounded-xl px-3 py-2 flex justify-between items-center">
                              <span className="text-sm">{lang === 'ar' ? alt.name_ar : alt.name}</span>
                              <span className="text-xs text-muted-foreground font-bold">{alt.calories} {t('kcal')}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {!todayMeals?.meals?.length && !generating && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-lg font-bold mb-2">{lang === 'ar' ? 'لا توجد وجبات اليوم' : 'No meals for today'}</h3>
            <p className="text-sm text-muted-foreground mb-6">{lang === 'ar' ? 'اضغط لتوليد خطة وجبات مخصصة لك' : 'Tap to generate your personalized meal plan'}</p>
            <Button className="bg-primary h-12 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={generateMeals}>
              <Sparkles className="w-4 h-4 mr-2" /> {lang === 'ar' ? 'توليد خطة الوجبات' : 'Generate Meal Plan'}
            </Button>
          </div>
        )}

        {generating && (
          <div className="text-center py-12">
            <div className="flex justify-center gap-2 mb-4">
              {[0,1,2,3,4].map(i => <div key={i} className="w-3 h-3 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${i*0.1}s` }} />)}
            </div>
            <p className="text-sm text-muted-foreground">{lang === 'ar' ? 'جارٍ توليد خطة وجباتك المخصصة...' : 'Generating your personalized meal plan...'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
