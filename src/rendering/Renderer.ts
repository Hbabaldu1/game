import { GAME_CONFIG } from '../config/GameConfig';
import { PlayerVehicle } from '../entities/PlayerVehicle';
import { TrafficVehicle } from '../entities/TrafficVehicle';
import { Collectible } from '../entities/Collectible';
import { LaneSystem } from '../systems/LaneSystem';
import { ParticleSystem } from './ParticleSystem';
import { LevelDefinition } from '../config/LevelConfig';

interface RoadsideElement {
  y: number;
  type: 'LIGHT' | 'SIGN' | 'BILLBOARD';
  side: -1 | 1; // Left or Right shoulder
  text?: string;
  color?: string;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private roadScrollOffset = 0;
  private screenShakeTime = 0;
  private screenShakeIntensity = 0;
  private roadsideElements: RoadsideElement[] = [];
  private levelTheme: LevelDefinition['environmentTheme'] | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.initRoadsideElements();
  }

  public setLevelTheme(theme: LevelDefinition['environmentTheme'] | null): void {
    this.levelTheme = theme;
  }

  private initRoadsideElements(): void {
    const signs = [
      'THIRD MAINLAND BRG',
      'IKORODU EXPRESS',
      'LEKKI TOLL PLAZA',
      'OJUELEGBA JNC',
      'APAPA WHARF'
    ];
    const billboards = [
      { text: 'INDOMIE 4 LIFE', color: '#DC2626' },
      { text: 'GLO UNLIMITED 4G', color: '#16A34A' },
      { text: 'ZENITH BANK', color: '#EA580C' },
      { text: 'STAR COLD BEER', color: '#2563EB' }
    ];

    // Seed realistic spaced roadside props
    for (let y = -200; y < 1400; y += 180) {
      this.roadsideElements.push({
        y,
        type: 'LIGHT',
        side: y % 360 === 0 ? -1 : 1
      });
    }

    for (let y = 100; y < 1600; y += 450) {
      const isSign = (y / 450) % 2 === 0;
      if (isSign) {
        this.roadsideElements.push({
          y,
          type: 'SIGN',
          side: 1,
          text: signs[Math.floor(Math.random() * signs.length)]
        });
      } else {
        const bb = billboards[Math.floor(Math.random() * billboards.length)];
        this.roadsideElements.push({
          y,
          type: 'BILLBOARD',
          side: -1,
          text: bb.text,
          color: bb.color
        });
      }
    }
  }

  public triggerScreenShake(intensity: number, duration: number): void {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  public update(dt: number, roadSpeed: number): void {
    // Scroll road markings
    this.roadScrollOffset = (this.roadScrollOffset + roadSpeed * dt) % 60;

    // Scroll roadside elements
    for (const elem of this.roadsideElements) {
      elem.y += roadSpeed * dt;
      if (elem.y > 850) {
        elem.y -= 1100;
      }
    }

    // Decay screen shake
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
      if (this.screenShakeTime <= 0) {
        this.screenShakeIntensity = 0;
      }
    }
  }

  public render(
    width: number,
    height: number,
    laneSystem: LaneSystem,
    player: PlayerVehicle,
    traffic: TrafficVehicle[],
    collectibles: Collectible[],
    particleSystem: ParticleSystem,
    comboMultiplier: number,
    currentSpeed: number = GAME_CONFIG.BASE_SPEED
  ): void {
    const ctx = this.ctx;

    ctx.save();

    // 1. Screen Shake offset
    if (this.screenShakeTime > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 2. Distant Shoulder / Lagoon Atmosphere
    const skyTop = this.levelTheme?.skyTop || '#0B0D10';
    const skyBottom = this.levelTheme?.skyBottom || '#181C24';
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, skyTop);
    bgGrad.addColorStop(1, skyBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    const roadLeft = laneSystem.getRoadLeft();
    const roadWidth = laneSystem.getRoadWidth();
    const roadRight = laneSystem.getRoadRight();
    const curbWidth = 14;

    // Distant bridge pillars & horizon silhouettes on shoulders
    this.drawShoulderEnvironment(ctx, roadLeft, roadRight, width, height);

    // 3. Roadside Props (Behind curbs)
    this.drawRoadsideProps(ctx, roadLeft, roadRight);

    // 4. Road Sidewalks / Curbs
    this.drawCurb(ctx, roadLeft - curbWidth, curbWidth, height, this.roadScrollOffset);
    this.drawCurb(ctx, roadRight, curbWidth, height, this.roadScrollOffset);

    // 5. Draw Asphalt
    ctx.fillStyle = this.levelTheme?.roadColor || GAME_CONFIG.COLORS.ASPHALT;
    ctx.fillRect(roadLeft, 0, roadWidth, height);

    // Asphalt subtle texture grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(roadLeft + i * 50 + 10, 0, 2, height);
    }

    // 6. Draw Lane Markings
    const laneWidth = laneSystem.getLaneWidth();
    ctx.strokeStyle = 'rgba(244, 244, 245, 0.85)';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([26, 34]);
    ctx.lineDashOffset = -this.roadScrollOffset;

    for (let i = 1; i < GAME_CONFIG.LANES_COUNT; i++) {
      const lineX = roadLeft + i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(lineX, -50);
      ctx.lineTo(lineX, height + 50);
      ctx.stroke();
    }
    ctx.setLineDash([]); // Reset line dash

    // 7. High-Speed Wind Lines
    if (currentSpeed > 600 || comboMultiplier >= 3) {
      this.drawSpeedLines(ctx, roadLeft, roadRight, height, comboMultiplier);
    }

    // 8. Draw Collectibles
    collectibles.forEach(item => {
      if (item.active) {
        if (item.type === 'KOBO') {
          this.drawKobo(ctx, item.x, item.y, item.radius, item.animTime);
        } else {
          this.drawFuelJerrycan(ctx, item.x, item.y, item.radius, item.animTime);
        }
      }
    });

    // 9. Draw Traffic Vehicles
    traffic.forEach(vehicle => {
      if (vehicle.active) {
        this.drawTrafficVehicle(ctx, vehicle);
      }
    });

    // 10. Draw Player Vehicle
    this.drawPlayer(ctx, player, comboMultiplier);

    // 11. Draw Particles
    particleSystem.getParticles().forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size, p.size, p.size * 2);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 12. Draw Floating Texts
    particleSystem.getFloatingTexts().forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.opacity;
      ctx.fillStyle = ft.color;
      ctx.font = `bold ${ft.fontSize}px 'Chakra Petch', sans-serif`;
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  private drawShoulderEnvironment(
    ctx: CanvasRenderingContext2D,
    roadLeft: number,
    roadRight: number,
    _width: number,
    height: number
  ): void {
    // Left shoulder barrier
    ctx.fillStyle = '#16191E';
    ctx.fillRect(0, 0, roadLeft - 14, height);

    // Right shoulder barrier
    ctx.fillStyle = '#16191E';
    ctx.fillRect(roadRight + 14, 0, _width - (roadRight + 14), height);

    // Distant water reflection / lagoon glimmer on the right edge
    if (_width - (roadRight + 14) > 20) {
      ctx.fillStyle = '#0D1520';
      ctx.fillRect(roadRight + 28, 0, _width - (roadRight + 28), height);
    }
  }

  private drawRoadsideProps(ctx: CanvasRenderingContext2D, roadLeft: number, roadRight: number): void {
    this.roadsideElements.forEach(elem => {
      const x = elem.side === -1 ? roadLeft - 24 : roadRight + 24;

      if (elem.type === 'LIGHT') {
        // Streetlight pole
        ctx.fillStyle = '#52525B';
        ctx.fillRect(x - 2, elem.y, 4, 30);

        // Light bulb
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(x, elem.y - 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Warm cone of illumination hitting road surface
        const roadX = elem.side === -1 ? roadLeft + 25 : roadRight - 25;
        const grad = ctx.createRadialGradient(roadX, elem.y + 10, 5, roadX, elem.y + 10, 55);
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.08)');
        grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(roadX, elem.y + 10, 55, 0, Math.PI * 2);
        ctx.fill();
      } else if (elem.type === 'SIGN' && elem.text) {
        // Highway overhead sign board
        const signW = 75;
        const signH = 34;
        const signX = elem.side === -1 ? roadLeft - signW - 16 : roadRight + 16;

        ctx.fillStyle = '#065F46'; // Green expressway sign
        this.roundRect(ctx, signX, elem.y, signW, signH, 4);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(elem.text, signX + signW / 2, elem.y + signH / 2 + 3);
      } else if (elem.type === 'BILLBOARD' && elem.text) {
        // Commercial Billboard
        const bbW = 72;
        const bbH = 40;
        const bbX = elem.side === -1 ? roadLeft - bbW - 16 : roadRight + 16;

        ctx.fillStyle = elem.color || '#D97706';
        this.roundRect(ctx, bbX, elem.y, bbW, bbH, 4);
        ctx.fill();
        ctx.strokeStyle = '#27272A';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 8px "Chakra Petch", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(elem.text, bbX + bbW / 2, elem.y + bbH / 2 + 3);
      }
    });
  }

  private drawSpeedLines(
    ctx: CanvasRenderingContext2D,
    roadLeft: number,
    roadRight: number,
    height: number,
    comboMultiplier: number
  ): void {
    const count = 6;
    ctx.strokeStyle = comboMultiplier >= 5 ? 'rgba(251, 191, 36, 0.35)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;

    for (let i = 0; i < count; i++) {
      const y1 = ((this.roadScrollOffset * 6 + i * 130) % height);
      const y2 = y1 + 50;

      // Left gutter streak
      ctx.beginPath();
      ctx.moveTo(roadLeft + 12 + (i % 3) * 6, y1);
      ctx.lineTo(roadLeft + 12 + (i % 3) * 6, y2);
      ctx.stroke();

      // Right gutter streak
      ctx.beginPath();
      ctx.moveTo(roadRight - 12 - (i % 3) * 6, y1);
      ctx.lineTo(roadRight - 12 - (i % 3) * 6, y2);
      ctx.stroke();
    }
  }

  private drawCurb(
    ctx: CanvasRenderingContext2D,
    x: number,
    width: number,
    height: number,
    scrollOffset: number
  ): void {
    const segmentHeight = 36;
    const startY = -segmentHeight + (scrollOffset % segmentHeight);

    for (let y = startY; y < height + segmentHeight; y += segmentHeight) {
      const isRed = Math.floor((y - scrollOffset) / segmentHeight) % 2 === 0;
      ctx.fillStyle = isRed ? GAME_CONFIG.COLORS.CURB_RED : GAME_CONFIG.COLORS.CURB_WHITE;
      ctx.fillRect(x, y, width, segmentHeight);
    }
  }

  // --- MULTI-VEHICLE PLAYER RENDERING ---
  private drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerVehicle, comboMultiplier: number): void {
    if (player.isInvulnerable && Math.floor(player.invulnerabilityTimer * 12) % 2 === 0) {
      return;
    }

    ctx.save();
    ctx.translate(player.x, player.y + player.engineVibration);
    ctx.rotate(player.rotation);

    if (player.isBraking) {
      // Subtle pitch / rear-compression when braking
      ctx.scale(1.0, 0.95);
    }

    // Route to specialized vehicle renderer
    const vehicleId = player.definition.id;
    if (vehicleId === 'OKADA') {
      this.drawOkadaPlayer(ctx, player);
    } else if (vehicleId === 'KEKE') {
      this.drawKekePlayer(ctx, player);
    } else {
      this.drawDanfoPlayer(ctx, player);
    }

    // High Combo Energy Aura
    if (comboMultiplier >= 3) {
      ctx.strokeStyle = comboMultiplier >= 5 ? '#FBBF24' : '#60A5FA';
      ctx.lineWidth = 3;
      ctx.beginPath();
      this.roundRect(ctx, -player.width / 2 - 5, -player.height / 2 - 5, player.width + 10, player.height + 10, 14);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 1. Classic Lagos Danfo
  private drawDanfoPlayer(ctx: CanvasRenderingContext2D, player: PlayerVehicle): void {
    const w = player.width;
    const h = player.height;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(3, 4, w / 2 + 3, h / 2 + 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight Beams forward
    const beamGrad = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 - 150);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h / 2);
    ctx.lineTo(-w / 2 - 28, -h / 2 - 150);
    ctx.lineTo(w / 2 + 28, -h / 2 - 150);
    ctx.lineTo(w / 2 - 6, -h / 2);
    ctx.closePath();
    ctx.fill();

    // Body
    ctx.fillStyle = player.definition.primaryColor;
    this.roundRect(ctx, -w / 2, -h / 2, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Double Black Stripes
    ctx.fillStyle = '#18181B';
    ctx.fillRect(-w / 2, -h * 0.18, w, 5);
    ctx.fillRect(-w / 2, -h * 0.08, w, 5);

    // Front Windshield with Glare
    ctx.fillStyle = '#1E293B';
    this.roundRect(ctx, -w / 2 + 5, -h / 2 + 7, w - 10, 20, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 8, -h / 2 + 9);
    ctx.lineTo(-w / 2 + 18, -h / 2 + 9);
    ctx.lineTo(-w / 2 + 12, -h / 2 + 24);
    ctx.lineTo(-w / 2 + 6, -h / 2 + 24);
    ctx.fill();

    // Rear Window
    ctx.fillStyle = '#1E293B';
    this.roundRect(ctx, -w / 2 + 7, h / 2 - 16, w - 14, 9, 3);
    ctx.fill();

    // Side Windows
    ctx.fillStyle = '#334155';
    ctx.fillRect(-w / 2 + 3, -h * 0.02, 6, 22);
    ctx.fillRect(w / 2 - 9, -h * 0.02, 6, 22);

    // Roof Luggage Rack with Wrapped Bundles
    ctx.fillStyle = '#475569';
    this.roundRect(ctx, -w / 2 + 7, 2, w - 14, 26, 3);
    ctx.fill();

    ctx.fillStyle = '#B45309';
    this.roundRect(ctx, -w / 2 + 10, 4, 14, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#047857';
    this.roundRect(ctx, 1, 5, 14, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#4338CA';
    this.roundRect(ctx, -w / 2 + 12, 16, w - 24, 9, 2);
    ctx.fill();

    // Headlights
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-w / 2 + 4, -h / 2 + 1, 9, 4);
    ctx.fillRect(w / 2 - 13, -h / 2 + 1, 9, 4);

    // Tail Lights
    if (player.isBraking) {
      ctx.fillStyle = '#FF0000';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 14;
      ctx.fillRect(-w / 2 + 3, h / 2 - 6, 10, 6);
      ctx.fillRect(w / 2 - 13, h / 2 - 6, 10, 6);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-w / 2 + 4, h / 2 - 4, 8, 4);
      ctx.fillRect(w / 2 - 12, h / 2 - 4, 8, 4);
    }
  }

  // 2. Agile Commercial Okada Motorcycle
  private drawOkadaPlayer(ctx: CanvasRenderingContext2D, player: PlayerVehicle): void {
    const w = player.width;
    const h = player.height;

    // Motorcycle Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, 3, w / 2 + 1, h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight Beam forward
    const beamGrad = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 - 160);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-6, -h / 2);
    ctx.lineTo(-24, -h / 2 - 160);
    ctx.lineTo(24, -h / 2 - 160);
    ctx.lineTo(6, -h / 2);
    ctx.closePath();
    ctx.fill();

    // Bike Frame & Wheels
    // Front Wheel
    ctx.fillStyle = '#18181B';
    this.roundRect(ctx, -4, -h / 2, 8, 16, 3);
    ctx.fill();

    // Rear Wheel
    ctx.fillStyle = '#18181B';
    this.roundRect(ctx, -5, h / 2 - 16, 10, 16, 3);
    ctx.fill();

    // Bike Body Chassis
    ctx.fillStyle = player.definition.primaryColor;
    this.roundRect(ctx, -7, -h / 2 + 12, 14, 28, 4);
    ctx.fill();

    // Handlebars with Grips & Mirrors
    ctx.fillStyle = '#3F3F46';
    ctx.fillRect(-w / 2 + 2, -h / 2 + 8, w - 4, 4);

    ctx.fillStyle = '#F59E0B'; // Turn indicators / Mirrors
    ctx.fillRect(-w / 2 + 1, -h / 2 + 6, 4, 3);
    ctx.fillRect(w / 2 - 5, -h / 2 + 6, 4, 3);

    // Front Headlight
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, -h / 2 + 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Okada Rider: Torso with High-Visibility Vest
    ctx.fillStyle = '#F97316'; // Orange hi-vis vest
    this.roundRect(ctx, -9, -h * 0.15, 18, 20, 5);
    ctx.fill();

    // Reflective stripe on vest
    ctx.fillStyle = '#E4E4E7';
    ctx.fillRect(-9, -h * 0.05, 18, 4);

    // Rider Helmet with dark visor
    ctx.fillStyle = player.definition.primaryColor;
    ctx.beginPath();
    ctx.arc(0, -h * 0.18, 9, 0, Math.PI * 2);
    ctx.fill();

    // Visor
    ctx.fillStyle = '#090A0F';
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.22, 6, 3, 0, 0, Math.PI);
    ctx.fill();

    // Rear tail light
    if (player.isBraking) {
      ctx.fillStyle = '#FF0000';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 14;
      ctx.fillRect(-6, h / 2 - 5, 12, 5);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-5, h / 2 - 3, 10, 3);
    }
  }

  // 3. Stable Keke Marwa (Tricycle)
  private drawKekePlayer(ctx: CanvasRenderingContext2D, player: PlayerVehicle): void {
    const w = player.width;
    const h = player.height;

    // Ground Shadow (tapered front, wide rear)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, 3, w / 2 + 2, h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight Beam
    const beamGrad = ctx.createLinearGradient(0, -h / 2, 0, -h / 2 - 140);
    beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    beamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(-6, -h / 2);
    ctx.lineTo(-24, -h / 2 - 140);
    ctx.lineTo(24, -h / 2 - 140);
    ctx.lineTo(6, -h / 2);
    ctx.closePath();
    ctx.fill();

    // Front single wheel
    ctx.fillStyle = '#18181B';
    this.roundRect(ctx, -4, -h / 2 + 1, 8, 14, 2);
    ctx.fill();

    // Rear two wheels on sides
    ctx.fillRect(-w / 2 - 2, h / 2 - 22, 5, 18);
    ctx.fillRect(w / 2 - 3, h / 2 - 22, 5, 18);

    // Keke Main Yellow Metal Body
    ctx.fillStyle = player.definition.primaryColor;
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h / 2 + 14);
    ctx.lineTo(w / 2 - 6, -h / 2 + 14);
    ctx.lineTo(w / 2, h / 2 - 4);
    ctx.lineTo(-w / 2, h / 2 - 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Front Windshield
    ctx.fillStyle = '#1E293B';
    this.roundRect(ctx, -w / 2 + 8, -h / 2 + 15, w - 16, 12, 3);
    ctx.fill();

    // Dark Green / Black Fabric Weather Canopy Roof
    ctx.fillStyle = player.definition.accentColor;
    this.roundRect(ctx, -w / 2 + 3, -h * 0.12, w - 6, 38, 4);
    ctx.fill();
    ctx.strokeStyle = '#064E3B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Canopy Roof Ribs / Tie straps
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(-w / 2 + 4, 2, w - 8, 3);
    ctx.fillRect(-w / 2 + 4, 14, w - 8, 3);

    // Single Center Headlight
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(0, -h / 2 + 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Dual Tail lights
    if (player.isBraking) {
      ctx.fillStyle = '#FF0000';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 14;
      ctx.fillRect(-w / 2 + 2, h / 2 - 7, 8, 5);
      ctx.fillRect(w / 2 - 10, h / 2 - 7, 8, 5);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(-w / 2 + 3, h / 2 - 6, 6, 3);
      ctx.fillRect(w / 2 - 9, h / 2 - 6, 6, 3);
    }
  }

  // --- TRAFFIC RENDERING ---
  private drawTrafficVehicle(ctx: CanvasRenderingContext2D, vehicle: TrafficVehicle): void {
    ctx.save();
    ctx.translate(vehicle.x, vehicle.y);

    const w = vehicle.width;
    const h = vehicle.height;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(3, 4, w / 2 + 2, h / 2 + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (vehicle.type === 'TRUCK') {
      // Long Haulage Container Truck
      ctx.fillStyle = '#3F3F46';
      this.roundRect(ctx, -w / 2, -h / 2 + 34, w, h - 34, 4);
      ctx.fill();
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Corrugated container roof ribs
      ctx.fillStyle = '#27272A';
      for (let y = -h / 2 + 45; y < h / 2 - 10; y += 18) {
        ctx.fillRect(-w / 2 + 4, y, w - 8, 3);
      }

      // Container Port Logo
      ctx.fillStyle = '#E4E4E7';
      ctx.font = 'bold 9px "Chakra Petch", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('APAPA LOGISTICS', 0, 10);

      // Cab
      ctx.fillStyle = vehicle.color;
      this.roundRect(ctx, -w / 2 + 2, -h / 2, w - 4, 32, 6);
      ctx.fill();
      ctx.stroke();

      // Cab Windshield
      ctx.fillStyle = '#1E293B';
      this.roundRect(ctx, -w / 2 + 7, -h / 2 + 6, w - 14, 12, 2);
      ctx.fill();

      // Headlights & Tail lights
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-w / 2 + 5, -h / 2 + 1, 8, 3);
      ctx.fillRect(w / 2 - 13, -h / 2 + 1, 8, 3);

      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-w / 2 + 4, h / 2 - 4, 10, 4);
      ctx.fillRect(w / 2 - 14, h / 2 - 4, 10, 4);
    } else if (vehicle.type === 'DANFO') {
      // Competitor Danfo
      ctx.fillStyle = GAME_CONFIG.COLORS.LAGOS_YELLOW;
      this.roundRect(ctx, -w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Stripes
      ctx.fillStyle = '#18181B';
      ctx.fillRect(-w / 2, -h * 0.15, w, 4);
      ctx.fillRect(-w / 2, -h * 0.05, w, 4);

      // Windows
      ctx.fillStyle = '#1E293B';
      this.roundRect(ctx, -w / 2 + 5, -h / 2 + 6, w - 10, 18, 3);
      ctx.fill();
      this.roundRect(ctx, -w / 2 + 6, h / 2 - 14, w - 12, 8, 2);
      ctx.fill();

      // Roof load
      ctx.fillStyle = '#047857';
      this.roundRect(ctx, -w / 2 + 8, 4, w - 16, 22, 3);
      ctx.fill();

      // Headlights & Tail lights
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-w / 2 + 4, -h / 2 + 1, 7, 3);
      ctx.fillRect(w / 2 - 11, -h / 2 + 1, 7, 3);

      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-w / 2 + 4, h / 2 - 3, 7, 3);
      ctx.fillRect(w / 2 - 11, h / 2 - 3, 7, 3);
    } else {
      // Passenger Sedan / Hazard Cab
      ctx.fillStyle = vehicle.color;
      this.roundRect(ctx, -w / 2, -h / 2, w, h, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Windshield & Rear
      ctx.fillStyle = '#0F172A';
      this.roundRect(ctx, -w / 2 + 5, -h / 2 + 16, w - 10, 14, 3);
      ctx.fill();
      this.roundRect(ctx, -w / 2 + 6, h / 2 - 24, w - 12, 10, 3);
      ctx.fill();

      // Roof
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      this.roundRect(ctx, -w / 2 + 6, -h / 2 + 32, w - 12, 22, 3);
      ctx.fill();

      // Headlights & Tail lights
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-w / 2 + 4, -h / 2 + 1, 8, 4);
      ctx.fillRect(w / 2 - 12, -h / 2 + 1, 8, 4);

      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-w / 2 + 4, h / 2 - 4, 8, 4);
      ctx.fillRect(w / 2 - 12, h / 2 - 4, 8, 4);

      if (vehicle.type === 'HAZARD_CAR' && vehicle.hazardBlinkState) {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(-w / 2 + 4, h / 2 - 2, 5, 0, Math.PI * 2);
        ctx.arc(w / 2 - 4, h / 2 - 2, 5, 0, Math.PI * 2);
        ctx.arc(-w / 2 + 4, -h / 2 + 2, 5, 0, Math.PI * 2);
        ctx.arc(w / 2 - 4, -h / 2 + 2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // --- COLLECTIBLE RENDERING ---
  private drawKobo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    animTime: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const spinScale = Math.cos(animTime * 4.5);
    ctx.scale(Math.abs(spinScale), 1);

    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, 0, radius - 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350F';
    ctx.font = `bold ${Math.round(radius * 1.1)}px 'Chakra Petch', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₦', 0, 1);

    ctx.restore();
  }

  private drawFuelJerrycan(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    animTime: number
  ): void {
    ctx.save();
    ctx.translate(x, y);

    const bob = Math.sin(animTime * 5) * 3;
    ctx.translate(0, bob);

    const w = radius * 1.6;
    const h = radius * 2.1;

    ctx.fillStyle = '#DC2626';
    this.roundRect(ctx, -w / 2, -h / 2, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-w / 2 + 2, -h / 2 - 5, 7, 5);

    ctx.fillStyle = '#991B1B';
    ctx.fillRect(-w / 2 + 10, -h / 2 - 3, w - 14, 3);

    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
