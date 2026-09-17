import { eventBus } from '../core/EventBus';

export class InputSystem {
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private readonly minSwipeDistance = 25;
  private readonly maxSwipeTime = 350;
  private element: HTMLElement | null = null;
  private isDestroyed = false;
  private isBrakingKeyHeld = false;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
  }

  public attach(element: HTMLElement): void {
    this.element = element;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    // Also support mouse clicks for desktop testing
    element.addEventListener('pointerdown', this.handlePointerDown);
  }

  public detach(): void {
    this.isDestroyed = true;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);

    if (this.element) {
      this.element.removeEventListener('touchstart', this.handleTouchStart);
      this.element.removeEventListener('touchend', this.handleTouchEnd);
      this.element.removeEventListener('pointerdown', this.handlePointerDown);
      this.element = null;
    }
  }

  private isBrakeKey(key: string): boolean {
    return key === 'ArrowDown' || key === 's' || key === 'S' || key === ' ';
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.isDestroyed) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      eventBus.emit('input:lane_change', -1);
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      eventBus.emit('input:lane_change', 1);
    } else if (this.isBrakeKey(e.key)) {
      e.preventDefault();
      if (!this.isBrakingKeyHeld) {
        this.isBrakingKeyHeld = true;
        eventBus.emit('input:brake_start');
      }
      eventBus.emit('input:action_button');
    } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      e.preventDefault();
      eventBus.emit('input:toggle_pause');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      eventBus.emit('input:action_button');
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (this.isDestroyed) return;

    if (this.isBrakeKey(e.key)) {
      e.preventDefault();
      this.isBrakingKeyHeld = false;
      eventBus.emit('input:brake_end');
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = performance.now();
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;
    const dt = performance.now() - this.touchStartTime;

    // Check if it's a swipe
    if (Math.abs(dx) > this.minSwipeDistance && Math.abs(dx) > Math.abs(dy) && dt < this.maxSwipeTime) {
      if (dx < 0) {
        eventBus.emit('input:lane_change', -1);
      } else {
        eventBus.emit('input:lane_change', 1);
      }
    } else {
      // Tap on left or right half of the canvas/screen
      const rect = this.element?.getBoundingClientRect();
      if (rect) {
        const midX = rect.left + rect.width / 2;
        if (touch.clientX < midX) {
          eventBus.emit('input:lane_change', -1);
        } else {
          eventBus.emit('input:lane_change', 1);
        }
      }
    }
  }

  private handlePointerDown = (e: PointerEvent): void => {
    // If it's a mouse click, allow clicking left/right half for immediate testing
    if (e.pointerType === 'mouse') {
      const rect = this.element?.getBoundingClientRect();
      if (rect) {
        const midX = rect.left + rect.width / 2;
        if (e.clientX < midX) {
          eventBus.emit('input:lane_change', -1);
        } else {
          eventBus.emit('input:lane_change', 1);
        }
      }
    }
  };
}
