import { GameState, PlayerStats } from '../types/game';
import { GAME_CONFIG } from '../config/GameConfig';
import { eventBus } from './EventBus';
import { StateManager } from './StateManager';
import { GameLoop } from './GameLoop';
import { LaneSystem } from '../systems/LaneSystem';
import { InputSystem } from '../systems/InputSystem';
import { SpawnerSystem } from '../systems/SpawnerSystem';
import { CollisionSystem } from '../systems/CollisionSystem';
import { CloseShaveSystem } from '../systems/CloseShaveSystem';
import { ScoreSystem } from '../systems/ScoreSystem';
import { FuelSystem } from '../systems/FuelSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { PlayerVehicle } from '../entities/PlayerVehicle';
import { AudioManager } from '../audio/AudioManager';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { Renderer } from '../rendering/Renderer';
import { storageService } from '../services/StorageService';
import { achievementService } from '../services/AchievementService';
import { dailyChallengeService } from '../services/DailyChallengeService';
import { DailyChallengeDefinition } from '../config/DailyConfig';
import { VEHICLE_DEFINITIONS, VehicleId } from '../config/VehicleConfig';
import { analytics } from '../services/AnalyticsService';
import { adService } from '../services/MockAdService';
import { ScoreCardData } from '../utils/ScoreCardGenerator';
import { LevelSystem } from '../systems/LevelSystem';
import { BrakeSystem } from '../systems/BrakeSystem';

export class Game {
  public canvas: HTMLCanvasElement;
  public stateManager: StateManager;
  public gameLoop: GameLoop;
  public laneSystem: LaneSystem;
  public inputSystem: InputSystem;
  public player: PlayerVehicle;
  public spawner: SpawnerSystem;
  public collisionSystem: CollisionSystem;
  public closeShaveSystem: CloseShaveSystem;
  public scoreSystem: ScoreSystem;
  public fuelSystem: FuelSystem;
  public difficultySystem: DifficultySystem;
  public levelSystem: LevelSystem;
  public brakeSystem: BrakeSystem;
  public audio: AudioManager;
  public particleSystem: ParticleSystem;
  public renderer: Renderer;

  private container: HTMLElement;
  private width = 0;
  private height = 0;
  private runSessionCount = 0;
  private hasRevivedThisRun = false;

  // Prompt 2: Product & Challenge state
  public isDailyChallenge: boolean = false;
  public currentDailyChallenge: DailyChallengeDefinition | null = null;
  private exhaustTimer = 0;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.container = container;

    // 1. Core State & Audio
    this.stateManager = new StateManager();
    this.audio = new AudioManager(
      storageService.isSoundMuted(),
      storageService.isMusicMuted()
    );

    // 2. Systems Setup
    this.laneSystem = new LaneSystem(GAME_CONFIG.BASE_WIDTH);
    const initialVehicle = storageService.getSelectedVehicle();
    this.player = new PlayerVehicle(this.laneSystem, initialVehicle);
    this.spawner = new SpawnerSystem(this.laneSystem);
    this.collisionSystem = new CollisionSystem();
    this.closeShaveSystem = new CloseShaveSystem();
    this.scoreSystem = new ScoreSystem(storageService.getHighScore());
    this.fuelSystem = new FuelSystem();
    this.difficultySystem = new DifficultySystem();
    this.levelSystem = new LevelSystem();
    this.brakeSystem = new BrakeSystem(initialVehicle);
    this.particleSystem = new ParticleSystem();
    this.renderer = new Renderer(canvas);
    this.inputSystem = new InputSystem();

    // 3. Game Loop
    this.gameLoop = new GameLoop(
      this.update.bind(this),
      this.render.bind(this)
    );

    // 4. Bind Events & Resize
    this.setupListeners();
    this.resize();

    analytics.track('game_loaded', {
      device_pixel_ratio: window.devicePixelRatio || 1,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight
    });
  }

  public init(): void {
    this.inputSystem.attach(this.container);
    this.gameLoop.start();
  }

  public destroy(): void {
    this.gameLoop.stop();
    this.audio.stopMusic();
    this.inputSystem.detach();
    eventBus.clear();
  }

  private setupListeners(): void {
    window.addEventListener('resize', () => this.resize());

    // Input Events
    eventBus.on('input:lane_change', (direction: -1 | 1) => {
      if (this.stateManager.is('PLAYING')) {
        const moved = this.player.changeLane(direction);
        if (moved) {
          this.audio.playLaneChange();
        }
      }
    });

    eventBus.on('input:toggle_pause', () => {
      if (this.stateManager.is('PLAYING')) {
        this.pause();
      } else if (this.stateManager.is('PAUSED')) {
        this.resume();
      }
    });

    // Close Shave Event
    eventBus.on('game:close_shave', (payload: any) => {
      const result = this.scoreSystem.recordCloseShave();
      storageService.incrementCloseShaves(1);
      storageService.updateBestCombo(result.multiplier);

      // Inform audio engine of new combo level for dynamic stem activation
      this.audio.setComboMultiplier(result.multiplier);
      this.audio.playCloseShave(result.multiplier);

      this.renderer.triggerScreenShake(
        GAME_CONFIG.CLOSE_SHAVE_SHAKE_INTENSITY,
        GAME_CONFIG.CLOSE_SHAVE_SHAKE_DURATION
      );

      const label = result.multiplier > 1 ? `${result.multiplier}x COMBO!` : 'CLOSE SHAVE!';
      this.particleSystem.spawnCloseShaveBurst(payload.x, payload.y, label);

      // Check achievement unlocked
      if (result.multiplier >= 5) {
        achievementService.checkAndAward('combo_5x');
      }
      if (result.multiplier >= 10) {
        achievementService.checkAndAward('combo_10x');
      }
      achievementService.checkAndAward('first_close_shave');

      analytics.track('close_shave', {
        multiplier: result.multiplier,
        points: result.points,
        obstacle_type: payload.vehicle.type
      });
    });

    // Combo lost reset
    eventBus.on('score:combo_lost', () => {
      this.audio.setComboMultiplier(1);
    });

    // Fuel Events
    eventBus.on('fuel:empty', () => {
      if (this.stateManager.is('PLAYING')) {
        this.handleGameOver('FUEL_EMPTY');
      }
    });

    // Brake Events
    eventBus.on('input:brake_start', () => {
      if (this.stateManager.is('PLAYING')) {
        this.brakeSystem.pressBrake();
      }
    });

    eventBus.on('input:brake_end', () => {
      this.brakeSystem.releaseBrake();
    });

    eventBus.on('brake:start', () => {
      this.audio.playBrakeSound();
    });

    // Level Progression Events
    eventBus.on('level:changed', (payload: any) => {
      this.renderer.setLevelTheme(payload.current.environmentTheme);
      this.audio.playLevelUp();
      this.particleSystem.addFloatingText(
        this.player.x,
        this.player.y - 60,
        `LEVEL UP: ${payload.current.name.toUpperCase()}!`,
        '#38BDF8',
        22
      );
      if (payload.rewardKobo > 0) {
        this.scoreSystem.addKobo(payload.rewardKobo);
        this.particleSystem.spawnKoboSparkle(this.player.x, this.player.y - 70);
        this.particleSystem.addFloatingText(
          this.player.x,
          this.player.y - 85,
          `+${payload.rewardKobo} KOBO BONUS!`,
          '#FBBF24',
          18
        );
      }
    });
  }

  public resize(): void {
    const rect = this.container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    }

    this.laneSystem.updateDimensions(this.width);
    this.player.y = this.height - 130;
    this.player.x = this.laneSystem.getLaneCenter(this.player.targetLane);
  }

  public setPlayerVehicle(vehicleId: VehicleId): void {
    this.player.setVehicle(vehicleId);
    this.brakeSystem.setVehicle(vehicleId);
  }

  public startRun(dailyChallenge?: DailyChallengeDefinition): void {
    this.audio.init();
    this.audio.playButton();

    this.runSessionCount++;
    this.hasRevivedThisRun = false;
    this.isDailyChallenge = !!dailyChallenge;
    this.currentDailyChallenge = dailyChallenge || null;

    // Apply vehicle configuration
    const vehicleId = dailyChallenge?.modifiers.forcedVehicle || storageService.getSelectedVehicle();
    this.player.setVehicle(vehicleId);
    this.player.reset();
    this.player.y = this.height - 130;
    this.player.x = this.laneSystem.getLaneCenter(1);

    this.spawner.reset();
    this.scoreSystem.reset();
    this.fuelSystem.reset();
    this.difficultySystem.reset();
    this.levelSystem.reset(1);
    this.renderer.setLevelTheme(this.levelSystem.getCurrentLevel().environmentTheme);
    this.brakeSystem.reset(vehicleId);
    this.particleSystem.reset();

    // Apply modifiers from Vehicle & Daily Challenge
    const fuelMultiplier = this.player.definition.fuelEfficiency * (dailyChallenge?.modifiers.fuelDrainMultiplier || 1.0);
    this.fuelSystem.setDrainMultiplier(fuelMultiplier);

    const scoreMultiplier = this.player.definition.scoreModifier * (dailyChallenge?.modifiers.scoreBonusMultiplier || 1.0);
    this.scoreSystem.setBonusMultiplier(scoreMultiplier);

    // Start Dynamic Afrobeat Music & Sequencer
    this.audio.startMusic();
    this.audio.setComboMultiplier(1);

    this.stateManager.setState('PLAYING');

    analytics.track('game_started', {
      session_id: this.runSessionCount,
      vehicle: vehicleId,
      is_daily: this.isDailyChallenge,
      daily_id: dailyChallenge?.typeId || 'standard_run',
      high_score_to_beat: this.scoreSystem.highScore
    });
  }

  public pause(): void {
    if (this.stateManager.is('PLAYING')) {
      this.stateManager.setState('PAUSED');
      this.audio.stopMusic();
      analytics.track('game_paused');
    }
  }

  public resume(): void {
    if (this.stateManager.is('PAUSED')) {
      this.stateManager.setState('PLAYING');
      this.audio.startMusic();
      this.audio.setComboMultiplier(this.scoreSystem.getMultiplier());
      analytics.track('game_resumed');
    }
  }

  private handleGameOver(reason: 'CRASH' | 'FUEL_EMPTY'): void {
    this.audio.stopMusic();
    this.stateManager.setState('GAME_OVER', { reason });

    const finalScore = this.scoreSystem.score;
    const isNewHigh = storageService.saveScore(finalScore);
    storageService.addKobo(this.scoreSystem.koboEarned);
    storageService.updateBestCombo(this.scoreSystem.maxCombo);
    storageService.recordRun(Math.round(this.scoreSystem.distance));

    // Daily Challenge Record
    if (this.isDailyChallenge) {
      const todayKey = dailyChallengeService.getTodayKey();
      storageService.saveDailyHighScore(todayKey, finalScore);
    }

    // Celebration Confetti for great run
    if (isNewHigh || finalScore > 3000) {
      this.particleSystem.spawnConfetti(this.player.x, this.player.y - 40);
    }

    // Evaluate Achievements
    achievementService.checkRunAchievements({
      score: finalScore,
      maxCombo: this.scoreSystem.maxCombo,
      closeShavesCount: this.scoreSystem.closeShavesCount,
      isDaily: this.isDailyChallenge
    });

    analytics.track('game_over', {
      reason,
      score: finalScore,
      is_new_high: isNewHigh,
      close_shaves: this.scoreSystem.closeShavesCount,
      max_combo: this.scoreSystem.maxCombo,
      kobo_earned: this.scoreSystem.koboEarned,
      distance: Math.round(this.scoreSystem.distance),
      vehicle: this.player.definition.id,
      is_daily: this.isDailyChallenge
    });

    // Frequency-capped mock ad
    if (this.runSessionCount >= 3) {
      adService.showInterstitial();
    }
  }

  public async revive(): Promise<boolean> {
    if (this.hasRevivedThisRun || !this.stateManager.is('GAME_OVER')) {
      return false;
    }

    this.stateManager.setState('REVIVING');
    const adWatched = await adService.showRewardedAd('revive_run');

    if (adWatched) {
      this.hasRevivedThisRun = true;

      const safeRadius = 340;
      this.spawner.getActiveTraffic().forEach(v => {
        if (Math.abs(v.y - this.player.y) < safeRadius) {
          v.active = false;
        }
      });

      this.fuelSystem.addFuel(50);
      this.player.setInvulnerable(3.0);
      this.audio.startMusic();
      this.audio.setComboMultiplier(1);
      this.stateManager.setState('PLAYING');
      this.particleSystem.addFloatingText(this.player.x, this.player.y - 40, 'REVIVED! 3s SHIELD', '#34D399', 22);

      return true;
    } else {
      this.stateManager.setState('GAME_OVER');
      return false;
    }
  }

  public canRevive(): boolean {
    return !this.hasRevivedThisRun && this.scoreSystem.score > 200;
  }

  public getScoreCardData(): ScoreCardData {
    return {
      score: this.scoreSystem.score,
      highScore: storageService.getHighScore(),
      koboEarned: this.scoreSystem.koboEarned,
      maxCombo: this.scoreSystem.maxCombo,
      closeShaves: this.scoreSystem.closeShavesCount,
      distance: Math.round(this.scoreSystem.distance),
      vehicle: this.player.definition,
      isDailyChallenge: this.isDailyChallenge,
      dailyChallengeName: this.currentDailyChallenge?.name,
      levelReached: this.levelSystem.getCurrentLevel().id,
      levelName: this.levelSystem.getCurrentLevel().name
    };
  }

  private update(dt: number): void {
    if (!this.stateManager.is('PLAYING')) {
      this.particleSystem.update(dt);
      return;
    }

    // 1. Brake System Update & Player Visual Sync
    this.brakeSystem.update(dt);
    this.player.isBraking = this.brakeSystem.isBraking();
    this.player.brakeFactor = this.brakeSystem.currentBrakeFactor;

    // 2. Level Progression Evaluation
    this.levelSystem.update(this.scoreSystem.distance);

    // 3. Difficulty & Dynamic Speed
    this.difficultySystem.update(dt);
    let speed = this.difficultySystem.currentSpeed *
                this.player.definition.maxSpeedMultiplier *
                this.levelSystem.getSpeedMultiplier() *
                this.brakeSystem.getEffectiveSpeedMultiplier();

    if (this.currentDailyChallenge) {
      speed *= this.currentDailyChallenge.modifiers.speedMultiplier;
    }

    // Dynamic fuel drain adjusted for level
    const dynamicFuelDrain = this.player.definition.fuelEfficiency *
                             (this.currentDailyChallenge?.modifiers.fuelDrainMultiplier || 1.0) *
                             this.levelSystem.getFuelDrainMultiplier();
    this.fuelSystem.setDrainMultiplier(dynamicFuelDrain);

    // 4. Systems Update
    this.renderer.update(dt, speed);
    this.player.update(dt, speed);
    this.fuelSystem.update(dt);
    this.scoreSystem.update(dt, speed);
    this.particleSystem.update(dt);

    // 5. Exhaust smoke puffs
    this.exhaustTimer += dt;
    if (this.exhaustTimer >= 0.14) {
      this.exhaustTimer = 0;
      this.particleSystem.spawnExhaustPuff(
        this.player.x - 4,
        this.player.y + this.player.height / 2 + 2
      );
    }

    const activeTraffic = this.spawner.getActiveTraffic();
    const activeCollectibles = this.spawner.getActiveCollectibles();

    // 6. Traffic Movement
    for (let i = 0; i < activeTraffic.length; i++) {
      activeTraffic[i].update(dt, speed);
    }

    // 7. Collectibles Movement
    for (let i = 0; i < activeCollectibles.length; i++) {
      activeCollectibles[i].update(dt, speed);
    }

    // 8. Spawner (Level-Aware Density & Spawning)
    this.spawner.update(
      dt,
      this.difficultySystem.elapsedTime,
      speed,
      this.height,
      activeTraffic,
      activeCollectibles,
      this.levelSystem.getMaxTrafficDensity(),
      this.levelSystem.getSpawnRateMultiplier(),
      this.levelSystem.getCurrentLevel().availableTrafficTypes
    );

    // 7. Close Shave Proximity Check
    this.closeShaveSystem.checkCloseShaves(this.player, activeTraffic);

    // 8. Fatal Collision Check
    const crashedVehicle = this.collisionSystem.checkPlayerTrafficCollision(this.player, activeTraffic);
    if (crashedVehicle) {
      this.audio.playCrash();
      this.renderer.triggerScreenShake(
        GAME_CONFIG.SCREEN_SHAKE_INTENSITY,
        GAME_CONFIG.SCREEN_SHAKE_DURATION
      );
      this.particleSystem.spawnCollisionSparks(this.player.x, this.player.y - 20);
      this.handleGameOver('CRASH');
      return;
    }

    // 9. Collectible Pickups
    const pickedItems = this.collisionSystem.checkCollectibles(this.player, activeCollectibles);
    for (let i = 0; i < pickedItems.length; i++) {
      const item = pickedItems[i];
      item.active = false;

      if (item.type === 'KOBO') {
        this.scoreSystem.addKobo(GAME_CONFIG.KOBO_VALUE);
        this.audio.playKoboPickup();
        this.particleSystem.spawnKoboSparkle(item.x, item.y);
        this.particleSystem.addFloatingText(item.x, item.y, `+${GAME_CONFIG.KOBO_VALUE} ₦`, '#FBBF24', 16);
      } else if (item.type === 'FUEL') {
        this.fuelSystem.addFuel(GAME_CONFIG.FUEL_PICKUP_AMOUNT);
        this.audio.playFuelPickup();
        this.particleSystem.spawnFuelSplash(item.x, item.y);
        this.particleSystem.addFloatingText(item.x, item.y, '+FUEL', '#34D399', 16);
      }
    }
  }

  private render(): void {
    let speed = this.difficultySystem.currentSpeed;
    if (this.currentDailyChallenge) {
      speed *= this.currentDailyChallenge.modifiers.speedMultiplier;
    }

    this.renderer.render(
      this.width,
      this.height,
      this.laneSystem,
      this.player,
      this.spawner.getActiveTraffic(),
      this.spawner.getActiveCollectibles(),
      this.particleSystem,
      this.scoreSystem.getMultiplier(),
      speed
    );
  }

  public getLevelInfo() {
    return {
      current: this.levelSystem.getCurrentLevel(),
      progress: this.levelSystem.getLevelProgress(this.scoreSystem.distance),
      koboMultiplier: this.levelSystem.getKoboMultiplier()
    };
  }

  public getBrakeInfo() {
    return this.brakeSystem.getBrakeStatus();
  }

  public getStats(): PlayerStats {
    return {
      score: this.scoreSystem.score,
      highScore: this.scoreSystem.highScore,
      koboEarned: this.scoreSystem.koboEarned,
      totalKobo: storageService.getTotalKobo() + this.scoreSystem.koboEarned,
      distance: Math.round(this.scoreSystem.distance),
      closeShaves: this.scoreSystem.closeShavesCount,
      maxCombo: this.scoreSystem.maxCombo,
      currentCombo: this.scoreSystem.getMultiplier(),
      comboTimer: this.scoreSystem.comboTimer,
      fuel: this.fuelSystem.getPercentage(),
      isInvulnerable: this.player.isInvulnerable,
      invulnerabilityTimer: this.player.invulnerabilityTimer
    };
  }
}
