'use client';
import { useCallback, useEffect, useState } from 'react';
import { learningDay } from '@/lib/forest/daily-learning';

export function useLearningDay() {
  const [day, setDay] = useState<string | null>(null);
  const sync = useCallback(() => setDay(learningDay(new Date().toISOString())), []);
  useEffect(() => {
    sync();
    const timer = window.setInterval(sync, 30000);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [sync]);
  return [day, sync] as const;
}
