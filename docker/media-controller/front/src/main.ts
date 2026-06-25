import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(
  AppComponent,
  {
    ...appConfig,
    providers: [
      provideZonelessChangeDetection(),
      ...appConfig.providers
    ]
  }
)
.catch(
  // eslint-disable-next-line no-console -- Logger is unavailable if bootstrapApplication fails
  (err) => console.error(err)
);
