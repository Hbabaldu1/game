import { GameState } from '../types/game';
import { eventBus } from './EventBus';

export class StateManager {
  private currentState: GameState = 'MENU';

  public getState(): GameState {
    return this.currentState;
  }

  public setState(nextState: GameState, payload?: any): void {
    if (this.currentState === nextState) return;

    const previousState = this.currentState;
    this.currentState = nextState;

    eventBus.emit('state:changed', {
      previous: previousState,
      current: nextState,
      payload
    });
  }

  public is(state: GameState): boolean {
    return this.currentState === state;
  }
}
