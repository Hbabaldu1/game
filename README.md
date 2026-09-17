# Danfo Drift: Lagos Express

> **"Weave the traffic. Grab the fares. Don't scratch the paint."**

A commercial-grade, high-octane 2D HTML5 arcade traffic weaver with genuine mobile-first feel, close-shave combo mechanics, and authentic Lagos street vitality.

---

## 🛠 Tech Stack

- **Engine**: Modular TypeScript + HTML5 Canvas 2D
- **Audio**: Web Audio API Procedural Synthesizer (zero external audio file dependencies)
- **State & UI**: Decoupled EventBus + React 19 overlay UI + Tailwind CSS v4
- **Persistence**: LocalStorage with fail-safe fallback (ready for Firestore migration)
- **Build Tool**: Vite 6 / 8

---

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Run Locally (Development)
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 📂 Project Structure

```text
src/
├── main.tsx                # Entry point
├── App.tsx                 # Canvas frame & UI host
├── types/
│   └── game.ts             # Global TypeScript interfaces & game states
├── config/
│   ├── GameConfig.ts       # Centralized balancing, dimensions, speeds & colors
│   └── AudioConfig.ts      # Sound frequencies & volume buses
├── core/
│   ├── Game.ts             # Master game orchestrator
│   ├── GameLoop.ts         # 60 FPS fixed-timestep accumulator loop
│   ├── EventBus.ts         # Typed pub/sub event bus
│   └── StateManager.ts     # MENU, PLAYING, PAUSED, GAME_OVER, REVIVING
├── entities/
│   ├── PlayerVehicle.ts    # Lagos Yellow Danfo with smooth lane lerp & tilt
│   ├── TrafficVehicle.ts   # Sedans, Danfo buses, Cargo Trucks, Hazard Cabs
│   └── Collectible.ts      # Kobo coins (₦) & Fuel Jerrycans
├── systems/
│   ├── LaneSystem.ts       # 3-lane coordinate calculations
│   ├── InputSystem.ts      # Touch taps, swipes, and keyboard (A/D/Arrows)
│   ├── CollisionSystem.ts  # Fair AABB box collision checks
│   ├── CloseShaveSystem.ts # Proximity near-miss detection & combo triggers
│   ├── SpawnerSystem.ts    # Procedural lane-aware traffic & item spawner
│   ├── ScoreSystem.ts      # Distance points, passes, multipliers & combo timer
│   ├── FuelSystem.ts       # Resource drain & Jerrycan replenishment
│   └── DifficultySystem.ts # Dynamic speed ramping
├── audio/
│   └── AudioManager.ts     # Procedural synthesizer for all arcade SFX
├── rendering/
│   ├── Renderer.ts         # Canvas 2D road, vehicles, lighting & shadows
│   └── ParticleSystem.ts   # Sparks, splashes, and floating combo text
├── services/
│   ├── StorageService.ts   # LocalStorage high-score & Kobo persistence
│   ├── AnalyticsService.ts # Event telemetry buffer
│   ├── AdService.ts        # Rewarded & Interstitial interface
│   └── MockAdService.ts    # Development simulation of rewarded revive
└── ui/
    └── GameUI.tsx          # Mobile HUD, Title Screen, Game Over & Pause modals
```

---

## 🎮 Current MVP Features

1. **Immediate Playability**: Tap to drive within 1 second of loading; no bloated menus.
2. **Iconic Lagos Danfo**: Stylized yellow commercial minibus with black stripes, roof luggage rack, and headlights.
3. **Responsive Controls**: Instant lane shifting via keyboard (A/D or Arrows) and mobile touch (tap left/right half or swipe).
4. **Close Shave Mechanic**: Proximity near-misses around traffic trigger multipliers (1x → 2x → 3x → 5x → 10x), screen shake, sound, and floating badges.
5. **Procedural Traffic**: Cargo Trucks, Passenger Sedans, Danfo Buses, and Hazard Cabs with blinking amber flashers.
6. **Fuel & Resource System**: Tank drains gradually; collecting red Jerrycans prevents fuel exhaustion.
7. **Kobo Coin Economy**: Collect gold ₦ coins during runs; persists across sessions.
8. **Web Audio Sound Effects**: Lane whoosh, coin chime, fuel splash, brass combo chord, and crash crunch.
9. **Instant Restart & Rewarded Revive**: Sub-300ms restart; working mock rewarded ad revive flow.
10. **Persistence**: Saves Personal Best Score, Total Kobo, and Best Combo in LocalStorage.

---

## ⚠️ Known Limitations in MVP

- **Visuals**: Procedural Canvas 2D vector art (custom SVG/raster sprite sheet packs planned for v1.0).
- **Backend / Cloud Leaderboards**: LocalStorage persistence currently; Firebase Firestore cloud leaderboards planned for Prompt 3.
- **Monetization**: Runs on `MockAdService`; live Google H5 Games Ads / AdSense network integration planned for Prompt 3.

---

## 🎯 Next Development Milestone (Prompt 2)

- Game feel polish, secondary vehicles in garage (Okada motorbike, Keke tricycle), audio expansion with layered Afrobeat percussive rhythm loop, and daily challenge seed system.
