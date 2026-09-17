import { VehicleId } from './VehicleConfig';

export interface BrakeVehicleProfile {
  brakeDecelRate: number;      // How fast brake takes effect (per second)
  brakeRecoveryRate: number;   // How fast speed returns to normal
  minSpeedMultiplier: number;  // Minimum forward speed when fully braking
  maxContinuousDuration: number; // Seconds of continuous braking before cooldown
  cooldownDuration: number;    // Seconds to cool down after overheating
}

export const BRAKE_CONFIG: Record<VehicleId, BrakeVehicleProfile> = {
  DANFO: {
    brakeDecelRate: 4.5,
    brakeRecoveryRate: 3.2,
    minSpeedMultiplier: 0.50,
    maxContinuousDuration: 3.5,
    cooldownDuration: 1.5
  },
  OKADA: {
    brakeDecelRate: 6.5,       // Snappier brake bite
    brakeRecoveryRate: 4.5,
    minSpeedMultiplier: 0.42,
    maxContinuousDuration: 2.8,
    cooldownDuration: 1.8
  },
  KEKE: {
    brakeDecelRate: 3.2,       // Heavier, slower deceleration
    brakeRecoveryRate: 2.6,
    minSpeedMultiplier: 0.58,
    maxContinuousDuration: 4.2,
    cooldownDuration: 1.2
  }
};
