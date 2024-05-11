import {ActionReducerMap, MetaReducer} from "@ngrx/store";
import {gameReducer, gameStateKey} from "@store/game/game.reducer";
import {playersEffects, GameState} from "./game";
import {isDevMode, Type} from "@angular/core";
import {machineEffects, machineReducer, machineStateKey} from "@store/machine";
import {MachineVariables} from "@store/machine/types";

export interface State {
  [gameStateKey]: GameState
  [machineStateKey]: MachineVariables
}

export const reducers: ActionReducerMap<State> = {
  [gameStateKey]: gameReducer,
  [machineStateKey]: machineReducer
}

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : []

export const effects: Type<unknown>[] = [
  ...playersEffects,
  ...machineEffects
]
