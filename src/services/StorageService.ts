import { VehicleId } from '../config/VehicleConfig';

export interface PersistentData {
  highScore: number;
  totalKobo: number;
  bestCombo: number;
  totalCloseShaves: number;
  totalRuns: number;
  totalDistance: number;
  soundMuted: boolean;
  musicMuted: boolean;
  tutorialCompleted: boolean;
  ownedVehicles: VehicleId[];
  selectedVehicle: VehicleId;
  unlockedAchievements: Record<string, number>; // id -> timestamp
  dailyHighScores: Record<string, number>; // dateKey -> score
}

const STORAGE_KEY = 'danfo_drift_save_v2';
const LEGACY_STORAGE_KEY = 'danfo_drift_save_v1';

export class StorageService {
  private static instance: StorageService;
  private data: PersistentData;

  private constructor() {
    this.data = this.load();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private load(): PersistentData {
    const defaults: PersistentData = {
      highScore: 0,
      totalKobo: 0,
      bestCombo: 1,
      totalCloseShaves: 0,
      totalRuns: 0,
      totalDistance: 0,
      soundMuted: false,
      musicMuted: false,
      tutorialCompleted: false,
      ownedVehicles: ['DANFO'],
      selectedVehicle: 'DANFO',
      unlockedAchievements: {},
      dailyHighScores: {}
    };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaults,
          ...parsed
        };
      }

      // Check legacy v1 save to preserve player progress
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        const upgraded: PersistentData = {
          ...defaults,
          highScore: parsedLegacy.highScore || 0,
          totalKobo: parsedLegacy.totalKobo || 0,
          bestCombo: parsedLegacy.bestCombo || 1,
          totalCloseShaves: parsedLegacy.totalCloseShaves || 0,
          soundMuted: !!parsedLegacy.soundMuted
        };
        this.data = upgraded;
        this.save();
        return upgraded;
      }
    } catch (err) {
      console.warn('[StorageService] Unable to read localStorage:', err);
    }

    return defaults;
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.warn('[StorageService] Unable to write to localStorage:', err);
    }
  }

  // --- High Score & Stats ---
  public getHighScore(): number {
    return this.data.highScore;
  }

  public saveScore(score: number): boolean {
    if (score > this.data.highScore) {
      this.data.highScore = score;
      this.save();
      return true;
    }
    return false;
  }

  public getTotalKobo(): number {
    return this.data.totalKobo;
  }

  public addKobo(amount: number): number {
    this.data.totalKobo += amount;
    this.save();
    return this.data.totalKobo;
  }

  public deductKobo(amount: number): boolean {
    if (this.data.totalKobo >= amount) {
      this.data.totalKobo -= amount;
      this.save();
      return true;
    }
    return false;
  }

  public getBestCombo(): number {
    return this.data.bestCombo;
  }

  public updateBestCombo(combo: number): void {
    if (combo > this.data.bestCombo) {
      this.data.bestCombo = combo;
      this.save();
    }
  }

  public incrementCloseShaves(count = 1): number {
    this.data.totalCloseShaves += count;
    this.save();
    return this.data.totalCloseShaves;
  }

  public getTotalCloseShaves(): number {
    return this.data.totalCloseShaves;
  }

  public recordRun(distance: number): void {
    this.data.totalRuns += 1;
    this.data.totalDistance += distance;
    this.save();
  }

  public getTotalRuns(): number {
    return this.data.totalRuns;
  }

  public getTotalDistance(): number {
    return this.data.totalDistance;
  }

  // --- Audio & Settings ---
  public isSoundMuted(): boolean {
    return this.data.soundMuted;
  }

  public setSoundMuted(muted: boolean): void {
    this.data.soundMuted = muted;
    this.save();
  }

  public isMusicMuted(): boolean {
    return this.data.musicMuted;
  }

  public setMusicMuted(muted: boolean): void {
    this.data.musicMuted = muted;
    this.save();
  }

  public isTutorialCompleted(): boolean {
    return this.data.tutorialCompleted;
  }

  public setTutorialCompleted(completed: boolean): void {
    this.data.tutorialCompleted = completed;
    this.save();
  }

  // --- Garage & Vehicles ---
  public getOwnedVehicles(): VehicleId[] {
    return [...this.data.ownedVehicles];
  }

  public isVehicleOwned(id: VehicleId): boolean {
    return this.data.ownedVehicles.includes(id);
  }

  public unlockVehicle(id: VehicleId, cost: number): boolean {
    if (this.isVehicleOwned(id)) return true;
    if (this.deductKobo(cost)) {
      this.data.ownedVehicles.push(id);
      this.save();
      return true;
    }
    return false;
  }

  public getSelectedVehicle(): VehicleId {
    return this.data.selectedVehicle || 'DANFO';
  }

  public setSelectedVehicle(id: VehicleId): void {
    if (this.isVehicleOwned(id)) {
      this.data.selectedVehicle = id;
      this.save();
    }
  }

  // --- Achievements ---
  public isAchievementUnlocked(id: string): boolean {
    return !!this.data.unlockedAchievements[id];
  }

  public unlockAchievement(id: string): boolean {
    if (this.data.unlockedAchievements[id]) {
      return false; // Already unlocked
    }
    this.data.unlockedAchievements[id] = Date.now();
    this.save();
    return true;
  }

  public getUnlockedAchievements(): Record<string, number> {
    return { ...this.data.unlockedAchievements };
  }

  // --- Daily Challenge ---
  public getDailyHighScore(dateKey: string): number {
    return this.data.dailyHighScores[dateKey] || 0;
  }

  public saveDailyHighScore(dateKey: string, score: number): boolean {
    const prev = this.data.dailyHighScores[dateKey] || 0;
    if (score > prev) {
      this.data.dailyHighScores[dateKey] = score;
      this.save();
      return true;
    }
    return false;
  }
}

export const storageService = StorageService.getInstance();
