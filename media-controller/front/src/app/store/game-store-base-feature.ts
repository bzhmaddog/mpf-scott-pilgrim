import {signalStoreFeature, withState} from "@ngrx/signals";
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
      withState<GameState>(initialState)
    );
}