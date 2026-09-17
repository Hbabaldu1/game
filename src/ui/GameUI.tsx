import React, { useState, useEffect } from 'react';
import { Game } from '../core/Game';
import { GameState, PlayerStats } from '../types/game';
import { eventBus } from '../core/EventBus';
import { storageService } from '../services/StorageService';
import { dailyChallengeService } from '../services/DailyChallengeService';
import { DailyChallengeDefinition } from '../config/DailyConfig';
import { VehicleId, VEHICLE_DEFINITIONS } from '../config/VehicleConfig';
import { ScoreCardData } from '../utils/ScoreCardGenerator';
import {
  Volume2,
  VolumeX,
  Music,
  Pause,
  Play,
  RotateCcw,
  Zap,
  Fuel,
  Award,
  Share2,
  Trophy,
  Calendar,
  BarChart3,
  Car,
  Home
} from 'lucide-react';

import { GarageModal } from './GarageModal';
import { DailyChallengeModal } from './DailyChallengeModal';
import { AchievementsModal } from './AchievementsModal';
import { CareerStatsModal } from './CareerStatsModal';
import { ShareModal } from './ShareModal';
import { LeaderboardModal } from './LeaderboardModal';
import { BrakeControls } from './BrakeControls';
import { leaderboardService } from '../services/LeaderboardService';
import { adService } from '../services/CommercialAdService';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';

interface GameUIProps {
  game: Game | null;
}

export const GameUI: React.FC<GameUIProps> = ({ game }) => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameOverReason, setGameOverReason] = useState<'CRASH' | 'FUEL_EMPTY'>('CRASH');
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    highScore: 0,
    koboEarned: 0,
    totalKobo: 0,
    distance: 0,
    closeShaves: 0,
    maxCombo: 1,
    currentCombo: 1,
    comboTimer: 0,
    fuel: 100,
    isInvulnerable: false,
    invulnerabilityTimer: 0
  });

  const [isSoundMuted, setIsSoundMuted] = useState(storageService.isSoundMuted());
  const [isMusicMuted, setIsMusicMuted] = useState(storageService.isMusicMuted());
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleId>(storageService.getSelectedVehicle());
  const [isReviving, setIsReviving] = useState(false);
  const [isDoublingKobo, setIsDoublingKobo] = useState(false);
  const [hasDoubledKobo, setHasDoubledKobo] = useState(false);

  // Modals state
  const [isGarageOpen, setIsGarageOpen] = useState(false);
  const [isDailyOpen, setIsDailyOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Score card data for game over sharing
  const [shareData, setShareData] = useState<ScoreCardData | null>(null);

  useEffect(() => {
    const handleStateChange = (e: { previous: GameState; current: GameState; payload?: any }) => {
      setGameState(e.current);
      if (e.current === 'PLAYING') {
        setHasDoubledKobo(false);
      }
      if (e.current === 'GAME_OVER') {
        if (e.payload?.reason) {
          setGameOverReason(e.payload.reason);
        }
        if (game) {
          const card = game.getScoreCardData();
          setShareData(card);
          // Automatically register score into Leaderboard
          leaderboardService.submitScore({
            playerName: leaderboardService.getPlayerTag(),
            score: card.score,
            distance: card.distance,
            closeShaves: card.closeShaves,
            vehicle: card.vehicle.id,
            levelReached: card.levelReached || 1
          });
        }
      }
    };

    eventBus.on('state:changed', handleStateChange);

    // Refresh UI stats at 20Hz (50ms)
    const interval = setInterval(() => {
      if (game) {
        setStats(game.getStats());
      }
    }, 50);

    return () => {
      eventBus.off('state:changed', handleStateChange);
      clearInterval(interval);
    };
  }, [game]);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (game) {
      const muted = game.audio.toggleMute();
      storageService.setSoundMuted(muted);
      setIsSoundMuted(muted);
    }
  };

  const handleToggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (game) {
      const muted = game.audio.toggleMusic();
      storageService.setMusicMuted(muted);
      setIsMusicMuted(muted);
    }
  };

  const handleStartStandardRun = () => {
    if (game) {
      game.startRun();
    }
  };

  const handleStartDailyChallenge = (challenge: DailyChallengeDefinition) => {
    if (game) {
      game.startRun(challenge);
    }
  };

  const handleSelectVehicle = (vId: VehicleId) => {
    setSelectedVehicle(vId);
    if (game) {
      game.setPlayerVehicle(vId);
    }
  };

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (game) {
      if (gameState === 'PLAYING') {
        game.pause();
      } else if (gameState === 'PAUSED') {
        game.resume();
      }
    }
  };

  const handleRevive = async () => {
    if (game && !isReviving) {
      setIsReviving(true);
      await game.revive();
      setIsReviving(false);
    }
  };

  const handleDoubleKobo = async () => {
    if (isDoublingKobo || hasDoubledKobo || stats.koboEarned <= 0) return;
    setIsDoublingKobo(true);
    const granted = await adService.showRewardedAd('double_kobo');
    if (granted) {
      storageService.addKobo(stats.koboEarned);
      setHasDoubledKobo(true);
    }
    setIsDoublingKobo(false);
  };

  const handleGoToMenu = () => {
    if (game) {
      game.stateManager.setState('MENU');
      game.audio.stopMusic();
    }
  };

  const currentVehicleDef = VEHICLE_DEFINITIONS[selectedVehicle];
  const levelInfo = game ? game.getLevelInfo() : null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* 1. TOP HUD (Visible during PLAYING and PAUSED) */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <header className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex flex-col gap-2 z-20">
          <div className="flex items-center justify-between max-w-md mx-auto w-full">
            {/* Score & Combo */}
            <div className="flex items-center gap-2">
              <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                <span className="text-[10px] text-zinc-400 font-bold block uppercase tracking-wider">Score</span>
                <span className="font-['Chakra_Petch'] text-xl sm:text-2xl font-black text-white tracking-wide">
                  {stats.score.toLocaleString()}
                </span>
              </div>

              {/* Combo Multiplier Pill */}
              <div
                className={`px-2.5 py-1.5 rounded-xl border font-['Chakra_Petch'] font-black text-sm flex items-center gap-1 transition-all ${
                  stats.currentCombo > 1
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-black/60 border-white/10 text-zinc-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{stats.currentCombo}x</span>
              </div>
            </div>

            {/* In-Run Kobo & Controls */}
            <div className="flex items-center gap-2">
              <div className="bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 shadow-lg">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] flex items-center justify-center font-['Chakra_Petch']">
                  ₦
                </span>
                <span className="font-['Chakra_Petch'] font-bold text-sm text-amber-300">
                  {stats.koboEarned}
                </span>
              </div>

              {/* Sound Toggle */}
              <button
                id="btn-hud-sound"
                onClick={handleToggleSound}
                className="pointer-events-auto p-2 bg-black/70 hover:bg-black/90 active:scale-95 text-white/80 hover:text-white rounded-xl border border-white/10 transition"
                title={isSoundMuted ? 'Unmute SFX' : 'Mute SFX'}
              >
                {isSoundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              {/* Pause */}
              <button
                id="btn-hud-pause"
                onClick={handleTogglePause}
                className="pointer-events-auto p-2 bg-black/70 hover:bg-black/90 active:scale-95 text-white/80 hover:text-white rounded-xl border border-white/10 transition"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Daily Challenge Banner indicator if active */}
          {game?.isDailyChallenge && game.currentDailyChallenge && (
            <div className="max-w-md mx-auto w-full flex justify-center">
              <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-black font-['Chakra_Petch'] flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <span>DAILY: {game.currentDailyChallenge.name.toUpperCase()}</span>
              </div>
            </div>
          )}

          {/* Level Progress & Expressway Sector Pill */}
          {levelInfo && (
            <div className="max-w-md mx-auto w-full flex items-center justify-between px-1 text-[10px] font-['Chakra_Petch'] font-bold">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-sky-500/25 border border-sky-400/40 text-sky-300">
                  LVL {levelInfo.current.id}
                </span>
                <span className="text-zinc-200 tracking-wide">
                  {levelInfo.current.name.toUpperCase()}
                </span>
                <span className="text-amber-400">
                  ({levelInfo.koboMultiplier}x ₦)
                </span>
              </div>
              <span className="text-zinc-400 font-mono">
                {Math.round(levelInfo.progress * 100)}%
              </span>
            </div>
          )}

          {/* Fuel Gauge Bar */}
          <div className="max-w-md mx-auto w-full px-1">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="flex items-center gap-1 text-zinc-300 uppercase tracking-wider font-['Chakra_Petch']">
                <Fuel className="w-3 h-3 text-red-400" /> Fuel
              </span>
              <span className={`font-mono ${stats.fuel < 25 ? 'text-red-400 font-bold animate-pulse' : 'text-zinc-400'}`}>
                {Math.round(stats.fuel)}%
              </span>
            </div>
            <div className="h-2 w-full bg-zinc-900/90 rounded-full overflow-hidden border border-white/10 p-[1px]">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  stats.fuel < 25
                    ? 'bg-red-500 shadow-[0_0_10px_#ef4444]'
                    : stats.fuel < 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${stats.fuel}%` }}
              />
            </div>
          </div>
        </header>
      )}

      {/* 2. ON-SCREEN BRAKE CONTROLS & WEAVE GUIDES */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-between items-end px-4 pointer-events-none z-20">
          <div className="text-zinc-400 text-xs font-bold flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/10 opacity-30">
            <span>◀ WEAVE</span>
          </div>

          {/* Interactive Touch Brake Pedal & Heat Gauge */}
          <BrakeControls brakeStatus={game ? game.getBrakeInfo() : null} />

          <div className="text-zinc-400 text-xs font-bold flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full border border-white/10 opacity-30">
            <span>WEAVE ▶</span>
          </div>
        </div>
      )}

      {/* 3. MENU / TITLE SCREEN */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/95 pointer-events-auto flex flex-col justify-between p-5 z-30">
          {/* Top Bar: Kobo Balance, High Score, Audio Controls */}
          <div className="w-full flex justify-between items-center max-w-md mx-auto">
            {/* Kobo Balance & High Score */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-xl border border-amber-500/30">
                <span className="w-4 h-4 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] flex items-center justify-center font-['Chakra_Petch']">
                  ₦
                </span>
                <span className="font-['Chakra_Petch'] font-bold text-xs text-amber-300">
                  {stats.totalKobo.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/70 px-3 py-1.5 rounded-xl border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] text-zinc-400 font-bold">BEST:</span>
                <span className="font-['Chakra_Petch'] font-bold text-xs text-white">
                  {stats.highScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Sound & Music Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-menu-music"
                onClick={handleToggleMusic}
                className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-xl border border-white/10 transition"
                title={isMusicMuted ? 'Unmute Afrobeat Music' : 'Mute Music'}
              >
                <Music className={`w-3.5 h-3.5 ${isMusicMuted ? 'text-zinc-600' : 'text-amber-400'}`} />
              </button>

              <button
                id="btn-menu-sound"
                onClick={handleToggleSound}
                className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-xl border border-white/10 transition"
                title={isSoundMuted ? 'Unmute SFX' : 'Mute SFX'}
              >
                {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Center Brand & Drive CTA */}
          <div className="text-center flex flex-col items-center my-auto">
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-400/40 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black font-['Chakra_Petch'] tracking-widest uppercase mb-2">
              <span>LAGOS EXPRESSWAY ARCADE</span>
            </div>

            <h1 className="font-['Chakra_Petch'] text-4xl sm:text-5xl font-black text-amber-400 tracking-tight drop-shadow-[0_4px_16px_rgba(245,158,11,0.5)]">
              DANFO DRIFT
            </h1>
            <p className="font-['Chakra_Petch'] text-sm sm:text-base font-bold text-zinc-200 tracking-widest mt-0.5">
              LAGOS EXPRESS
            </p>

            {/* Selected Vehicle Badge */}
            <button
              onClick={() => setIsGarageOpen(true)}
              className="mt-3 py-1.5 px-3 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 flex items-center gap-2 text-xs text-zinc-300 transition"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>Ride: <strong className="text-amber-400 font-['Chakra_Petch']">{currentVehicleDef.name}</strong></span>
              <span className="text-[10px] text-zinc-500 underline ml-1">Change</span>
            </button>

            {/* Main Drive Action Button */}
            <div className="mt-7">
              <button
                id="btn-main-drive"
                onClick={handleStartStandardRun}
                className="w-56 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-['Chakra_Petch'] font-black text-lg tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-zinc-950" />
                <span>TAP TO DRIVE</span>
              </button>
            </div>

            {/* PWA Install Button if eligible */}
            <div className="mt-4">
              <PWAInstallButton />
            </div>
          </div>

          {/* Bottom Grid Navigation: Garage, Daily, Legends, Trophies, Logbook */}
          <div className="w-full max-w-md mx-auto grid grid-cols-5 gap-1.5 pt-2 border-t border-zinc-800/80">
            <button
              id="nav-garage-btn"
              onClick={() => setIsGarageOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 transition"
            >
              <Car className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[9px] font-bold tracking-wider uppercase font-['Chakra_Petch']">Garage</span>
            </button>

            <button
              id="nav-daily-btn"
              onClick={() => setIsDailyOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 transition relative"
            >
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <Calendar className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[9px] font-bold tracking-wider uppercase font-['Chakra_Petch']">Daily</span>
            </button>

            <button
              id="nav-legends-btn"
              onClick={() => setIsLeaderboardOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400 text-zinc-300 transition"
            >
              <Award className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[9px] font-bold tracking-wider uppercase font-['Chakra_Petch']">Legends</span>
            </button>

            <button
              id="nav-trophies-btn"
              onClick={() => setIsAchievementsOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 transition"
            >
              <Trophy className="w-4 h-4 text-yellow-400 mb-1" />
              <span className="text-[9px] font-bold tracking-wider uppercase font-['Chakra_Petch']">Trophies</span>
            </button>

            <button
              id="nav-stats-btn"
              onClick={() => setIsStatsOpen(true)}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-blue-500/40 text-zinc-300 transition"
            >
              <BarChart3 className="w-4 h-4 text-blue-400 mb-1" />
              <span className="text-[9px] font-bold tracking-wider uppercase font-['Chakra_Petch']">Logbook</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. GAME OVER SCREEN */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md pointer-events-auto flex flex-col items-center justify-center p-5 z-30">
          <div className="bg-[#121316] border border-white/10 rounded-2xl p-5 max-w-xs sm:max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
            {/* Reason Badge */}
            <div
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 font-['Chakra_Petch'] ${
                gameOverReason === 'CRASH'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              }`}
            >
              {gameOverReason === 'CRASH' ? 'Accident! Expressway Blocked' : 'Tank Empty! Out of Fuel'}
            </div>

            {/* Daily Challenge Indicator if active */}
            {game?.isDailyChallenge && game.currentDailyChallenge && (
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                DAILY: {game.currentDailyChallenge.name}
              </div>
            )}

            <h2 className="font-['Chakra_Petch'] text-3xl font-black text-white">
              RUN COMPLETE
            </h2>

            {/* Score & High Score */}
            <div className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 my-3 flex flex-col gap-1.5">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Final Score</span>
                <span className="font-['Chakra_Petch'] text-3xl font-black text-amber-400">
                  {stats.score.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between text-xs text-zinc-400">
                <span>Personal Best</span>
                <span className="font-['Chakra_Petch'] font-bold text-white">
                  {stats.highScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stats Triplets */}
            <div className="grid grid-cols-3 gap-2 w-full mb-3">
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block font-bold">Kobo</span>
                <span className="font-['Chakra_Petch'] font-bold text-amber-300">+{stats.koboEarned * (hasDoubledKobo ? 2 : 1)}₦</span>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block font-bold">Close Shaves</span>
                <span className="font-['Chakra_Petch'] font-bold text-emerald-400">{stats.closeShaves}</span>
              </div>
              <div className="bg-zinc-900/80 p-2 rounded-lg border border-white/5">
                <span className="text-[10px] text-zinc-400 block font-bold">Peak Combo</span>
                <span className="font-['Chakra_Petch'] font-bold text-sky-400">{stats.maxCombo}x</span>
              </div>
            </div>

            {/* Rewarded Double Kobo Ad Option */}
            {stats.koboEarned > 0 && !hasDoubledKobo && (
              <button
                id="btn-double-kobo"
                onClick={handleDoubleKobo}
                disabled={isDoublingKobo}
                className="w-full mb-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-['Chakra_Petch'] font-black text-xs py-2.5 px-3 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 fill-zinc-950" />
                <span>{isDoublingKobo ? 'PLAYING AD...' : `DOUBLE KOBO (+${stats.koboEarned}₦) [WATCH AD]`}</span>
              </button>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full">
              {/* Optional Revive */}
              {game && game.canRevive() && (
                <button
                  id="btn-gameover-revive"
                  onClick={handleRevive}
                  disabled={isReviving}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-['Chakra_Petch'] font-black text-sm py-3 px-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-zinc-950" />
                  <span>{isReviving ? 'LOADING AD...' : 'REVIVE (WATCH AD)'}</span>
                </button>
              )}

              {/* Drive Again */}
              <button
                id="btn-gameover-restart"
                onClick={handleStartStandardRun}
                className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-['Chakra_Petch'] font-black text-sm py-3 px-4 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>DRIVE AGAIN</span>
              </button>

              {/* Share Ticket & Leaderboard */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-share-score"
                  onClick={() => setIsShareOpen(true)}
                  className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-['Chakra_Petch'] font-bold text-xs flex items-center justify-center gap-1.5 transition border border-white/10 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>SHARE TICKET</span>
                </button>

                <button
                  id="btn-gameover-leaderboard"
                  onClick={() => setIsLeaderboardOpen(true)}
                  className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-['Chakra_Petch'] font-bold text-xs flex items-center justify-center gap-1.5 transition border border-white/10 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>LEGENDS</span>
                </button>
              </div>

              {/* Return to Menu & Garage */}
              <div className="flex justify-between items-center px-1 pt-1">
                <button
                  id="btn-gameover-garage"
                  onClick={() => setIsGarageOpen(true)}
                  className="text-amber-400 hover:text-amber-300 text-xs py-1 transition flex items-center gap-1 cursor-pointer font-bold"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>GARAGE (₦{storageService.getTotalKobo()})</span>
                </button>

                <button
                  id="btn-return-menu"
                  onClick={handleGoToMenu}
                  className="text-zinc-500 hover:text-zinc-300 text-xs py-1 transition flex items-center gap-1 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>MAIN MENU</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. PAUSED MODAL */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm pointer-events-auto flex flex-col items-center justify-center p-6 z-30">
          <div className="bg-[#121316] border border-white/10 rounded-2xl p-6 max-w-xs w-full shadow-2xl flex flex-col items-center text-center">
            <h2 className="font-['Chakra_Petch'] text-2xl font-black text-white mb-1">PAUSED</h2>
            <p className="text-zinc-400 text-xs mb-5">Take a breather, Oga Driver!</p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                id="btn-pause-resume"
                onClick={handleTogglePause}
                className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-['Chakra_Petch'] font-black text-sm py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-zinc-950" />
                <span>RESUME RUN</span>
              </button>

              <button
                id="btn-pause-restart"
                onClick={handleStartStandardRun}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-['Chakra_Petch'] font-bold text-xs py-2.5 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESTART</span>
              </button>

              <button
                id="btn-pause-menu"
                onClick={handleGoToMenu}
                className="text-zinc-500 hover:text-zinc-300 text-xs py-1 transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>QUIT TO MENU</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modals */}
      <GarageModal
        isOpen={isGarageOpen}
        onClose={() => setIsGarageOpen(false)}
        onSelectVehicle={handleSelectVehicle}
      />

      <DailyChallengeModal
        isOpen={isDailyOpen}
        onClose={() => setIsDailyOpen(false)}
        onStartChallenge={handleStartDailyChallenge}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
      />

      <CareerStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      {shareData && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          scoreData={shareData}
        />
      )}

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        playerHighScore={storageService.getHighScore()}
      />
    </div>
  );
};
