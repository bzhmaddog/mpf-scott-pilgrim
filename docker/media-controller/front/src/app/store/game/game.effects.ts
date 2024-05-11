import {Injectable} from "@angular/core";
import {Store} from "@ngrx/store";
import {Actions, createEffect, ofType} from "@ngrx/effects";

import {gameActions, setCurrentPlayerSuccess} from 'app/store/game'
import {combineLatest, map, of, switchMap, withLatestFrom} from "rxjs";
import {selectPlayer} from "@store/game/game.selectors";
import {concatLatestFrom} from "@ngrx/operators";

@Injectable()
export class GameEffects {
  constructor(
    private actions$: Actions,
    private readonly _store: Store
  ) {
  }

  /*addPlayerEffect$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(gameActions.addPlayer),
      withLatestFrom(this._store.select(selectNumberOfPlayers)),
      switchMap((stateData) => {
        const [, numberOfPlayers] = stateData

        if (numberOfPlayers == 1) {
          return of(
            gameActions.setCurrentPlayer({player: 1}),
            gameActions.setCurrentBall({ball: 1})
          )
        } else {
          return of(gameActions.addPlayerSuccess())
        }
      })
    )
  })*/

  setPlayerScoreEffect$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(gameActions.setCurrentPlayer),
      switchMap((action) => combineLatest([
        this._store.select(selectPlayer(action.player))
      ])),
      switchMap((stateData) => {
        const [player] = stateData

        return of(
          gameActions.setCurrentScore({score:player.score}),
          gameActions.setCurrentBall({ball:player.ball}),
          gameActions.setCurrentPlayerSuccess()
        )
      })
    )
  })
}
