import { ACHIEVEMENTS, AchievementDefinition } from '../config/AchievementConfig';
import { storageService } from './StorageService';
import { eventBus } from '../core/EventBus';
import { analytics } from './AnalyticsService';

export class AchievementService {
  private static instance: AchievementService;

  public static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  public getAchievements(): AchievementDefinition[] {
    return ACHIEVEMENTS;
  }

  public getUnlockedAchievements(): Record<string, number> {
    return storageService.getUnlockedAchievements();
  }

  public checkAndAward(id: string): boolean {
    if (storageService.isAchievementUnlocked(id)) {
      return false;
    }

    const definition = ACHIEVEMENTS.find(a => a.id === id);
    if (!definition) return false;

    const awarded = storageService.unlockAchievement(id);
    if (awarded) {
      eventBus.emit('achievement:unlocked', definition);
      analytics.track('achievement_unlocked', {
        achievement_id: id,
        title: definition.title
      });
      return true;
    }
    return false;
  }

  public checkRunAchievements(params: {
    score: number;
    maxCombo: number;
    closeShavesCount: number;
    isDaily: boolean;
  }): void {
    // Maiden run
    this.checkAndAward('first_drive');

    // Score milestones
    if (params.score >= 1000) {
      this.checkAndAward('score_1000');
    }
    if (params.score >= 5000) {
      this.checkAndAward('score_5000');
    }

    // Combo milestones
    if (params.maxCombo >= 5) {
      this.checkAndAward('combo_5x');
    }
    if (params.maxCombo >= 10) {
      this.checkAndAward('combo_10x');
    }

    // Career milestones
    if (params.closeShavesCount >= 1) {
      this.checkAndAward('first_close_shave');
    }
    if (storageService.getTotalCloseShaves() >= 10) {
      this.checkAndAward('close_shave_10');
    }
    if (storageService.getTotalKobo() >= 100) {
      this.checkAndAward('kobo_collector_100');
    }
    if (params.isDaily) {
      this.checkAndAward('daily_challenger');
    }
  }
}

export const achievementService = AchievementService.getInstance();
