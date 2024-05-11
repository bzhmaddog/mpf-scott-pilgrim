import {createAction, props} from "@ngrx/store";

export const setMachineVariable = createAction(
  '[MACHINE] set machine variable',
  props<{key: string, value: string}>()
)
