import { BoundingBox } from '../types/game';
import { PlayerVehicle } from '../entities/PlayerVehicle';
import { TrafficVehicle } from '../entities/TrafficVehicle';
import { Collectible } from '../entities/Collectible';

export class CollisionSystem {
  public static checkAABB(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  public checkPlayerTrafficCollision(player: PlayerVehicle, traffic: TrafficVehicle[]): TrafficVehicle | null {
    if (player.isInvulnerable) return null;

    const playerBox = player.getHitbox();

    for (let i = 0; i < traffic.length; i++) {
      const vehicle = traffic[i];
      if (!vehicle.active) continue;

      if (CollisionSystem.checkAABB(playerBox, vehicle.getHitbox())) {
        return vehicle;
      }
    }

    return null;
  }

  public checkCollectibles(player: PlayerVehicle, collectibles: Collectible[]): Collectible[] {
    const collected: Collectible[] = [];
    const playerBox = player.getHitbox();

    for (let i = 0; i < collectibles.length; i++) {
      const item = collectibles[i];
      if (!item.active) continue;

      if (CollisionSystem.checkAABB(playerBox, item.getHitbox())) {
        collected.push(item);
      }
    }

    return collected;
  }
}
