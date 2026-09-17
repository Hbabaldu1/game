import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { getAuth, signInAnonymously, Auth, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { LeaderboardEntry } from './LeaderboardService';

export class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private auth: Auth | null = null;
  private currentUser: User | null = null;
  private isOnline: boolean = false;
  private initPromise: Promise<boolean> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<boolean> {
    try {
      if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
        console.warn('[Firebase] Incomplete Firebase configuration');
        return false;
      }

      this.app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

      // Use specific databaseId if specified in config
      if (firebaseConfig.firestoreDatabaseId) {
        this.db = getFirestore(this.app, firebaseConfig.firestoreDatabaseId);
      } else {
        this.db = getFirestore(this.app);
      }

      this.auth = getAuth(this.app);

      // Anonymous authentication for frictionless player identity
      try {
        const userCred = await signInAnonymously(this.auth);
        this.currentUser = userCred.user;
      } catch (authErr) {
        console.warn('[Firebase Auth] Anonymous sign-in notice (running offline/guest):', authErr);
      }

      // Test connection as instructed by Firestore protocol
      try {
        await getDocFromServer(doc(this.db, 'test', 'connection'));
        this.isOnline = true;
      } catch (connErr) {
        // Even if connection check errors (e.g. document doesn't exist), we are connected to server
        if (connErr instanceof Error && connErr.message.includes('the client is offline')) {
          this.isOnline = false;
        } else {
          this.isOnline = true;
        }
      }

      return true;
    } catch (err) {
      console.warn('[Firebase] Initialized in offline fallback mode:', err);
      this.isOnline = false;
      return false;
    }
  }

  public getUserId(): string {
    return this.currentUser?.uid || 'guest_local';
  }

  public isCloudConnected(): boolean {
    return this.isOnline && this.db !== null;
  }

  /**
   * Fetch live high scores from Firestore
   */
  public async getCloudLeaderboard(limitCount: number = 20): Promise<LeaderboardEntry[]> {
    await this.initPromise;
    if (!this.db || !navigator.onLine) {
      return [];
    }

    try {
      const col = collection(this.db, 'leaderboard');
      const q = query(col, orderBy('score', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);

      const list: LeaderboardEntry[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          playerName: d.playerName || 'Express Driver',
          score: d.score || 0,
          distance: d.distance || 0,
          closeShaves: d.closeShaves || 0,
          vehicle: d.vehicle || 'DANFO',
          levelReached: d.levelReached || 1,
          date: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : 'Recent',
          isPlayer: d.userId === this.currentUser?.uid
        });
      });

      return list;
    } catch (err) {
      console.warn('[Firebase] Error reading cloud leaderboard:', err);
      return [];
    }
  }

  /**
   * Post run score to Firestore
   */
  public async submitCloudScore(entry: {
    playerName: string;
    score: number;
    distance: number;
    closeShaves: number;
    vehicle: string;
    levelReached: number;
  }): Promise<boolean> {
    await this.initPromise;
    if (!this.db || !this.currentUser) {
      return false;
    }

    try {
      const col = collection(this.db, 'leaderboard');
      await addDoc(col, {
        playerName: entry.playerName.trim().slice(0, 20),
        score: entry.score,
        distance: entry.distance,
        closeShaves: entry.closeShaves,
        vehicle: entry.vehicle,
        levelReached: entry.levelReached,
        userId: this.currentUser.uid,
        createdAt: Date.now()
      });
      return true;
    } catch (err) {
      console.warn('[Firebase] Could not submit score to cloud (offline fallback active):', err);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
