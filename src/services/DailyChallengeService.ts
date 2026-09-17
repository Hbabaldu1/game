import { DAILY_CHALLENGE_POOL, DailyChallengeDefinition } from '../config/DailyConfig';

export interface TodayChallengeInfo {
  dateKey: string; // YYYY-MM-DD
  challenge: DailyChallengeDefinition;
  formattedDate: string;
}

export class DailyChallengeService {
  private static instance: DailyChallengeService;

  public static getInstance(): DailyChallengeService {
    if (!DailyChallengeService.instance) {
      DailyChallengeService.instance = new DailyChallengeService();
    }
    return DailyChallengeService.instance;
  }

  public getTodayKey(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Deterministic 32-bit integer hash from string
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  public getTodayChallenge(): TodayChallengeInfo {
    const dateKey = this.getTodayKey();
    const hash = this.hashString(dateKey);
    const poolIndex = hash % DAILY_CHALLENGE_POOL.length;
    const challenge = DAILY_CHALLENGE_POOL[poolIndex];

    const dateObj = new Date();
    const formattedDate = dateObj.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return {
      dateKey,
      challenge,
      formattedDate
    };
  }
}

export const dailyChallengeService = DailyChallengeService.getInstance();
