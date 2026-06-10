import {signalStoreFeature, withState} from "@ngrx/signals";
import {withDevtools} from "@angular-architects/ngrx-toolkit";
import {GameState} from "@models/game-state";
import { GameStoreFeatureType } from "@types";


export const initialState: GameState = {
  players: [],
  player: 0,
  variables: {},
  settings: []
}

export type GameStoreBaseFeature = GameStoreFeatureType<typeof withGameStoreBase>;

export function withGameStoreBase() {
    return signalStoreFeature(
      withDevtools('gameStore'),
      withState<GameState>(initialState)
    );
}