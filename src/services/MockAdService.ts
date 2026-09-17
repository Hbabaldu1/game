import { AdService, AdPlacement } from './AdService';
import { analytics } from './AnalyticsService';

export class MockAdService implements AdService {
  private lastInterstitialTime = 0;
  private readonly minInterstitialIntervalSec = 90;

  public isRewardedAdAvailable(): boolean {
    return true;
  }

  public isInterstitialAvailable(): boolean {
    const elapsed = (Date.now() - this.lastInterstitialTime) / 1000;
    return elapsed >= this.minInterstitialIntervalSec;
  }

  public async showRewardedAd(placement: AdPlacement): Promise<boolean> {
    analytics.track('rewarded_ad_requested', { placement });

    return new Promise(resolve => {
      // Simulate quick 1.2s ad view delay in development
      setTimeout(() => {
        analytics.track('rewarded_ad_completed', { placement, reward_granted: true });
        resolve(true);
      }, 1200);
    });
  }

  public async showInterstitial(): Promise<boolean> {
    if (!this.isInterstitialAvailable()) {
      return false;
    }

    analytics.track('interstitial_shown', {
      time_since_last: (Date.now() - this.lastInterstitialTime) / 1000
    });
    this.lastInterstitialTime = Date.now();

    return new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 800);
    });
  }
}

export const adService: AdService = new MockAdService();
