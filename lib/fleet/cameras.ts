/**
 * SSOT: real CCTV cameras per kitchen.
 * Derived from Imou API NVR groupings (verified 2026-06-25).
 */

export interface KitchenCamera {
  deviceId: string;
  name: string;
  channelId: string;
  kitchenId: string;
  zone: 'food' | 'storage' | 'washing' | 'receiving' | 'parking' | 'other';
}

export const KITCHEN_CAMERAS: KitchenCamera[] = [
  // ── SPPG Gamping · Yogyakarta (NVR: 26AD9BJPSF00342) ──────────────
  { kitchenId: 'gamping-yogyakarta', deviceId: '1074CBMPSF98A91', name: 'Ruang Persiapan',   channelId: '0', zone: 'food'      },
  { kitchenId: 'gamping-yogyakarta', deviceId: '5058FBMPSFDDAD8', name: 'Cuci Ompreng',       channelId: '0', zone: 'washing'   },
  { kitchenId: 'gamping-yogyakarta', deviceId: '5058FBMPSF5C811', name: 'Pengolahan',          channelId: '0', zone: 'food'      },
  { kitchenId: 'gamping-yogyakarta', deviceId: 'A6A76BMPSF104A8', name: 'Pemorsian',           channelId: '0', zone: 'food'      },
  { kitchenId: 'gamping-yogyakarta', deviceId: '00E56BJPSFAB9A1', name: 'Gudang Kering',       channelId: '0', zone: 'storage'   },
  { kitchenId: 'gamping-yogyakarta', deviceId: 'F4AA0BLPSF99E84', name: 'Penerimaan Barang',   channelId: '0', zone: 'receiving' },
  { kitchenId: 'gamping-yogyakarta', deviceId: '00E56BJPSF8813A', name: 'Gudang Basah',        channelId: '0', zone: 'storage'   },
  { kitchenId: 'gamping-yogyakarta', deviceId: '9607DBEPBVB84AF', name: 'Parkiran',             channelId: '0', zone: 'parking'   },

  // ── SPPG Bagelen · Purwokerto (NVR: E945FBMPSF00047) ──────────────
  { kitchenId: 'bagelen-purwokerto', deviceId: '1074CBMPSFDE7A8', name: 'Gudang Basah',        channelId: '0', zone: 'storage'   },
  { kitchenId: 'bagelen-purwokerto', deviceId: '1074CBMPSF4E691', name: 'Ruang Makan',         channelId: '0', zone: 'food'      },
  { kitchenId: 'bagelen-purwokerto', deviceId: '1074CBMPSFAD2DA', name: 'Persiapan',            channelId: '0', zone: 'food'      },
  { kitchenId: 'bagelen-purwokerto', deviceId: '1074CBMPSF9A424', name: 'Pemorsian',            channelId: '0', zone: 'food'      },
  { kitchenId: 'bagelen-purwokerto', deviceId: '1074CBMPSF88336', name: 'Pengolahan',           channelId: '0', zone: 'food'      },
  { kitchenId: 'bagelen-purwokerto', deviceId: '1074CBMPSFB7C1C', name: 'Penerimaan Barang',    channelId: '0', zone: 'receiving' },
  { kitchenId: 'bagelen-purwokerto', deviceId: '1074CBMPSF47827', name: 'Gudang Kering',        channelId: '0', zone: 'storage'   },
  { kitchenId: 'bagelen-purwokerto', deviceId: '080B5BMPBVD61E4', name: 'Cuci Ompreng',        channelId: '0', zone: 'washing'   },
  { kitchenId: 'bagelen-purwokerto', deviceId: '080B5BMPBVC41B7', name: 'Parkiran',             channelId: '0', zone: 'parking'   },
  { kitchenId: 'bagelen-purwokerto', deviceId: '080B5BMPBVF3002', name: 'Gas',                  channelId: '0', zone: 'other'     },
];

export function getCamerasByKitchen(kitchenId: string): KitchenCamera[] {
  return KITCHEN_CAMERAS.filter(c => c.kitchenId === kitchenId);
}

export function getFoodCameras(kitchenId: string): KitchenCamera[] {
  return KITCHEN_CAMERAS.filter(c => c.kitchenId === kitchenId && c.zone === 'food');
}

export function getAllDeviceIds(): string[] {
  return KITCHEN_CAMERAS.map(c => c.deviceId);
}
