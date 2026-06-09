import {withComputed} from "@ngrx/signals";
import {computed} from "@angular/core";

export function withGameStoreComputed() {
  return withComputed(({players, player}) => ({
    currentPlayerScore: computed(() => players()[player() - 1]?.score ?? 0),
    currentPlayerBall:  computed(() => players()[player() - 1]?.ball ?? 0),
  }));
}
