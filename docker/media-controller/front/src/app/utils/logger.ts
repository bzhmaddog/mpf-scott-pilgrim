import {inject, InjectionToken, isDevMode, makeEnvironmentProviders, Injectable} from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

export const LOG_LEVEL = new InjectionToken<LogLevel>('LOG_LEVEL', {
  providedIn: 'root',
  factory: () => isDevMode() ? LogLevel.DEBUG : LogLevel.WARN,
});

export function provideLogLevel(level: LogLevel) {
  return makeEnvironmentProviders([{ provide: LOG_LEVEL, useValue: level }]);
}

const _console = {
  debug: console.debug.bind(console),
  log:   console.log.bind(console),
  info:  console.info.bind(console),
  warn:  console.warn.bind(console),
  error: console.error.bind(console),
};

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 61 + 180; // 180–240: blue range
  return `hsl(${hue}, 70%, 55%)`;
}

export class TaggedLogger {
  constructor(
    private readonly _tag: string,
    private readonly _logger: Logger
  ) {}

  private _format(args: unknown[]): unknown[] {
    const color = getTagColor(this._tag);
    return [`%c[${this._tag}]%c`, `color:${color};font-weight:bold`, 'color:inherit', ...args];
  }

  debug(...args: unknown[]): void { this._logger.debug(...this._format(args)); }
  log(...args: unknown[]): void   { this._logger.log(...this._format(args)); }
  info(...args: unknown[]): void  { this._logger.info(...this._format(args)); }
  warn(...args: unknown[]): void  { this._logger.warn(...this._format(args)); }
  error(...args: unknown[]): void { this._logger.error(...this._format(args)); }
}

@Injectable({
  providedIn: 'root'
})
export class Logger {
  static instance: Logger;

  private readonly _level = inject(LOG_LEVEL);
  private readonly _instances = new Map<string, TaggedLogger>();

  constructor() {
    Logger.instance = this;
  }

  getInstance(tag: string): TaggedLogger {
    let instance = this._instances.get(tag)
    if (!instance) {
      instance = new TaggedLogger(tag, this)
      this._instances.set(tag, instance)
    }
    return instance
  }

  debug(...args: unknown[]): void {
    if (this._level <= LogLevel.DEBUG) _console.debug(...args);
  }

  log(...args: unknown[]): void {
    if (this._level <= LogLevel.INFO) _console.log(...args);
  }

  info(...args: unknown[]): void {
    if (this._level <= LogLevel.INFO) _console.info(...args);
  }

  warn(...args: unknown[]): void {
    if (this._level <= LogLevel.WARN) _console.warn(...args);
  }

  error(...args: unknown[]): void {
    if (this._level <= LogLevel.ERROR) _console.error(...args);
  }
}
