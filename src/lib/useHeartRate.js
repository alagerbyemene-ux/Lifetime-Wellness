import { useState, useCallback, useRef } from 'react';

// Web Bluetooth API for heart rate monitors (any BLE heart rate device)
export function useHeartRate() {
  const [heartRate, setHeartRate] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState(null);
  const characteristicRef = useRef(null);
  const deviceRef = useRef(null);

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const handleHeartRateChange = useCallback((event) => {
    const value = event.target.value;
    const flags = value.getUint8(0);
    let hr;
    if (flags & 0x01) {
      hr = value.getUint16(1, true);
    } else {
      hr = value.getUint8(1);
    }
    setHeartRate(hr);
  }, []);

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth not supported on this device');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'Heart Rate Monitor');

      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setHeartRate(0);
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      
      characteristicRef.current = characteristic;
      
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleHeartRateChange);
      
      setIsConnected(true);
      setIsSearching(false);
    } catch (err) {
      setIsSearching(false);
      if (err.name !== 'NotFoundError') {
        setError(err.message);
      }
    }
  }, [isSupported, handleHeartRateChange]);

  const disconnect = useCallback(async () => {
    if (characteristicRef.current) {
      try {
        await characteristicRef.current.stopNotifications();
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleHeartRateChange);
      } catch (e) {}
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setIsConnected(false);
    setHeartRate(0);
    setDeviceName('');
  }, [handleHeartRateChange]);

  return { heartRate, isConnected, isSearching, deviceName, error, isSupported, connect, disconnect };
}
