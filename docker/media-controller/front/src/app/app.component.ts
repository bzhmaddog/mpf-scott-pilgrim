import {
  AfterViewInit, ChangeDetectionStrategy,
  Component,
  ElementRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  ViewChild
} from '@angular/core';
import {App} from '@mpf/app';
import {Logger} from './utils/logger';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit{
  title = 'Scott Pilgrim vs the pinball';
  private readonly _logger = inject(Logger);

  private environmentInjector = inject(EnvironmentInjector)

  @ViewChild('dmd')
  dmdElementRef!: ElementRef

  ngAfterViewInit() {
    runInInjectionContext(this.environmentInjector, () => {
      new App(this.dmdElementRef.nativeElement)
    });
  }

}
