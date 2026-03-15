import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy, 
  Shield, 
  Zap, 
  Info, 
  Gamepad2,
  Heart,
  Target,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GameState, 
  EnemyType, 
  PowerUpType, 
  Player, 
  Bullet, 
  Enemy, 
  PowerUp, 
  Particle, 
  Achievement, 
  GameStats 
} from './types';
import { 
  PLAYER_RADIUS, 
  PLAYER_SPEED, 
  PLAYER_MAX_HEALTH, 
  INVINCIBLE_DURATION,
  BULLET_RADIUS,
  BULLET_SPEED,
  ENEMY_CONFIGS,
  POWERUP_RADIUS,
  POWERUP_DURATION,
  INITIAL_ACHIEVEMENTS
} from './constants';

// Asset URLs - 替换这些链接为您自己的图片路径
const ASSET_URLS = {
  player: '/主角战机-removebg-preview.png', // 使用您上传的主角战机图片
  enemyBasic: '/敌机-removebg-preview.png', // 使用您上传的敌机图片
  enemyFast: '/敌机-removebg-preview.png',
  enemyHeavy: '/敌机-removebg-preview.png',
  powerupTriple: 'https://picsum.photos/seed/powerup1/60/60',
  powerupShield: 'https://picsum.photos/seed/powerup2/60/60',
  background: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?auto=format&fit=crop&w=1920&q=80' // 背景图
};

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(PLAYER_MAX_HEALTH);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [activeAchievements, setActiveAchievements] = useState<Achievement[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  // Refs for game engine
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);
  const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({});
  
  // Asset Loading
  useEffect(() => {
    let loadedCount = 0;
    const totalAssets = Object.keys(ASSET_URLS).length;
    
    Object.entries(ASSET_URLS).forEach(([key, url]) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === totalAssets) setAssetsLoaded(true);
      };
      imagesRef.current[key] = img;
    });
  }, []);
  const playerRef = useRef<Player>({
    x: 0, y: 0, radius: PLAYER_RADIUS, color: '#10b981', 
    speed: PLAYER_SPEED, health: PLAYER_MAX_HEALTH, maxHealth: PLAYER_MAX_HEALTH,
    invincible: false, invincibleTimer: 0, shieldActive: false, tripleShotTimer: 0
  });
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const statsRef = useRef<GameStats>({
    score: 0, level: 1, enemiesDestroyed: 0, bulletsFired: 0, powerUpsCollected: 0
  });

  // Initialize player position
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
        if (gameState === GameState.START) {
          playerRef.current.x = canvasRef.current.width / 2;
          playerRef.current.y = canvasRef.current.height - 100;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [gameState]);

  // Achievement check
  const checkAchievements = useCallback((stats: GameStats) => {
    setAchievements(prev => {
      const next = [...prev];
      let changed = false;

      // First Blood
      if (!next[0].unlocked && stats.enemiesDestroyed >= 1) {
        next[0].unlocked = true;
        setActiveAchievements(a => [...a, next[0]]);
        changed = true;
      }
      // Survivor
      if (!next[1].unlocked && stats.level >= 5) {
        next[1].unlocked = true;
        setActiveAchievements(a => [...a, next[1]]);
        changed = true;
      }
      // Sharpshooter
      if (!next[2].unlocked && stats.bulletsFired >= 500) {
        next[2].unlocked = true;
        setActiveAchievements(a => [...a, next[2]]);
        changed = true;
      }
      // Collector
      if (!next[3].unlocked && stats.powerUpsCollected >= 5) {
        next[3].unlocked = true;
        setActiveAchievements(a => [...a, next[3]]);
        changed = true;
      }
      // Unstoppable
      if (!next[4].unlocked && stats.score >= 10000) {
        next[4].unlocked = true;
        setActiveAchievements(a => [...a, next[4]]);
        changed = true;
      }

      return changed ? next : prev;
    });
  }, []);

  // Clear achievement popup
  useEffect(() => {
    if (activeAchievements.length > 0) {
      const timer = setTimeout(() => {
        setActiveAchievements(prev => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeAchievements]);

  // Game Loop
  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const player = playerRef.current;
    const bullets = bulletsRef.current;
    const enemies = enemiesRef.current;
    const powerUps = powerUpsRef.current;
    const particles = particlesRef.current;

    // 1. Player Movement
    if (keysRef.current['ArrowUp'] || keysRef.current['w']) player.y -= player.speed;
    if (keysRef.current['ArrowDown'] || keysRef.current['s']) player.y += player.speed;
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) player.x -= player.speed;
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) player.x += player.speed;

    // Boundary check
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Player Timers
    if (player.invincible) {
      player.invincibleTimer--;
      if (player.invincibleTimer <= 0) player.invincible = false;
    }
    if (player.tripleShotTimer > 0) player.tripleShotTimer--;

    // 2. Shooting
    if (keysRef.current[' '] && requestRef.current! % 10 === 0) {
      const fireBullet = (vx: number, vy: number, offset: number = 0) => {
        bullets.push({
          x: player.x + offset,
          y: player.y - player.radius,
          radius: BULLET_RADIUS,
          color: '#fbbf24',
          vx,
          vy,
          damage: 1
        });
        statsRef.current.bulletsFired++;
      };

      if (player.tripleShotTimer > 0) {
        fireBullet(0, -BULLET_SPEED);
        fireBullet(-2, -BULLET_SPEED, -10);
        fireBullet(2, -BULLET_SPEED, 10);
      } else {
        fireBullet(0, -BULLET_SPEED);
      }
    }

    // 3. Update Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      if (b.y < -b.radius || b.x < -b.radius || b.x > canvas.width + b.radius) {
        bullets.splice(i, 1);
      }
    }

    // 4. Update Enemies
    if (requestRef.current! % Math.max(20, 60 - statsRef.current.level * 5) === 0) {
      const types = [EnemyType.BASIC, EnemyType.BASIC, EnemyType.FAST, EnemyType.HEAVY];
      const type = types[Math.floor(Math.random() * (statsRef.current.level > 3 ? 4 : 2))];
      const config = ENEMY_CONFIGS[type];
      enemies.push({
        x: Math.random() * (canvas.width - config.radius * 2) + config.radius,
        y: -config.radius,
        radius: config.radius,
        color: config.color,
        type,
        vx: (Math.random() - 0.5) * 1,
        vy: config.speed + (statsRef.current.level * 0.2),
        health: config.health,
        scoreValue: config.scoreValue,
        speed: config.speed
      });
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.x += e.vx;
      e.y += e.vy;

      // Escape check
      if (e.y > canvas.height + e.radius) {
        enemies.splice(i, 1);
        setScore(s => Math.max(0, s - 50));
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 1000);
        continue;
      }

      // Collision with Player
      if (!player.invincible) {
        const dist = Math.hypot(player.x - e.x, player.y - e.y);
        if (dist < player.radius + e.radius) {
          if (player.shieldActive) {
            player.shieldActive = false;
            createExplosion(e.x, e.y, e.color);
            enemies.splice(i, 1);
          } else {
            player.health--;
            setHealth(player.health);
            player.invincible = true;
            player.invincibleTimer = INVINCIBLE_DURATION;
            createExplosion(player.x, player.y, player.color);
            if (player.health <= 0) {
              setGameState(GameState.GAME_OVER);
            }
          }
          continue;
        }
      }

      // Collision with Bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const dist = Math.hypot(e.x - b.x, e.y - b.y);
        if (dist < e.radius + b.radius) {
          e.health -= b.damage;
          bullets.splice(j, 1);
          if (e.health <= 0) {
            createExplosion(e.x, e.y, e.color);
            statsRef.current.score += e.scoreValue;
            statsRef.current.enemiesDestroyed++;
            setScore(statsRef.current.score);
            
            // Spawn PowerUp
            if (Math.random() < 0.1) {
              powerUps.push({
                x: e.x,
                y: e.y,
                radius: POWERUP_RADIUS,
                color: Math.random() > 0.5 ? '#f59e0b' : '#3b82f6',
                type: Math.random() > 0.5 ? PowerUpType.TRIPLE_SHOT : PowerUpType.SHIELD,
                vy: 2
              });
            }

            enemies.splice(i, 1);
            break;
          }
        }
      }
    }

    // 5. Update PowerUps
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.vy;

      if (p.y > canvas.height + p.radius) {
        powerUps.splice(i, 1);
        continue;
      }

      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < player.radius + p.radius) {
        if (p.type === PowerUpType.TRIPLE_SHOT) {
          player.tripleShotTimer = POWERUP_DURATION;
        } else {
          player.shieldActive = true;
        }
        statsRef.current.powerUpsCollected++;
        powerUps.splice(i, 1);
      }
    }

    // 6. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = p.life / 30;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // 7. Level Up
    if (statsRef.current.score >= statsRef.current.level * 2000) {
      statsRef.current.level++;
      setLevel(statsRef.current.level);
      enemiesRef.current = []; // Clear screen
      // Visual level up feedback could go here
    }

    checkAchievements(statsRef.current);
  }, [gameState, checkAchievements]);

  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x,
        y,
        radius: Math.random() * 3 + 1,
        color,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30,
        alpha: 1
      });
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background Image
    if (assetsLoaded && imagesRef.current.background) {
      ctx.save();
      ctx.globalAlpha = 0.3; // 保持背景暗淡
      ctx.drawImage(imagesRef.current.background, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
    });

    // Draw Bullets
    bulletsRef.current.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = b.color;
      ctx.fill();
    });

    // Draw Enemies
    enemiesRef.current.forEach(e => {
      ctx.save();
      let enemyImg = null;
      if (assetsLoaded) {
        if (e.type === EnemyType.BASIC) enemyImg = imagesRef.current.enemyBasic;
        if (e.type === EnemyType.FAST) enemyImg = imagesRef.current.enemyFast;
        if (e.type === EnemyType.HEAVY) enemyImg = imagesRef.current.enemyHeavy;
      }

      if (enemyImg) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = e.color;
        ctx.drawImage(enemyImg, e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = e.color;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.stroke();
      }
      ctx.restore();
    });

    // Draw PowerUps
    powerUpsRef.current.forEach(p => {
      ctx.save();
      let pImg = assetsLoaded ? (p.type === PowerUpType.TRIPLE_SHOT ? imagesRef.current.powerupTriple : imagesRef.current.powerupShield) : null;

      if (pImg) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = p.color;
        ctx.drawImage(pImg, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 25;
        ctx.shadowColor = p.color;
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type === PowerUpType.TRIPLE_SHOT ? '3' : 'S', p.x, p.y);
      }
      ctx.restore();
    });

    // Draw Player
    const player = playerRef.current;
    if (!player.invincible || requestRef.current! % 10 < 5) {
      ctx.save();
      // Shield
      if (player.shieldActive) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
      }

      if (assetsLoaded && imagesRef.current.player) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.color;
        ctx.drawImage(imagesRef.current.player, player.x - player.radius, player.y - player.radius, player.radius * 2, player.radius * 2);
      } else {
        ctx.beginPath();
        ctx.moveTo(player.x, player.y - player.radius);
        ctx.lineTo(player.x - player.radius, player.y + player.radius);
        ctx.lineTo(player.x + player.radius, player.y + player.radius);
        ctx.closePath();
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = player.color;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(player.x, player.y + 5, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      ctx.restore();
    }
  }, [assetsLoaded]);

  const animate = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(animate);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animate]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      if (e.key === 'p' || e.key === 'P') {
        setGameState(prev => prev === GameState.PLAYING ? GameState.PAUSED : (prev === GameState.PAUSED ? GameState.PLAYING : prev));
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch Controls
  const handleTouch = (e: React.TouchEvent) => {
    if (gameState !== GameState.PLAYING) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    playerRef.current.x = touch.clientX - rect.left;
    playerRef.current.y = touch.clientY - rect.top;
    
    // Auto shoot on touch
    keysRef.current[' '] = true;
  };

  const handleTouchEnd = () => {
    keysRef.current[' '] = false;
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setHealth(PLAYER_MAX_HEALTH);
    statsRef.current = { score: 0, level: 1, enemiesDestroyed: 0, bulletsFired: 0, powerUpsCollected: 0 };
    playerRef.current = {
      ...playerRef.current,
      health: PLAYER_MAX_HEALTH,
      invincible: false,
      shieldActive: false,
      tripleShotTimer: 0
    };
    enemiesRef.current = [];
    bulletsRef.current = [];
    powerUpsRef.current = [];
    particlesRef.current = [];
    setGameState(GameState.PLAYING);
  };

  return (
    <div className="relative w-full h-screen bg-[#020617] text-white overflow-hidden font-sans select-none">
      {/* Dynamic Star Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="stars-container">
          {[...Array(100)].map((_, i) => (
            <div 
              key={i} 
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 2 + 'px',
                height: Math.random() * 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random(),
                animationDelay: Math.random() * 5 + 's',
                animationDuration: Math.random() * 3 + 2 + 's'
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        onTouchEnd={handleTouchEnd}
      />

      {/* UI Overlays */}
      <AnimatePresence>
        {gameState === GameState.START && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
          >
            <div className="max-w-md w-full p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl text-center">
              <motion.h1 
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="text-6xl font-black mb-4 tracking-tighter bg-gradient-to-b from-emerald-400 to-emerald-600 bg-clip-text text-transparent"
              >
                星际先锋
              </motion.h1>
              <p className="text-emerald-100/60 mb-8 text-lg">守护银河系的最后一道防线</p>
              
              <div className="space-y-4 mb-8 text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 text-sm">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  <span>WASD 或 方向键移动 | 空格射击</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>收集道具增强火力与护盾</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Info className="w-5 h-5 text-blue-400" />
                  <span>按 P 键暂停游戏</span>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="group relative w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Play className="w-6 h-6 fill-current" />
                <span className="text-xl">开始任务</span>
              </button>
            </div>
          </motion.div>
        )}

        {gameState === GameState.PAUSED && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50"
          >
            <div className="p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl text-center min-w-[300px]">
              <h2 className="text-4xl font-bold mb-8">游戏暂停</h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setGameState(GameState.PLAYING)}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  继续游戏
                </button>
                <button 
                  onClick={() => setGameState(GameState.START)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  退出任务
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === GameState.GAME_OVER && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-xl z-50"
          >
            <div className="max-w-lg w-full p-10 rounded-[2.5rem] bg-white/5 border border-white/10 text-center">
              <h2 className="text-5xl font-black mb-2 text-red-500">任务失败</h2>
              <p className="text-white/40 mb-8">战机已被摧毁，银河系陷入危机</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <div className="text-white/40 text-sm mb-1 uppercase tracking-widest">最终得分</div>
                  <div className="text-4xl font-black text-emerald-400">{score}</div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                  <div className="text-white/40 text-sm mb-1 uppercase tracking-widest">最高关卡</div>
                  <div className="text-4xl font-black text-blue-400">{level}</div>
                </div>
              </div>

              <div className="mb-8 text-left">
                <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  已解锁成就
                </h3>
                <div className="flex flex-wrap gap-2">
                  {achievements.filter(a => a.unlocked).map(a => (
                    <span key={a.id} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">
                      {a.title}
                    </span>
                  ))}
                  {achievements.filter(a => a.unlocked).length === 0 && (
                    <span className="text-white/20 text-sm italic">暂无成就</span>
                  )}
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-6 h-6" />
                重新开始
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start pointer-events-none z-40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-black tabular-nums">{score.toLocaleString()}</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40 font-bold uppercase tracking-widest">Level</span>
              <span className="text-2xl font-black text-blue-400">{level}</span>
            </div>
          </div>
          
          {/* Health Bar */}
          <div className="flex gap-1.5 mt-2">
            {[...Array(PLAYER_MAX_HEALTH)].map((_, i) => (
              <motion.div 
                key={i}
                initial={false}
                animate={{ 
                  scale: i < health ? 1 : 0.8,
                  opacity: i < health ? 1 : 0.2
                }}
                className={`w-8 h-2 rounded-full ${i < health ? 'bg-red-500' : 'bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        {/* Active Powerups */}
        <div className="flex flex-col gap-2 items-end">
          <AnimatePresence>
            {playerRef.current.shieldActive && (
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                className="flex items-center gap-3 bg-blue-500/20 border border-blue-500/40 px-4 py-2 rounded-xl backdrop-blur-md"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">能量护盾已激活</span>
              </motion.div>
            )}
            {playerRef.current.tripleShotTimer > 0 && (
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 50, opacity: 0 }}
                className="flex items-center gap-3 bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl backdrop-blur-md"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-100 uppercase tracking-widest">三向子弹 {Math.ceil(playerRef.current.tripleShotTimer / 60)}s</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Warning Message */}
      <AnimatePresence>
        {showWarning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500/40 px-6 py-2 rounded-full backdrop-blur-md text-red-400 font-bold text-sm tracking-widest uppercase z-40"
          >
            敌机逃脱！分数扣除
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Popups */}
      <div className="absolute bottom-10 right-10 flex flex-col gap-4 z-50 pointer-events-none">
        <AnimatePresence>
          {activeAchievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id + idx}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="flex items-center gap-4 bg-emerald-500 text-black p-4 rounded-2xl shadow-2xl min-w-[240px]"
            >
              <div className="bg-black/10 p-2 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-black uppercase opacity-60">成就解锁</div>
                <div className="font-bold text-lg leading-tight">{achievement.title}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 right-6 flex-col gap-4 z-30">
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-[200px]">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">道具说明</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold">三向子弹</div>
                <div className="text-[10px] text-white/40">大幅提升火力覆盖范围</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-xs font-bold">能量护盾</div>
                <div className="text-[10px] text-white/40">抵挡一次致命撞击</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
