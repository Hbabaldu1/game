import { VehicleId } from '../config/VehicleConfig';
import { BRAKE_CONFIG, BrakeVehicleProfile } from '../config/BrakeConfig';
import { eventBus } from '../core/EventBus';

export interface BrakeStatus {
  isBraking: boolean;
  factor: number;
  heatPercent: number;
  isOverheated: boolean;
  cooldownRemaining: number;
}

export class BrakeSystem {
  public profile: BrakeVehicleProfile;
  public isBrakeRequested: boolean = false;
  public currentBrakeFactor: number = 0; // 0 (cruising) to 1 (full brake applied)
  public heatTimer: number = 0;
  public cooldownTimer: number = 0;
  public isOverheated: boolean = false;
  public totalBrakeEventsCount: number = 0;

  private wasBrakingPreviously: boolean = false;

  constructor(vehicleId: VehicleId = 'DANFO') {
    this.profile = BRAKE_CONFIG[vehicleId] || BRAKE_CONFIG.DANFO;
    this.reset(vehicleId);
  }

  public reset(vehicleId?: VehicleId): void {
    if (vehicleId && BRAKE_CONFIG[vehicleId]) {
      this.profile = BRAKE_CONFIG[vehicleId];
    }
    this.isBrakeRequested = false;
    this.currentBrakeFactor = 0;
    this.heatTimer = 0;
    this.cooldownTimer = 0;
    this.isOverheated = false;
    this.totalBrakeEventsCount = 0;
    this.wasBrakingPreviously = false;
  }

  public setVehicle(vehicleId: VehicleId): void {
    if (BRAKE_CONFIG[vehicleId]) {
      this.profile = BRAKE_CONFIG[vehicleId];
    }
  }

  public pressBrake(): void {
    if (this.isOverheated) return;
    if (!this.isBrakeRequested) {
      this.totalBrakeEventsCount += 1;
      eventBus.emit('brake:start');
    }
    this.isBrakeRequested = true;
  }

  public releaseBrake(): void {
    if (this.isBrakeRequested) {
      this.isBrakeRequested = false;
      eventBus.emit('brake:end');
    }
  }

  public update(dt: number): void {
    // 1. Handle Overheat Cooldown
    if (this.isOverheated) {
      this.cooldownTimer -= dt;
      if (this.cooldownTimer <= 0) {
        this.isOverheated = false;
        this.cooldownTimer = 0;
        this.heatTimer = 0;
        eventBus.emit('brake:cooled');
      }
    }

    // 2. Adjust Brake Factor
    if (this.isBrakeRequested && !this.isOverheated) {
      this.currentBrakeFactor = Math.min(1.0, this.currentBrakeFactor + dt * this.profile.brakeDecelRate);
      this.heatTimer += dt;

      // Overheat condition
      if (this.heatTimer >= this.profile.maxContinuousDuration) {
        this.isOverheated = true;
        this.isBrakeRequested = false;
        this.cooldownTimer = this.profile.cooldownDuration;
        eventBus.emit('brake:overheated');
      }
    } else {
      // Releasing / Cooling off
      this.currentBrakeFactor = Math.max(0, this.currentBrakeFactor - dt * this.profile.brakeRecoveryRate);
      if (!this.isOverheated) {
        this.heatTimer = Math.max(0, this.heatTimer - dt * (this.profile.maxContinuousDuration / 2.0));
      }
    }

    // 3. Emit state changes for sound / lights
    const isNowBraking = this.currentBrakeFactor > 0.15;
    if (isNowBraking !== this.wasBrakingPreviously) {
      this.wasBrakingPreviously = isNowBraking;
      eventBus.emit('brake:state_change', { isBraking: isNowBraking, factor: this.currentBrakeFactor });
    }
  }

  /**
   * Returns multiplier from 1.0 (cruising) down to profile.minSpeedMultiplier (full brake)
   */
  public getEffectiveSpeedMultiplier(): number {
    return 1.0 - this.currentBrakeFactor * (1.0 - this.profile.minSpeedMultiplier);
  }

  public isBraking(): boolean {
    return this.currentBrakeFactor > 0.1;
  }

  public getHeatRatio(): number {
    if (this.isOverheated) {
      return this.cooldownTimer / this.profile.cooldownDuration;
    }
    return this.heatTimer / this.profile.maxContinuousDuration;
  }

  public getBrakeStatus(): BrakeStatus {
    return {
      isBraking: this.isBraking(),
      factor: this.currentBrakeFactor,
      heatPercent: Math.min(100, Math.max(0, this.getHeatRatio() * 100)),
      isOverheated: this.isOverheated,
      cooldownRemaining: this.cooldownTimer
    };
  }
}
