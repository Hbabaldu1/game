export class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly targetDelta = 1 / 60; // 60 FPS physics tick
  private animationFrameId: number | null = null;
  private isRunning = false;

  private updateFn: (dt: number) => void;
  private renderFn: (interpolation: number) => void;

  constructor(updateFn: (dt: number) => void, renderFn: (interpolation: number) => void) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    let frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap frame time to prevent spiral of death on background tab/lag spike
    if (frameTime > 0.1) {
      frameTime = 0.1;
    }

    this.accumulator += frameTime;

    while (this.accumulator >= this.targetDelta) {
      this.updateFn(this.targetDelta);
      this.accumulator -= this.targetDelta;
    }

    const interpolation = this.accumulator / this.targetDelta;
    this.renderFn(interpolation);

    this.animationFrameId = requestAnimationFrame(this.loop);
  }
}
