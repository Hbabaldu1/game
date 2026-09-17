import { Particle, FloatingText } from '../types/game';

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private nextTextId = 1;
  private readonly maxParticles = 120;

  public reset(): void {
    this.particles = [];
    this.floatingTexts = [];
  }

  public update(dt: number): void {
    // 1. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life += dt;
      ft.opacity = Math.max(0, 1 - ft.life / ft.maxLife);

      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public spawnCollisionSparks(x: number, y: number): void {
    const count = 28;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#F9B208' : '#EF4444',
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: Math.random() * 0.4 + 0.25,
        alpha: 1,
        shape: 'spark'
      });
    }
  }

  public spawnKoboSparkle(x: number, y: number): void {
    const count = 10;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: '#FBBF24',
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: Math.random() * 0.3 + 0.2,
        alpha: 1,
        shape: 'circle'
      });
    }
  }

  public spawnFuelSplash(x: number, y: number): void {
    const count = 12;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 50;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? '#10B981' : '#F97316',
        size: Math.random() * 4 + 2,
        life: 0,
        maxLife: Math.random() * 0.35 + 0.2,
        alpha: 1,
        shape: 'circle'
      });
    }
  }

  public spawnCloseShaveBurst(x: number, y: number, text: string): void {
    // 1. Spurt of white/yellow speed streaks
    const count = 16;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      this.particles.push({
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: (Math.random() - 0.5) * 160,
        vy: (Math.random() - 0.5) * 160,
        color: '#FEF08A',
        size: Math.random() * 3 + 2,
        life: 0,
        maxLife: 0.3,
        alpha: 1,
        shape: 'spark'
      });
    }

    // 2. Big floating text
    this.addFloatingText(x, y - 10, text, '#FDE047', 22);
  }

  public spawnExhaustPuff(x: number, y: number): void {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 4 - 2),
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * 40 + 60, // drifting backward
      color: 'rgba(200, 200, 210, 0.4)',
      size: Math.random() * 3 + 2,
      life: 0,
      maxLife: 0.25,
      alpha: 0.5,
      shape: 'circle'
    });
  }

  public spawnConfetti(x: number, y: number): void {
    const count = 35;
    const colors = ['#F9B208', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 220 + 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 3,
        life: 0,
        maxLife: Math.random() * 0.6 + 0.4,
        alpha: 1,
        shape: 'spark'
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color = '#FFFFFF', fontSize = 18): void {
    this.floatingTexts.push({
      id: this.nextTextId++,
      x,
      y,
      text,
      color,
      fontSize,
      opacity: 1,
      vy: -75,
      life: 0,
      maxLife: 0.85
    });
  }

  public getParticles(): Particle[] {
    return this.particles;
  }

  public getFloatingTexts(): FloatingText[] {
    return this.floatingTexts;
  }
}
