import React, { useState, useEffect } from 'react';
import { X, Trophy, Flame, Zap, Award, Edit2, Check } from 'lucide-react';
import { leaderboardService, LeaderboardEntry } from '../services/LeaderboardService';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerHighScore: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  playerHighScore
}) => {
  const [filter, setFilter] = useState<'ALL_TIME' | 'DAILY'>('ALL_TIME');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [playerTag, setPlayerTag] = useState(leaderboardService.getPlayerTag());
  const [isEditingTag, setIsEditingTag] = useState(false);
  const [tempTag, setTempTag] = useState(playerTag);

  useEffect(() => {
    if (isOpen) {
      loadScores();
    }
  }, [isOpen, filter]);

  const loadScores = async () => {
    setIsLoading(true);
    try {
      const list = await leaderboardService.getScores(filter);
      setEntries(list);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTag = () => {
    if (tempTag.trim()) {
      leaderboardService.setPlayerTag(tempTag.trim());
      setPlayerTag(tempTag.trim());
      setIsEditingTag(false);
      loadScores();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white font-['Chakra_Petch'] tracking-wide uppercase">
                Lagos Expressway Legends
              </h2>
              <p className="text-xs text-zinc-400">
                Top Mainland Drivers & High Scores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Tag & Filter Bar */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/20 flex flex-col gap-3">
          {/* Driver Tag Row */}
          <div className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 uppercase font-['Chakra_Petch'] font-bold">
                Driver Tag:
              </span>
              {isEditingTag ? (
                <input
                  type="text"
                  maxLength={16}
                  value={tempTag}
                  onChange={e => setTempTag(e.target.value)}
                  className="bg-zinc-800 text-white text-xs px-2 py-1 rounded border border-amber-500/50 outline-none font-bold"
                  autoFocus
                />
              ) : (
                <span className="text-sm font-black text-amber-400 font-['Chakra_Petch']">
                  {playerTag}
                </span>
              )}
            </div>

            {isEditingTag ? (
              <button
                onClick={handleSaveTag}
                className="p-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setTempTag(playerTag);
                  setIsEditingTag(true);
                }}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
                title="Edit Tag"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* All Time / Daily Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => setFilter('ALL_TIME')}
              className={`py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] transition uppercase ${
                filter === 'ALL_TIME'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              All-Time Legends
            </button>
            <button
              onClick={() => setFilter('DAILY')}
              className={`py-2 rounded-xl text-xs font-bold font-['Chakra_Petch'] transition uppercase ${
                filter === 'DAILY'
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Today's Best
            </button>
          </div>
        </div>

        {/* Leaderboard Table / Entries */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              Loading rankings...
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No recorded runs yet today. Hit the expressway and be the first!
            </div>
          ) : (
            entries.map((item, idx) => {
              const isTop3 = idx < 3;
              const rankColor =
                idx === 0
                  ? 'bg-amber-400 text-amber-950'
                  : idx === 1
                  ? 'bg-zinc-300 text-zinc-950'
                  : idx === 2
                  ? 'bg-amber-700 text-white'
                  : 'bg-zinc-800 text-zinc-400';

              return (
                <div
                  key={item.id || idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition ${
                    item.isPlayer
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div
                      className={`w-7 h-7 rounded-xl font-black font-['Chakra_Petch'] flex items-center justify-center text-xs shadow-inner ${rankColor}`}
                    >
                      {item.rank || idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm font-bold ${
                            item.isPlayer ? 'text-amber-300 font-black' : 'text-zinc-200'
                          }`}
                        >
                          {item.playerName}
                        </span>
                        {item.isPlayer && (
                          <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-400 text-[9px] font-black rounded uppercase">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                        <span>Lvl {item.levelReached}</span>
                        <span>•</span>
                        <span>{item.distance}m</span>
                        <span>•</span>
                        <span className="text-amber-400/80">{item.closeShaves} Shaves</span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="font-['Chakra_Petch'] font-black text-base text-white tracking-wide">
                      {item.score.toLocaleString()}
                    </span>
                    <span className="block text-[9px] text-zinc-500 uppercase tracking-wider font-mono">
                      PTS
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-between items-center text-xs text-zinc-400">
          <span>
            Your Record: <strong className="text-amber-400 font-['Chakra_Petch']">{playerHighScore.toLocaleString()} PTS</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl font-['Chakra_Petch'] uppercase tracking-wider transition"
          >
            Back to Garage
          </button>
        </div>
      </div>
    </div>
  );
};
