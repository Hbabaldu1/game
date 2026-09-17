import React from 'react';
import { X, Calendar, Flame, Gauge, Fuel, Coins, Award } from 'lucide-react';
import { dailyChallengeService } from '../services/DailyChallengeService';
import { storageService } from '../services/StorageService';
import { DailyChallengeDefinition } from '../config/DailyConfig';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChallenge: (challenge: DailyChallengeDefinition) => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  onStartChallenge
}) => {
  if (!isOpen) return null;

  const todayInfo = dailyChallengeService.getTodayChallenge();
  const challenge = todayInfo.challenge;
  const bestToday = storageService.getDailyHighScore(todayInfo.dateKey);

  const handleStart = () => {
    onStartChallenge(challenge);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-900 border border-emerald-500/40 rounded-2xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                {todayInfo.formattedDate}
              </span>
              <h2 className="text-xl font-black text-white font-['Chakra_Petch']">DAILY CHALLENGE</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenge Card */}
        <div className="my-5 bg-gradient-to-br from-zinc-950 to-zinc-900 border border-emerald-500/30 rounded-xl p-5">
          <div className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
            {challenge.tagline}
          </div>
          <h3 className="text-2xl font-black text-white font-['Chakra_Petch'] mt-1">
            {challenge.name}
          </h3>
          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
            {challenge.description}
          </p>

          {/* Modifiers Pill Badges */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 flex items-center gap-2 text-xs">
              <Gauge className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-zinc-500 font-bold">SPEED</div>
                <div className="font-black text-white">
                  {Math.round(challenge.modifiers.speedMultiplier * 100)}% Base
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 flex items-center gap-2 text-xs">
              <Flame className="w-4 h-4 text-orange-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-zinc-500 font-bold">TRAFFIC</div>
                <div className="font-black text-white">
                  {Math.round(challenge.modifiers.trafficDensityMultiplier * 100)}% Density
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 flex items-center gap-2 text-xs">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-zinc-500 font-bold">KOBO DROPS</div>
                <div className="font-black text-white">
                  {challenge.modifiers.koboSpawnMultiplier}x Rate
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 flex items-center gap-2 text-xs">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <div className="text-[10px] text-zinc-500 font-bold">SCORE BONUS</div>
                <div className="font-black text-emerald-400">
                  +{Math.round((challenge.modifiers.scoreBonusMultiplier - 1) * 100)}% Score
                </div>
              </div>
            </div>
          </div>

          {/* Forced Vehicle tag if any */}
          {challenge.modifiers.forcedVehicle && (
            <div className="mt-3 py-1.5 px-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center text-xs font-bold text-amber-400">
              LOCK: {challenge.modifiers.forcedVehicle} ONLY
            </div>
          )}
        </div>

        {/* Personal Best for Today */}
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs mb-4">
          <span className="text-zinc-400">Today's Best Run:</span>
          <span className="font-black font-['Chakra_Petch'] text-amber-400 text-sm">
            {bestToday > 0 ? `${bestToday.toLocaleString()} PTS` : 'NOT PLAYED YET'}
          </span>
        </div>

        {/* Launch Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm font-['Chakra_Petch'] tracking-wide transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <Flame className="w-4 h-4" />
          <span>START TODAY'S CHALLENGE</span>
        </button>
      </div>
    </div>
  );
};
