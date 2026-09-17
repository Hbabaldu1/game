import { GAME_CONFIG } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';

export class FuelSystem {
  public fuel: number = GAME_CONFIG.START_FUEL;
  public drainMultiplier: number = 1.0;
  private hasEmittedWarning: boolean = false;

  public reset(): void {
    this.fuel = GAME_CONFIG.START_FUEL;
    this.hasEmittedWarning = false;
    this.drainMultiplier = 1.0;
  }

  public setDrainMultiplier(multiplier: number): void {
    this.drainMultiplier = Math.max(0.2, multiplier);
  }

  public update(dt: number): void {
    if (this.fuel <= 0) return;

    this.fuel -= GAME_CONFIG.FUEL_CONSUMPTION_RATE * this.drainMultiplier * dt;

    if (this.fuel <= GAME_CONFIG.FUEL_WARNING_THRESHOLD && !this.hasEmittedWarning) {
      this.hasEmittedWarning = true;
      eventBus.emit('fuel:low', this.fuel);
    } else if (this.fuel > GAME_CONFIG.FUEL_WARNING_THRESHOLD) {
      this.hasEmittedWarning = false;
    }

    if (this.fuel <= 0) {
      this.fuel = 0;
      eventBus.emit('fuel:empty');
    }
  }

  public addFuel(amount: number = GAME_CONFIG.FUEL_PICKUP_AMOUNT): number {
    const oldFuel = this.fuel;
    this.fuel = Math.min(GAME_CONFIG.MAX_FUEL, this.fuel + amount);
    if (this.fuel > GAME_CONFIG.FUEL_WARNING_THRESHOLD) {
      this.hasEmittedWarning = false;
    }
    return this.fuel - oldFuel;
  }

  public getPercentage(): number {
    return Math.max(0, Math.min(100, (this.fuel / GAME_CONFIG.MAX_FUEL) * 100));
  }
}
