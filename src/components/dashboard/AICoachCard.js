import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';

export default function AICoachCard({ profile, dailyLog }) {
  const { t, lang } = useLanguage();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const generateMessage = async () => {
    setLoading(true);
    const prompt = lang === 'ar'
      ? `أنت مدرب صحي ذكي. المستخدم عمره ${profile?.age || 25} سنة، وزنه ${profile?.weight_kg || 70} كيلو، هدفه ${profile?.goal || 'improve_fitness'}. اليوم مشى ${dailyLog?.steps || 0} خطوة وحرق ${dailyLog?.calories_burned || 0} سعرة. مزاجه: ${dailyLog?.mood || 'غير محدد'}. أعطه رسالة تحفيزية قصيرة (جملتين فقط) باللغة العربية.`
      : `You are an AI health coach. User is ${profile?.age || 25} years old, weighs ${profile?.weight_kg || 70}kg, goal is ${profile?.goal || 'improve_fitness'}. Today walked ${dailyLog?.steps || 0} steps, burned ${dailyLog?.calories_burned || 0} calories. Mood: ${dailyLog?.mood || 'not set'}. Give a short motivational message (2 sentences max).`;

    const res = await base44.integrations.Core.InvokeLLM({ prompt });
    setMessage(res);
    setLoading(false);
  };

  useEffect(() => {
    if (profile) generateMessage();
  }, [profile?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gradient-to-br from-primary/20 to-accent/10 rounded-2xl p-4 border border-primary/20"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">{t('aiCoach')}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={generateMessage} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed">
        {loading ? '...' : message || t('noData')}
      </p>
    </motion.div>
  );
}
