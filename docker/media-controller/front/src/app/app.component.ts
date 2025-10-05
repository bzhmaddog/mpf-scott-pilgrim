import {
  AfterViewInit,
  Component,
  ElementRef,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  ViewChild
} from '@angular/core';

import {App} from '@mpf/app';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
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
