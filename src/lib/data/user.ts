export interface BillHistory {
  month: string;
  kwh: number;
  cost: number;
}

export interface Appliance {
  name: string;
  icon: string;
  kwh: number;
  pct: number;
}

export interface RatePlan {
  id: string;
  name: string;
  type: 'flat' | 'tou' | 'tiered';
  description: string;
  avgRate: number;
  current: boolean;
}

export interface EvData {
  make: string;
  model: string;
  year: number;
  milesPerYear: number;
  chargingStyle: 'home' | 'mixed' | 'public';
  currentMonthlyKwh: number;
  currentMonthlyCost: number;
}

export interface SolarData {
  hasSystem: boolean;
  systemKw?: number;
}

export interface UserBill {
  month: string;
  kwh: number;
  totalCost: number;
  electricCost: number;
  gasCost: number;
  baselineKwh: number;
  baselineRate: number;
  aboveKwh: number;
  aboveRate: number;
  delivery: number;
  taxes: number;
  peakKwh: number;
  offPeakKwh: number;
}

export interface User {
  name: string;
  address: string;
  zip: string;
  utility: string;
  bill: UserBill;
  history: BillHistory[];
  appliances: Appliance[];
  ratePlans: RatePlan[];
  ev: EvData;
  solar: SolarData;
}

export const USER: User = {
  name: 'Alex',
  address: '1842 Telegraph Ave, Oakland, CA 94703',
  zip: '94703',
  utility: 'Energy Co',

  bill: {
    month: 'March 2026',
    kwh: 612,
    totalCost: 148.42,
    electricCost: 117.22,
    gasCost: 31.20,
    baselineKwh: 342,
    baselineRate: 0.31,
    aboveKwh: 270,
    aboveRate: 0.47,
    delivery: 28.40,
    taxes: 9.80,
    peakKwh: 367,
    offPeakKwh: 245,
  },

  history: [
    { month: 'Oct', kwh: 480, cost: 121 },
    { month: 'Nov', kwh: 530, cost: 133 },
    { month: 'Dec', kwh: 695, cost: 168 },
    { month: 'Jan', kwh: 720, cost: 175 },
    { month: 'Feb', kwh: 658, cost: 160 },
    { month: 'Mar', kwh: 612, cost: 148 },
  ],

  appliances: [
    { name: 'HVAC',         icon: '❄️',  kwh: 220, pct: 36 },
    { name: 'Water Heater', icon: '🚿',  kwh: 147, pct: 24 },
    { name: 'EV Charging',  icon: '🚗',  kwh: 98,  pct: 16 },
    { name: 'Refrigerator', icon: '🧊',  kwh: 55,  pct: 9  },
    { name: 'Lighting',     icon: '💡',  kwh: 49,  pct: 8  },
    { name: 'Other',        icon: '🔌',  kwh: 43,  pct: 7  },
  ],

  ratePlans: [
    {
      id: 'e1',
      name: 'E-1 Residential',
      type: 'flat',
      description: 'Simple flat rate — same price all day, all month.',
      avgRate: 0.34,
      current: true,
    },
    {
      id: 'etou-c',
      name: 'E-TOU-C',
      type: 'tou',
      description: 'Lower off-peak rate (9pm–4pm). Best if you charge your EV overnight.',
      avgRate: 0.27,
      current: false,
    },
    {
      id: 'etou-d',
      name: 'E-TOU-D',
      type: 'tou',
      description: 'Very low overnight rate; higher peak (4–9pm). Great with a battery.',
      avgRate: 0.24,
      current: false,
    },
    {
      id: 'e-elec',
      name: 'E-ELEC',
      type: 'tiered',
      description: 'Tiered pricing designed for all-electric homes with heat pumps.',
      avgRate: 0.29,
      current: false,
    },
  ],

  ev: {
    make: 'Chevrolet',
    model: 'Bolt EUV',
    year: 2022,
    milesPerYear: 12000,
    chargingStyle: 'home',
    currentMonthlyKwh: 98,
    currentMonthlyCost: 33.32,
  },

  solar: {
    hasSystem: false,
  },
};
