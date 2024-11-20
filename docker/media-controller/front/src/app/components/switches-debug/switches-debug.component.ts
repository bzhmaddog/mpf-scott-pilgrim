import {Component, computed, inject} from '@angular/core';
import {GameStore} from "../../store/game.store";
import {JsonPipe} from "@angular/common";

@Component({
  selector: 'app-switches-debug',
  standalone: true,
  imports: [
    JsonPipe
  ],
  templateUrl: './switches-debug.component.html',
  styleUrl: './switches-debug.component.scss'
})
export class SwitchesDebugComponent {

  store = inject(GameStore)

  switches = computed(()=> Object.entries(this.store.variables()).filter(([k]) => k.startsWith('audits_switches_')))

}
