// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Speisekarte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    bezeichnung?: string;
    beschreibung?: string;
    preis?: number;
    besondere_angaben?: string;
  };
}

export interface Bestellungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name_bestellender?: string;
    gericht?: string; // applookup -> URL zu 'Speisekarte' Record
    vorspeise?: LookupValue;
    besondere_hinweise?: string;
    bezahlung?: LookupValue;
    bezahlt?: LookupValue;
  };
}

export const APP_IDS = {
  SPEISEKARTE: '69d25bddc5789f7ef4bc8229',
  BESTELLUNGEN: '69d25be01d8ecf5e2ed286c8',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'bestellungen': {
    vorspeise: [{ key: "fruehlingsrollen", label: "Frühlingsrollen" }, { key: "suppe", label: "Suppe" }, { key: "suesssauer", label: "Süßsauer" }, { key: "suppe_kokosmilch", label: "Suppe Kokosmilch" }],
    bezahlung: [{ key: "keine_angabe", label: "Keine Angabe" }, { key: "paypal", label: "PayPal" }, { key: "bar", label: "Bar" }, { key: "kostenlos", label: "Kostenlos" }],
    bezahlt: [{ key: "keine_angabe", label: "Keine Angabe" }, { key: "ja", label: "Ja" }, { key: "nein", label: "Nein" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'speisekarte': {
    'bezeichnung': 'string/text',
    'beschreibung': 'string/text',
    'preis': 'number',
    'besondere_angaben': 'string/text',
  },
  'bestellungen': {
    'name_bestellender': 'string/text',
    'gericht': 'applookup/select',
    'vorspeise': 'lookup/select',
    'besondere_hinweise': 'string/text',
    'bezahlung': 'lookup/select',
    'bezahlt': 'lookup/select',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateSpeisekarte = StripLookup<Speisekarte['fields']>;
export type CreateBestellungen = StripLookup<Bestellungen['fields']>;