import { useState, useEffect, useRef, useCallback } from 'react';

// Real step counter using DeviceMotion API
export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const lastStepTimeRef = useRef(0);
  const magnitudeHistoryRef = useRef([]);
  const stepsRef = useRef(0);

  const STEP_THRESHOLD = 1.2;
  const MIN_STEP_INTERVAL = 280; // ms between steps
  const SMOOTHING_WINDOW = 4;

  const handleMotion = useCallback((event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null) return;

    const { x, y, z } = acc;
    const last = lastAccelRef.current;
    
    // Calculate magnitude of acceleration change
    const deltaX = x - last.x;
    const deltaY = y - last.y;
    const deltaZ = z - last.z;
    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);
    
    lastAccelRef.current = { x, y, z };

    // Smoothing
    const history = magnitudeHistoryRef.current;
    history.push(magnitude);
    if (history.length > SMOOTHING_WINDOW) history.shift();
    
    const avgMag = history.reduce((a, b) => a + b, 0) / history.length;

    const now = Date.now();
    if (avgMag > STEP_THRESHOLD && (now - lastStepTimeRef.current) > MIN_STEP_INTERVAL) {
      lastStepTimeRef.current = now;
      stepsRef.current += 1;
      setSteps(stepsRef.current);
    }
  }, []);

  const startCounting = useCallback(async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setIsSupported(false);
      return;
    }

    // Request permission on iOS
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      const permission = await DeviceMotionEvent.requestPermission();
      if (permission !== 'granted') {
        setIsSupported(false);
        return;
      }
    }

    stepsRef.current = 0;
    setSteps(0);
    lastStepTimeRef.current = 0;
    magnitudeHistoryRef.current = [];
    lastAccelRef.current = { x: 0, y: 0, z: 0 };
    
    window.addEventListener('devicemotion', handleMotion);
    setIsActive(true);
  }, [handleMotion]);

  const stopCounting = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsActive(false);
  }, [handleMotion]);

  const resetSteps = useCallback(() => {
    stepsRef.current = 0;
    setSteps(0);
  }, []);

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return { steps, isActive, isSupported, startCounting, stopCounting, resetSteps };
}
