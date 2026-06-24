/**
 * Mock fleet of MBG/SPPG kitchens — UI illusion only (no backend).
 * The pilot is the single live kitchen; the rest are "enrolled but not yet
 * provisioned", which doubles as the real pilot→national rollout story.
 * The pilot label matches the finance scenarios' `kitchen` for consistency.
 */

export interface FleetKitchen {
  id: string;
  label: string;
  province: string;
  status: 'live' | 'locked';
  pilot?: boolean;
}

export const PILOT_KITCHEN_ID = 'gamping-yogyakarta';

export const FLEET_KITCHENS: FleetKitchen[] = [
  {
    id: PILOT_KITCHEN_ID,
    label: 'Dapur SPPG Gamping · Yogyakarta',
    province: 'DI Yogyakarta',
    status: 'live',
    pilot: true,
  },
  {
    id: 'bandung-04',
    label: 'SPPG 04 — Bandung',
    province: 'Jawa Barat',
    status: 'locked',
  },
  {
    id: 'surabaya-11',
    label: 'SPPG 11 — Surabaya',
    province: 'Jawa Timur',
    status: 'locked',
  },
  {
    id: 'medan-02',
    label: 'SPPG 02 — Medan',
    province: 'Sumatera Utara',
    status: 'locked',
  },
  {
    id: 'makassar-07',
    label: 'SPPG 07 — Makassar',
    province: 'Sulawesi Selatan',
    status: 'locked',
  },
  {
    id: 'semarang-06',
    label: 'SPPG 06 — Semarang',
    province: 'Jawa Tengah',
    status: 'locked',
  },
  {
    id: 'denpasar-03',
    label: 'SPPG 03 — Denpasar',
    province: 'Bali',
    status: 'locked',
  },
  {
    id: 'yogyakarta-sleman',
    label: 'SPPG Sleman — Yogyakarta',
    province: 'DI Yogyakarta',
    status: 'locked',
  },
  {
    id: 'padang-05',
    label: 'SPPG 05 — Padang',
    province: 'Sumatera Barat',
    status: 'locked',
  },
  {
    id: 'pontianak-08',
    label: 'SPPG 08 — Pontianak',
    province: 'Kalimantan Barat',
    status: 'locked',
  },
  {
    id: 'banjarmasin-10',
    label: 'SPPG 10 — Banjarmasin',
    province: 'Kalimantan Selatan',
    status: 'locked',
  },
  {
    id: 'manado-12',
    label: 'SPPG 12 — Manado',
    province: 'Sulawesi Utara',
    status: 'locked',
  },
  {
    id: 'kupang-13',
    label: 'SPPG 13 — Kupang',
    province: 'Nusa Tenggara Timur',
    status: 'locked',
  },
  {
    id: 'ambon-14',
    label: 'SPPG 14 — Ambon',
    province: 'Maluku',
    status: 'locked',
  },
  {
    id: 'palembang-15',
    label: 'SPPG 15 — Palembang',
    province: 'Sumatera Selatan',
    status: 'locked',
  },
  {
    id: 'jayapura-18',
    label: 'SPPG 18 — Jayapura',
    province: 'Papua',
    status: 'locked',
  },
];

export const FLEET_STATS = {
  registered: 277,
  provinces: 38,
  live: 1,
};

export function pilotKitchen(): FleetKitchen {
  return (
    FLEET_KITCHENS.find((k) => k.id === PILOT_KITCHEN_ID) ?? FLEET_KITCHENS[0]!
  );
}
