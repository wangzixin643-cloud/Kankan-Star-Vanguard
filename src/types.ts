export enum GameState {
  START,
  PLAYING,
  PAUSED,
  GAME_OVER
}

export enum EnemyType {
  BASIC = 'BASIC',
  FAST = 'FAST',
  HEAVY = 'HEAVY'
}

export enum PowerUpType {
  TRIPLE_SHOT = 'TRIPLE_SHOT',
  SHIELD = 'SHIELD'
}

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  radius: number;
  color: string;
}

export interface Player extends Entity {
  speed: number;
  health: number;
  maxHealth: number;
  invincible: boolean;
  invincibleTimer: number;
  shieldActive: boolean;
  tripleShotTimer: number;
}

export interface Bullet extends Entity {
  vx: number;
  vy: number;
  damage: number;
}

export interface Enemy extends Entity {
  type: EnemyType;
  vx: number;
  vy: number;
  health: number;
  scoreValue: number;
  speed: number;
}

export interface PowerUp extends Entity {
  type: PowerUpType;
  vy: number;
}

export interface Particle extends Entity {
  vx: number;
  vy: number;
  alpha: number;
  life: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface GameStats {
  score: number;
  level: number;
  enemiesDestroyed: number;
  bulletsFired: number;
  powerUpsCollected: number;
}
