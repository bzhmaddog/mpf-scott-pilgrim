import {SignalStoreFeature, EmptyFeatureResult} from "@ngrx/signals";

export type MachineVariables = Record<string, string>;

// This type is used to extract the output type of a SignalStoreFeature function
// Used to inject extensions easily in the store without having to manually define the type of the store after each extension
export type GameStoreFeatureType<Feature extends (...args: never[]) => SignalStoreFeature> = 
    Feature extends (...args: never[]) => SignalStoreFeature<EmptyFeatureResult, infer Output>
     ? Output
     : never;