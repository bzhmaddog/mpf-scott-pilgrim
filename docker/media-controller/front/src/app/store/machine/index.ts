import {MachineEffects} from "@store/machine/machine.effects";
import {Type} from "@angular/core";

export * from "@store/machine/machine.actions"
export * as machineActions from "@store/machine/machine.actions"

export * from "@store/machine/machine.effects"
export * from "@store/machine/machine.reducer"


export const machineEffects: Type<unknown>[] = [
 MachineEffects
]
