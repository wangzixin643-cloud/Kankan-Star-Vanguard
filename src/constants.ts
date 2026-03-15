import { EnemyType, Achievement } from './types';

export const PLAYER_RADIUS = 20;
export const PLAYER_SPEED = 5;
export const PLAYER_MAX_HEALTH = 3;
export const INVINCIBLE_DURATION = 120; // frames

export const BULLET_RADIUS = 4;
export const BULLET_SPEED = 8;

export const ENEMY_CONFIGS = {
  [EnemyType.BASIC]: {
    radius: 18,
    speed: 2,
    health: 1,
    scoreValue: 100,
    color: '#3b82f6' // blue-500
  },
  [EnemyType.FAST]: {
    radius: 14,
    speed: 4,
    health: 1,
    scoreValue: 200,
    color: '#f59e0b' // amber-500
  },
  [EnemyType.HEAVY]: {
    radius: 25,
    speed: 1.2,
    health: 3,
    scoreValue: 500,
    color: '#ef4444' // red-500
  }
};

export const POWERUP_RADIUS = 15;
export const POWERUP_DURATION = 600; // 10 seconds at 60fps

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_blood', title: '第一滴血', description: '摧毁第一架敌机', unlocked: false },
  { id: 'survivor', title: '生存者', description: '达到第5关', unlocked: false },
  { id: 'sharpshooter', title: '神枪手', description: '单局发射超过500发子弹', unlocked: false },
  { id: 'collector', title: '收集者', description: '收集5个道具', unlocked: false },
  { id: 'unstoppable', title: '势不可挡', description: '分数超过10000分', unlocked: false }
];
