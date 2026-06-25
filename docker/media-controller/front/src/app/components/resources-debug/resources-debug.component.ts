import {Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {ResourcesManager} from '@mpf/services/resources-manager.service';
import {DebugPanelComponent} from '../debug-panel/debug-panel.component';

@Component({
  selector: 'app-resources-debug',
  standalone: true,
  imports: [DebugPanelComponent],
  templateUrl: './resources-debug.component.html',
})
export class ResourcesDebugComponent {
  private readonly _resourcesManager = inject(ResourcesManager);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _tick = signal(0);

  readonly snapshot = computed(() => {
    this._tick();
    return this._resourcesManager.getSnapshot();
  });

  constructor() {
    const id = setInterval(() => this._tick.update(n => n + 1), 1000);
    this._destroyRef.onDestroy(() => clearInterval(id));
  }
}
