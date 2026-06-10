import {Component, computed, inject, signal} from '@angular/core';

import { NgxJsonTreeviewComponent } from "ngx-json-treeview";


import {GameStore} from "../../store/game.store";


@Component({
  selector: 'app-store-debug',
  standalone: true,
  imports: [
    NgxJsonTreeviewComponent
  ],
  templateUrl: './store-debug.component.html',
  styleUrl: './store-debug.component.scss'
})
export class StoreDebugComponent {

  readonly store = inject(GameStore);

  readonly snapshot = computed(() => {
    const variables = this.store.variables();

    return {
      players: this.store.players(),
      currentPlayerState: this.store.currentPlayerState(),
      settings: this.store.settings(),
      variables
    }
  });

  readonly position = signal({ left: 0, top: 400 });
  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  onMouseDown(event: MouseEvent): void {
    const header = (event.currentTarget as HTMLElement).querySelector('.debug-header');
    if (!header?.contains(event.target as Node)) return;
    
    this.dragging = true;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.dragging) return;
    
    this.position.set({
      left: event.clientX - this.dragOffset.x,
      top: event.clientY - this.dragOffset.y
    });
  }

  onMouseUp(): void {
    this.dragging = false;
  }

}
