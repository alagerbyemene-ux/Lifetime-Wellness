import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useLanguage } from '@/lib/LanguageContext';

export default function WeeklyChart({ data }) {
  const { t } = useLanguage();

  const daysEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const daysAr = ['إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت', 'أحد'];

  const { lang } = useLanguage();
  const dayLabels = lang === 'ar' ? daysAr : daysEn;

  const chartData = dayLabels.map((day, i) => ({
    day,
    steps: data?.[i]?.steps || 0,
  }));

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <h3 className="text-sm font-semibold mb-3">{t('weeklyProgress')}</h3>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData}>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }}
          />
          <Bar dataKey="steps" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
