import React, { useState } from 'react';
import { X, Check, Lock, Zap, Gauge, Fuel, Award } from 'lucide-react';
import { VEHICLE_DEFINITIONS, VehicleDefinition, VehicleId } from '../config/VehicleConfig';
import { storageService } from '../services/StorageService';
import { achievementService } from '../services/AchievementService';

interface GarageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicleId: VehicleId) => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  isOpen,
  onClose,
  onSelectVehicle
}) => {
  const [selectedId, setSelectedId] = useState<VehicleId>(storageService.getSelectedVehicle());
  const [ownedVehicles, setOwnedVehicles] = useState<VehicleId[]>(storageService.getOwnedVehicles());
  const [koboBalance, setKoboBalance] = useState<number>(storageService.getTotalKobo());

  if (!isOpen) return null;

  const currentVehicle: VehicleDefinition = VEHICLE_DEFINITIONS[selectedId];
  const isOwned = ownedVehicles.includes(selectedId);
  const canAfford = koboBalance >= currentVehicle.unlockCost;

  const handleUnlock = () => {
    if (!isOwned && canAfford) {
      const unlocked = storageService.unlockVehicle(selectedId, currentVehicle.unlockCost);
      if (unlocked) {
        setOwnedVehicles(storageService.getOwnedVehicles());
        setKoboBalance(storageService.getTotalKobo());
        achievementService.checkAndAward('unlock_first_vehicle');
      }
    }
  };

  const handleSelect = () => {
    if (isOwned) {
      storageService.setSelectedVehicle(selectedId);
      onSelectVehicle(selectedId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">FLEET YARD</span>
            <h2 className="text-2xl font-black text-white font-['Chakra_Petch']">LAGOS GARAGE</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <span>₦</span>
              <span>{koboBalance.toLocaleString()}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Vehicle Tabs */}
        <div className="grid grid-cols-3 gap-2 my-4">
          {(Object.keys(VEHICLE_DEFINITIONS) as VehicleId[]).map(id => {
            const v = VEHICLE_DEFINITIONS[id];
            const owned = ownedVehicles.includes(id);
            const isSelected = selectedId === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedId(id)}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <div className="text-xs font-black font-['Chakra_Petch']">{v.name}</div>
                <div className="text-[10px] mt-1 flex items-center gap-1">
                  {owned ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> OWNED
                    </span>
                  ) : (
                    <span className="text-zinc-400 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> ₦{v.unlockCost}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Vehicle Preview Card */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 flex flex-col items-center">
          <div className="text-xs font-bold tracking-wider text-amber-500 uppercase">{currentVehicle.tagline}</div>
          <h3 className="text-xl font-black text-white font-['Chakra_Petch'] mt-0.5">{currentVehicle.name}</h3>
          <p className="text-xs text-zinc-400 text-center mt-1 max-w-xs">{currentVehicle.description}</p>

          {/* Graphical Stylized Vehicle Graphic */}
          <div className="h-28 flex items-center justify-center my-3">
            {selectedId === 'DANFO' && (
              <div className="w-14 h-24 bg-amber-400 rounded-lg border-2 border-amber-700 relative shadow-lg flex flex-col justify-between p-1.5">
                <div className="w-full h-5 bg-slate-800 rounded" />
                <div className="w-full h-2 bg-zinc-900" />
                <div className="w-full h-2 bg-zinc-900" />
                <div className="w-full h-4 bg-emerald-800 rounded text-[8px] text-white text-center font-bold">CARGO</div>
                <div className="flex justify-between">
                  <div className="w-2.5 h-1 bg-red-600 rounded" />
                  <div className="w-2.5 h-1 bg-red-600 rounded" />
                </div>
              </div>
            )}
            {selectedId === 'OKADA' && (
              <div className="w-8 h-20 bg-emerald-600 rounded-full border-2 border-emerald-800 relative shadow-lg flex flex-col items-center justify-between p-1">
                <div className="w-2.5 h-4 bg-zinc-900 rounded" />
                <div className="w-5 h-5 bg-orange-500 rounded-full border border-orange-300 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full" />
                </div>
                <div className="w-2.5 h-4 bg-zinc-900 rounded" />
              </div>
            )}
            {selectedId === 'KEKE' && (
              <div className="w-12 h-20 bg-yellow-500 rounded-t-xl rounded-b border-2 border-amber-800 relative shadow-lg flex flex-col justify-between p-1">
                <div className="w-3 h-3 bg-zinc-900 rounded-full mx-auto" />
                <div className="w-full h-8 bg-emerald-700 rounded border border-emerald-900" />
                <div className="flex justify-between">
                  <div className="w-2 h-3 bg-zinc-900 rounded" />
                  <div className="w-2 h-3 bg-zinc-900 rounded" />
                </div>
              </div>
            )}
          </div>

          {/* Stats Breakdown */}
          <div className="w-full space-y-2.5 mt-2">
            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" /> Top Speed
                </span>
                <span className="text-white">{Math.round(currentVehicle.maxSpeedMultiplier * 100)}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(currentVehicle.maxSpeedMultiplier / 1.25) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Handling / Agile Shift
                </span>
                <span className="text-white">{currentVehicle.handling}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all"
                  style={{ width: `${(currentVehicle.laneChangeSpeed / 24) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-emerald-400" /> Fuel Economy
                </span>
                <span className="text-white">
                  {currentVehicle.fuelEfficiency <= 0.8
                    ? 'Very High'
                    : currentVehicle.fuelEfficiency <= 1.0
                    ? 'Standard'
                    : 'High Drain'}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${(1.3 - currentVehicle.fuelEfficiency) * 150}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-pink-400" /> Score Multiplier
                </span>
                <span className="text-white">{currentVehicle.scoreModifier}x</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${(currentVehicle.scoreModifier / 1.3) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          {isOwned ? (
            <button
              onClick={handleSelect}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm font-['Chakra_Petch'] tracking-wide transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>DRIVE THIS VEHICLE</span>
            </button>
          ) : (
            <button
              onClick={handleUnlock}
              disabled={!canAfford}
              className={`w-full py-3.5 rounded-xl font-black text-sm font-['Chakra_Petch'] tracking-wide transition shadow-lg flex items-center justify-center gap-2 ${
                canAfford
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 cursor-pointer'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>
                UNLOCK FOR ₦{currentVehicle.unlockCost} {canAfford ? '' : `(Need ₦${currentVehicle.unlockCost - koboBalance} more)`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
