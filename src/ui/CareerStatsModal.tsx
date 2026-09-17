import React from 'react';
import { X, Trophy, Flame, Coins, Route, Gauge, Zap } from 'lucide-react';
import { storageService } from '../services/StorageService';

interface CareerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CareerStatsModal: React.FC<CareerStatsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const highScore = storageService.getHighScore();
  const totalRuns = storageService.getTotalRuns();
  const totalDistance = storageService.getTotalDistance();
  const totalKobo = storageService.getTotalKobo();
  const totalCloseShaves = storageService.getTotalCloseShaves();
  const bestCombo = storageService.getBestCombo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">DRIVER LOGBOOK</span>
            <h2 className="text-2xl font-black text-white font-['Chakra_Petch']">CAREER STATS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">HIGH SCORE</div>
              <div className="text-lg font-black text-white font-['Chakra_Petch']">{highScore.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">TOTAL RUNS</div>
              <div className="text-lg font-black text-white font-['Chakra_Petch']">{totalRuns}</div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">TOTAL DISTANCE</div>
              <div className="text-lg font-black text-white font-['Chakra_Petch']">
                {(totalDistance / 1000).toFixed(1)} km
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-yellow-500/10 rounded-lg text-yellow-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">KOBO COINS</div>
              <div className="text-lg font-black text-amber-400 font-['Chakra_Petch']">₦{totalKobo.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 rounded-lg text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">CLOSE SHAVES</div>
              <div className="text-lg font-black text-white font-['Chakra_Petch']">{totalCloseShaves}</div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase">PEAK COMBO</div>
              <div className="text-lg font-black text-white font-['Chakra_Petch']">{bestCombo}x</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs tracking-wider uppercase transition"
        >
          CLOSE LOGBOOK
        </button>
      </div>
    </div>
  );
};
