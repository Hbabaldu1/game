import { VehicleId } from './VehicleConfig';

export interface DailyChallengeModifiers {
  speedMultiplier: number;
  trafficDensityMultiplier: number;
  fuelDrainMultiplier: number;
  koboSpawnMultiplier: number;
  scoreBonusMultiplier: number;
  forcedVehicle?: VehicleId;
}

export interface DailyChallengeDefinition {
  typeId: string;
  name: string;
  tagline: string;
  description: string;
  modifiers: DailyChallengeModifiers;
}

export const DAILY_CHALLENGE_POOL: DailyChallengeDefinition[] = [
  {
    typeId: 'rush_hour',
    name: 'Rush Hour Gridlock',
    tagline: 'Tight Gaps & Near Misses',
    description: 'Traffic density is boosted by 35%. Hone your lane weaving for massive combo multipliers!',
    modifiers: {
      speedMultiplier: 0.95,
      trafficDensityMultiplier: 1.35,
      fuelDrainMultiplier: 1.0,
      koboSpawnMultiplier: 1.2,
      scoreBonusMultiplier: 1.25
    }
  },
  {
    typeId: 'third_mainland_sprint',
    name: 'Third Mainland Sprint',
    tagline: 'High Speed Expressway',
    description: 'Vehicles move 25% faster from the starting gate. Pure reflex testing.',
    modifiers: {
      speedMultiplier: 1.25,
      trafficDensityMultiplier: 0.9,
      fuelDrainMultiplier: 1.1,
      koboSpawnMultiplier: 1.0,
      scoreBonusMultiplier: 1.3
    }
  },
  {
    typeId: 'kobo_rush',
    name: 'Kobo Gold Rush',
    tagline: 'Coins Everywhere',
    description: 'Gold coins spawn in rich continuous trails. Grab as much fare as you can carry!',
    modifiers: {
      speedMultiplier: 1.0,
      trafficDensityMultiplier: 1.0,
      fuelDrainMultiplier: 0.9,
      koboSpawnMultiplier: 2.2,
      scoreBonusMultiplier: 1.15
    }
  },
  {
    typeId: 'fuel_crisis',
    name: 'Fuel Shortage Alert',
    tagline: 'Watch That Gauge',
    description: 'Fuel drains 35% faster. Missing Jerrycans is not an option on this run.',
    modifiers: {
      speedMultiplier: 1.05,
      trafficDensityMultiplier: 1.1,
      fuelDrainMultiplier: 1.35,
      koboSpawnMultiplier: 1.1,
      scoreBonusMultiplier: 1.4
    }
  },
  {
    typeId: 'okada_alley',
    name: 'Okada Express',
    tagline: 'Two Wheels Only',
    description: 'Locked to the Okada motorcycle! High agility, high risk, +50% score boost.',
    modifiers: {
      speedMultiplier: 1.15,
      trafficDensityMultiplier: 1.2,
      fuelDrainMultiplier: 0.95,
      koboSpawnMultiplier: 1.3,
      scoreBonusMultiplier: 1.5,
      forcedVehicle: 'OKADA'
    }
  }
];
