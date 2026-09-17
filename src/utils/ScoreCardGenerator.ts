import { VehicleDefinition } from '../config/VehicleConfig';

export interface ScoreCardData {
  score: number;
  highScore: number;
  koboEarned: number;
  maxCombo: number;
  closeShaves: number;
  distance: number;
  vehicle: VehicleDefinition;
  isDailyChallenge?: boolean;
  dailyChallengeName?: string;
  levelReached?: number;
  levelName?: string;
}

export class ScoreCardGenerator {
  public static generateCardCanvas(data: ScoreCardData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // 1. Dark Lagos Expressway Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 750);
    bgGrad.addColorStop(0, '#0E1013');
    bgGrad.addColorStop(0.5, '#14161B');
    bgGrad.addColorStop(1, '#090A0C');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 750);

    // Decorative Yellow/Green glow orbs in corners
    const glow1 = ctx.createRadialGradient(80, 80, 10, 80, 80, 260);
    glow1.addColorStop(0, 'rgba(249, 178, 8, 0.15)');
    glow1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, 600, 400);

    const glow2 = ctx.createRadialGradient(520, 650, 10, 520, 650, 240);
    glow2.addColorStop(0, 'rgba(5, 150, 105, 0.12)');
    glow2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 400, 600, 350);

    // 2. Card Frame Border & Curbs
    ctx.strokeStyle = '#F9B208';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 560, 710);

    // Subtle inner border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 28, 544, 694);

    // 3. Header & Lagos Branding
    ctx.fillStyle = '#F9B208';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LAGOS EXPRESSWAY ARCADE', 300, 56);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px sans-serif';
    ctx.fillText('DANFO DRIFT', 300, 98);

    ctx.fillStyle = '#E5E7EB';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('OFFICIAL TRIP MANIFEST', 300, 126);

    // Badge if daily challenge
    if (data.isDailyChallenge && data.dailyChallengeName) {
      ctx.fillStyle = 'rgba(5, 150, 105, 0.25)';
      ctx.fillRect(150, 140, 300, 26);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1;
      ctx.strokeRect(150, 140, 300, 26);

      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`DAILY CHALLENGE: ${data.dailyChallengeName.toUpperCase()}`, 300, 157);
    }

    // 4. Hero Score Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.roundRect(ctx, 50, 180, 500, 150, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(249, 178, 8, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('TOTAL SCORE EARNED', 300, 212);

    ctx.fillStyle = '#F9B208';
    ctx.font = '900 56px sans-serif';
    ctx.fillText(data.score.toLocaleString(), 300, 276);

    if (data.score >= data.highScore && data.score > 0) {
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('★ NEW PERSONAL BEST RECORD ★', 300, 312);
    } else {
      ctx.fillStyle = '#6B7280';
      ctx.font = '13px sans-serif';
      ctx.fillText(`All-time Best: ${data.highScore.toLocaleString()} PTS`, 300, 312);
    }

    // 5. Run Metrics Grid (2x2)
    const metrics = [
      { label: 'CLOSE SHAVES', value: `${data.closeShaves}`, color: '#34D399' },
      { label: 'PEAK COMBO', value: `${data.maxCombo}x`, color: '#38BDF8' },
      { label: 'DISTANCE', value: `${data.distance}m`, color: '#F472B6' },
      { label: 'KOBO EARNED', value: `₦${data.koboEarned}`, color: '#FBBF24' }
    ];

    const boxW = 235;
    const boxH = 75;
    const startY = 350;

    metrics.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const bx = 50 + col * (boxW + 30);
      const by = startY + row * (boxH + 15);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      this.roundRect(ctx, bx, by, boxW, boxH, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#9CA3AF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(m.label, bx + 16, by + 28);

      ctx.fillStyle = m.color;
      ctx.font = '900 24px sans-serif';
      ctx.fillText(m.value, bx + 16, by + 58);
    });

    // 6. Vehicle Row
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.roundRect(ctx, 50, 535, 500, 60, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '12px sans-serif';
    ctx.fillText('RIDE USED', 120, 570);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(data.vehicle.name, 250, 570);

    ctx.fillStyle = '#F9B208';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(data.vehicle.tagline, 430, 570);

    // 7. Footer Call To Action & Timestamp
    const todayStr = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    ctx.fillStyle = '#6B7280';
    ctx.font = '11px sans-serif';
    ctx.fillText(`Issued: ${todayStr} • Third Mainland Expressway, Lagos`, 300, 640);

    ctx.fillStyle = '#F9B208';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('CAN YOU BEAT MY RUN? PLAY NOW', 300, 672);

    ctx.fillStyle = '#4B5563';
    ctx.font = '10px sans-serif';
    ctx.fillText('Danfo Drift: Lagos Express — Mobile Web Game', 300, 696);

    return canvas;
  }

  public static async generateCardBlob(data: ScoreCardData): Promise<Blob | null> {
    const canvas = this.generateCardCanvas(data);
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  private static roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  public static async shareScore(data: ScoreCardData): Promise<{ shared: boolean; method: string }> {
    const text = `I just scored ${data.score.toLocaleString()} points weaving Lagos traffic in my ${data.vehicle.name} on Danfo Drift! 🚐💨 Think you can beat it?`;
    const title = 'Danfo Drift: Lagos Express';

    try {
      const blob = await this.generateCardBlob(data);
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], `danfo-drift-score-${data.score}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title,
            text,
            files: [file]
          });
          return { shared: true, method: 'web_share_file' };
        }
      }

      if (navigator.share) {
        await navigator.share({
          title,
          text
        });
        return { shared: true, method: 'web_share_text' };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { shared: false, method: 'cancelled' };
      }
      console.warn('Web Share failed, switching to fallback:', err);
    }

    // Fallback: Download Image and Copy to Clipboard
    try {
      await this.downloadScoreCard(data);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      return { shared: true, method: 'download_fallback' };
    } catch (e) {
      console.error('Fallback sharing failed:', e);
      return { shared: false, method: 'failed' };
    }
  }

  public static async downloadScoreCard(data: ScoreCardData): Promise<void> {
    const blob = await this.generateCardBlob(data);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danfo-drift-score-${data.score}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Instance wrapper methods
  public generateScoreCard(data: ScoreCardData): HTMLCanvasElement {
    return ScoreCardGenerator.generateCardCanvas(data);
  }

  public shareScoreCard(data: ScoreCardData): Promise<{ shared: boolean; method: string }> {
    return ScoreCardGenerator.shareScore(data);
  }

  public downloadScoreCard(data: ScoreCardData): Promise<void> {
    return ScoreCardGenerator.downloadScoreCard(data);
  }
}

export const scoreCardGenerator = new ScoreCardGenerator();
