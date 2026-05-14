import {ApplicationConfig, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideModesManager, provideResourcesManager} from "@mpf/services";
import {provideToastr} from "ngx-toastr";
import {AttractMode} from "@mpf/modes/attract-mode";
import {GameMode} from "@mpf/modes/game-mode";
import {BaseMode} from "@mpf/modes/base-mode";
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideResourcesManager({
      file: 'resources.json',
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
    provideAnimationsAsync(),
    provideToastr(),
  ]
};
