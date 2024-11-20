import {
  AfterViewInit, ChangeDetectionStrategy,
  Component,
  ElementRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  ViewChild
} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {App} from '@mpf/app';
import {JsonPipe} from "@angular/common";
import {SwitchesDebugComponent} from "./components/switches-debug/switches-debug.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, JsonPipe, SwitchesDebugComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit{
  title = 'Scott Pilgrim vs the pinball';

  private environmentInjector = inject(EnvironmentInjector)

  @ViewChild('dmd')
  dmdElementRef!: ElementRef

  ngAfterViewInit() {
    runInInjectionContext(this.environmentInjector, () => {
      new App(this.dmdElementRef.nativeElement)
    });
  }

}
