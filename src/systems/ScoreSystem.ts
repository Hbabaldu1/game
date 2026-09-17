import { GAME_CONFIG } from '../config/GameConfig';
import { eventBus } from '../core/EventBus';

export class ScoreSystem {
  public score = 0;
  public highScore = 0;
  public distance = 0;
  public closeShavesCount = 0;
  public currentMultiplierIndex = 0;
  public comboTimer = 0;
  public maxCombo = 1;
  public koboEarned = 0;
  public bonusMultiplier = 1.0;

  constructor(initialHighScore = 0) {
    this.highScore = initialHighScore;
  }

  public reset(): void {
    this.score = 0;
    this.distance = 0;
    this.closeShavesCount = 0;
    this.currentMultiplierIndex = 0;
    this.comboTimer = 0;
    this.maxCombo = 1;
    this.koboEarned = 0;
    this.bonusMultiplier = 1.0;
  }

  public setBonusMultiplier(multiplier: number): void {
    this.bonusMultiplier = Math.max(0.5, multiplier);
  }

  public getMultiplier(): number {
    return GAME_CONFIG.COMBO_MULTIPLIERS[this.currentMultiplierIndex];
  }

  public update(dt: number, speed: number): void {
    // 1. Distance & continuous forward score
    const distanceDelta = (speed * dt) / 10;
    this.distance += distanceDelta;
    this.score += Math.round(distanceDelta * (GAME_CONFIG.DISTANCE_SCORE_RATE / 10) * this.getMultiplier() * this.bonusMultiplier);

    // 2. Combo timer decay
    if (this.currentMultiplierIndex > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  public recordCloseShave(): { points: number; multiplier: number } {
    this.closeShavesCount++;

    // Advance multiplier
    if (this.currentMultiplierIndex < GAME_CONFIG.COMBO_MULTIPLIERS.length - 1) {
      this.currentMultiplierIndex++;
    }

    const currentMultiplier = this.getMultiplier();
    if (currentMultiplier > this.maxCombo) {
      this.maxCombo = currentMultiplier;
    }

    // Refresh combo window timer
    this.comboTimer = GAME_CONFIG.COMBO_TIMEOUT_SECONDS;

    const points = Math.round(GAME_CONFIG.BASE_CLOSE_SHAVE_POINTS * currentMultiplier * this.bonusMultiplier);
    this.score += points;

    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    return { points, multiplier: currentMultiplier };
  }

  public addKobo(amount: number = GAME_CONFIG.KOBO_VALUE): void {
    this.koboEarned += amount;
    this.score += Math.round(GAME_CONFIG.KOBO_SCORE_POINTS * this.getMultiplier() * this.bonusMultiplier);
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
  }

  public resetCombo(): void {
    if (this.currentMultiplierIndex > 0) {
      this.currentMultiplierIndex = 0;
      this.comboTimer = 0;
      eventBus.emit('score:combo_lost');
    }
  }
}
