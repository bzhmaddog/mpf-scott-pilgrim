import {signalStore, withState} from "@ngrx/signals";
import {Player} from "@models/player";
import {withDevtools} from "@angular-architects/ngrx-toolkit";
import {withGameStoreMethods} from "./game.store.methods";
import {withGameStoreComputed} from "./game.store.computed";

export type MachineVariables = Record<string, string>;

export interface GameState {
  players: Player[],
  player: number,
  variables: MachineVariables;
  settings: []
}

export const initialState: GameState = {
  players: [],
  player: 0,
  variables: {},
  settings: []
}

export const GameStore = signalStore(
  {providedIn: 'root'},
  withDevtools('gameStore'),
  withState(initialState),
  withGameStoreMethods(),
  withGameStoreComputed(),
)
