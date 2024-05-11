export interface Player {
  score: number,
  ball: number
}

export interface CurrentGameState {
  player: number
  ball: number
  score: number
  players: number
}

export interface GameState {
  players: Player[],
  current: CurrentGameState

}
