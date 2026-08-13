import type {Mode} from '@mpf/core/mode';

export interface IModesConfigDictionary {
    [key: string]: () => Mode
}
