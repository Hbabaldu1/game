export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'REVIVING';

export type TrafficType = 'SEDAN' | 'DANFO' | 'TRUCK' | 'HAZARD_CAR';

export type CollectibleType = 'KOBO' | 'FUEL' | 'SHIELD';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerStats {
  score: number;
  highScore: number;
  koboEarned: number;
  totalKobo: number;
  distance: number;
  closeShaves: number;
  maxCombo: number;
  currentCombo: number;
  comboTimer: number;
  fuel: number;
  isInvulnerable: boolean;
  invulnerabilityTimer: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  opacity: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  shape?: 'circle' | 'rect' | 'spark';
}
