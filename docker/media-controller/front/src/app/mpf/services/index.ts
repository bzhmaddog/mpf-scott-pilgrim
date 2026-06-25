import {EnvironmentProviders, InjectionToken, makeEnvironmentProviders} from "@angular/core";
import {ResourcesManager} from "@mpf/services/resources-manager.service";
import {ModesManager} from "@mpf/services/modes-manager.service";
import {IModesConfigDictionary, IResourcesManagerConfig} from '@mpf/models';
export type {IResourcesData, IResourcesManagerConfig, IModesConfigDictionary} from '@mpf/models';

export const resourcesManager: InjectionToken<ResourcesManager> = new InjectionToken<ResourcesManager>('resourceManager')
export const modesManager: InjectionToken<ModesManager> = new InjectionToken<ModesManager>('modesManager')

export function provideResourcesManager(config: IResourcesManagerConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: resourcesManager,
      useValue: config
    }
  ])
}


export function provideModesManager(modes: IModesConfigDictionary): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: modesManager,
      useValue: modes
    }
  ])
}
