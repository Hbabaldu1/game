import React from 'react';
import { BrakeStatus } from '../systems/BrakeSystem';
import { Flame, AlertTriangle } from 'lucide-react';
import { eventBus } from '../core/EventBus';

interface BrakeControlsProps {
  brakeStatus: BrakeStatus | null;
}

export const BrakeControls: React.FC<BrakeControlsProps> = ({ brakeStatus }) => {
  if (!brakeStatus) return null;

  const { heatPercent, isOverheated, isBraking, cooldownRemaining } = brakeStatus;

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isOverheated) {
      eventBus.emit('input:brake_start');
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    eventBus.emit('input:brake_end');
  };

  // Color mapping based on heat
  const getMeterColor = () => {
    if (isOverheated) return 'bg-red-500 shadow-[0_0_12px_#ef4444]';
    if (heatPercent > 75) return 'bg-orange-500 shadow-[0_0_8px_#f97316]';
    if (heatPercent > 40) return 'bg-amber-400';
    return 'bg-sky-400';
  };

  return (
    <div className="flex flex-col items-center pointer-events-auto select-none">
      {/* Brake Heat Bar & Overheat Warning */}
      <div className="w-24 mb-1.5 flex flex-col items-center">
        <div className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-400 mb-0.5 px-0.5">
          <span className="flex items-center gap-0.5 uppercase tracking-wider font-['Chakra_Petch']">
            <Flame className={`w-3 h-3 ${isOverheated ? 'text-red-500 animate-bounce' : heatPercent > 50 ? 'text-amber-400' : 'text-zinc-500'}`} />
            Brake
          </span>
          <span className={`font-mono ${isOverheated ? 'text-red-400 font-black animate-pulse' : 'text-zinc-400'}`}>
            {isOverheated ? 'LOCK' : `${Math.round(heatPercent)}%`}
          </span>
        </div>

        {/* Meter Gauge */}
        <div className="w-full h-1.5 bg-zinc-900/90 rounded-full overflow-hidden border border-white/10 p-[1px]">
          <div
            className={`h-full rounded-full transition-all duration-75 ${getMeterColor()}`}
            style={{ width: `${Math.min(100, Math.max(0, heatPercent))}%` }}
          />
        </div>

        {/* Overheat Warning Pill */}
        {isOverheated && (
          <div className="mt-1 px-1.5 py-0.5 bg-red-600/90 text-white font-['Chakra_Petch'] font-black text-[9px] rounded-sm tracking-wider flex items-center gap-0.5 animate-pulse shadow-md">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>COOLING ({cooldownRemaining.toFixed(1)}s)</span>
          </div>
        )}
      </div>

      {/* Touch Brake Pedal Button */}
      <button
        id="btn-hud-brake"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        disabled={isOverheated}
        className={`w-20 h-14 rounded-2xl flex flex-col items-center justify-center font-['Chakra_Petch'] font-black tracking-wider transition-all duration-100 shadow-xl border-2 active:scale-95 ${
          isOverheated
            ? 'bg-red-950/40 border-red-500/40 text-red-400 cursor-not-allowed opacity-60'
            : isBraking
            ? 'bg-amber-500 text-black border-amber-300 scale-95 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
            : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-white/20 active:border-amber-400'
        }`}
      >
        <span className="text-xs leading-none uppercase">
          {isOverheated ? 'LOCKED' : 'BRAKE'}
        </span>
        <span className="text-[8px] font-medium text-zinc-400 mt-0.5 tracking-normal leading-none hidden sm:inline">
          [SPACE]
        </span>
      </button>
    </div>
  );
};
