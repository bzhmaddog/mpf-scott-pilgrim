import {
  AfterViewInit, ChangeDetectionStrategy,
  Component,
  ElementRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  ViewChild
} from '@angular/core';
import {MpfApp} from '@mpf/mpf-app';
import {Logger} from './utils/logger';
import {StoreDebugComponent} from "./components/store-debug/store-debug.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StoreDebugComponent],
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
      this._logger.getInstance('AppComponent').log("Initializing MpfApp")
      
      new MpfApp(this.dmdElementRef.nativeElement)
    });
  }

}
