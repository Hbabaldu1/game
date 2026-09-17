import { GAME_CONFIG } from '../config/GameConfig';
import { TrafficType, CollectibleType } from '../types/game';
import { TrafficVehicle } from '../entities/TrafficVehicle';
import { Collectible } from '../entities/Collectible';
import { LaneSystem } from './LaneSystem';

export class SpawnerSystem {
  private laneSystem: LaneSystem;
  private trafficPool: TrafficVehicle[] = [];
  private collectiblePool: Collectible[] = [];
  private nextEntityId = 1;

  private spawnTimer = 0;
  private fuelSpawnTimer = 0;
  private koboSpawnTimer = 0;
  private currentSpawnInterval: number = GAME_CONFIG.INITIAL_SPAWN_INTERVAL;

  constructor(laneSystem: LaneSystem) {
    this.laneSystem = laneSystem;
  }

  public reset(): void {
    this.trafficPool.forEach(v => (v.active = false));
    this.collectiblePool.forEach(c => (c.active = false));
    this.spawnTimer = 0.5; // Short delay before first car spawns
    this.fuelSpawnTimer = 6.0; // First fuel can in ~6s
    this.koboSpawnTimer = 1.0;
    this.currentSpawnInterval = GAME_CONFIG.INITIAL_SPAWN_INTERVAL;
  }

  public update(
    dt: number,
    gameTime: number,
    playerSpeed: number,
    screenHeight: number,
    activeTraffic: TrafficVehicle[],
    activeCollectibles: Collectible[],
    maxDensity: number = 4,
    spawnRateMultiplier: number = 1.0,
    allowedTrafficTypes?: TrafficType[]
  ): void {
    // Clean up entities that have left the screen
    for (let i = 0; i < activeTraffic.length; i++) {
      const v = activeTraffic[i];
      if (v.active && v.y > screenHeight + 200) {
        v.active = false;
      }
    }

    for (let i = 0; i < activeCollectibles.length; i++) {
      const c = activeCollectibles[i];
      if (c.active && c.y > screenHeight + 150) {
        c.active = false;
      }
    }

    // Scale spawn interval with difficulty over time and level multiplier
    const baseInterval = Math.max(
      GAME_CONFIG.MIN_SPAWN_INTERVAL,
      GAME_CONFIG.INITIAL_SPAWN_INTERVAL - gameTime * GAME_CONFIG.SPAWN_INTERVAL_REDUCTION_RATE
    );
    this.currentSpawnInterval = baseInterval / Math.max(0.5, spawnRateMultiplier);

    // 1. Update Traffic Spawning (capped by maxDensity)
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.currentSpawnInterval) {
      this.spawnTimer = 0;
      if (activeTraffic.length < maxDensity) {
        this.spawnTrafficWave(playerSpeed, allowedTrafficTypes);
      }
    }

    // 2. Update Fuel Spawning (every 9 - 14 seconds)
    this.fuelSpawnTimer += dt;
    if (this.fuelSpawnTimer >= 11) {
      this.fuelSpawnTimer = 0;
      this.spawnCollectible('FUEL');
    }

    // 3. Update Kobo Spawning (every 2 - 3 seconds)
    this.koboSpawnTimer += dt;
    if (this.koboSpawnTimer >= 2.2) {
      this.koboSpawnTimer = 0;
      this.spawnKoboGroup();
    }
  }

  private spawnTrafficWave(playerSpeed: number, allowedTrafficTypes?: TrafficType[]): void {
    // Choose 1 or 2 lanes to spawn in (NEVER all 3, to guarantee an open path)
    const availableLanes = [0, 1, 2];
    // Shuffle lanes
    availableLanes.sort(() => Math.random() - 0.5);

    // 70% chance 1 vehicle, 30% chance 2 vehicles (if gameTime advanced)
    const count = Math.random() < 0.28 ? 2 : 1;
    const selectedLanes = availableLanes.slice(0, count);

    selectedLanes.forEach(lane => {
      let type: TrafficType = 'SEDAN';

      if (allowedTrafficTypes && allowedTrafficTypes.length > 0) {
        const randomIndex = Math.floor(Math.random() * allowedTrafficTypes.length);
        type = allowedTrafficTypes[randomIndex];
      } else {
        // Pick vehicle type based on weights
        const roll = Math.random();
        if (roll < 0.40) {
          type = 'DANFO';
        } else if (roll < 0.70) {
          type = 'SEDAN';
        } else if (roll < 0.90) {
          type = 'TRUCK';
        } else {
          type = 'HAZARD_CAR';
        }
      }

      const config = GAME_CONFIG.TRAFFIC_CONFIGS[type] || GAME_CONFIG.TRAFFIC_CONFIGS.SEDAN;
      const vehicleSpeed = playerSpeed * config.speedFactor;
      const spawnY = -config.height - 20;
      const spawnX = this.laneSystem.getLaneCenter(lane);

      this.getOrCreateTrafficVehicle(type, lane, spawnX, spawnY, vehicleSpeed);
    });
  }

  private spawnCollectible(type: CollectibleType, lane?: number, yOffset = 0): void {
    const chosenLane = lane !== undefined ? lane : Math.floor(Math.random() * GAME_CONFIG.LANES_COUNT);
    const x = this.laneSystem.getLaneCenter(chosenLane);
    const y = -40 - yOffset;
    this.getOrCreateCollectible(type, chosenLane, x, y);
  }

  private spawnKoboGroup(): void {
    const lane = Math.floor(Math.random() * GAME_CONFIG.LANES_COUNT);
    const count = Math.floor(Math.random() * 3) + 2; // 2 to 4 coins in a trail
    const spacing = 45;

    for (let i = 0; i < count; i++) {
      this.spawnCollectible('KOBO', lane, i * spacing);
    }
  }

  private getOrCreateTrafficVehicle(
    type: TrafficType,
    lane: number,
    x: number,
    y: number,
    speed: number
  ): TrafficVehicle {
    let vehicle = this.trafficPool.find(v => !v.active);
    if (vehicle) {
      vehicle.reset(this.nextEntityId++, type, lane, x, y, speed);
    } else {
      vehicle = new TrafficVehicle(this.nextEntityId++, type, lane, x, y, speed);
      this.trafficPool.push(vehicle);
    }
    return vehicle;
  }

  private getOrCreateCollectible(type: CollectibleType, lane: number, x: number, y: number): Collectible {
    let item = this.collectiblePool.find(c => !c.active);
    if (item) {
      item.reset(this.nextEntityId++, type, lane, x, y);
    } else {
      item = new Collectible(this.nextEntityId++, type, lane, x, y);
      this.collectiblePool.push(item);
    }
    return item;
  }

  public getActiveTraffic(): TrafficVehicle[] {
    return this.trafficPool.filter(v => v.active);
  }

  public getActiveCollectibles(): Collectible[] {
    return this.collectiblePool.filter(c => c.active);
  }
}
