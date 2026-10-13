/**
 * Irani Chai & Osmania Biscuit Rush
 * A fast-paced Hyderabadi Irani café-themed time-attack multitasking clicker.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Coffee,
  Sparkles,
  Timer,
  Trophy,
  Volume2,
  VolumeX,
  Flame,
  RotateCcw,
  Play,
  Pause,
  Award,
  Zap,
  Info,
  Music,
  Home,
  Flag,
  Keyboard,
  MousePointer,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  FileText
} from 'lucide-react';
import { sounds } from './utils/audio';

// Asset paths
import cafeBackdrop from './assets/images/irani_cafe_backdrop_1791879509769.jpg';
import samovarImg from './assets/images/vintage_brass_samovar_1791879510559.jpg';
import biscuitsPileImg from './assets/images/osmania_biscuit_pile_1791879510566.jpg';

// Biscuit types
type BiscuitType = 'classic' | 'golden' | 'malai' | 'burnt';

interface FallingBiscuit {
  id: number;
  type: BiscuitType;
  x: number; // percentage 10% to 90%
  y: number; // percentage 0% to 100%
  speed: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
}

interface CrumbParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface FloatingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  isSpecial?: boolean;
}

type GameMode = 'RUSH_45' | 'RELAXED_90';
type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface UpgradeState {
  spigotLevel: number; // increases chai fill per tap (default 11%, +3.5% per lvl)
  cardamomLvl: number; // +20 bonus points per cup
  chotuLvl: number;    // auto pour rate
}

// 5-STAGE AVATAR DEFINITIONS
export interface AvatarStage {
  stage: number;
  title: string;
  subtitle: string;
  minScore: number;
  maxScore: number;
  badge: string;
  color: string;
  border: string;
  perkDescription: string;
}

export const AVATAR_STAGES: AvatarStage[] = [
  {
    stage: 1,
    title: 'Chai Chotu',
    subtitle: 'Counter Apprentice',
    minScore: 0,
    maxScore: 199,
    badge: '🧑‍🍳',
    color: 'from-amber-700 to-amber-900',
    border: 'border-amber-600/50',
    perkDescription: 'New recruit learning to catch biscuits and brew the cutting chai',
  },
  {
    stage: 2,
    title: 'Cutting Pro',
    subtitle: 'Rapid Server',
    minScore: 200,
    maxScore: 449,
    badge: '⚡',
    color: 'from-emerald-700 to-teal-900',
    border: 'border-emerald-500/50',
    perkDescription: 'Swift server balancing glasses and catching falling biscuits with speed',
  },
  {
    stage: 3,
    title: 'Table Ustaad',
    subtitle: 'Master Barista',
    minScore: 450,
    maxScore: 799,
    badge: '🎖️',
    color: 'from-sky-700 to-blue-900',
    border: 'border-sky-500/50',
    perkDescription: 'Café veteran gliding the brass plate effortlessly with two-hand coordination',
  },
  {
    stage: 4,
    title: 'Café Baadshah',
    subtitle: 'Heritage Maestro',
    minScore: 800,
    maxScore: 1199,
    badge: '👑',
    color: 'from-purple-700 to-indigo-950',
    border: 'border-purple-500/50',
    perkDescription: 'Revered master with legendary pour rhythm and golden biscuit mastery',
  },
  {
    stage: 5,
    title: 'Sultan of Samovars',
    subtitle: 'Royal Nizam Master',
    minScore: 1200,
    maxScore: Infinity,
    badge: '🌟',
    color: 'from-amber-400 via-yellow-500 to-amber-600',
    border: 'border-yellow-300',
    perkDescription: 'Supreme ruler of Hyderabadi Irani chai lore facing Charminar',
  },
];

export const getAvatarForScore = (currentScore: number): AvatarStage => {
  for (let i = AVATAR_STAGES.length - 1; i >= 0; i--) {
    if (currentScore >= AVATAR_STAGES[i].minScore) {
      return AVATAR_STAGES[i];
    }
  }
  return AVATAR_STAGES[0];
};

export default function App() {
  // Game Flow State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('RUSH_45');
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [totalGameTime, setTotalGameTime] = useState<number>(45);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [maxCombo, setMaxCombo] = useState<number>(1);
  const [biscuitsCaught, setBiscuitsCaught] = useState<number>(0);
  const [goldenCaught, setGoldenCaught] = useState<number>(0);
  const [cupsServed, setCupsServed] = useState<number>(0);
  const [dunkCount, setDunkCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(true);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showLoreModal, setShowLoreModal] = useState<boolean>(false);
  const [showReadmeModal, setShowReadmeModal] = useState<boolean>(false);

  // Avatar Evolution Notification
  const [avatarLevelBanner, setAvatarLevelBanner] = useState<string | null>(null);

  // High score in localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('irani_rush_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Catching Plate State (Percentage 12% to 88%)
  const [plateX, setPlateX] = useState<number>(50);
  const plateXRef = useRef<number>(50);
  const [plateBounce, setPlateBounce] = useState<boolean>(false);

  // Chai Brewing State
  const [chaiFill, setChaiFill] = useState<number>(0); // 0 to 100
  const [tapPressEffect, setTapPressEffect] = useState<boolean>(false);
  const [lastCupServedTime, setLastCupServedTime] = useState<number>(0);
  const [servingCelebration, setServingCelebration] = useState<boolean>(false);

  // Upgrades purchased during run
  const [upgrades, setUpgrades] = useState<UpgradeState>({
    spigotLevel: 1,
    cardamomLvl: 0,
    chotuLvl: 0,
  });

  // Falling Biscuits State
  const [biscuits, setBiscuits] = useState<FallingBiscuit[]>([]);
  const [particles, setParticles] = useState<CrumbParticle[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  // Refs for animation loop & IDs
  const biscuitNextId = useRef<number>(1);
  const particleNextId = useRef<number>(1);
  const scoreNextId = useRef<number>(1);
  const lastSpawnTime = useRef<number>(0);
  const animFrameId = useRef<number | null>(null);
  const lastTickTime = useRef<number>(0);
  const lastAutoPourTime = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const catcherRef = useRef<HTMLDivElement>(null);

  // Keep plateXRef updated synchronously
  const updatePlatePosition = useCallback((newX: number) => {
    const clamped = Math.max(14, Math.min(86, newX));
    plateXRef.current = clamped;
    setPlateX(clamped);
  }, []);

  // Sync SFX settings
  useEffect(() => {
    sounds.sfxEnabled = soundEnabled;
  }, [soundEnabled]);

  // Sync Background Music settings with gameplay state
  useEffect(() => {
    sounds.bgmEnabled = musicEnabled;
    if (musicEnabled && gameState === 'PLAYING') {
      sounds.startBgm();
    } else {
      sounds.stopBgm();
    }
  }, [musicEnabled, gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sounds.stopBgm();
    };
  }, []);

  // Check Avatar Level Up whenever score changes
  const prevStageRef = useRef<number>(1);
  useEffect(() => {
    const currentAvatar = getAvatarForScore(score);
    if (currentAvatar.stage > prevStageRef.current && gameState === 'PLAYING') {
      sounds.playGoldenBiscuit();
      setAvatarLevelBanner(`AVATAR EVOLVED: ${currentAvatar.title}! ${currentAvatar.badge}`);
      setTimeout(() => setAvatarLevelBanner(null), 2500);
    }
    prevStageRef.current = currentAvatar.stage;
  }, [score, gameState]);

  // Add floating text popup
  const addFloatingScore = useCallback((text: string, x: number, y: number, color = '#F59E0B', isSpecial = false) => {
    const id = scoreNextId.current++;
    setFloatingScores(prev => [...prev, { id, text, x, y, color, isSpecial }]);
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(item => item.id !== id));
    }, 950);
  }, []);

  // Spawn crumb blast
  const spawnCrumbBlast = useCallback((xPercent: number, yPercent: number, biscuitType: BiscuitType) => {
    const newParticles: CrumbParticle[] = [];
    const colors = biscuitType === 'golden' 
      ? ['#FBBF24', '#F59E0B', '#FDE68A', '#D97706']
      : biscuitType === 'malai'
      ? ['#FEF3C7', '#FDE68A', '#FFFBEB', '#D97706']
      : biscuitType === 'burnt'
      ? ['#451A03', '#78350F', '#1F2937', '#92400E']
      : ['#D97706', '#F59E0B', '#B45309', '#FDE68A'];

    const count = biscuitType === 'golden' ? 14 : 9;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 3.5;
      newParticles.push({
        id: particleNextId.current++,
        x: xPercent,
        y: yPercent,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        life: 1.0,
      });
    }
    setParticles(prev => [...prev.slice(-40), ...newParticles]);
  }, []);

  // Samovar Pour Tap Click Handler
  const handleSamovarClick = useCallback((e?: React.MouseEvent) => {
    if (gameState !== 'PLAYING') return;

    setTapPressEffect(true);
    setTimeout(() => setTapPressEffect(false), 120);

    sounds.playPourTap();

    // Fill calculation based on spigot level (Base: 11% per tap -> ~9 clicks per cup)
    const fillIncrement = 11 + (upgrades.spigotLevel - 1) * 3.5;
    
    setChaiFill(prev => {
      const nextFill = prev + fillIncrement;
      if (nextFill >= 100) {
        // Cup is complete and served!
        sounds.playChaiServed();
        setServingCelebration(true);
        setTimeout(() => setServingCelebration(false), 800);

        // Cup bonus
        const cupPoints = 50 + (upgrades.cardamomLvl * 20);
        const earned = cupPoints * combo;
        setScore(s => s + earned);
        setCupsServed(c => c + 1);
        setLastCupServedTime(performance.now());

        // Popup at samovar area
        addFloatingScore(`+${earned} CHAI SERVED!`, 75, 48, '#F59E0B', true);

        // Gentle combo growth on cup completion
        setCombo(currentCombo => {
          const nextC = Math.min(currentCombo + 1, 5);
          if (nextC > currentCombo) sounds.playComboUp(nextC);
          setMaxCombo(m => Math.max(m, nextC));
          return nextC;
        });

        return 0; // reset for next cup
      } else {
        // Micro point per tap
        setScore(s => s + 1);
        return nextFill;
      }
    });

    // Add tiny pour ripple floater
    if (e && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;
      addFloatingScore('+1', clickX, clickY, '#D97706');
    }
  }, [gameState, upgrades, combo, addFloatingScore]);

  // Handle Catching a Biscuit in the Brass Plate
  const triggerCatchBiscuit = useCallback((biscuit: FallingBiscuit) => {
    spawnCrumbBlast(biscuit.x, 82, biscuit.type);

    // Check Dunk synergy: if cup was served within the last 2.2 seconds!
    const isDunked = (performance.now() - lastCupServedTime) < 2200;
    const dunkMultiplier = isDunked ? 2 : 1;
    if (isDunked) {
      setDunkCount(d => d + 1);
    }

    if (biscuit.type === 'burnt') {
      // Penalty hazard!
      sounds.playPenalty();
      setScore(s => Math.max(0, s - 10));
      setCombo(1); // combo reset
      addFloatingScore('-10 BURNT!', biscuit.x, 76, '#EF4444', true);
      return;
    }

    // Normal or special scoring
    let basePts = 10;
    let specialNote = '';
    let textColor = '#F59E0B';

    if (biscuit.type === 'golden') {
      basePts = 25;
      sounds.playGoldenBiscuit();
      setTimeLeft(t => Math.min(t + 2.0, totalGameTime + 15)); // +2s time bonus
      setGoldenCaught(g => g + 1);
      specialNote = ' +2s!';
      textColor = '#FBBF24';
    } else if (biscuit.type === 'malai') {
      basePts = 15;
      sounds.playCatchBiscuit();
      setCombo(c => {
        const next = Math.min(c + 1, 5);
        if (next > c) sounds.playComboUp(next);
        setMaxCombo(m => Math.max(m, next));
        return next;
      });
      textColor = '#FEF08A';
    } else {
      sounds.playCatchBiscuit();
    }

    const earned = basePts * combo * dunkMultiplier;
    setScore(s => s + earned);
    setBiscuitsCaught(b => b + 1);

    const dunkLabel = isDunked ? ' ☕ DUNK 2X!' : '';
    addFloatingScore(`+${earned}${specialNote}${dunkLabel}`, biscuit.x, 76, textColor, isDunked || biscuit.type === 'golden');

    // Slight combo progress on biscuit catch
    if (!isDunked) {
      setCombo(c => {
        if (Math.random() < 0.35) {
          const next = Math.min(c + 1, 5);
          if (next > c) sounds.playComboUp(next);
          setMaxCombo(m => Math.max(m, next));
          return next;
        }
        return c;
      });
    }
  }, [lastCupServedTime, totalGameTime, combo, spawnCrumbBlast, addFloatingScore]);

  // Handle start game
  const startGame = useCallback((mode: GameMode = gameMode) => {
    const initialDuration = mode === 'RUSH_45' ? 45 : 90;
    setGameMode(mode);
    setTotalGameTime(initialDuration);
    setTimeLeft(initialDuration);
    setScore(0);
    setCombo(1);
    setMaxCombo(1);
    setBiscuitsCaught(0);
    setGoldenCaught(0);
    setCupsServed(0);
    setDunkCount(0);
    setChaiFill(0);
    setBiscuits([]);
    setParticles([]);
    setFloatingScores([]);
    setUpgrades({ spigotLevel: 1, cardamomLvl: 0, chotuLvl: 0 });
    updatePlatePosition(50);
    prevStageRef.current = 1;
    setGameState('PLAYING');
    if (musicEnabled) {
      sounds.startBgm();
    }
    lastSpawnTime.current = performance.now();
    lastTickTime.current = performance.now();
    lastAutoPourTime.current = performance.now();
  }, [gameMode, musicEnabled, updatePlatePosition]);

  // Restart handler
  const restartGame = useCallback(() => {
    startGame(gameMode);
  }, [startGame, gameMode]);

  // Toggle pause
  const togglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      sounds.stopBgm();
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      if (musicEnabled) {
        sounds.startBgm();
      }
      lastTickTime.current = performance.now();
    }
  }, [gameState, musicEnabled]);

  // Go Home handler
  const goHome = useCallback(() => {
    setGameState('TITLE');
    sounds.stopBgm();
  }, []);

  // End Game Now handler
  const endGameNow = useCallback(() => {
    setGameState('GAME_OVER');
    sounds.stopBgm();
    sounds.playGameOver();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#D97706', '#FEF3C7', '#B45309']
    });
  }, []);

  // Keyboard navigation & controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') {
        if (e.key === ' ' && gameState === 'TITLE') {
          startGame('RUSH_45');
        }
        return;
      }

      // Steer Plate Left
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        updatePlatePosition(plateXRef.current - 6);
      }
      // Steer Plate Right
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        updatePlatePosition(plateXRef.current + 6);
      }
      // Rapid Chai Tap with Space or Enter
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleSamovarClick();
      }
      // Pause shortcut
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleSamovarClick, togglePause, startGame, updatePlatePosition]);

  // Mouse & Touch pointer tracker for the plate
  const handleArenaPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING' || !catcherRef.current) return;
    const rect = catcherRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    updatePlatePosition(xPercent);
  };

  const handleArenaTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING' || !catcherRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = catcherRef.current.getBoundingClientRect();
    const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;
    updatePlatePosition(xPercent);
  };

  // Purchase In-Game Upgrade with earned score
  const buyUpgrade = useCallback((upgradeType: keyof UpgradeState, cost: number) => {
    if (score < cost) return;
    setScore(s => s - cost);
    sounds.playGoldenBiscuit();
    setUpgrades(prev => ({
      ...prev,
      [upgradeType]: prev[upgradeType] + 1,
    }));
    addFloatingScore('PERK UNLOCKED!', 75, 80, '#10B981', true);
  }, [score, addFloatingScore]);

  // Main Game Loop (Physics, Timer, Spawns, Plate Catch Detection)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let isSubscribed = true;

    const gameLoop = (timestamp: number) => {
      if (!isSubscribed) return;

      // 1. Timer Tick
      if (timestamp - lastTickTime.current >= 1000) {
        lastTickTime.current = timestamp;
        setTimeLeft(prev => {
          const next = prev - 1;
          if (next <= 10 && next > 0) {
            sounds.playTick();
          }
          if (next <= 0) {
            // Trigger Game Over
            setGameState('GAME_OVER');
            sounds.stopBgm();
            sounds.playGameOver();
            confetti({
              particleCount: 120,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#D97706', '#FEF3C7', '#B45309']
            });
            return 0;
          }
          return next;
        });
      }

      // 2. Chotu Auto-Pour Helper
      if (upgrades.chotuLvl > 0 && timestamp - lastAutoPourTime.current >= 800 / upgrades.chotuLvl) {
        lastAutoPourTime.current = timestamp;
        handleSamovarClick();
      }

      // 3. Spawn Falling Biscuits
      const spawnInterval = Math.max(550, 1100 - combo * 85);
      if (timestamp - lastSpawnTime.current > spawnInterval) {
        lastSpawnTime.current = timestamp;

        const roll = Math.random();
        let type: BiscuitType = 'classic';
        if (roll < 0.16) {
          type = 'golden'; // 16% Golden Osmania (+25pts, +2s)
        } else if (roll < 0.32) {
          type = 'malai';  // 16% Creamy Malai (+15pts, combo boost)
        } else if (roll < 0.44) {
          type = 'burnt';  // 12% Kadak/Burnt hazard (dodge!)
        }

        const newBiscuit: FallingBiscuit = {
          id: biscuitNextId.current++,
          type,
          x: 14 + Math.random() * 72, // percentage 14% to 86%
          y: -8,
          speed: 0.44 + Math.random() * 0.44 + (type === 'golden' ? 0.15 : 0),
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 3,
          size: type === 'golden' ? 54 : 48,
        };

        setBiscuits(prev => [...prev.slice(-18), newBiscuit]);
      }

      // 4. Update Biscuit positions & Plate Collision Detection
      setBiscuits(prev => {
        const nextList: FallingBiscuit[] = [];
        const currentPlateX = plateXRef.current;
        const plateCatchRadius = 13.5; // Catch width tolerance

        for (const b of prev) {
          const nextY = b.y + b.speed;

          // Check if biscuit reaches the plate catch plane (Y between 78% and 86%)
          const inCatchZone = nextY >= 78 && nextY <= 86;
          const hitsPlate = inCatchZone && Math.abs(b.x - currentPlateX) <= plateCatchRadius;

          if (hitsPlate) {
            // CAUGHT IN THE BRASS PLATE!
            triggerCatchBiscuit(b);
            setPlateBounce(true);
            setTimeout(() => setPlateBounce(false), 140);
            continue; // Remove biscuit from falling list
          }

          if (nextY > 95) {
            // Missed plate and crashed on table!
            if (b.type !== 'burnt') {
              spawnCrumbBlast(b.x, 92, b.type);
              setCombo(c => Math.max(1, c - 1)); // drop combo
            }
          } else {
            nextList.push({
              ...b,
              y: nextY,
              rotation: b.rotation + b.rotationSpeed,
            });
          }
        }
        return nextList;
      });

      // 5. Update Crumb Particles
      setParticles(prev => {
        if (prev.length === 0) return prev;
        const nextParticles: CrumbParticle[] = [];
        for (const p of prev) {
          const nextLife = p.life - 0.04;
          if (nextLife > 0) {
            nextParticles.push({
              ...p,
              x: p.x + p.vx * 0.3,
              y: p.y + p.vy * 0.3,
              vy: p.vy + 0.15, // gravity
              life: nextLife,
            });
          }
        }
        return nextParticles;
      });

      animFrameId.current = requestAnimationFrame(gameLoop);
    };

    animFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      isSubscribed = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [gameState, combo, upgrades.chotuLvl, handleSamovarClick, triggerCatchBiscuit, spawnCrumbBlast]);

  // Update High Score on Game Over
  useEffect(() => {
    if (gameState === 'GAME_OVER') {
      if (score > highScore) {
        setHighScore(score);
        try {
          localStorage.setItem('irani_rush_highscore', score.toString());
        } catch {
          // Ignore
        }
      }
    }
  }, [gameState, score, highScore]);

  // Current avatar stage for active score
  const currentAvatar = getAvatarForScore(score);

  return (
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500/30">
      
      {/* Background Ambience with authentic vintage cafe photo */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 bg-cover bg-center filter saturate-120"
        style={{ backgroundImage: `url(${cafeBackdrop})` }}
      />
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-stone-950/80 via-stone-950/90 to-stone-950" />

      {/* TOP NAVIGATION BAR - Clean 3-zone Top Bar Contract */}
      <header className="relative z-30 flex items-center justify-between gap-8 px-6 py-3.5 border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <span className="font-serif-display text-xl font-bold tracking-tight text-amber-200">
            Irani Chai & Osmania Biscuit Rush
          </span>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-300">
          <button 
            onClick={() => setShowReadmeModal(true)} 
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            README & Guide
          </button>
          <button 
            onClick={() => setShowRulesModal(true)} 
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
          >
            How to Play
          </button>
          <button 
            onClick={() => setShowLoreModal(true)} 
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
          >
            Irani Café Lore
          </button>
          <button 
            onClick={() => {
              if (gameState === 'PLAYING') togglePause();
              else startGame();
            }}
            className="hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 text-left cursor-pointer"
          >
            {gameState === 'PLAYING' ? 'Pause' : 'Start Rush'}
          </button>
          <span className="text-xs text-stone-500 whitespace-nowrap shrink-0">
            Best Score: <strong className="text-amber-300 font-mono-numbers">{highScore}</strong>
          </span>
        </nav>

        {/* Zone 3: Audio controls & primary action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Ambient BGM toggle */}
          <button
            onClick={() => setMusicEnabled(m => !m)}
            className={`p-2 transition-colors rounded-lg border ${
              musicEnabled
                ? 'border-amber-600/60 bg-amber-950/40 text-amber-300'
                : 'border-stone-800 bg-stone-900/60 text-stone-500 hover:text-stone-300'
            }`}
            title={musicEnabled ? 'Pause Café Music' : 'Play Café Music'}
            aria-label="Toggle Café Ambient Music"
          >
            <Music className="w-4 h-4" />
          </button>

          {/* SFX toggle */}
          <button
            onClick={() => setSoundEnabled(s => !s)}
            className="p-2 text-stone-400 hover:text-amber-200 transition-colors rounded-lg border border-stone-800 hover:border-stone-700 bg-stone-900/60"
            title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            aria-label="Sound Toggle"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          {/* Stop / Home Button when active */}
          {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
            <button
              onClick={goHome}
              className="px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5"
              title="Stop Game & Return to Home Screen"
            >
              <Home className="w-3.5 h-3.5" />
              Stop Game
            </button>
          )}

          {gameState === 'PLAYING' ? (
            <button
              onClick={restartGame}
              className="px-3.5 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all rounded-lg whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart
            </button>
          ) : (
            <button
              onClick={() => startGame('RUSH_45')}
              className="px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all rounded-lg whitespace-nowrap shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play Rush (45s)
            </button>
          )}
        </div>
      </header>

      {/* IN-GAME HUD DASHBOARD STRIP WITH PAUSE, HOME, END CONTROLS */}
      <section className="relative z-20 border-b border-stone-800 bg-stone-900/85 px-4 sm:px-6 py-2 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-sm">
          
          {/* Left: Timer & Score */}
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
              timeLeft <= 10 && gameState === 'PLAYING'
                ? 'bg-rose-950/60 border-rose-600 text-rose-300 animate-pulse'
                : 'bg-stone-950/60 border-stone-800 text-stone-200'
            }`}>
              <Timer className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="text-[11px] text-stone-400 font-medium">TIME:</span>
              <span className="font-mono-numbers text-base sm:text-lg font-bold tracking-tight">
                {timeLeft}s
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-800 bg-stone-950/60">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] text-stone-400 font-medium">SCORE:</span>
              <span className="font-mono-numbers text-base sm:text-lg font-bold text-amber-300 tracking-tight">
                {score}
              </span>
            </div>

            {/* DYNAMIC 5-STAGE AVATAR BADGE IN HUD */}
            <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-lg border ${currentAvatar.border} bg-stone-950/70`}>
              <span className="text-base" role="img" aria-label={currentAvatar.title}>
                {currentAvatar.badge}
              </span>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[10px] text-stone-400 font-medium">
                  STAGE {currentAvatar.stage}/5
                </span>
                <span className="text-xs font-bold text-amber-300 truncate max-w-[110px]">
                  {currentAvatar.title}
                </span>
              </div>
            </div>
          </div>

          {/* Center: IN-GAME CONTROLS (PAUSE, HOME, END) */}
          <div className="flex items-center gap-1.5 bg-stone-950/70 p-1 rounded-lg border border-stone-800">
            {/* Pause / Resume Button */}
            <button
              onClick={togglePause}
              disabled={gameState === 'TITLE' || gameState === 'GAME_OVER'}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                gameState === 'PAUSED'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-600/50'
                  : 'text-stone-300 hover:text-amber-300 hover:bg-stone-800/80'
              } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
              title={gameState === 'PAUSED' ? 'Resume Game (P)' : 'Pause Game (P)'}
            >
              {gameState === 'PAUSED' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pause</span>
                </>
              )}
            </button>

            {/* Home Button */}
            <button
              onClick={goHome}
              className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 text-stone-300 hover:text-amber-300 hover:bg-stone-800/80 cursor-pointer"
              title="Return to Home Menu"
            >
              <Home className="w-3.5 h-3.5 text-amber-400" />
              <span>Home</span>
            </button>

            {/* End Game Button */}
            <button
              onClick={endGameNow}
              disabled={gameState !== 'PLAYING' && gameState !== 'PAUSED'}
              className="px-2.5 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 text-rose-300 hover:text-rose-200 hover:bg-rose-950/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="End Current Rush & View Score"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" />
              <span>End</span>
            </button>
          </div>

          {/* Right: Combo & Counters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 font-medium">COMBO:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(lvl => (
                  <div
                    key={lvl}
                    className={`h-2.5 w-4 rounded-xs transition-all ${
                      combo >= lvl 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                        : 'bg-stone-800'
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono-numbers text-xs font-bold text-amber-300 ml-0.5">
                {combo}x
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-3 text-xs text-stone-400">
              <div>
                <span>Caught: </span>
                <strong className="text-stone-200 font-mono-numbers">{biscuitsCaught}</strong>
              </div>
              <div className="h-3 w-px bg-stone-700" />
              <div>
                <span>Chai: </span>
                <strong className="text-amber-300 font-mono-numbers">{cupsServed}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVATAR EVOLUTION CELEBRATION FLOATER */}
      {avatarLevelBanner && (
        <div className="fixed top-20 inset-x-0 z-40 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-black px-6 py-2.5 rounded-full shadow-2xl border-2 border-yellow-200 text-sm tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-stone-950 animate-spin" />
            {avatarLevelBanner}
          </div>
        </div>
      )}

      {/* MAIN TWO-ZONE PLAY AREA - PERMANENTLY SIDE-BY-SIDE */}
      <main 
        ref={containerRef}
        className="relative flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 md:gap-5 z-10 items-stretch"
      >
        
        {/* ============================================================== */}
        {/* LEFT STATION: OSMANIA BISCUIT CATCHING ARENA (Cols 1-7)        */}
        {/* ============================================================== */}
        <section 
          ref={catcherRef}
          onPointerMove={handleArenaPointerMove}
          onTouchMove={handleArenaTouchMove}
          className="sm:col-span-7 flex flex-col rounded-xl border border-stone-800/90 bg-stone-900/70 backdrop-blur-md overflow-hidden relative shadow-2xl h-[510px] sm:h-[550px] md:h-[590px] touch-none select-none"
        >
          {/* Station Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-stone-800 bg-stone-950/70 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <span className="font-semibold text-stone-200 tracking-wide truncate">
                ZONE 1 (LEFT): 🍪 OSMANIA BISCUIT CATCHER
              </span>
            </div>
            <span className="text-stone-400 hidden lg:inline text-[11px] whitespace-nowrap">
              Move plate below · Mouse or [←] [→] / [A] [D]
            </span>
          </div>

          {/* Falling Biscuit Area & Interactive Plate */}
          <div className="relative flex-1 w-full h-full overflow-hidden bg-stone-950/40">
            
            {/* Ambient Bakery Shelf at top */}
            <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-amber-950/40 to-transparent pointer-events-none border-b border-amber-900/30" />

            {/* Checkered Marble Table Ledge at bottom */}
            <div className="absolute bottom-0 inset-x-0 h-10 border-t border-stone-700/60 bg-gradient-to-t from-stone-900 to-stone-950 flex items-center justify-between px-4 text-[11px] text-stone-400 pointer-events-none z-10">
              <span className="font-serif-display italic text-amber-200/70">Marble Countertop</span>
              <span>Catch zone · Don&apos;t let biscuits shatter on the marble!</span>
            </div>

            {/* PAUSED OVERLAY */}
            {gameState === 'PAUSED' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-stone-950/85 backdrop-blur-sm p-6 text-center">
                <h3 className="font-serif-display text-2xl font-bold text-amber-300 mb-2">
                  Café Rush Paused
                </h3>
                <p className="text-xs text-stone-400 mb-5">Take a breather, chai is simmering hot!</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePause}
                    className="px-5 py-2.5 rounded-lg text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Resume
                  </button>
                  <button
                    onClick={goHome}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold text-stone-300 border border-stone-700 hover:border-amber-400 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Home className="w-3.5 h-3.5" />
                    Home
                  </button>
                  <button
                    onClick={endGameNow}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold text-rose-300 border border-rose-800/60 bg-rose-950/30 hover:bg-rose-900/40 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-400" />
                    End
                  </button>
                </div>
              </div>
            )}

            {/* Falling Biscuits */}
            {biscuits.map(b => {
              const isGolden = b.type === 'golden';
              const isMalai = b.type === 'malai';
              const isBurnt = b.type === 'burnt';

              return (
                <div
                  key={b.id}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    transform: `translate(-50%, -50%) rotate(${b.rotation}deg)`,
                    width: `${b.size}px`,
                    height: `${b.size}px`,
                  }}
                  className={`absolute pointer-events-none select-none transition-transform duration-75 flex items-center justify-center ${
                    isGolden ? 'animate-golden-shine z-10' : 'z-5'
                  }`}
                >
                  <div className={`relative w-full h-full rounded-full flex items-center justify-center shadow-lg transition-all ${
                    isGolden
                      ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-2 border-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                      : isMalai
                      ? 'bg-gradient-to-br from-amber-100 via-amber-200 to-amber-400 border border-amber-300 shadow-[0_0_8px_rgba(253,230,138,0.5)]'
                      : isBurnt
                      ? 'bg-gradient-to-br from-stone-900 via-amber-950 to-stone-950 border border-stone-800'
                      : 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 border border-amber-300/80'
                  }`}>
                    
                    {/* Iconic Scalloped Osmania edge indentations */}
                    <div className="absolute inset-1 rounded-full border border-dashed border-amber-900/30 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-xs transform rotate-45 border ${
                        isGolden 
                          ? 'border-yellow-100 bg-amber-200' 
                          : isBurnt 
                          ? 'border-stone-800 bg-stone-950' 
                          : 'border-amber-700/40 bg-amber-300/40'
                      }`} />
                    </div>

                    {isGolden && (
                      <span className="absolute -top-1.5 -right-1 text-[9px] font-black text-stone-900 bg-yellow-300 px-1 py-0.2 rounded-full font-mono-numbers shadow">
                        +2s
                      </span>
                    )}

                    {isBurnt && (
                      <span className="absolute -top-1 text-[8px] font-bold text-red-300 bg-red-950 px-1 rounded border border-red-800 font-mono-numbers">
                        BURNT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ========================================================= */}
            {/* INTERACTIVE BRASS CATCHING PLATE AT BOTTOM (Y = 82%)      */}
            {/* ========================================================= */}
            <div
              style={{
                left: `${plateX}%`,
                top: '82%',
                transform: `translate(-50%, -50%) scale(${plateBounce ? 1.12 : 1})`,
              }}
              className="absolute z-20 transition-transform duration-75 ease-out pointer-events-none"
            >
              {/* Traditional Hyderabadi Brass Chai Thali / Plate */}
              <div className="relative w-32 sm:w-40 h-8 sm:h-9 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-yellow-200 shadow-[0_6px_20px_rgba(217,119,6,0.55)] flex items-center justify-center">
                
                {/* Engraved decorative brass rim */}
                <div className="absolute inset-1 rounded-full border border-dashed border-yellow-100/70" />
                
                {/* Inner saucer indentation */}
                <div className="w-24 sm:w-28 h-4 sm:h-5 rounded-full bg-gradient-to-b from-amber-600 via-amber-700 to-amber-800 border border-amber-400/50 flex items-center justify-center">
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-amber-200 drop-shadow">
                    OSMANIA PLATE
                  </span>
                </div>

                {/* Catch gleam glow */}
                {plateBounce && (
                  <div className="absolute inset-0 rounded-full bg-yellow-300/30 blur-xs animate-ping" />
                )}
              </div>
            </div>

            {/* Crumb Burst Particles */}
            {particles.map(p => (
              <div
                key={p.id}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  opacity: p.life,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute rounded-full pointer-events-none"
              />
            ))}

            {/* Floating Popups */}
            {floatingScores.map(fs => (
              <div
                key={fs.id}
                style={{
                  left: `${fs.x}%`,
                  top: `${fs.y}%`,
                }}
                className={`absolute pointer-events-none font-bold text-xs transform -translate-x-1/2 -translate-y-8 animate-out fade-out slide-out-to-top duration-700 z-30 font-mono-numbers ${
                  fs.isSpecial ? 'text-sm font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' : ''
                }`}
              >
                <span 
                  style={{ color: fs.color }}
                  className="bg-stone-950/85 px-2 py-0.5 rounded border border-stone-800 backdrop-blur-xs whitespace-nowrap shadow-md"
                >
                  {fs.text}
                </span>
              </div>
            ))}
          </div>

          {/* Biscuit Catch Legend Footer */}
          <div className="px-4 py-2 bg-stone-950/80 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Osmania (+10)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_6px_#facc15] inline-block" />
                Golden (+25 & +2s)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-200 inline-block" />
                Malai (+15 & Combo)
              </span>
              <span className="flex items-center gap-1.5 text-stone-500">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-800 border border-stone-700 inline-block" />
                Burnt (Dodge!)
              </span>
            </div>
            <span className="text-[11px] text-amber-400/90 hidden sm:inline">
              Move plate to catch · Use [Space] for Chai
            </span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* RIGHT STATION: CHAI SAMOVAR BREWING STATION (Cols 8-12)        */}
        {/* ============================================================== */}
        <section className="sm:col-span-5 flex flex-col rounded-xl border border-stone-800/90 bg-stone-900/70 backdrop-blur-md overflow-hidden relative shadow-2xl h-[510px] sm:h-[550px] md:h-[590px]">
          
          {/* Station Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-stone-800 bg-stone-950/70 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-semibold text-stone-200 tracking-wide truncate">
                ZONE 2 (RIGHT): ☕ CHAI SAMOVAR BREWERY
              </span>
            </div>
            <span className="text-amber-400 font-mono-numbers whitespace-nowrap text-[11px]">
              {cupsServed} Cups Served
            </span>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4">
            
            {/* Top: Samovar Visual & Pressure Gauge */}
            <div className="flex items-center gap-4 bg-stone-950/60 rounded-xl p-3 border border-stone-800/80">
              <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-amber-600/40 shadow-inner bg-stone-900">
                <img 
                  src={samovarImg} 
                  alt="Vintage Brass Samovar" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-1 inset-x-0 flex justify-center pointer-events-none">
                  <div className="w-1.5 h-4 bg-white/50 rounded-full blur-[2px] animate-steam" />
                  <div className="w-2 h-5 bg-white/40 rounded-full blur-[2px] animate-steam ml-1 delay-150" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-300">
                    Heritage Brass Boiler
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Spigot Lv.{upgrades.spigotLevel}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug mb-2">
                  Rapidly tap the pour spigot below or press <strong className="text-stone-200">[Spacebar]</strong> to fill the cutting glass!
                </p>

                <div className="flex items-center gap-3 text-[11px] text-stone-300 font-mono-numbers">
                  <span className="text-amber-400 font-semibold">
                    +{50 + upgrades.cardamomLvl * 20} pts/cup
                  </span>
                  <span>·</span>
                  <span className="text-stone-400">
                    Tap: +{Math.round(11 + (upgrades.spigotLevel - 1) * 3.5)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Interactive Cutting Chai Glass Progress Display */}
            <div className="bg-stone-950/80 rounded-xl p-4 border border-stone-800 text-center relative overflow-hidden">
              
              {servingCelebration && (
                <div className="absolute inset-0 bg-amber-500/20 backdrop-blur-xs flex items-center justify-center z-20 animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-stone-950 border border-amber-400 text-amber-300 font-bold px-4 py-2 rounded-lg text-sm shadow-xl flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-400 animate-bounce" />
                    IRANI CHAI SERVED! +{50 + upgrades.cardamomLvl * 20} PTS!
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs mb-2 text-stone-300">
                <span className="font-medium">Cutting Glass Fill Status</span>
                <span className="font-mono-numbers font-bold text-amber-400">
                  {Math.min(100, Math.round(chaiFill))}%
                </span>
              </div>

              {/* Cutting Glass Container Visualization */}
              <div className="relative w-28 h-36 mx-auto my-2 border-2 border-stone-600/80 rounded-b-xl rounded-t-xs bg-stone-900/40 overflow-hidden shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
                <div className="absolute top-0 bottom-0 left-2 w-1.5 bg-white/10 rounded-full z-10 pointer-events-none" />
                <div className="absolute top-0 bottom-0 right-2 w-0.5 bg-white/5 rounded-full z-10 pointer-events-none" />

                {/* Rising Chai Liquid */}
                <div 
                  className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-amber-900 via-amber-700 to-amber-600 transition-all duration-100 ease-out flex flex-col justify-start"
                  style={{ height: `${chaiFill}%` }}
                >
                  {chaiFill > 8 && (
                    <div className="h-3.5 w-full bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300/80 border-b border-amber-600/40 shadow-sm" />
                  )}
                  {chaiFill > 20 && (
                    <div className="flex justify-around items-center pt-1 opacity-70">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-300/60 animate-ping" />
                      <div className="w-1 h-1 rounded-full bg-amber-200/60 animate-ping delay-200" />
                    </div>
                  )}
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-mono-numbers font-bold text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {Math.round(chaiFill)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar under glass */}
              <div className="w-full bg-stone-900 h-2.5 rounded-full overflow-hidden border border-stone-800 mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-300 transition-all duration-100"
                  style={{ width: `${chaiFill}%` }}
                />
              </div>
            </div>

            {/* BIG RAPID-CLICK SAMOVAR BUTTON */}
            <div>
              <button
                disabled={gameState !== 'PLAYING'}
                onClick={handleSamovarClick}
                className={`w-full py-4 px-6 rounded-xl font-bold text-stone-950 transition-all transform flex items-center justify-center gap-3 cursor-pointer select-none shadow-xl border-2 ${
                  tapPressEffect
                    ? 'scale-[0.96] bg-amber-300 border-yellow-200 shadow-[0_0_25px_rgba(251,191,36,0.9)]'
                    : 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 border-amber-300 shadow-[0_4px_16px_rgba(217,119,6,0.5)]'
                } ${gameState !== 'PLAYING' ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-0.5'}`}
              >
                <Coffee className={`w-6 h-6 text-stone-950 ${tapPressEffect ? 'animate-bounce' : ''}`} />
                <div className="text-left">
                  <div className="text-base sm:text-lg leading-tight uppercase tracking-wider font-extrabold">
                    PRESS TAP TO POUR CHAI!
                  </div>
                  <div className="text-[11px] text-stone-900 font-medium tracking-normal">
                    Rapid clicks or [Spacebar] fill the glass to 100%
                  </div>
                </div>
              </button>
            </div>

            {/* Quick In-Run Café Upgrades Bar */}
            <div className="border-t border-stone-800/80 pt-3">
              <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                <span className="font-semibold text-stone-300">Café Counter Perks</span>
                <span className="text-[11px]">Spend points to brew faster</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={score < (upgrades.spigotLevel * 60) || gameState !== 'PLAYING'}
                  onClick={() => buyUpgrade('spigotLevel', upgrades.spigotLevel * 60)}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    score >= (upgrades.spigotLevel * 60) && gameState === 'PLAYING'
                      ? 'border-amber-500/50 bg-stone-900 hover:bg-amber-950/40 text-stone-200'
                      : 'border-stone-800 bg-stone-950/40 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-amber-300 truncate">
                    Spigot Lvl {upgrades.spigotLevel + 1}
                  </span>
                  <span className="text-[9px] text-stone-400">+3.5% / tap</span>
                  <span className="text-[10px] font-mono-numbers font-bold text-amber-400 mt-1">
                    {upgrades.spigotLevel * 60} pts
                  </span>
                </button>

                <button
                  disabled={score < ((upgrades.cardamomLvl + 1) * 80) || gameState !== 'PLAYING'}
                  onClick={() => buyUpgrade('cardamomLvl', (upgrades.cardamomLvl + 1) * 80)}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    score >= ((upgrades.cardamomLvl + 1) * 80) && gameState === 'PLAYING'
                      ? 'border-amber-500/50 bg-stone-900 hover:bg-amber-950/40 text-stone-200'
                      : 'border-stone-800 bg-stone-950/40 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-amber-300 truncate">
                    Elaichi Blend
                  </span>
                  <span className="text-[9px] text-stone-400">+20 pts / cup</span>
                  <span className="text-[10px] font-mono-numbers font-bold text-amber-400 mt-1">
                    {(upgrades.cardamomLvl + 1) * 80} pts
                  </span>
                </button>

                <button
                  disabled={score < 150 || upgrades.chotuLvl >= 3 || gameState !== 'PLAYING'}
                  onClick={() => buyUpgrade('chotuLvl', 150)}
                  className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    score >= 150 && upgrades.chotuLvl < 3 && gameState === 'PLAYING'
                      ? 'border-emerald-500/50 bg-stone-900 hover:bg-emerald-950/40 text-stone-200'
                      : 'border-stone-800 bg-stone-950/40 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-emerald-300 truncate">
                    Chotu Auto-Tap
                  </span>
                  <span className="text-[9px] text-stone-400">
                    {upgrades.chotuLvl === 0 ? 'Auto pours' : `Speed ${upgrades.chotuLvl + 1}`}
                  </span>
                  <span className="text-[10px] font-mono-numbers font-bold text-emerald-400 mt-1">
                    {upgrades.chotuLvl >= 3 ? 'MAX' : '150 pts'}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* GAME OVER MODAL WITH HOME BUTTON & 5-STAGE AVATAR SUMMARY */}
      {gameState === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-7 text-center shadow-2xl relative">
            
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 mx-auto flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>

            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-amber-200 mb-1">
              Rush Hour Finished!
            </h2>
            <p className="text-xs text-stone-400 mb-4">
              Here is your final café service performance report:
            </p>

            {/* Score & Avatar Stage Highlight */}
            <div className="bg-stone-950/90 rounded-xl p-4 border border-stone-800 mb-4 text-center">
              <div className="text-[11px] uppercase tracking-widest text-stone-400 mb-0.5">
                Final Score
              </div>
              <div className="text-4xl font-mono-numbers font-black text-amber-300 mb-2">
                {score}
              </div>

              {/* Achieved Avatar Stage */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-center gap-2">
                <span className="text-2xl">{currentAvatar.badge}</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-amber-300">
                    Stage {currentAvatar.stage}: {currentAvatar.title}
                  </div>
                  <div className="text-[11px] text-stone-400">
                    {currentAvatar.subtitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-2.5 text-left text-xs mb-5 bg-stone-950/50 p-3 rounded-lg border border-stone-800/60 font-mono-numbers">
              <div>
                <span className="text-stone-400">Biscuits Caught:</span>
                <strong className="block text-stone-200 text-sm">{biscuitsCaught}</strong>
              </div>
              <div>
                <span className="text-stone-400">Chai Served:</span>
                <strong className="block text-amber-400 text-sm">{cupsServed} cups</strong>
              </div>
              <div>
                <span className="text-stone-400">Golden Biscuits:</span>
                <strong className="block text-yellow-300 text-sm">{goldenCaught}</strong>
              </div>
              <div>
                <span className="text-stone-400">Max Combo:</span>
                <strong className="block text-amber-300 text-sm">{maxCombo}x</strong>
              </div>
              <div>
                <span className="text-stone-400">Dunk Bonanzas:</span>
                <strong className="block text-emerald-400 text-sm">{dunkCount} dips</strong>
              </div>
              <div>
                <span className="text-stone-400">Personal Best:</span>
                <strong className="block text-stone-300 text-sm">{highScore}</strong>
              </div>
            </div>

            {/* ACTION BUTTONS: PLAY AGAIN + HOME BUTTON */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => startGame('RUSH_45')}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Play 45s Rush
              </button>
              
              <button
                onClick={() => startGame('RELAXED_90')}
                className="py-3 px-3.5 rounded-xl font-semibold text-xs text-stone-300 border border-stone-700 hover:border-amber-400 hover:text-amber-200 transition-all cursor-pointer"
              >
                90s Mode
              </button>

              {/* HOME ICON BUTTON AT END OF GAME */}
              <button
                onClick={goHome}
                className="py-3 px-3.5 rounded-xl font-semibold text-xs text-amber-300 border border-amber-600/50 bg-amber-950/30 hover:bg-amber-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                title="Return to Main Menu"
              >
                <Home className="w-4 h-4 text-amber-400" />
                <span>Home</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TITLE / WELCOME MODAL OVERLAY (KEEPS DUAL STATIONS VISIBLE IN BACKGROUND) */}
      {gameState === 'TITLE' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-stone-900/95 border border-stone-800 rounded-2xl p-5 sm:p-7 shadow-2xl text-center relative max-h-[90vh] overflow-y-auto">
            
            <img 
              src={biscuitsPileImg} 
              alt="Osmania Biscuits"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-500/60 shadow-xl mx-auto mb-3"
            />
            
            <h2 className="font-serif-display text-2xl sm:text-3xl font-bold text-amber-200 mb-1">
              Irani Chai & Osmania Biscuit Rush
            </h2>
            <p className="text-xs text-stone-300 max-w-lg mx-auto mb-4 leading-relaxed">
              Step behind the counter of a heritage Hyderabadi café! Multitask between two bustling stations side-by-side before the 45-second timer runs out.
            </p>

            {/* TWO STATIONS SIDE-BY-SIDE EXPLANATION BOX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs mb-4">
              {/* Left Station */}
              <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-500/30">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1 text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  ZONE 1 (LEFT): BISCUIT CATCHER
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed mb-2">
                  Catch falling Osmania biscuits into the brass plate at the bottom. Don&apos;t let them crash!
                </p>
                <div className="text-[10px] text-stone-400 bg-stone-900 p-1.5 rounded border border-stone-800">
                  <span className="text-amber-300 font-semibold">Controls:</span> Mouse Move or <kbd className="text-stone-200">[←] [→] / [A] [D]</kbd>
                </div>
              </div>

              {/* Right Station */}
              <div className="bg-stone-950/80 p-3 rounded-xl border border-amber-500/30">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1 text-xs">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  ZONE 2 (RIGHT): SAMOVAR BREWERY
                </div>
                <p className="text-stone-300 text-[11px] leading-relaxed mb-2">
                  Rapidly tap the pour tap to fill the cutting glass to 100% (+50 pts & combo multiplier).
                </p>
                <div className="text-[10px] text-stone-400 bg-stone-900 p-1.5 rounded border border-stone-800">
                  <span className="text-amber-300 font-semibold">Controls:</span> Click Tap or <kbd className="text-stone-200">[Spacebar] / [Enter]</kbd>
                </div>
              </div>
            </div>

            {/* 5-STAGE AVATAR PREVIEW */}
            <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80 mb-5 text-left">
              <div className="text-[11px] font-semibold text-stone-400 mb-1.5 flex items-center justify-between">
                <span>5-Stage Barista Avatar Progression:</span>
                <span className="text-amber-400 text-[10px]">Score more points to evolve!</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {AVATAR_STAGES.map(s => (
                  <div 
                    key={s.stage}
                    className={`p-1 rounded-lg border ${s.border} bg-stone-900/60 flex flex-col items-center justify-between`}
                  >
                    <span className="text-base mb-0.5">{s.badge}</span>
                    <span className="text-[9px] font-bold text-stone-200 truncate w-full">{s.title}</span>
                    <span className="text-[8px] text-stone-400 font-mono-numbers">{s.minScore}+</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions: Start 45s Rush, 90s Mode, and README */}
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => startGame('RUSH_45')}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Start 45s Rush
              </button>
              
              <button
                onClick={() => startGame('RELAXED_90')}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-stone-200 border border-stone-700 hover:border-amber-400 hover:text-amber-200 transition-all cursor-pointer"
              >
                Relaxed 90s Mode
              </button>

              <button
                onClick={() => setShowReadmeModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-300 border border-stone-800 bg-stone-950/60 hover:text-amber-300 hover:border-stone-700 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                README & Info
              </button>
            </div>

          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <h3 className="font-serif-display text-xl font-bold text-amber-200 flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-400" />
                How to Play: Irani Chai Rush
              </h3>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1 rounded bg-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-1">
              <div className="bg-stone-950/60 p-3 rounded-lg border border-stone-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  Dual Controls (Keyboard & Mouse)
                </h4>
                <p className="mb-2">
                  This game tests your multitasking skills across two café stations simultaneously:
                </p>
                <ul className="list-disc list-inside space-y-1 text-stone-300">
                  <li><strong>Move Plate:</strong> Mouse Move or <code>[←] [→]</code> / <code>[A] [D]</code> keys.</li>
                  <li><strong>Pour Chai:</strong> Click Pour Tap or press <code>[Spacebar]</code> / <code>[Enter]</code>.</li>
                  <li><strong>Pause Game:</strong> In-game Pause button or press <code>[P]</code>.</li>
                </ul>
              </div>

              <div className="bg-stone-950/60 p-3 rounded-lg border border-stone-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1">
                  Catch with Brass Plate
                </h4>
                <ul className="list-disc list-inside space-y-1 text-stone-300">
                  <li><strong>Classic Osmania:</strong> +10 points</li>
                  <li><strong>Golden Osmania:</strong> +25 points and adds +2 seconds to the timer!</li>
                  <li><strong>Malai Glazed:</strong> +15 points and increases your combo level.</li>
                  <li><strong>Burnt Hazard:</strong> Dodge it! Penalizes -10 points and resets your combo.</li>
                </ul>
              </div>

              <div className="bg-stone-950/60 p-3 rounded-lg border border-stone-800">
                <h4 className="font-bold text-emerald-400 text-sm mb-1">
                  Dunk Synergy Bonus (2X Points)
                </h4>
                <p>
                  Catching an Osmania biscuit right after serving a cup of chai triggers the famous Hyderabadi <em>&quot;Dunked in Chai&quot;</em> double multiplier!
                </p>
              </div>

              <div className="bg-stone-950/60 p-3 rounded-lg border border-stone-800">
                <h4 className="font-bold text-yellow-300 text-sm mb-1">
                  5-Stage Avatar Evolution
                </h4>
                <p>
                  Level up your Barista from <strong>Chai Chotu</strong> (0-199) to <strong>Cutting Pro</strong> (200-449), <strong>Table Ustaad</strong> (450-799), <strong>Café Baadshah</strong> (800-1199), and finally <strong>Sultan of Samovars</strong> (1200+)!
                </p>
              </div>
            </div>

            {/* FIX: Clicking Close NEVER auto-starts the game! */}
            <div className="mt-5 pt-3 border-t border-stone-800 flex justify-between items-center">
              <span className="text-[11px] text-stone-400">Controls guide always available</span>
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 rounded-lg text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IRANI CAFE LORE MODAL */}
      {showLoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <h3 className="font-serif-display text-xl font-bold text-amber-200">
                The Heritage of Irani Chai & Osmania Biscuits
              </h3>
              <button
                onClick={() => setShowLoreModal(false)}
                className="text-stone-400 hover:text-stone-200 text-xs px-2 py-1 rounded bg-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                In the early 20th century, Zoroastrian Iranian settlers traveled to Bombay and Hyderabad, establishing legendary cafés with high ceilings, large Belgian mirrors, checkered marble floors, and bentwood Thonet chairs.
              </p>
              <p>
                <strong>Irani Chai:</strong> Unlike regular milk tea, authentic Irani chai is slow-steeped in enormous, gleaming copper and brass <em>samovars</em>. The thick black tea decoction and creamy caramelized <em>malai</em> milk are brewed in separate pots, combined piping hot directly into a glass tumbler right before being served.
              </p>
              <p>
                <strong>The Osmania Biscuit:</strong> Named after Mir Osman Ali Khan, the 7th Nizam of Hyderabad. Created at the Nizamia General Hospital kitchens, it is celebrated for its irresistible crumb that perfectly balances a subtle salty tang with rich buttery sweetness. Dipping an Osmania biscuit into scalding Irani chai is a daily Hyderabadi ritual cherished across generations.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-stone-800 flex justify-end">
              <button
                onClick={() => setShowLoreModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE README & GAME GUIDE MODAL */}
      {showReadmeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-7 shadow-2xl relative max-h-[85vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-display text-xl font-bold text-amber-200">
                  README & Café Game Guide
                </h3>
              </div>
              <button
                onClick={() => setShowReadmeModal(false)}
                className="text-stone-400 hover:text-stone-200 text-xs px-2.5 py-1 rounded bg-stone-800 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="space-y-4 text-xs text-stone-300 leading-relaxed overflow-y-auto pr-1 flex-1">
              
              {/* Section 1: Overview */}
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1.5 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  1. Overview & Goal
                </h4>
                <p className="mb-2">
                  <strong>Irani Chai & Osmania Biscuit Rush</strong> is a time-attack multitasking clicker capturing the energy of Hyderabad&apos;s century-old Irani cafés (such as Café Nimrah at Charminar and Niloufer Café).
                </p>
                <p>
                  You must manage two distinct action stations side-by-side simultaneously before the 45-second timer runs out.
                </p>
              </div>

              {/* Section 2: Dual Station Architecture */}
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1.5">
                  2. Dual Station Architecture (Side-by-Side)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="p-2.5 rounded-lg border border-amber-600/30 bg-stone-900">
                    <strong className="text-amber-300 block mb-1">Zone 1 (Left): Biscuit Catcher</strong>
                    <p className="text-[11px] text-stone-300">
                      Osmania biscuits tumble from the bakery rack. Glide the traditional brass plate along the bottom to catch them before they hit the marble countertop!
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg border border-amber-600/30 bg-stone-900">
                    <strong className="text-amber-300 block mb-1">Zone 2 (Right): Samovar Brewery</strong>
                    <p className="text-[11px] text-stone-300">
                      Rapidly tap the vintage copper boiler spigot to fill the cutting glass with boiling tea and malai cream to 100% (+50 pts & combo upgrade)!
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Controls */}
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1.5 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  3. Controls & Mechanisms
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-numbers">
                  <div>
                    <span className="text-stone-400 block font-sans">Move Plate:</span>
                    <span className="text-stone-200">Mouse Move or [←] [→] / [A] [D]</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-sans">Pour Chai:</span>
                    <span className="text-stone-200">Click Tap or [Space] / [Enter]</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-sans">Pause Game:</span>
                    <span className="text-stone-200">HUD Pause button or [P]</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-sans">Stop / Home:</span>
                    <span className="text-stone-200">Stop Game button or [Esc]</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Scoring & Dunk Synergy */}
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1.5">
                  4. Scoring, Combos & Dunk Synergy
                </h4>
                <ul className="list-disc list-inside space-y-1 text-stone-300 text-[11px] mb-2">
                  <li><strong>Classic Osmania:</strong> +10 pts</li>
                  <li><strong>Golden Osmania:</strong> +25 pts & <strong>+2.0s Time Bonus</strong></li>
                  <li><strong>Malai Biscuit:</strong> +15 pts & Boosts Combo Multiplier</li>
                  <li><strong>Burnt Hazard:</strong> -10 pts & Resets Combo (Dodge it!)</li>
                  <li><strong>Completed Chai Glass:</strong> +50 pts (+Perk bonuses)</li>
                </ul>
                <div className="p-2 bg-emerald-950/40 border border-emerald-600/40 rounded text-emerald-300 text-[11px]">
                  <strong>☕ Dunk Synergy (2X Multiplier):</strong> Catching an Osmania biscuit within 2.2 seconds of serving chai triggers the famous <em>&quot;Dunked in Chai&quot;</em> 2x score multiplier!
                </div>
              </div>

              {/* Section 5: 5-Stage Avatar Progression */}
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800">
                <h4 className="font-bold text-amber-300 text-sm mb-1.5">
                  5. 5-Stage Barista Avatar Progression
                </h4>
                <div className="space-y-1.5">
                  {AVATAR_STAGES.map(s => (
                    <div key={s.stage} className="flex items-center justify-between p-2 rounded bg-stone-900 border border-stone-800 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{s.badge}</span>
                        <div>
                          <strong className="text-stone-200">{s.title}</strong>
                          <span className="text-stone-400 ml-1.5">({s.subtitle})</span>
                        </div>
                      </div>
                      <span className="text-amber-400 font-mono-numbers font-semibold">
                        {s.minScore}+ pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 6: Audio Synthesizer */}
              <div className="bg-stone-950/70 p-3.5 rounded-xl border border-stone-800 text-[11px] text-stone-400">
                <strong className="text-stone-200 block mb-1">Web Audio API Synthesis:</strong>
                All sound effects (biscuit crunch, golden sitar arpeggio, brass bell, boiling steam hiss, and ambient Tanpura/Tabla café loop) are synthesized in real-time with zero external audio assets.
              </div>

            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-stone-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowReadmeModal(false)}
                className="px-5 py-2 rounded-lg text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer"
              >
                Close README
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="relative z-20 border-t border-stone-800/80 py-3 px-6 bg-stone-950/90 text-stone-400 text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>Irani Chai & Osmania Biscuit Rush</span>
          <span>·</span>
          <span>Inspired by Hyderabadi Café Culture</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-stone-400">
          <span>Plate Catcher & Dual Controls</span>
          <span>·</span>
          <span>5-Stage Avatar Progression</span>
          <span>·</span>
          <span className="font-mono-numbers">v1.1</span>
        </div>
      </footer>

    </div>
  );
}
