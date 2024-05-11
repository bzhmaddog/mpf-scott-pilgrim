import {ApplicationConfig, isDevMode} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideModesManager, provideResourcesManager} from "@mpf/services/types";
import {provideAnimations} from "@angular/platform-browser/animations";
import {provideToastr} from "ngx-toastr";
import {provideStore} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {provideStoreDevtools} from "@ngrx/store-devtools";
import {effects, metaReducers, reducers} from "@store/index";
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
    provideAnimations(),
    provideToastr(),
    provideStore(reducers, {metaReducers}),
    provideEffects(effects),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
      trace: false
    })
  ]
};
