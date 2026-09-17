export type VehicleId = 'DANFO' | 'OKADA' | 'KEKE';

export interface VehicleDefinition {
  id: VehicleId;
  name: string;
  tagline: string;
  description: string;
  unlockCost: number; // In Kobo (₦)
  maxSpeedMultiplier: number;
  laneChangeSpeed: number;
  width: number;
  height: number;
  hitboxInsetX: number;
  hitboxInsetY: number;
  leanAngle: number;
  fuelEfficiency: number; // Lower consumption rate multiplier (< 1 is more efficient)
  scoreModifier: number; // Points multiplier
  handling: 'Balanced' | 'Agile' | 'Steady';
  primaryColor: string;
  accentColor: string;
}

export const VEHICLE_DEFINITIONS: Record<VehicleId, VehicleDefinition> = {
  DANFO: {
    id: 'DANFO',
    name: 'Yellow Danfo',
    tagline: 'Balanced City Runner',
    description: 'The iconic Lagos commercial minibus. Reliable handling, standard fuel tank, and authentic street presence.',
    unlockCost: 0, // Default starting vehicle
    maxSpeedMultiplier: 1.0,
    laneChangeSpeed: 16,
    width: 52,
    height: 96,
    hitboxInsetX: 6,
    hitboxInsetY: 10,
    leanAngle: 0.14,
    fuelEfficiency: 1.0,
    scoreModifier: 1.0,
    handling: 'Balanced',
    primaryColor: '#F9B208',
    accentColor: '#18181B'
  },
  OKADA: {
    id: 'OKADA',
    name: 'Okada Rider',
    tagline: 'Swift Lane Weaver',
    description: 'Lightweight commercial motorcycle. Ultra-narrow hitbox and lightning-fast lane shifts, but demands sharp reflexes.',
    unlockCost: 120, // Achievable within 2-3 good runs
    maxSpeedMultiplier: 1.15,
    laneChangeSpeed: 24, // Very rapid lane changes
    width: 32,
    height: 68,
    hitboxInsetX: 4,
    hitboxInsetY: 6,
    leanAngle: 0.28, // Dramatic motorbike lean
    fuelEfficiency: 0.9, // Lower fuel drain
    scoreModifier: 1.25, // Bonus score for risk-taking
    handling: 'Agile',
    primaryColor: '#059669', // Lagos green helmet & bike
    accentColor: '#F59E0B'
  },
  KEKE: {
    id: 'KEKE',
    name: 'Keke Marwa',
    tagline: 'Stable & Forgiving',
    description: 'Three-wheeled autorickshaw with compact stance and incredible fuel conservation. Forgiving on near-misses.',
    unlockCost: 300,
    maxSpeedMultiplier: 0.92,
    laneChangeSpeed: 14,
    width: 44,
    height: 78,
    hitboxInsetX: 5,
    hitboxInsetY: 8,
    leanAngle: 0.10,
    fuelEfficiency: 0.70, // 30% less fuel consumption!
    scoreModifier: 1.1,
    handling: 'Steady',
    primaryColor: '#EAB308',
    accentColor: '#047857' // Green canopy
  }
};
