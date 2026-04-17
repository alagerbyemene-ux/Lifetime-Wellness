import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { useLanguage } from '@/lib/LanguageContext';
import NotificationBell from '@/components/notifications/NotificationBell';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const { isRTL } = useLanguage();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className={`min-h-screen bg-background font-inter ${isRTL ? 'font-tajawal' : 'font-inter'}`}>
      {/* Global notification bell - fixed top right */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell user={user} />
      </div>
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
