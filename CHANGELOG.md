# Changelog

All notable changes to **Danfo Drift: Lagos Express** will be documented in this file.

## [0.1.0] - MVP Release - 2026-09-17

### Added
- **Core Loop**: Vertical 3-lane scrolling expressway with responsive lane-switching.
- **Player Danfo**: Stylized yellow Lagos commercial minibus with dynamic body tilt and headlights.
- **Procedural Traffic**: 4 vehicle classes (Sedan, Danfo, Haulage Truck, Hazard Cab with blinking flashers).
- **Close Shave Mechanic**: Proximity near-miss detection, multiplier stepping (1x -> 2x -> 3x -> 5x -> 10x), combo decay timer, and floating score notifications.
- **Resource Management**: Fuel tank draining with collectible Jerrycans and warning state.
- **Kobo Coin Economy**: Collectible spinning 3D-effect gold coins with LocalStorage balance persistence.
- **Arcade Audio**: Procedural Web Audio API sound synthesis for all vehicle and UI actions.
- **Mobile Touch Controls**: Left/Right screen tap zones, swipe detection, and keyboard controls (A/D and Arrow keys).
- **Monetization Layer**: `AdService` interface and `MockAdService` with Rewarded Revive flow and Interstitial frequency capping.
- **Analytics Layer**: Telemetry buffer tracking game lifecycle and player behavior.
