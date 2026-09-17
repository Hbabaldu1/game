import React, { useState, useEffect } from 'react';
import { Award, Zap, Flame, Sparkles, Trophy, Coins, Key, CalendarCheck, Compass, Car } from 'lucide-react';
import { eventBus } from '../core/EventBus';
import { AchievementDefinition } from '../config/AchievementConfig';

const ICONS: Record<string, React.ReactNode> = {
  Car: <Car className="w-5 h-5 text-amber-400" />,
  Zap: <Zap className="w-5 h-5 text-yellow-400" />,
  Flame: <Flame className="w-5 h-5 text-orange-400" />,
  Sparkles: <Sparkles className="w-5 h-5 text-amber-300" />,
  Award: <Award className="w-5 h-5 text-emerald-400" />,
  Compass: <Compass className="w-5 h-5 text-blue-400" />,
  Trophy: <Trophy className="w-5 h-5 text-amber-400" />,
  Coins: <Coins className="w-5 h-5 text-yellow-400" />,
  Key: <Key className="w-5 h-5 text-indigo-400" />,
  CalendarCheck: <CalendarCheck className="w-5 h-5 text-emerald-400" />
};

export const AchievementToast: React.FC = () => {
  const [activeToast, setActiveToast] = useState<AchievementDefinition | null>(null);

  useEffect(() => {
    const handleUnlocked = (achievement: AchievementDefinition) => {
      setActiveToast(achievement);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    };

    eventBus.on('achievement:unlocked', handleUnlocked);
    return () => {
      eventBus.off('achievement:unlocked', handleUnlocked);
    };
  }, []);

  if (!activeToast) return null;

  return (
    <div
      id="achievement-toast"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900/95 border-2 border-amber-500 rounded-xl shadow-2xl backdrop-blur max-w-xs sm:max-w-sm animate-bounce"
    >
      <div className="p-2 bg-amber-500/10 rounded-lg shrink-0">
        {ICONS[activeToast.iconName] || <Award className="w-5 h-5 text-amber-400" />}
      </div>
      <div>
        <div className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
          ACHIEVEMENT UNLOCKED
        </div>
        <div className="text-sm font-black text-white font-['Chakra_Petch']">
          {activeToast.title}
        </div>
        <div className="text-xs text-zinc-400 leading-tight">
          {activeToast.description}
        </div>
      </div>
    </div>
  );
};
