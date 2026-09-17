import { GAME_CONFIG } from '../config/GameConfig';
import { PlayerVehicle } from '../entities/PlayerVehicle';
import { TrafficVehicle } from '../entities/TrafficVehicle';
import { CollisionSystem } from './CollisionSystem';
import { eventBus } from '../core/EventBus';

export class CloseShaveSystem {
  public checkCloseShaves(player: PlayerVehicle, traffic: TrafficVehicle[]): void {
    if (player.isInvulnerable) return;

    const proximityBox = player.getProximityBox();
    const fatalBox = player.getHitbox();

    for (let i = 0; i < traffic.length; i++) {
      const vehicle = traffic[i];
      if (!vehicle.active || vehicle.hasAwardedCloseShave) continue;

      const vehicleBox = vehicle.getHitbox();

      // If fatal collision occurred, collision system handles game over
      if (CollisionSystem.checkAABB(fatalBox, vehicleBox)) {
        continue;
      }

      // Check if within near-miss proximity
      if (CollisionSystem.checkAABB(proximityBox, vehicleBox)) {
        // Calculate lateral and vertical closeness
        const dx = Math.abs(player.x - vehicle.x);
        const dy = Math.abs(player.y - vehicle.y);

        // Near-miss condition: vehicles are passing each other closely
        // (either side-by-side brush or closely cutting in front/behind)
        const minDistanceToTrigger = (player.width + vehicle.width) / 2 + 18;

        if (dx <= minDistanceToTrigger && dy < (player.height + vehicle.height) / 2 + 15) {
          vehicle.hasAwardedCloseShave = true;

          // Award event
          eventBus.emit('game:close_shave', {
            vehicle,
            x: (player.x + vehicle.x) / 2,
            y: (player.y + vehicle.y) / 2
          });
        }
      }
    }
  }
}
