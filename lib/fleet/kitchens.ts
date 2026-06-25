/**
 * SSOT for live MBG kitchens.
 * Only real, live kitchens are listed here.
 */

export interface FleetKitchen {
  id: string;
  label: string;
  location: string;
  province: string;
  status: 'live' | 'locked';
  pilot?: boolean;
  nvrId?: string;
}

export const PILOT_KITCHEN_ID = 'gamping-yogyakarta';

export const FLEET_KITCHENS: FleetKitchen[] = [
  {
    id: 'gamping-yogyakarta',
    label: 'SPPG Gamping',
    location: 'Gamping, Sleman',
    province: 'DI Yogyakarta',
    status: 'live',
    pilot: true,
    nvrId: '26AD9BJPSF00342',
  },
  {
    id: 'bagelen-purwokerto',
    label: 'SPPG Bagelen',
    location: 'Bagelen, Purworejo',
    province: 'Jawa Tengah',
    status: 'live',
    nvrId: 'E945FBMPSF00047',
  },
];

export const FLEET_STATS = {
  total: FLEET_KITCHENS.length,
  live: FLEET_KITCHENS.filter(k => k.status === 'live').length,
  registered: FLEET_KITCHENS.length,
  provinces: [...new Set(FLEET_KITCHENS.map(k => k.province))].length,
};

export function pilotKitchen(): FleetKitchen {
  return FLEET_KITCHENS.find(k => k.pilot) ?? FLEET_KITCHENS[0]!;
}

export function getKitchen(id: string): FleetKitchen | undefined {
  return FLEET_KITCHENS.find(k => k.id === id);
}
