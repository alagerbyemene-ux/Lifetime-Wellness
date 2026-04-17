import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { Brain, RefreshCw, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HealthPredictionCard({ profile, todayLog, logs }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const analyze = async () => {
    setLoading(true);
    const avgSleep = logs.length ? (logs.reduce((s, l) => s + (l.sleep_hours || 0), 0) / logs.length).toFixed(1) : 0;
    const avgSteps = logs.length ? Math.round(logs.reduce((s, l) => s + (l.steps || 0), 0) / logs.length) : 0;

    const prompt = lang === 'ar'
      ? `أنت محرك توقع صحي. المستخدم عمره ${profile?.age} سنة، وزنه ${profile?.weight_kg} كيلو. متوسط نومه: ${avgSleep} ساعة، متوسط خطواته: ${avgSteps}، مزاجه اليوم: ${todayLog?.mood || 'غير محدد'}. أعطني تحليلاً صحياً مختصراً وتوقع لغد بـ JSON: {"energy_level": "high/medium/low", "risk": "عبارة قصيرة عن مخاطر غداً", "advice": "نصيحة عملية واحدة", "tomorrow_prediction": "توقع غداً في جملة واحدة"}`
      : `You are a health prediction engine. User: ${profile?.age}y, ${profile?.weight_kg}kg. Avg sleep: ${avgSleep}h, avg steps: ${avgSteps}, today mood: ${todayLog?.mood || 'unknown'}. Give health analysis JSON: {"energy_level": "high/medium/low", "risk": "short risk description for tomorrow", "advice": "one practical advice", "tomorrow_prediction": "tomorrow prediction in one sentence"}`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          energy_level: { type: 'string' },
          risk: { type: 'string' },
          advice: { type: 'string' },
          tomorrow_prediction: { type: 'string' },
        }
      }
    });
    setPrediction(res);
    setLoading(false);
  };

  const energyColor = prediction?.energy_level === 'high' ? 'text-green-400' : prediction?.energy_level === 'medium' ? 'text-yellow-400' : 'text-red-400';
  const EnergyIcon = prediction?.energy_level === 'high' ? TrendingUp : prediction?.energy_level === 'low' ? TrendingDown : Minus;

  return (
    <div className="bg-card rounded-3xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{lang === 'ar' ? 'محرك التوقع الصحي' : 'Health Prediction Engine'}</h3>
            <p className="text-[10px] text-muted-foreground">AI-powered</p>
          </div>
        </div>
        <button onClick={analyze} disabled={loading}
          className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
          <RefreshCw className={`w-4 h-4 text-purple-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!prediction && !loading && (
        <button onClick={analyze}
          className="w-full py-3 bg-purple-500/10 border border-dashed border-purple-500/30 rounded-2xl text-sm text-purple-400 font-medium">
          {lang === 'ar' ? '🧠 تحليل صحتك الآن' : '🧠 Analyze My Health Now'}
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center py-4 gap-2">
          <div className="flex gap-1">
            {[0,1,2,3].map(i => <div key={i} className="w-2 h-2 bg-purple-400/50 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
          </div>
          <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'جارٍ التحليل...' : 'Analyzing...'}</p>
        </div>
      )}

      {prediction && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center gap-3 bg-muted rounded-2xl p-3">
            <EnergyIcon className={`w-5 h-5 ${energyColor}`} />
            <div>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مستوى الطاقة' : 'Energy Level'}</p>
              <p className={`text-sm font-bold ${energyColor}`}>{prediction.energy_level?.toUpperCase()}</p>
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3">
            <p className="text-[10px] text-yellow-400 font-semibold mb-1">⚠️ {lang === 'ar' ? 'توقع غداً' : "Tomorrow's Prediction"}</p>
            <p className="text-xs text-foreground/80">{prediction.tomorrow_prediction}</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3">
            <p className="text-[10px] text-green-400 font-semibold mb-1">💡 {lang === 'ar' ? 'نصيحة اليوم' : 'Today\'s Advice'}</p>
            <p className="text-xs text-foreground/80">{prediction.advice}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
