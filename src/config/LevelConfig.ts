import { TrafficType } from '../types/game';

export interface LevelDefinition {
  id: number;
  name: string;
  subtitle: string;
  requiredDistance: number;
  trafficSpeedMultiplier: number;
  spawnRateMultiplier: number;
  trafficDensity: number; // Max concurrent traffic
  fuelDrainMultiplier: number;
  koboMultiplier: number;
  scoreMultiplier: number;
  koboBonusOnReach: number;
  environmentTheme: {
    name: string;
    skyTop: string;
    skyBottom: string;
    roadColor: string;
    curbColor: string;
    gantryColor: string;
    ambientFilter?: string;
  };
  availableTrafficTypes: TrafficType[];
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    id: 1,
    name: 'Lagos Morning',
    subtitle: 'Awake on the Outer Marina',
    requiredDistance: 0,
    trafficSpeedMultiplier: 1.0,
    spawnRateMultiplier: 1.0,
    trafficDensity: 3,
    fuelDrainMultiplier: 1.0,
    koboMultiplier: 1.0,
    scoreMultiplier: 1.0,
    koboBonusOnReach: 0,
    environmentTheme: {
      name: 'morning',
      skyTop: '#131A26',
      skyBottom: '#223048',
      roadColor: '#1A1C20',
      curbColor: '#F59E0B',
      gantryColor: '#2D3748'
    },
    availableTrafficTypes: ['SEDAN', 'DANFO']
  },
  {
    id: 2,
    name: 'City Rush',
    subtitle: 'Commercial Heartbeat',
    requiredDistance: 400,
    trafficSpeedMultiplier: 1.08,
    spawnRateMultiplier: 1.15,
    trafficDensity: 4,
    fuelDrainMultiplier: 1.05,
    koboMultiplier: 1.2,
    scoreMultiplier: 1.25,
    koboBonusOnReach: 20,
    environmentTheme: {
      name: 'city_rush',
      skyTop: '#1E232F',
      skyBottom: '#344055',
      roadColor: '#181A1E',
      curbColor: '#FBBF24',
      gantryColor: '#3B485C'
    },
    availableTrafficTypes: ['SEDAN', 'DANFO', 'HAZARD_CAR']
  },
  {
    id: 3,
    name: 'Third Mainland Express',
    subtitle: 'Lagoon Crosswinds & High Stakes',
    requiredDistance: 950,
    trafficSpeedMultiplier: 1.16,
    spawnRateMultiplier: 1.3,
    trafficDensity: 4,
    fuelDrainMultiplier: 1.1,
    koboMultiplier: 1.4,
    scoreMultiplier: 1.5,
    koboBonusOnReach: 35,
    environmentTheme: {
      name: 'third_mainland',
      skyTop: '#1A2938',
      skyBottom: '#2A4A63',
      roadColor: '#15171A',
      curbColor: '#F59E0B',
      gantryColor: '#10B981'
    },
    availableTrafficTypes: ['SEDAN', 'DANFO', 'TRUCK']
  },
  {
    id: 4,
    name: 'Lekki Toll Run',
    subtitle: 'Golden Hour Coastal Blitz',
    requiredDistance: 1700,
    trafficSpeedMultiplier: 1.24,
    spawnRateMultiplier: 1.45,
    trafficDensity: 5,
    fuelDrainMultiplier: 1.15,
    koboMultiplier: 1.6,
    scoreMultiplier: 1.8,
    koboBonusOnReach: 50,
    environmentTheme: {
      name: 'lekki_toll',
      skyTop: '#381E2E',
      skyBottom: '#6B3438',
      roadColor: '#181519',
      curbColor: '#F97316',
      gantryColor: '#8B5CF6'
    },
    availableTrafficTypes: ['SEDAN', 'DANFO', 'TRUCK', 'HAZARD_CAR']
  },
  {
    id: 5,
    name: 'Obalende Rush Hour',
    subtitle: 'Wall of Heavy Haulers',
    requiredDistance: 2600,
    trafficSpeedMultiplier: 1.32,
    spawnRateMultiplier: 1.6,
    trafficDensity: 5,
    fuelDrainMultiplier: 1.2,
    koboMultiplier: 2.0,
    scoreMultiplier: 2.2,
    koboBonusOnReach: 75,
    environmentTheme: {
      name: 'rush_hour',
      skyTop: '#261914',
      skyBottom: '#4A2A1A',
      roadColor: '#141312',
      curbColor: '#EF4444',
      gantryColor: '#DC2626'
    },
    availableTrafficTypes: ['TRUCK', 'DANFO', 'SEDAN', 'HAZARD_CAR']
  },
  {
    id: 6,
    name: 'Lagos After Dark',
    subtitle: 'Neon Streaks & Midnight Mastery',
    requiredDistance: 3700,
    trafficSpeedMultiplier: 1.4,
    spawnRateMultiplier: 1.75,
    trafficDensity: 6,
    fuelDrainMultiplier: 1.25,
    koboMultiplier: 2.5,
    scoreMultiplier: 2.8,
    koboBonusOnReach: 100,
    environmentTheme: {
      name: 'after_dark',
      skyTop: '#090A0E',
      skyBottom: '#10141D',
      roadColor: '#0E0F12',
      curbColor: '#38BDF8',
      gantryColor: '#06B6D4',
      ambientFilter: 'rgba(6, 182, 212, 0.08)'
    },
    availableTrafficTypes: ['SEDAN', 'DANFO', 'TRUCK', 'HAZARD_CAR']
  }
];
