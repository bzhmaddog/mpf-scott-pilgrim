import {patchState, withMethods} from "@ngrx/signals";
import {inject} from "@angular/core";
import {Logger} from "../utils/logger";
import {GameState} from "./game.store";

export function withGameStoreMethods() {
  return withMethods((store) => {
    const logger = inject(Logger).getInstance('GameStore');
    return ({

      /**
       * Set variable
       * @param key
       * @param value
       */
      setMachineVariable(key: string, value: string) {
        patchState(store, (state: GameState) => ({
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
        patchState(store, (state: GameState) => ({
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
        patchState(store, (state: GameState) => {

          if (player < 1) {
            logger.error("setCurrentPlayer() : player cannot be lower than 1")
            return state;
          }

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
        patchState(store, (state: GameState) => {

          if (ball < 1) {
            logger.error("setCurrentBall() : ball cannot be lower than 1")
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
        patchState(store, (state: GameState) => {

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
        patchState(store, (state: GameState) => {
            if (player < 1) {
              logger.error("setPlayerBall() : player cannot be lower than 1")
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
       * Set score for a specific player
       * @param player
       * @param score
       */
      setPlayerScore(player: number, score: number) {
        patchState(store, (state: GameState) => {
            if (player < 1) {
              logger.error("setPlayerScore() : player cannot be lower than 1")
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
        patchState(store, (state: GameState) => ({
            ...state,
            settings
          })
        )
      }

    });
  });
}
