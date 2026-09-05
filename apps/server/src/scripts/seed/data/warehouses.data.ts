export interface SeedWarehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  shippingCostWeight: number;
  isPrimary: boolean;
}

export const GUJARAT_WAREHOUSES: SeedWarehouse[] = [
  {
    id: "wh_amd_changodar",
    code: "WH-AMD-CHANGODAR",
    name: "Changodar Industrial Logistics Hub (Ahmedabad)",
    location: "Changodar GIDC, Ahmedabad, Gujarat 382213",
    shippingCostWeight: 1.0,
    isPrimary: true,
  },
  {
    id: "wh_srt_sachin",
    code: "WH-SRT-SACHIN",
    name: "Sachin Diamond & Textile Logistics Center (Surat)",
    location: "Sachin GIDC, Surat, Gujarat 394230",
    shippingCostWeight: 1.2,
    isPrimary: false,
  },
  {
    id: "wh_bdq_makarpura",
    code: "WH-BDQ-MAKARPURA",
    name: "Makarpura Heavy Engineering Depot (Vadodara)",
    location: "Makarpura GIDC, Vadodara, Gujarat 390010",
    shippingCostWeight: 1.1,
    isPrimary: false,
  },
  {
    id: "wh_raj_metoda",
    code: "WH-RAJ-METODA",
    name: "Metoda Auto & Foundry Depot (Rajkot)",
    location: "Metoda GIDC, Rajkot, Gujarat 360021",
    shippingCostWeight: 1.3,
    isPrimary: false,
  },
  {
    id: "wh_gft_sez",
    code: "WH-GFT-SEZ",
    name: "GIFT City FinTech Logistics Center (Gandhinagar)",
    location: "GIFT SEZ, Gandhinagar, Gujarat 382355",
    shippingCostWeight: 1.05,
    isPrimary: false,
  },
];
