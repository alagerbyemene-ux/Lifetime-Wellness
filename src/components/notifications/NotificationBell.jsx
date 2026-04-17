import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { Bell, X, Plus, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ADMIN_EMAIL = 'njdj9985@gmail.com';

export default function NotificationBell({ user }) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [form, setForm] = useState({ title: '', title_ar: '', body: '', body_ar: '', emoji: '🔔', type: 'info' });
  const [sending, setSending] = useState(false);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.AppNotification.list('-created_date', 30),
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.read_by?.includes(user?.email));

  const markReadMutation = useMutation({
    mutationFn: (n) => base44.entities.AppNotification.update(n.id, {
      read_by: [...(n.read_by || []), user?.email],
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const sendNotification = async () => {
    if (!form.title || !form.body) return;
    setSending(true);
    await base44.entities.AppNotification.create({
      ...form,
      sent_by: user?.email,
      read_by: [],
    });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setForm({ title: '', title_ar: '', body: '', body_ar: '', emoji: '🔔', type: 'info' });
    setShowSend(false);
    setSending(false);
  };

  const typeColors = {
    info: 'border-blue-500/20 bg-blue-500/5',
    challenge: 'border-primary/20 bg-primary/5',
    reward: 'border-yellow-500/20 bg-yellow-500/5',
    system: 'border-purple-500/20 bg-purple-500/5',
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
        <Bell className="w-5 h-5 text-foreground" />
        {unread.length > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-[9px] text-white font-black">{unread.length > 9 ? '9+' : unread.length}</span>
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-12 right-0 w-80 z-50 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black">{lang === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
                  {unread.length > 0 && (
                    <span className="bg-red-500/20 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded-full">{unread.length}</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {isAdmin && (
                    <button onClick={() => setShowSend(!showSend)}
                      className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-primary" />
                    </button>
                  )}
                  <button onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Admin Send Form */}
              {isAdmin && showSend && (
                <div className="px-4 py-3 border-b border-border bg-primary/5 space-y-2">
                  <p className="text-xs font-black text-primary">📢 {lang === 'ar' ? 'إرسال إشعار للجميع' : 'Send to Everyone'}</p>
                  <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Title (EN)" className="w-full bg-muted rounded-xl px-3 py-1.5 text-xs outline-none" />
                  <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })}
                    placeholder="العنوان (AR)" className="w-full bg-muted rounded-xl px-3 py-1.5 text-xs outline-none" />
                  <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })}
                    placeholder="Message (EN)" rows={2} className="w-full bg-muted rounded-xl px-3 py-1.5 text-xs outline-none resize-none" />
                  <textarea value={form.body_ar} onChange={e => setForm({ ...form, body_ar: e.target.value })}
                    placeholder="الرسالة (AR)" rows={2} className="w-full bg-muted rounded-xl px-3 py-1.5 text-xs outline-none resize-none" />
                  <div className="flex gap-2">
                    <input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })}
                      placeholder="Emoji" className="w-16 bg-muted rounded-xl px-2 py-1.5 text-xs outline-none text-center" />
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                      className="flex-1 bg-muted rounded-xl px-2 py-1.5 text-xs outline-none">
                      <option value="info">Info</option>
                      <option value="challenge">Challenge</option>
                      <option value="reward">Reward</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <button onClick={sendNotification} disabled={sending || !form.title || !form.body}
                    className="w-full h-9 bg-primary rounded-xl text-xs font-black text-primary-foreground flex items-center justify-center gap-1 disabled:opacity-40">
                    {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    {lang === 'ar' ? 'إرسال للجميع' : 'Send to Everyone'}
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications yet'}</p>
                  </div>
                )}
                {notifications.map(n => {
                  const isUnread = !n.read_by?.includes(user?.email);
                  return (
                    <div key={n.id}
                      onClick={() => isUnread && markReadMutation.mutate(n)}
                      className={`px-4 py-3 border-b border-border cursor-pointer transition-all hover:bg-muted/50 ${isUnread ? 'bg-primary/5' : 'opacity-70'} ${typeColors[n.type] || ''}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xl flex-shrink-0">{n.emoji || '🔔'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-black truncate">{lang === 'ar' && n.title_ar ? n.title_ar : n.title}</p>
                            {isUnread && <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                            {lang === 'ar' && n.body_ar ? n.body_ar : n.body}
                          </p>
                          <p className="text-[9px] text-muted-foreground/60 mt-1">
                            {new Date(n.created_date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
