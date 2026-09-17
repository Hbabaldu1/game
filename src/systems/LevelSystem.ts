import { LEVEL_DEFINITIONS, LevelDefinition } from '../config/LevelConfig';
import { eventBus } from '../core/EventBus';
import { analytics } from '../services/AnalyticsService';

export class LevelSystem {
  public currentLevelIndex: number = 0;
  public highestLevelReachedThisRun: number = 1;
  public totalLevelsCompletedThisRun: number = 0;

  constructor() {
    this.reset();
  }

  public reset(startingLevelId: number = 1): void {
    const startIndex = Math.max(0, LEVEL_DEFINITIONS.findIndex(l => l.id === startingLevelId));
    this.currentLevelIndex = startIndex !== -1 ? startIndex : 0;
    this.highestLevelReachedThisRun = LEVEL_DEFINITIONS[this.currentLevelIndex].id;
    this.totalLevelsCompletedThisRun = 0;
  }

  public getCurrentLevel(): LevelDefinition {
    return LEVEL_DEFINITIONS[this.currentLevelIndex] || LEVEL_DEFINITIONS[0];
  }

  public getNextLevel(): LevelDefinition | null {
    if (this.currentLevelIndex + 1 < LEVEL_DEFINITIONS.length) {
      return LEVEL_DEFINITIONS[this.currentLevelIndex + 1];
    }
    return null;
  }

  public update(distance: number): { leveledUp: boolean; newLevel?: LevelDefinition; rewardKobo: number } {
    const nextLevel = this.getNextLevel();
    if (!nextLevel) {
      return { leveledUp: false, rewardKobo: 0 };
    }

    if (distance >= nextLevel.requiredDistance) {
      const prevLevel = this.getCurrentLevel();
      this.currentLevelIndex += 1;
      const currentLevel = this.getCurrentLevel();

      this.highestLevelReachedThisRun = Math.max(this.highestLevelReachedThisRun, currentLevel.id);
      this.totalLevelsCompletedThisRun += 1;

      const rewardKobo = currentLevel.koboBonusOnReach;

      eventBus.emit('level:changed', {
        previous: prevLevel,
        current: currentLevel,
        rewardKobo
      });

      analytics.track('level_reached', {
        level_id: currentLevel.id,
        level_name: currentLevel.name,
        distance: Math.round(distance),
        bonus_kobo: rewardKobo
      });

      return {
        leveledUp: true,
        newLevel: currentLevel,
        rewardKobo
      };
    }

    return { leveledUp: false, rewardKobo: 0 };
  }

  public getSpeedMultiplier(): number {
    return this.getCurrentLevel().trafficSpeedMultiplier;
  }

  public getSpawnRateMultiplier(): number {
    return this.getCurrentLevel().spawnRateMultiplier;
  }

  public getMaxTrafficDensity(): number {
    return this.getCurrentLevel().trafficDensity;
  }

  public getFuelDrainMultiplier(): number {
    return this.getCurrentLevel().fuelDrainMultiplier;
  }

  public getScoreMultiplier(): number {
    return this.getCurrentLevel().scoreMultiplier;
  }

  public getKoboMultiplier(): number {
    return this.getCurrentLevel().koboMultiplier;
  }

  public getLevelProgress(distance: number): number {
    const current = this.getCurrentLevel();
    const next = this.getNextLevel();
    if (!next) return 1.0;
    const range = next.requiredDistance - current.requiredDistance;
    if (range <= 0) return 1.0;
    const progress = (distance - current.requiredDistance) / range;
    return Math.max(0, Math.min(1.0, progress));
  }
}
