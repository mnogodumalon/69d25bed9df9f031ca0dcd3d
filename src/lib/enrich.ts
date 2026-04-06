import type { EnrichedBestellungen } from '@/types/enriched';
import type { Bestellungen, Speisekarte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface BestellungenMaps {
  speisekarteMap: Map<string, Speisekarte>;
}

export function enrichBestellungen(
  bestellungen: Bestellungen[],
  maps: BestellungenMaps
): EnrichedBestellungen[] {
  return bestellungen.map(r => ({
    ...r,
    gerichtName: resolveDisplay(r.fields.gericht, maps.speisekarteMap, 'bezeichnung'),
  }));
}
