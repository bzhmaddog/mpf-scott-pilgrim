import {withComputed, type, signalStoreFeature} from "@ngrx/signals";
import {computed} from "@angular/core";

import { GameStoreBaseFeature } from "./game-store-base-feature";


export function withGameStoreComputed() {
  return signalStoreFeature(
    type<GameStoreBaseFeature>(),
    withComputed(({players, player}) => {
      const currentPlayerState = computed(() => ({
        index: player(),
        score: players()[player() - 1]?.score ?? 0,
        ball: players()[player() - 1]?.ball ?? 0,
      }));

      return {
        currentPlayerState
      };

    })
  )
}
