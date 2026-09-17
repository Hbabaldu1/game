import { firebaseService } from './FirebaseService';

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  playerName: string;
  score: number;
  distance: number;
  closeShaves: number;
  vehicle: string;
  levelReached: number;
  date: string;
  isPlayer?: boolean;
}

const DEFAULT_LAGOS_LEGENDS: LeaderboardEntry[] = [
  { id: '1', playerName: 'Ketu_Drifter_99', score: 18450, distance: 3420, closeShaves: 28, vehicle: 'DANFO', levelReached: 5, date: 'Today' },
  { id: '2', playerName: 'Iyana_Ipaja_Express', score: 14200, distance: 2890, closeShaves: 22, vehicle: 'OKADA', levelReached: 4, date: 'Today' },
  { id: '3', playerName: 'Ojota_Speedster', score: 11850, distance: 2310, closeShaves: 19, vehicle: 'DANFO', levelReached: 4, date: 'Yesterday' },
  { id: '4', playerName: 'Lekki_Toll_Runner', score: 9400, distance: 1940, closeShaves: 15, vehicle: 'KEKE', levelReached: 3, date: 'Yesterday' },
  { id: '5', playerName: 'Oshodi_No_Brakes', score: 7950, distance: 1620, closeShaves: 12, vehicle: 'OKADA', levelReached: 3, date: '2 days ago' },
  { id: '6', playerName: 'Mile12_Merchant', score: 6200, distance: 1300, closeShaves: 9, vehicle: 'DANFO', levelReached: 2, date: '3 days ago' },
  { id: '7', playerName: 'Eko_Bridge_King', score: 4800, distance: 1050, closeShaves: 7, vehicle: 'KEKE', levelReached: 2, date: '3 days ago' },
  { id: '8', playerName: 'CMS_Conductor', score: 3500, distance: 820, closeShaves: 5, vehicle: 'DANFO', levelReached: 1, date: '4 days ago' }
];

const STORAGE_KEY_LEADERBOARD = 'danfo_local_leaderboard';
const STORAGE_KEY_PLAYER_TAG = 'danfo_player_tag';

export class LeaderboardService {
  private localScores: LeaderboardEntry[] = [];
  private playerTag: string = '';

  constructor() {
    this.loadPlayerTag();
    this.loadLocalScores();
  }

  private loadPlayerTag(): void {
    const saved = localStorage.getItem(STORAGE_KEY_PLAYER_TAG);
    if (saved) {
      this.playerTag = saved;
    } else {
      const randomNum = Math.floor(100 + Math.random() * 900);
      this.playerTag = `DanfoDriver_${randomNum}`;
      localStorage.setItem(STORAGE_KEY_PLAYER_TAG, this.playerTag);
    }
  }

  public getPlayerTag(): string {
    return this.playerTag;
  }

  public setPlayerTag(tag: string): void {
    const cleaned = tag.trim().slice(0, 16) || `DanfoDriver_${Math.floor(100 + Math.random() * 900)}`;
    this.playerTag = cleaned;
    localStorage.setItem(STORAGE_KEY_PLAYER_TAG, cleaned);
  }

  private loadLocalScores(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      if (data) {
        this.localScores = JSON.parse(data);
      } else {
        this.localScores = [...DEFAULT_LAGOS_LEGENDS];
        localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(this.localScores));
      }
    } catch {
      this.localScores = [...DEFAULT_LAGOS_LEGENDS];
    }
  }

  public async getScores(filter: 'ALL_TIME' | 'DAILY' = 'ALL_TIME'): Promise<LeaderboardEntry[]> {
    // Try fetching from Cloud first
    let cloudList: LeaderboardEntry[] = [];
    try {
      cloudList = await firebaseService.getCloudLeaderboard(15);
    } catch {
      cloudList = [];
    }

    // Merge Cloud with Local Scores
    const mergedMap = new Map<string, LeaderboardEntry>();

    // Add local scores first
    this.localScores.forEach(entry => {
      mergedMap.set(`${entry.playerName}_${entry.score}`, entry);
    });

    // Overlay live cloud scores
    cloudList.forEach(entry => {
      mergedMap.set(`${entry.playerName}_${entry.score}`, entry);
    });

    let list = Array.from(mergedMap.values());

    if (filter === 'DAILY') {
      const todayList = list.filter(item => item.date === 'Today');
      if (todayList.length >= 3) {
        list = todayList;
      }
    }

    list.sort((a, b) => b.score - a.score);

    return list.slice(0, 12).map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isPlayer: entry.playerName === this.playerTag || entry.isPlayer
    }));
  }

  public async submitScore(entry: Omit<LeaderboardEntry, 'id' | 'rank' | 'date'>): Promise<LeaderboardEntry> {
    const newEntry: LeaderboardEntry = {
      id: `score_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerName: entry.playerName || this.playerTag,
      score: entry.score,
      distance: entry.distance,
      closeShaves: entry.closeShaves,
      vehicle: entry.vehicle,
      levelReached: entry.levelReached,
      date: 'Today',
      isPlayer: true
    };

    // Save locally immediately
    this.localScores.push(newEntry);
    this.localScores.sort((a, b) => b.score - a.score);
    this.localScores = this.localScores.slice(0, 30);

    try {
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(this.localScores));
    } catch {
      // Ignore quota storage errors
    }

    // Submit to Cloud Firestore asynchronously (offline safe)
    firebaseService.submitCloudScore({
      playerName: newEntry.playerName,
      score: newEntry.score,
      distance: newEntry.distance,
      closeShaves: newEntry.closeShaves,
      vehicle: newEntry.vehicle,
      levelReached: newEntry.levelReached
    }).catch(err => {
      console.warn('[Leaderboard] Cloud submission deferred/failed:', err);
    });

    return newEntry;
  }
}

export const leaderboardService = new LeaderboardService();
