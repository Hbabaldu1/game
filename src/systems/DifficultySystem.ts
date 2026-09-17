import { GAME_CONFIG } from '../config/GameConfig';

export class DifficultySystem {
  public currentSpeed: number = GAME_CONFIG.BASE_SPEED;
  public elapsedTime: number = 0;

  public reset(): void {
    this.currentSpeed = GAME_CONFIG.BASE_SPEED;
    this.elapsedTime = 0;
  }

  public update(dt: number): void {
    this.elapsedTime += dt;
    // Gradually ramp speed
    this.currentSpeed = Math.min(
      GAME_CONFIG.MAX_SPEED,
      GAME_CONFIG.BASE_SPEED + this.elapsedTime * GAME_CONFIG.SPEED_INCREASE_RATE
    );
  }

  public getSpeedRatio(): number {
    return (
      (this.currentSpeed - GAME_CONFIG.BASE_SPEED) /
      (GAME_CONFIG.MAX_SPEED - GAME_CONFIG.BASE_SPEED)
    );
  }
}
