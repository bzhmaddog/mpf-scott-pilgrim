import {signalStore} from "@ngrx/signals";
import {withGameStoreMethods} from "./with-game-store-methods";
import {withGameStoreComputed} from "./with-game-store-computed";
import {withGameStoreBase} from "./game-store-base-feature";

export const GameStore = signalStore(
  {providedIn: 'root'},
  withGameStoreBase(),
  withGameStoreMethods(),
  withGameStoreComputed(),
)
