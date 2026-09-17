import React from 'react';
import { X, Award, CheckCircle2, Lock, Zap, Flame, Sparkles, Trophy, Coins, Key, CalendarCheck, Compass, Car } from 'lucide-react';
import { ACHIEVEMENTS, AchievementDefinition } from '../config/AchievementConfig';
import { achievementService } from '../services/AchievementService';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICONS: Record<string, React.ReactNode> = {
  Car: <Car className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Award: <Award className="w-4 h-4" />,
  Compass: <Compass className="w-4 h-4" />,
  Trophy: <Trophy className="w-4 h-4" />,
  Coins: <Coins className="w-4 h-4" />,
  Key: <Key className="w-4 h-4" />,
  CalendarCheck: <CalendarCheck className="w-4 h-4" />
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const unlockedMap = achievementService.getUnlockedAchievements();
  const unlockedCount = Object.keys(unlockedMap).length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">
              TROPHY ROOM
            </span>
            <h2 className="text-2xl font-black text-white font-['Chakra_Petch']">ACHIEVEMENTS</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-400">
              {unlockedCount} / {totalCount}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="my-3">
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-amber-400 h-2 rounded-full transition-all"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2">
          {ACHIEVEMENTS.map((ach: AchievementDefinition) => {
            const isUnlocked = !!unlockedMap[ach.id];
            const unlockedDate = isUnlocked ? new Date(unlockedMap[ach.id]).toLocaleDateString() : null;

            return (
              <div
                key={ach.id}
                className={`p-3 rounded-xl border flex items-center gap-3 transition ${
                  isUnlocked
                    ? 'bg-zinc-950/80 border-amber-500/40 text-white'
                    : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-500 opacity-60'
                }`}
              >
                <div
                  className={`p-2.5 rounded-lg shrink-0 ${
                    isUnlocked
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-zinc-800 text-zinc-600'
                  }`}
                >
                  {ICONS[ach.iconName] || <Award className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black font-['Chakra_Petch'] truncate">
                      {ach.title}
                    </h4>
                    {isUnlocked ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> {unlockedDate}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
