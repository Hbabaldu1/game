import { AdService, AdPlacement } from './AdService';
import { analytics } from './AnalyticsService';
import { eventBus } from '../core/EventBus';

export interface CommercialAdConfig {
  minInterstitialIntervalSec: number;
  maxDailyRewardedAds: number;
  rewardedAdDurationSec: number;
  testMode: boolean;
}

export const DEFAULT_AD_CONFIG: CommercialAdConfig = {
  minInterstitialIntervalSec: 90,
  maxDailyRewardedAds: 20,
  rewardedAdDurationSec: 2,
  testMode: true
};

export class CommercialAdService implements AdService {
  private lastInterstitialTime = 0;
  private rewardedAdsWatchedToday = 0;
  private todayDateKey: string = '';
  private config: CommercialAdConfig;

  constructor(config: CommercialAdConfig = DEFAULT_AD_CONFIG) {
    this.config = config;
    this.todayDateKey = new Date().toISOString().slice(0, 10);
    this.loadAdState();
  }

  private loadAdState(): void {
    try {
      const savedDate = localStorage.getItem('danfo_ad_date');
      const savedCount = localStorage.getItem('danfo_ad_rewarded_count');
      if (savedDate === this.todayDateKey && savedCount) {
        this.rewardedAdsWatchedToday = parseInt(savedCount, 10) || 0;
      } else {
        this.rewardedAdsWatchedToday = 0;
        localStorage.setItem('danfo_ad_date', this.todayDateKey);
        localStorage.setItem('danfo_ad_rewarded_count', '0');
      }
    } catch {
      this.rewardedAdsWatchedToday = 0;
    }
  }

  private incrementRewardedCount(): void {
    this.rewardedAdsWatchedToday++;
    try {
      localStorage.setItem('danfo_ad_rewarded_count', this.rewardedAdsWatchedToday.toString());
    } catch {
      // Ignore quota storage errors
    }
  }

  public isRewardedAdAvailable(): boolean {
    return this.rewardedAdsWatchedToday < this.config.maxDailyRewardedAds;
  }

  public isInterstitialAvailable(): boolean {
    const elapsed = (Date.now() - this.lastInterstitialTime) / 1000;
    return elapsed >= this.config.minInterstitialIntervalSec;
  }

  public getCooldownRemainingSec(): number {
    const elapsed = (Date.now() - this.lastInterstitialTime) / 1000;
    return Math.max(0, Math.ceil(this.config.minInterstitialIntervalSec - elapsed));
  }

  public async showRewardedAd(placement: AdPlacement): Promise<boolean> {
    if (!this.isRewardedAdAvailable()) {
      return false;
    }

    analytics.track('rewarded_ad_requested', { placement });
    eventBus.emit('ad:rewarded_start', { placement });

    // Check if Google AdSense H5 Games Ads is present
    const adBreak = (window as any).adBreak;
    if (typeof adBreak === 'function') {
      return new Promise<boolean>(resolve => {
        adBreak({
          type: 'reward',
          name: placement,
          beforeReward: (showAdFn: () => void) => {
            showAdFn();
          },
          adDismissed: () => {
            eventBus.emit('ad:rewarded_dismissed', { placement });
            resolve(false);
          },
          adViewed: () => {
            this.incrementRewardedCount();
            analytics.track('rewarded_ad_completed', { placement, reward_granted: true });
            eventBus.emit('ad:rewarded_completed', { placement });
            resolve(true);
          }
        });
      });
    }

    // High-fidelity fallback / test mode simulation
    return new Promise(resolve => {
      setTimeout(() => {
        this.incrementRewardedCount();
        analytics.track('rewarded_ad_completed', { placement, reward_granted: true, fallback: true });
        eventBus.emit('ad:rewarded_completed', { placement });
        resolve(true);
      }, this.config.rewardedAdDurationSec * 1000);
    });
  }

  public async showInterstitial(): Promise<boolean> {
    if (!this.isInterstitialAvailable()) {
      return false;
    }

    const elapsed = (Date.now() - this.lastInterstitialTime) / 1000;
    this.lastInterstitialTime = Date.now();

    analytics.track('interstitial_shown', { time_since_last: elapsed });
    eventBus.emit('ad:interstitial_start');

    // Check if Google AdSense H5 Games Ads is present
    const adBreak = (window as any).adBreak;
    if (typeof adBreak === 'function') {
      return new Promise<boolean>(resolve => {
        adBreak({
          type: 'start',
          name: 'interstitial_gameover',
          adBreakDone: () => {
            eventBus.emit('ad:interstitial_end');
            resolve(true);
          }
        });
      });
    }

    // Fallback simulation
    return new Promise(resolve => {
      setTimeout(() => {
        eventBus.emit('ad:interstitial_end');
        resolve(true);
      }, 700);
    });
  }
}

export const adService: AdService = new CommercialAdService();
