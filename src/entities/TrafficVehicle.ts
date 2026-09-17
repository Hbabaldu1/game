import { GAME_CONFIG } from '../config/GameConfig';
import { BoundingBox, TrafficType } from '../types/game';

export class TrafficVehicle {
  public id: number;
  public type: TrafficType;
  public lane: number;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public speed: number;
  public color: string;
  public hasAwardedCloseShave: boolean = false;
  public hasPassedPlayer: boolean = false;
  public hazardBlinkTimer: number = 0;
  public hazardBlinkState: boolean = false;
  public active: boolean = true;

  constructor(id: number, type: TrafficType, lane: number, x: number, y: number, speed: number) {
    this.id = id;
    this.type = type;
    this.lane = lane;
    this.x = x;
    this.y = y;
    this.speed = speed;

    const config = GAME_CONFIG.TRAFFIC_CONFIGS[type];
    this.width = config.width;
    this.height = config.height;
    this.color = config.color;
  }

  public reset(id: number, type: TrafficType, lane: number, x: number, y: number, speed: number): void {
    this.id = id;
    this.type = type;
    this.lane = lane;
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.hasAwardedCloseShave = false;
    this.hasPassedPlayer = false;
    this.active = true;

    const config = GAME_CONFIG.TRAFFIC_CONFIGS[type];
    this.width = config.width;
    this.height = config.height;
    this.color = config.color;
  }

  public update(dt: number, playerForwardSpeed: number): void {
    // Relative movement toward bottom of screen
    // The player moves forward at playerForwardSpeed; this vehicle moves forward at this.speed
    // Relative downward speed = (playerForwardSpeed - this.speed)
    const relativeSpeed = playerForwardSpeed - this.speed;
    this.y += relativeSpeed * dt;

    if (this.type === 'HAZARD_CAR') {
      this.hazardBlinkTimer += dt;
      if (this.hazardBlinkTimer >= 0.25) {
        this.hazardBlinkTimer = 0;
        this.hazardBlinkState = !this.hazardBlinkState;
      }
    }
  }

  public getHitbox(): BoundingBox {
    return {
      x: this.x - this.width / 2 + GAME_CONFIG.TRAFFIC_HITBOX_INSET_X,
      y: this.y - this.height / 2 + GAME_CONFIG.TRAFFIC_HITBOX_INSET_Y,
      width: this.width - GAME_CONFIG.TRAFFIC_HITBOX_INSET_X * 2,
      height: this.height - GAME_CONFIG.TRAFFIC_HITBOX_INSET_Y * 2
    };
  }
}
