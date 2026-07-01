import {Component, input, OnDestroy, OnInit, signal} from '@angular/core';
import {NgxJsonTreeviewComponent} from 'ngx-json-treeview';

interface PanelState {
  position: { left: number; top: number };
  size: { width: number; height: number };
  collapsed?: boolean;
}

@Component({
  selector: 'app-debug-panel',
  standalone: true,
  imports: [NgxJsonTreeviewComponent],
  templateUrl: './debug-panel.component.html',
  styleUrl: './debug-panel.component.scss'
})
export class DebugPanelComponent implements OnInit, OnDestroy {
  readonly title = input.required<string>();
  readonly storageKey = input.required<string>();
  readonly data = input.required<unknown>();
  readonly defaultPosition = input<{ left: number; top: number }>({ left: 0, top: 0 });

  readonly size = signal({ width: 500, height: 400 });
  readonly position = signal({ left: 0, top: 0 });
  readonly collapsed = signal(false);

  private dragging = false;
  private dragOffset = { x: 0, y: 0 };

  private _resizeStart?: { x: number; y: number; width: number; height: number };
  private readonly _onResizeMoveRef = this._onResizeMove.bind(this);
  private readonly _onResizeEndRef = this._onResizeEnd.bind(this);

  ngOnInit(): void {
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (raw) {
        const parsed = JSON.parse(raw) as PanelState | { left: number; top: number };
        if ('position' in parsed) {
          this.position.set(parsed.position);
          this.size.set(parsed.size);
          this.collapsed.set(parsed.collapsed ?? false);
        } else {
          // backward-compat: old format stored only position
          this.position.set(parsed as { left: number; top: number });
        }
      } else {
        this.position.set(this.defaultPosition());
      }
    } catch {
      this.position.set(this.defaultPosition());
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this._onResizeMoveRef);
    document.removeEventListener('mouseup', this._onResizeEndRef);
  }

  private _save(): void {
    localStorage.setItem(this.storageKey(), JSON.stringify({
      position: this.position(),
      size: this.size(),
      collapsed: this.collapsed()
    } satisfies PanelState));
  }

  toggleCollapsed(): void {
    this.collapsed.update(v => !v);
    this._save();
  }

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
    if (this.dragging) {
      this._save();
    }
    this.dragging = false;
  }

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this._resizeStart = {
      x: event.clientX,
      y: event.clientY,
      width: this.size().width,
      height: this.size().height,
    };
    document.addEventListener('mousemove', this._onResizeMoveRef);
    document.addEventListener('mouseup', this._onResizeEndRef);
  }

  private _onResizeMove(event: MouseEvent): void {
    if (!this._resizeStart) return;
    this.size.set({
      width: Math.max(200, this._resizeStart.width + event.clientX - this._resizeStart.x),
      height: Math.max(100, this._resizeStart.height + event.clientY - this._resizeStart.y),
    });
  }

  private _onResizeEnd(): void {
    this._resizeStart = undefined;
    document.removeEventListener('mousemove', this._onResizeMoveRef);
    document.removeEventListener('mouseup', this._onResizeEndRef);
    this._save();
  }
}
