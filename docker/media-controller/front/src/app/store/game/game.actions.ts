import {createAction, props} from "@ngrx/store";

export const addPlayer = createAction(
  '[GAME] add new player'
)



export const resetGameState = createAction(
  '[GAME] reset game state'
)

export const setCurrentState = createAction(
  '[GAME] Set current state',
  props<{player: number, score: number, ball: number}>()
)

export const setCurrentPlayer = createAction(
  '[GAME] Set current player number',
  props<{player: number}>()
)

export const setCurrentScore = createAction(
  '[GAME] Set current player score',
  props<{score: number}>()
)

export const setCurrentBall = createAction(
  '[GAME] Set current player ball number',
  props<{ball: number}>()
)

export const setCurrentNumberOfPlayers = createAction(
  '[GAME] Set current number of players',
  props<{players: number}>()
)


export const setPlayerScore = createAction(
  '[GAME] Set player score',
  props<{player: number, score:number}>()
)

export const setPlayerBall = createAction(
  '[GAME] Set player ball',
  props<{player: number, ball:number}>()
)


export const addPlayerSuccess = createAction(
  '[GAME] add new player Succeed'
)

export const setCurrentPlayerSuccess = createAction(
  '[GAME] Set current player success'
)

export const setPlayerScoreSuccess = createAction(
  '[GAME] Set player score success'
)

export const setPlayerBallSuccess = createAction(
  '[GAME] Set player ball success'
)
