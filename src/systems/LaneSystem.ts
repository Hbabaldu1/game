import { GAME_CONFIG } from '../config/GameConfig';

export class LaneSystem {
  private roadLeft = 0;
  private roadRight = 0;
  private roadWidth = 0;
  private laneWidth = 0;
  private laneCenters: number[] = [0, 0, 0];

  constructor(viewportWidth: number) {
    this.updateDimensions(viewportWidth);
  }

  public updateDimensions(viewportWidth: number): void {
    this.roadWidth = Math.min(viewportWidth * GAME_CONFIG.ROAD_WIDTH_RATIO, 380);
    this.roadLeft = (viewportWidth - this.roadWidth) / 2;
    this.roadRight = this.roadLeft + this.roadWidth;
    this.laneWidth = this.roadWidth / GAME_CONFIG.LANES_COUNT;

    for (let i = 0; i < GAME_CONFIG.LANES_COUNT; i++) {
      this.laneCenters[i] = this.roadLeft + (i + 0.5) * this.laneWidth;
    }
  }

  public getLaneCenter(laneIndex: number): number {
    const clampedIndex = Math.max(0, Math.min(GAME_CONFIG.LANES_COUNT - 1, laneIndex));
    return this.laneCenters[clampedIndex];
  }

  public getRoadLeft(): number {
    return this.roadLeft;
  }

  public getRoadRight(): number {
    return this.roadRight;
  }

  public getRoadWidth(): number {
    return this.roadWidth;
  }

  public getLaneWidth(): number {
    return this.laneWidth;
  }

  public getLaneIndexAtX(x: number): number {
    const relX = x - this.roadLeft;
    const lane = Math.floor(relX / this.laneWidth);
    return Math.max(0, Math.min(GAME_CONFIG.LANES_COUNT - 1, lane));
  }
}
