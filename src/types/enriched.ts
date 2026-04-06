import type { Bestellungen } from './app';

export type EnrichedBestellungen = Bestellungen & {
  gerichtName: string;
};
