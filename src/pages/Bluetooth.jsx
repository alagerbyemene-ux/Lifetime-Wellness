import React, { useState } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';
import { Bluetooth, Heart, Watch, Loader2, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BluetoothPage() {
  const { lang } = useLanguage();

  // Main HR device
  const [hrConnected, setHrConnected] = useState(false);
  const [hrSearching, setHrSearching] = useState(false);
  const [hrDeviceName, setHrDeviceName] = useState('');
  const [heartRate, setHeartRate] = useState(null);
  const [hrError, setHrError] = useState('');
  const [hrDevice, setHrDevice] = useState(null);
  const [hrCharRef, setHrCharRef] = useState(null);

  // Scan all nearby devices
  const [scanning, setScanning] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [scanError, setScanError] = useState('');

  const isSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

  const parseHeartRate = (value) => {
    const flags = value.getUint8(0);
    return (flags & 0x01) ? value.getUint16(1, true) : value.getUint8(1);
  };

  const connectHeartRate = async () => {
    setHrError('');
    setHrSearching(true);
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }],
      optionalServices: ['heart_rate', 'battery_service', 'device_information'],
    });
    setHrDeviceName(device.name || lang === 'ar' ? 'جهاز غير معروف' : 'Unknown device');
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('heart_rate');
    const char = await service.getCharacteristic('heart_rate_measurement');
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', (e) => {
      setHeartRate(parseHeartRate(e.target.value));
    });
    setHrDevice(device);
    setHrCharRef(char);
    setHrConnected(true);
    setHrSearching(false);
    device.addEventListener('gattserverdisconnected', () => {
      setHrConnected(false);
      setHeartRate(null);
    });
  };

  const disconnectHR = async () => {
    if (hrCharRef) {
      hrCharRef.removeEventListener('characteristicvaluechanged', () => {});
      await hrCharRef.stopNotifications().catch(() => {});
    }
    hrDevice?.gatt?.disconnect();
    setHrConnected(false);
    setHeartRate(null);
    setHrDeviceName('');
    setHrDevice(null);
  };

  const handleConnectHR = async () => {
    if (hrConnected) { disconnectHR(); return; }
    setHrSearching(true);
    setHrError('');
    try {
      await connectHeartRate();
    } catch (e) {
      setHrError(e.message || (lang === 'ar' ? 'فشل الاتصال' : 'Connection failed'));
    } finally {
      setHrSearching(false);
    }
  };

  // Scan ALL nearby BT devices
  const scanAllDevices = async () => {
    setScanError('');
    setScanning(true);
    setNearbyDevices([]);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'battery_service', 'device_information', 'generic_access'],
      });
      const newDev = { name: device.name || (lang === 'ar' ? 'جهاز مجهول' : 'Unknown Device'), id: device.id };
      setNearbyDevices(prev => {
        const exists = prev.find(d => d.id === newDev.id);
        return exists ? prev : [...prev, newDev];
      });
    } catch (e) {
      if (!e.message?.includes('cancelled')) {
        setScanError(lang === 'ar' ? 'لم يتم العثور على أجهزة' : 'No device found');
      }
    }
    setScanning(false);
  };

  const hrZone = heartRate
    ? heartRate < 60 ? { label: lang === 'ar' ? 'راحة' : 'Rest', color: 'text-blue-400', bg: 'bg-blue-400/20' }
    : heartRate < 100 ? { label: lang === 'ar' ? 'طبيعي' : 'Normal', color: 'text-green-400', bg: 'bg-green-400/20' }
    : heartRate < 140 ? { label: lang === 'ar' ? 'نشاط خفيف' : 'Light', color: 'text-yellow-400', bg: 'bg-yellow-400/20' }
    : heartRate < 170 ? { label: lang === 'ar' ? 'نشاط قوي' : 'Cardio', color: 'text-orange-400', bg: 'bg-orange-400/20' }
    : { label: lang === 'ar' ? 'أقصى جهد' : 'Max', color: 'text-red-400', bg: 'bg-red-400/20' }
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500/20 via-background to-background px-4 pt-12 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <Bluetooth className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-black">{lang === 'ar' ? '📡 الأجهزة والساعات' : '📡 Devices & Watches'}</h1>
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'ربط أي جهاز بلوتوث' : 'Connect any Bluetooth device'}</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Heart Rate Monitor Card */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden">
          <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 px-4 py-3 border-b border-border">
            <h2 className="text-sm font-black flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              {lang === 'ar' ? 'قياس نبض القلب' : 'Heart Rate Monitor'}
            </h2>
            <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'اربط ساعتك الذكية مباشرة' : 'Connect your smartwatch directly'}</p>
          </div>

          <div className="p-5 text-center">
            {/* Animated Heart */}
            <div className="relative inline-block mb-4">
              <motion.div
                animate={hrConnected ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
                className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center ${hrConnected ? 'bg-red-500/20' : 'bg-muted'}`}
              >
                {hrConnected ? (
                  <Heart className="w-14 h-14 text-red-400 fill-current" />
                ) : (
                  <Watch className="w-14 h-14 text-muted-foreground" />
                )}
              </motion.div>
              {hrConnected && (
                <motion.div
                  animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full border-4 border-red-400/30"
                />
              )}
            </div>

            {hrConnected && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-xs text-green-400 font-bold mb-1">✅ {hrDeviceName}</p>
                <div className="text-6xl font-black text-red-400 mb-1">{heartRate || '--'}</div>
                <p className="text-sm text-muted-foreground mb-2">{lang === 'ar' ? 'نبضة/دقيقة' : 'BPM'}</p>
                {hrZone && (
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${hrZone.bg} ${hrZone.color}`}>
                    {hrZone.label}
                  </span>
                )}
                {/* Live graph simulation */}
                <div className="flex gap-0.5 items-end h-8 justify-center mt-3">
                  {[4,7,5,9,6,8,5,7,4,8,6,9,5].map((h, i) => (
                    <motion.div key={i} className="w-1.5 bg-red-400/70 rounded-full"
                      animate={{ height: [`${h*3}px`, `${h*5}px`, `${h*3}px`] }}
                      transition={{ delay: i * 0.06, repeat: Infinity, duration: 0.8 }} />
                  ))}
                </div>
              </motion.div>
            )}

            {!hrConnected && !hrSearching && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {lang === 'ar' ? 'اضغط للبحث عن ساعتك الذكية' : 'Press to find your smartwatch'}
                </p>
              </div>
            )}

            {hrSearching && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-primary">{lang === 'ar' ? 'جارٍ البحث...' : 'Searching...'}</span>
              </div>
            )}

            {hrError && <p className="text-xs text-destructive mb-3">{hrError}</p>}

            {!isSupported && (
              <p className="text-xs text-destructive mb-3 bg-destructive/10 rounded-xl p-2">
                {lang === 'ar' ? '⚠️ استخدم Chrome على Android لدعم البلوتوث' : '⚠️ Use Chrome on Android for Bluetooth support'}
              </p>
            )}

            <Button
              className={`w-full h-12 rounded-2xl font-black shadow-lg transition-all ${
                hrConnected ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-primary hover:bg-primary/90 shadow-primary/30'
              }`}
              onClick={handleConnectHR}
              disabled={hrSearching || !isSupported}
            >
              {hrSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bluetooth className="w-4 h-4 mr-2" />}
              {hrConnected ? (lang === 'ar' ? 'قطع الاتصال' : 'Disconnect') : (lang === 'ar' ? 'ربط الساعة / HR Monitor' : 'Connect Watch / HR Monitor')}
            </Button>
          </div>
        </div>

        {/* Scan All Nearby Devices */}
        <div className="bg-card rounded-3xl p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-black">{lang === 'ar' ? '🔍 البحث عن أجهزة قريبة' : '🔍 Scan Nearby Devices'}</h3>
              <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'أي جهاز بلوتوث بجانبك' : 'Any Bluetooth device nearby'}</p>
            </div>
            <Button size="sm" variant="outline" onClick={scanAllDevices} disabled={scanning || !isSupported}
              className="rounded-2xl h-9 font-bold">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              {lang === 'ar' ? 'بحث' : 'Scan'}
            </Button>
          </div>

          {scanError && <p className="text-xs text-muted-foreground mb-2">{scanError}</p>}

          <AnimatePresence>
            {nearbyDevices.length > 0 && (
              <div className="space-y-2">
                {nearbyDevices.map((d, i) => (
                  <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 bg-muted rounded-2xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <Bluetooth className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground">{lang === 'ar' ? 'في النطاق' : 'In range'}</p>
                    </div>
                    <Zap className="w-3 h-3 text-green-400 ml-auto" />
                  </motion.div>
                ))}
              </div>
            )}
            {nearbyDevices.length === 0 && !scanning && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'اضغط بحث للعثور على الأجهزة المجاورة' : 'Press Scan to find nearby devices'}</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Supported Devices */}
        <div className="bg-card rounded-3xl p-4 border border-border">
          <h3 className="text-sm font-black mb-3">{lang === 'ar' ? '✅ الأجهزة المدعومة' : '✅ Supported Devices'}</h3>
          <div className="grid grid-cols-2 gap-2">
            {['Apple Watch', 'Samsung Galaxy Watch', 'Garmin', 'Fitbit', 'Xiaomi Mi Band', 'Polar HR', 'Chest Strap HR', 'Any BLE Device'].map((d, i) => (
              <div key={i} className="bg-muted rounded-xl px-3 py-2 flex items-center gap-2">
                <Watch className="w-3 h-3 text-accent flex-shrink-0" />
                <span className="text-xs">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
