export interface AnalyticsEvent {
  name: string;
  params?: Record<string, string | number | boolean>;
  timestamp: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private eventLog: AnalyticsEvent[] = [];
  private isDevelopment = true;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  public track(name: string, params?: Record<string, string | number | boolean>): void {
    const event: AnalyticsEvent = {
      name,
      params,
      timestamp: Date.now()
    };

    this.eventLog.push(event);

    if (this.isDevelopment) {
      console.log(`📊 [Analytics] ${name}`, params || '');
    }

    // Keep log bounded in memory
    if (this.eventLog.length > 200) {
      this.eventLog.shift();
    }
  }

  public getRecentEvents(): AnalyticsEvent[] {
    return [...this.eventLog];
  }
}

export const analytics = AnalyticsService.getInstance();
