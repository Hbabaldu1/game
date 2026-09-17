# Architecture: Danfo Drift — Lagos Express

## Overview
Danfo Drift is engineered as a decoupled, event-driven 2D web arcade game. The architecture avoids bloated frameworks and heavy runtime garbage collection, delivering 60 FPS on low-power mobile devices.

---

## Core Systems & Separation of Concerns

### 1. Game Loop & Timing (`GameLoop.ts`)
- **60 FPS Fixed-Timestep Accumulator**: Updates are evaluated in fixed `1/60` second increments with a frame clamp (`frameTime <= 0.1s`) to prevent simulation instability if a browser tab is backgrounded.
- **Interpolation**: Clean separation between state update and draw pass.

### 2. Event Bus (`EventBus.ts`)
- Decouples all gameplay systems from UI, audio, and analytics.
- Events include:
  - `input:lane_change`
  - `input:toggle_pause`
  - `input:action_button`
  - `game:close_shave`
  - `fuel:low`
  - `fuel:empty`
  - `state:changed`

### 3. Lane & Coordinate Mapping (`LaneSystem.ts`)
- Maps 3 virtual lanes centered on the screen viewport.
- Dynamic road width adapts smoothly to widescreen desktop vs narrow mobile portrait viewports.

### 4. Close Shave Proximity Engine (`CloseShaveSystem.ts`)
- Each traffic vehicle has a dual boundary:
  - **Fatal Hitbox**: Inset from vehicle boundary for forgiving, fair collision.
  - **Proximity Sensor**: Expanded lateral and longitudinal envelope.
- A near-miss is registered when the player overlaps the proximity sensor without triggering the fatal hitbox.
- Prevents duplicate triggers via `vehicle.hasAwardedCloseShave = true`.

### 5. Spawner System (`SpawnerSystem.ts`)
- Wave-based generation with guaranteed open pathways (never blocks all 3 lanes simultaneously).
- Object pooling for `TrafficVehicle` and `Collectible` prevents heap allocations inside the render loop.

### 6. Audio Engine (`AudioManager.ts`)
- Synthesizes all sound effects via browser `AudioContext` (sine, triangle, and filtered sawtooth oscillators + noise buffers).
- Handles browser autoplay policy cleanly with deferred activation upon first user pointer down.

### 7. Monetization & Analytics Abstractions (`AdService.ts`, `AnalyticsService.ts`)
- `AdService` defines async contracts for rewarded ads (`showRewardedAd`) and interstitials (`showInterstitial`).
- `MockAdService` simulates realistic countdowns and reward delivery during development without external network calls.
- Standardized analytics telemetry buffers events for Firebase Analytics integration in subsequent phases.
