import {patchState, signalStore, withComputed, withMethods, withState} from "@ngrx/signals";
import {Player} from "@models/player";
import {computed} from "@angular/core";
import {withDevtools} from "@angular-architects/ngrx-toolkit";

export type MachineVariables = Record<string, string>;

interface GameState {
  players: Player[],
  player: number,
  variables: MachineVariables;
  settings: []
}

const initialState: GameState = {
  players: [],
  player: 0,
  variables: {},
  settings: []
}

export const GameStore = signalStore(
  {providedIn: 'root'},
  withDevtools('game'), // <-- add this
  withState(initialState),
  withMethods((store) =>
    ({

      /**
       * Set variable
       * @param key
       * @param value
       */
      setMachineVariable(key: string, value: string) {
        patchState(store, (state) => ({
            ...state,
            variables: {
              ...state.variables,
              [key]: value
            }
          })
        )
      },

      /**
       * Add player to players array
       */
      addPlayer() {
        patchState(store, (state) => ({
            ...state,
            players: [...state.players, {ball: 0, score: 0}]
          })
        )
      },

      /**
       * Set current player value
       * @param player
       */
      setCurrentPlayer(player: number) {
        patchState(store, (state) => {

          if (player < 1) {
            console.error("setCurrentPlayer() : player cannot be lower than 1")
            return state;
          }

          console.log("Players[]", player, state.players)


          return {
            ...state,
            player
          }
        })
      },

      /**
       * Set ball value for current player
       * @param ball
       */
      setCurrentBall(ball: number) {
        patchState(store, (state) => {

          if (ball < 1) {
            console.error("setCurrentBall() : ball cannot be lower than 1")
            return state;
          }

          const player = state.player;
          const players = structuredClone(state.players);

          players[player - 1].ball = ball;

          return {
            ...state,
            players
          }
        })
      },

      /**
       * Set score value for current player
       * @param score
       */
      setCurrentScore(score: number) {
        patchState(store, (state) => {

            const player = state.player;
            const players = structuredClone(state.players);

            players[player - 1].score = Math.max(score, 0); // prevent negative number

            return {
              ...state,
              players
            }
          }
        )
      },

      /**
       * Set ball number for player
       * @param player
       * @param ball
       */
      setPlayerBall(player: number, ball: number) {
        patchState(store, (state) => {
            if (player < 1) {
              console.error("setCurrentBall() : ball cannot be lower than 1")
              return state;
            }

            const players = structuredClone(state.players);

            players[player - 1].ball = ball;

            return {
              ...state,
              players
            }
          }
        )
      },

      /**
       * Set ball number for player
       * @param player
       * @param score
       */
      setPlayerScore(player: number, score: number) {
        patchState(store, (state) => {
            if (player < 1) {
              console.error("setCurrentBall() : ball cannot be lower than 1")
              return state;
            }
            const players = structuredClone(state.players);

            players[player - 1].score = score;

            return {
              ...state,
              players
            }
          }
        )
      },

      setSettings(settings: []) {
        patchState(store, (state) => ({
            ...state,
            settings
          })
        )
      }

    }),
  ),
  withComputed(({players, player}) => ({
    currentPlayerState: computed(() => players()[player() - 1]),
    currentPlayerScore: computed(() => players()[player() - 1]?.score ?? 0),
    currentPlayerBall: computed(() => players()[player() - 1]?.ball ?? 1),
  }))
)
