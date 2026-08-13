import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {IResourcesData, provideModesManager, provideResourcesManager} from "@mpf/services";
import resourcesData from '@mpf/config/resources.json';
import {AttractMode} from "@mpf/modes/attract/attract-mode";
import {GameMode} from "@mpf/modes/game/game-mode";
import {BaseMode} from "@mpf/modes/base/base-mode";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideResourcesManager({
      data: resourcesData as IResourcesData,
      basePath: '/assets/resources/'
    }),
    provideModesManager({
      'attract': () => {
        return new AttractMode()
      },
      'base': () => {
        return new BaseMode()
      },
      'game': () => {
        return new GameMode()
      }
    }),
  ]
};
