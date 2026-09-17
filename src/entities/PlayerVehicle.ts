import { GAME_CONFIG } from '../config/GameConfig';
import { BoundingBox } from '../types/game';
import { LaneSystem } from '../systems/LaneSystem';
import { VehicleDefinition, VEHICLE_DEFINITIONS, VehicleId } from '../config/VehicleConfig';

export class PlayerVehicle {
  public currentLane: number = 1;
  public targetLane: number = 1;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public rotation: number = 0; // Lean angle in radians
  public isInvulnerable: boolean = false;
  public invulnerabilityTimer: number = 0;
  public isBraking: boolean = false;
  public brakeFactor: number = 0;

  // Visual polish properties
  public definition: VehicleDefinition;
  public engineVibration: number = 0;
  public wheelRotationTime: number = 0;
  public exhaustTimer: number = 0;

  private laneSystem: LaneSystem;

  constructor(laneSystem: LaneSystem, vehicleId: VehicleId = 'DANFO') {
    this.laneSystem = laneSystem;
    this.definition = VEHICLE_DEFINITIONS[vehicleId] || VEHICLE_DEFINITIONS.DANFO;
    this.width = this.definition.width;
    this.height = this.definition.height;
    this.x = laneSystem.getLaneCenter(1);
    this.y = GAME_CONFIG.PLAYER_BASE_Y;
  }

  public setVehicle(vehicleId: VehicleId): void {
    this.definition = VEHICLE_DEFINITIONS[vehicleId] || VEHICLE_DEFINITIONS.DANFO;
    this.width = this.definition.width;
    this.height = this.definition.height;
  }

  public reset(): void {
    this.currentLane = 1;
    this.targetLane = 1;
    this.x = this.laneSystem.getLaneCenter(1);
    this.y = GAME_CONFIG.PLAYER_BASE_Y;
    this.rotation = 0;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.isBraking = false;
    this.brakeFactor = 0;
    this.engineVibration = 0;
    this.wheelRotationTime = 0;
    this.exhaustTimer = 0;
  }

  public changeLane(direction: -1 | 1): boolean {
    const nextLane = this.targetLane + direction;
    if (nextLane >= 0 && nextLane < GAME_CONFIG.LANES_COUNT) {
      this.targetLane = nextLane;
      return true;
    }
    return false;
  }

  public update(dt: number, currentSpeed: number = GAME_CONFIG.BASE_SPEED): void {
    const targetX = this.laneSystem.getLaneCenter(this.targetLane);
    const dx = targetX - this.x;

    // Smooth lerp to target lane with vehicle's custom laneChangeSpeed
    this.x += dx * Math.min(1, this.definition.laneChangeSpeed * dt);

    // Calculate dynamic body lean based on lateral velocity and vehicle's max lean angle
    const targetRotation = Math.sign(dx) * Math.min(Math.abs(dx) * 0.0035, this.definition.leanAngle);
    this.rotation += (targetRotation - this.rotation) * Math.min(1, 16 * dt);

    // Subtle engine vibration (sub-pixel oscillation)
    this.engineVibration = Math.sin(Date.now() * 0.035) * 0.85;

    // Wheel rotation speed tracker
    this.wheelRotationTime += dt * (currentSpeed / 40);

    // Invulnerability timer
    if (this.isInvulnerable) {
      this.invulnerabilityTimer -= dt;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
      }
    }
  }

  public setInvulnerable(duration: number): void {
    this.isInvulnerable = true;
    this.invulnerabilityTimer = duration;
  }

  public getHitbox(): BoundingBox {
    return {
      x: this.x - this.width / 2 + this.definition.hitboxInsetX,
      y: this.y - this.height / 2 + this.definition.hitboxInsetY,
      width: this.width - this.definition.hitboxInsetX * 2,
      height: this.height - this.definition.hitboxInsetY * 2
    };
  }

  public getProximityBox(): BoundingBox {
    return {
      x: this.x - this.width / 2 - GAME_CONFIG.CLOSE_SHAVE_X_EXPANSION,
      y: this.y - this.height / 2 - GAME_CONFIG.CLOSE_SHAVE_Y_EXPANSION,
      width: this.width + GAME_CONFIG.CLOSE_SHAVE_X_EXPANSION * 2,
      height: this.height + GAME_CONFIG.CLOSE_SHAVE_Y_EXPANSION * 2
    };
  }
}
