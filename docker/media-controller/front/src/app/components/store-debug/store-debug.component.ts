import {Component, computed, inject} from '@angular/core';
import {GameStore} from '../../store/game.store';
import {DebugPanelComponent} from '../debug-panel/debug-panel.component';

@Component({
  selector: 'app-store-debug',
  standalone: true,
  imports: [DebugPanelComponent],
  templateUrl: './store-debug.component.html',
})
export class StoreDebugComponent {
  private readonly store = inject(GameStore);

  readonly snapshot = computed(() => ({
    players: this.store.players(),
    currentPlayerState: this.store.currentPlayerState(),
    settings: this.store.settings(),
    variables: this.store.variables()
  }));
}
