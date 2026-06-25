import type {Mode} from '@mpf/modes/mode';

export interface IModesConfigDictionary {
    [key: string]: () => Mode
}
