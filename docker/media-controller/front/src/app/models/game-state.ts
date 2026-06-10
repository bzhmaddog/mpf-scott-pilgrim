import {Player} from "./player";
import {MachineVariables} from "../types";

export interface GameState {
  players: Player[],
  player: number,
  variables: MachineVariables;
  settings: []
}