import {createFeatureSelector, createSelector} from "@ngrx/store";
import {machineStateKey} from "@store/machine/machine.reducer";
import {MachineVariables} from "@store/machine/types";


const selectMachineState = createFeatureSelector<MachineVariables>(machineStateKey)


export const selectAllMachineVariables = createSelector(
  selectMachineState,
  (state: MachineVariables): MachineVariables => state
)

export const selectMachineVariable = (key: string) => createSelector(
  selectMachineState,
  (state: MachineVariables): string => state[key]
)
