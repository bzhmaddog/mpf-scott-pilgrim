import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideModesManager, provideResourcesManager} from "@mpf/services";
import {provideToastr, ToastNoAnimation} from "ngx-toastr";
import {AttractMode} from "@mpf/modes/attract-mode";
import {GameMode} from "@mpf/modes/game-mode";
import {BaseMode} from "@mpf/modes/base-mode";

export const appConfig: ApplicationConfig = {
  providers: [
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
    provideToastr({ toastComponent: ToastNoAnimation }),
  ]
};
