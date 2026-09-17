import { CollectibleType, BoundingBox } from '../types/game';
import { GAME_CONFIG } from '../config/GameConfig';

export class Collectible {
  public id: number;
  public type: CollectibleType;
  public lane: number;
  public x: number;
  public y: number;
  public radius: number;
  public active: boolean = true;
  public animTime: number = 0;

  constructor(id: number, type: CollectibleType, lane: number, x: number, y: number) {
    this.id = id;
    this.type = type;
    this.lane = lane;
    this.x = x;
    this.y = y;
    this.radius = type === 'KOBO' ? GAME_CONFIG.KOBO_SIZE / 2 : GAME_CONFIG.FUEL_SIZE / 2;
  }

  public reset(id: number, type: CollectibleType, lane: number, x: number, y: number): void {
    this.id = id;
    this.type = type;
    this.lane = lane;
    this.x = x;
    this.y = y;
    this.radius = type === 'KOBO' ? GAME_CONFIG.KOBO_SIZE / 2 : GAME_CONFIG.FUEL_SIZE / 2;
    this.active = true;
    this.animTime = 0;
  }

  public update(dt: number, roadSpeed: number): void {
    this.y += roadSpeed * dt;
    this.animTime += dt;
  }

  public getHitbox(): BoundingBox {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }
}
