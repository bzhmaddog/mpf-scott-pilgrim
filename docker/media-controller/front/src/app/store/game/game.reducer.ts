import {GameState} from "@store/game/types";
import {ActionReducer, createReducer, on} from "@ngrx/store";
import {
  addPlayer,
  resetGameState,
  setCurrentBall, setCurrentNumberOfPlayers,
  setCurrentPlayer, setCurrentScore,
  setPlayerBall,
  setPlayerScore
} from "@store/game/game.actions";
import {mutableOn} from "ngrx-etc";

export const gameStateKey = 'game'

const initialState: GameState = {
  players: [],
  current: {
    player: 0,
    ball: 0,
    score: 0,
    players: 0
  }
}

export const gameReducer: ActionReducer<GameState> = createReducer(
  initialState,
  on(
    resetGameState,
    (): GameState => ({
      ...initialState
    })
  ),
  on(
    addPlayer,
    (state: GameState): GameState => ({
      ...state,
      players: [...state.players, {ball: 1, score: 0}]
    })
  ),
  on(
    setCurrentPlayer,
    (state: GameState, {player}): GameState => ({
      ...state,
      current: {
        ...state.current,
        player: player
      }
    })
  ),
  on(
    setCurrentBall,
    (state: GameState, {ball}): GameState => ({
      ...state,
      current: {
        ...state.current,
        ball: ball
      }
    })
  ),
  on(
    setCurrentScore,
    (state: GameState, {score}): GameState => ({
      ...state,
      current: {
        ...state.current,
        score: score
      }
    })
  ),
  on(
    setCurrentNumberOfPlayers,
    (state: GameState, {players}): GameState => ({
      ...state,
      current: {
        ...state.current,
        players
      }
    })
  ),
  mutableOn(
    setPlayerScore,
    (state: GameState, {player, score}) => {
      const playerState = state.players[player - 1]

      playerState.score = score
    }
  ),
  mutableOn(
    setPlayerBall,
    (state: GameState, {player, ball}) => {
      const playerState = state.players[player - 1]
      playerState.ball = ball
    }
  )
)
