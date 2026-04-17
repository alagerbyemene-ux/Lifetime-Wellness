import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/lib/LanguageContext';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { Footprints, Play, Square, Clock, Flame, Navigation, MapPin, Target, X } from 'lucide-react';
import { motion } from 'framer-motion';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function DestinationPicker({ onPick }) {
  useMapEvents({
    click(e) { onPick({ lat: e.latlng.lat, lng: e.latlng.lng }); }
  });
  return null;
}

function haversineDistance(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}

export default function Walking({ profile }) {
  const { lang } = useLanguage();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [mode, setMode] = useState(null); // null = choose, 'free' = free walk, 'destination' = pick dest
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(0);
  const [routePoints, setRoutePoints] = useState([]);
  const [currentPos, setCurrentPos] = useState(null);
  const [destination, setDestination] = useState(null);
  const [duration, setDuration] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [pickingDest, setPickingDest] = useState(false);

  const timerRef = useRef(null);
  const sessionIdRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const lastStepTimeRef = useRef(0);
  const prevMagnitudeRef = useRef(0);
  const stepBufferRef = useRef([]);

  const handleMotion = useCallback((event) => {
    if (!isTracking) return;
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
    stepBufferRef.current.push(mag);
    if (stepBufferRef.current.length > 5) stepBufferRef.current.shift();
    const smoothed = stepBufferRef.current.reduce((a, b) => a + b, 0) / stepBufferRef.current.length;
    const now = Date.now();
    const delta = smoothed - prevMagnitudeRef.current;
    prevMagnitudeRef.current = smoothed;
    if (delta > 2.2 && now - lastStepTimeRef.current > 280) {
      lastStepTimeRef.current = now;
      setSteps(s => s + 1);
    }
  }, [isTracking]);

  useEffect(() => {
    if (isTracking) window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [isTracking, handleMotion]);

  useEffect(() => {
    if (!navigator.geolocation) { setCurrentPos({ lat: 24.7136, lng: 46.6753 }); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setCurrentPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCurrentPos({ lat: 24.7136, lng: 46.6753 }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const createSessionMutation = useMutation({
    mutationFn: (data) => base44.entities.WalkSession.create(data),
    onSuccess: (res) => { sessionIdRef.current = res.id; },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WalkSession.update(id, data),
  });

  const updateDailyLogMutation = useMutation({
    mutationFn: async (data) => {
      const logs = await base44.entities.DailyLog.filter({ user_email: profile.user_email, date: today });
      if (logs.length > 0) return base44.entities.DailyLog.update(logs[0].id, data);
      return base44.entities.DailyLog.create({ user_email: profile.user_email, date: today, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] }),
  });

  const startWalking = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      const perm = await DeviceMotionEvent.requestPermission();
      if (perm !== 'granted') return;
    }
    setSteps(0); setRoutePoints([]); setDistanceKm(0); setDuration(0);
    lastStepTimeRef.current = 0; prevMagnitudeRef.current = 0; stepBufferRef.current = [];
    setIsTracking(true);
    setPickingDest(false);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date().toISOString() };
        setCurrentPos({ lat: p.lat, lng: p.lng });
        if (lastPosRef.current) {
          const dist = haversineDistance(lastPosRef.current, p);
          if (dist > 0.003) { setRoutePoints(prev => [...prev, p]); setDistanceKm(prev => prev + dist); lastPosRef.current = p; }
        } else { lastPosRef.current = p; setRoutePoints([p]); }
      },
      () => {}, { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );
    createSessionMutation.mutate({ user_email: profile.user_email, date: today, start_time: new Date().toISOString(), status: 'active' });
  };

  const stopWalking = () => {
    setIsTracking(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    const cals = Math.round(steps * 0.04);
    if (sessionIdRef.current) {
      updateSessionMutation.mutate({ id: sessionIdRef.current, data: { end_time: new Date().toISOString(), steps, distance_km: parseFloat(distanceKm.toFixed(3)), duration_minutes: Math.round(duration / 60), calories_burned: cals, route_points: routePoints.slice(-200), status: 'completed' } });
    }
    updateDailyLogMutation.mutate({ steps, distance_km: parseFloat(distanceKm.toFixed(3)), calories_burned: cals, active_minutes: Math.round(duration / 60) });
  };

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  const fmt = (secs) => `${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;

  const destToCurrentDist = destination && currentPos ? haversineDistance(currentPos, destination) : null;

  const destIcon = L.divIcon({ html: `<div style="background:#22c55e;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`, iconSize: [28,28], iconAnchor: [14,14], className: '' });
  const userIcon = L.divIcon({ html: `<div style="background:#4ade80;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(74,222,128,0.25);"></div>`, iconSize: [16,16], iconAnchor: [8,8], className: '' });

  // Mode selection screen
  if (!mode) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🚶</div>
          <h1 className="text-2xl font-black">{lang === 'ar' ? 'ابدأ المشي' : 'Start Walking'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{lang === 'ar' ? 'كيف تريد المشي اليوم؟' : 'How do you want to walk today?'}</p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setMode('free')}
            className="w-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-3xl p-6 text-start">
            <div className="text-3xl mb-2">🏃</div>
            <h3 className="text-base font-black">{lang === 'ar' ? 'مشي حر' : 'Free Walk'}</h3>
            <p className="text-xs text-muted-foreground mt-1">{lang === 'ar' ? 'امشِ أينما تريد — نتتبع مسارك تلقائياً' : 'Walk anywhere — we track your route automatically'}</p>
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => setMode('destination')}
            className="w-full bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-3xl p-6 text-start">
            <div className="text-3xl mb-2">🗺️</div>
            <h3 className="text-base font-black">{lang === 'ar' ? 'حدد وجهتك' : 'Set Destination'}</h3>
            <p className="text-xs text-muted-foreground mt-1">{lang === 'ar' ? 'اختر وجهة على الخريطة واحسب المسافة' : 'Pick a destination on the map and track distance'}</p>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 relative">
        {currentPos ? (
          <MapContainer center={[currentPos.lat, currentPos.lng]} zoom={16} className="h-full w-full" zoomControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
            {isTracking && <MapUpdater center={[currentPos.lat, currentPos.lng]} />}
            {pickingDest && <DestinationPicker onPick={(p) => { setDestination(p); setPickingDest(false); }} />}
            <Marker position={[currentPos.lat, currentPos.lng]} icon={userIcon} />
            {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
            {routePoints.length > 1 && (
              <Polyline positions={routePoints.map(p => [p.lat, p.lng])} color="hsl(160, 84%, 44%)" weight={5} opacity={0.9} />
            )}
          </MapContainer>
        ) : (
          <div className="h-full bg-muted flex items-center justify-center">
            <div className="text-center"><MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">{lang === 'ar' ? 'جارٍ تحميل الخريطة...' : 'Loading map...'}</p></div>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-start gap-2">
          <button onClick={() => { if (isTracking) stopWalking(); setMode(null); setDestination(null); }}
            className="w-9 h-9 rounded-2xl bg-card/90 backdrop-blur-xl border border-border flex items-center justify-center shadow-lg">
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1">
            {!isTracking && mode === 'destination' && !destination && (
              <div className="bg-card/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-border shadow-lg">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-accent" />
                  {lang === 'ar' ? 'اضغط على الخريطة لاختيار وجهتك' : 'Tap map to pick your destination'}
                </p>
              </div>
            )}
            {destination && !isTracking && (
              <div className="bg-card/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-primary/30 shadow-lg">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  ✅ {lang === 'ar' ? 'تم تحديد الوجهة' : 'Destination set'}
                  {destToCurrentDist && <span className="text-muted-foreground">— {destToCurrentDist.toFixed(2)} km</span>}
                </p>
              </div>
            )}
          </div>
          {/* Live steps overlay when tracking */}
          {isTracking && (
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
              className="bg-card/90 backdrop-blur-xl rounded-2xl px-4 py-2 border border-primary/30 shadow-lg">
              <p className="text-xl font-black text-primary">{steps}</p>
              <p className="text-[9px] text-muted-foreground text-center">{lang === 'ar' ? 'خطوة' : 'steps'}</p>
            </motion.div>
          )}
        </div>

        {/* Destination picker button */}
        {mode === 'destination' && !isTracking && (
          <button
            onClick={() => setPickingDest(!pickingDest)}
            className={`absolute bottom-4 right-4 z-10 px-4 py-2 rounded-2xl text-xs font-bold shadow-lg transition-all ${pickingDest ? 'bg-accent text-accent-foreground' : 'bg-card/90 backdrop-blur-xl border border-border'}`}>
            {pickingDest
              ? (lang === 'ar' ? '📍 انقر على الخريطة' : '📍 Click on map')
              : (lang === 'ar' ? '🗺️ تغيير الوجهة' : '🗺️ Change destination')}
          </button>
        )}
      </div>

      {/* Bottom Panel */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-card border-t border-border">
        <div className="grid grid-cols-4 gap-2 px-4 pt-4 pb-2">
          {[
            { icon: Footprints, label: lang === 'ar' ? 'خطوات' : 'Steps', value: steps, color: 'text-primary' },
            { icon: Navigation, label: lang === 'ar' ? 'مسافة' : 'Dist', value: `${distanceKm.toFixed(2)}km`, color: 'text-accent' },
            { icon: Clock, label: lang === 'ar' ? 'وقت' : 'Time', value: fmt(duration), color: 'text-yellow-400' },
            { icon: Flame, label: lang === 'ar' ? 'سعرات' : 'Cal', value: Math.round(steps * 0.04), color: 'text-orange-400' },
          ].map((s, i) => (
            <div key={i} className="text-center bg-muted rounded-2xl py-2.5">
              <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Destination distance bar */}
        {destination && isTracking && destToCurrentDist !== null && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-accent">{lang === 'ar' ? 'وجهتك' : 'To destination'}</span>
              <span className="font-bold">{destToCurrentDist.toFixed(2)} km</span>
            </div>
          </div>
        )}

        {isTracking && (
          <div className="px-4 py-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full"
                animate={{ width: `${Math.min((steps / (profile?.daily_step_goal || 5000)) * 100, 100)}%` }}
                transition={{ duration: 0.5 }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{Math.round((steps / (profile?.daily_step_goal || 5000)) * 100)}%</span>
          </div>
        )}

        <div className="px-4 pb-4">
          <Button
            className={`w-full h-14 text-lg font-black rounded-2xl shadow-lg transition-all ${isTracking ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-primary hover:bg-primary/90 shadow-primary/30'}`}
            onClick={isTracking ? stopWalking : startWalking}
            disabled={mode === 'destination' && !destination && !isTracking}
          >
            {isTracking ? (
              <><Square className="w-5 h-5 mr-2 fill-current" /> {lang === 'ar' ? 'إيقاف المشي' : 'Stop Walking'}</>
            ) : (
              <><Play className="w-5 h-5 mr-2 fill-current" /> {lang === 'ar' ? 'ابدأ المشي' : 'Start Walking'}</>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
