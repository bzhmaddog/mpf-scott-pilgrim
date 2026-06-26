import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  inject,
  runInInjectionContext,
  ViewChild
} from '@angular/core';
import {MpfApp} from '@mpf/mpf-app';
import {Logger} from './utils/logger';
import {StoreDebugComponent} from "./components/store-debug/store-debug.component";
import {ResourcesDebugComponent} from "./components/resources-debug/resources-debug.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [StoreDebugComponent, ResourcesDebugComponent],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'Scott Pilgrim vs the pinball';
  private readonly _logger = inject(Logger);

  private environmentInjector = inject(EnvironmentInjector)

  @ViewChild('dmd')
  dmdElementRef!: ElementRef

  private _mpfApp: MpfApp | undefined

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this._mpfApp?.handleKeyEvent(event)
  }

  constructor() {
    afterNextRender(() => {
      runInInjectionContext(this.environmentInjector, () => {
        this._logger.getInstance('AppComponent').log("Initializing MpfApp")
        this._mpfApp = new MpfApp(this.dmdElementRef.nativeElement)
      })
    })
  }

}
