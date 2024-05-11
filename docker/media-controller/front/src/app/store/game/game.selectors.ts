import {createFeatureSelector, createSelector} from "@ngrx/store";
import {gameStateKey} from "@store/game/game.reducer";
import {Player, GameState, CurrentGameState} from "@store/game/types";


const selectPlayersState = createFeatureSelector<GameState>(gameStateKey)


export const selectCurrentGameState = createSelector(
  selectPlayersState,
  (state: GameState): CurrentGameState => state.current
)


export const selectCurrentPlayer = createSelector(
  selectPlayersState,
  (state: GameState): number => state.current.player
)

export const selectPlayer = (player: number) => createSelector(
  selectPlayersState,
  (state: GameState): Player => state.players[player - 1]
)


export const selectPlayers = createSelector(
  selectPlayersState,
  (state: GameState): Player[] => state.players
)

export const selectNumberOfPlayers = createSelector(
  selectPlayersState,
  (state: GameState): number => state.players.length
)
