export type AdPlacement = 'revive_run' | 'double_kobo' | 'interstitial_gameover';

export interface AdService {
  isRewardedAdAvailable(): boolean;
  isInterstitialAvailable(): boolean;
  showRewardedAd(placement: AdPlacement): Promise<boolean>;
  showInterstitial(): Promise<boolean>;
}
