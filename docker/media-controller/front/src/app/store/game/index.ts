import {GameEffects} from "@store/game/game.effects";
import {Type} from "@angular/core";

export * from "@store/game/game.actions"
export * as gameActions from "@store/game/game.actions"
export * from "@store/game/game.effects"
export * from "@store/game/game.reducer"

export * from "@store/game/types"

export const playersEffects: Type<unknown>[] = [
  GameEffects
]
