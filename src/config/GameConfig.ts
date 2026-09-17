export const GAME_CONFIG = {
  // Dimensions and world
  BASE_WIDTH: 420,
  BASE_HEIGHT: 750,
  LANES_COUNT: 3,
  ROAD_WIDTH_RATIO: 0.82, // Portion of screen width occupied by the 3 lanes
  ROAD_SCROLL_SPEED: 480, // Base visual speed px/sec

  // Player physics
  PLAYER_WIDTH: 52,
  PLAYER_HEIGHT: 96,
  PLAYER_BASE_Y: 580, // Default Y position
  LANE_SWITCH_SPEED: 16, // Lerp factor for smooth lane transition
  LEAN_MAX_ANGLE: 0.14, // Max tilt angle during lane switches (radians)

  // Collision adjustments (tight hitboxes for fair arcade dodging)
  PLAYER_HITBOX_INSET_X: 6,
  PLAYER_HITBOX_INSET_Y: 10,
  TRAFFIC_HITBOX_INSET_X: 6,
  TRAFFIC_HITBOX_INSET_Y: 8,

  // Close Shave (Near-Miss) mechanics
  CLOSE_SHAVE_X_EXPANSION: 24, // Lateral buffer for detecting a brush
  CLOSE_SHAVE_Y_EXPANSION: 18, // Vertical buffer
  COMBO_MULTIPLIERS: [1, 2, 3, 5, 10],
  COMBO_TIMEOUT_SECONDS: 3.5, // Window to chain another near-miss before multiplier resets
  BASE_CLOSE_SHAVE_POINTS: 250,

  // Resource & Fuel system
  MAX_FUEL: 100,
  START_FUEL: 100,
  FUEL_CONSUMPTION_RATE: 3.8, // Fuel drained per second
  FUEL_PICKUP_AMOUNT: 32, // Restored per jerrycan
  FUEL_WARNING_THRESHOLD: 25, // Percentage where warning pulses

  // Collectibles
  KOBO_VALUE: 10,
  KOBO_SCORE_POINTS: 100,
  KOBO_SIZE: 28,
  FUEL_SIZE: 30,

  // Difficulty & Spawning
  BASE_SPEED: 420,
  MAX_SPEED: 820,
  SPEED_INCREASE_RATE: 4.5, // Speed added per second
  INITIAL_SPAWN_INTERVAL: 1.6, // Seconds between obstacle spawns
  MIN_SPAWN_INTERVAL: 0.72,
  SPAWN_INTERVAL_REDUCTION_RATE: 0.008,

  // Traffic types parameters
  TRAFFIC_CONFIGS: {
    SEDAN: {
      width: 48,
      height: 84,
      speedFactor: 0.85, // Slower than player
      color: '#3B82F6',
      name: 'Private Sedan'
    },
    DANFO: {
      width: 52,
      height: 98,
      speedFactor: 0.75,
      color: '#EAB308',
      name: 'Commercial Danfo'
    },
    TRUCK: {
      width: 58,
      height: 140,
      speedFactor: 0.60, // Slow moving heavy container
      color: '#EF4444',
      name: 'Haulage Truck'
    },
    HAZARD_CAR: {
      width: 48,
      height: 84,
      speedFactor: 0.20, // Near-stationary hazard
      color: '#F97316',
      name: 'Broke-down Cab'
    }
  },

  // Scoring
  DISTANCE_SCORE_RATE: 15, // Score per meter/frame fraction
  TRAFFIC_PASS_POINTS: 50,

  // Visuals & Feedback
  SCREEN_SHAKE_DURATION: 0.35,
  SCREEN_SHAKE_INTENSITY: 12,
  CLOSE_SHAVE_SHAKE_INTENSITY: 3.5,
  CLOSE_SHAVE_SHAKE_DURATION: 0.15,

  // Colors
  COLORS: {
    LAGOS_YELLOW: '#F9B208',
    LAGOS_STRIPE: '#18181B',
    ASPHALT: '#18191D',
    ASPHALT_LINE: '#E4E4E7',
    SIDEWALK: '#27272A',
    CURB_RED: '#DC2626',
    CURB_WHITE: '#FAFAFA',
    ATLANTIC_GREEN: '#008751',
    KOBO_GOLD: '#FBBF24',
    FUEL_ORANGE: '#EA580C',
    HUD_BG: 'rgba(18, 19, 22, 0.85)',
    ACCENT_RED: '#E11D48'
  }
} as const;
