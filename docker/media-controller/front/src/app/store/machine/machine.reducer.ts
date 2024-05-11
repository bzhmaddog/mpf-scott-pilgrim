import {ActionReducer, createReducer, on} from "@ngrx/store";
import {MachineVariables} from "@store/machine/types";

import {machineActions} from '@store/machine'

export const machineStateKey = 'machine'

const initialState: MachineVariables = {}

export const machineReducer: ActionReducer<MachineVariables> = createReducer(
  initialState,
  on(
    machineActions.setMachineVariable,
    (state: MachineVariables, {key, value}): MachineVariables => ({
      ...state,
        [key]: value
    })
  )
)
