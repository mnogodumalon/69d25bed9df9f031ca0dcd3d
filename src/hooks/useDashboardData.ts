import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Speisekarte, Bestellungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [speisekarte, setSpeisekarte] = useState<Speisekarte[]>([]);
  const [bestellungen, setBestellungen] = useState<Bestellungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [speisekarteData, bestellungenData] = await Promise.all([
        LivingAppsService.getSpeisekarte(),
        LivingAppsService.getBestellungen(),
      ]);
      setSpeisekarte(speisekarteData);
      setBestellungen(bestellungenData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    async function silentRefresh() {
      try {
        const [speisekarteData, bestellungenData] = await Promise.all([
          LivingAppsService.getSpeisekarte(),
          LivingAppsService.getBestellungen(),
        ]);
        setSpeisekarte(speisekarteData);
        setBestellungen(bestellungenData);
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    window.addEventListener('dashboard-refresh', handleRefresh);
    return () => window.removeEventListener('dashboard-refresh', handleRefresh);
  }, []);

  const speisekarteMap = useMemo(() => {
    const m = new Map<string, Speisekarte>();
    speisekarte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [speisekarte]);

  return { speisekarte, setSpeisekarte, bestellungen, setBestellungen, loading, error, fetchAll, speisekarteMap };
}