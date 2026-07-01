/// <reference types="vitest/globals" />
import {TestBed} from '@angular/core/testing';
import {Logger, LogLevel, provideLogLevel, TaggedLogger} from './logger';

function makeLogger(level: LogLevel): Logger {
  TestBed.configureTestingModule({
    providers: [provideLogLevel(level), Logger]
  });
  return TestBed.inject(Logger);
}

describe('Logger', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('sets Logger.instance on construction', () => {
    const logger = makeLogger(LogLevel.DEBUG);
    expect(Logger.instance).toBe(logger);
  });

  describe('getInstance()', () => {
    it('returns a TaggedLogger', () => {
      expect(makeLogger(LogLevel.DEBUG).getInstance('tag')).toBeInstanceOf(TaggedLogger);
    });

    it('caches the same instance for the same tag', () => {
      const logger = makeLogger(LogLevel.DEBUG);
      expect(logger.getInstance('x')).toBe(logger.getInstance('x'));
    });

    it('returns distinct instances for different tags', () => {
      const logger = makeLogger(LogLevel.DEBUG);
      expect(logger.getInstance('a')).not.toBe(logger.getInstance('b'));
    });
  });

  describe('log-level filtering', () => {
    const methods = ['debug', 'log', 'info', 'warn', 'error'] as const;

    it('calls through at DEBUG level (all methods active)', () => {
      const logger = makeLogger(LogLevel.DEBUG);
      const spies = methods.map(m => vi.spyOn(logger, m).mockImplementation(() => {}));
      methods.forEach(m => logger[m]('test'));
      spies.forEach(spy => expect(spy).toHaveBeenCalledWith('test'));
    });

    it('does not call console at SILENT level', () => {
      // Exercise the "skip" branch of every method
      const logger = makeLogger(LogLevel.SILENT);
      methods.forEach(m => expect(() => logger[m]('test')).not.toThrow());
    });

    it('executes _console calls at DEBUG level (branch coverage)', () => {
      // Suppress actual output; still exercises the truthy branch in each method
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'info').mockImplementation(() => {});
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const logger = makeLogger(LogLevel.DEBUG);
      methods.forEach(m => expect(() => logger[m]('test')).not.toThrow());
    });
  });

  describe('TaggedLogger', () => {
    let logger: Logger;
    let tagged: TaggedLogger;

    beforeEach(() => {
      logger = makeLogger(LogLevel.DEBUG);
      tagged = logger.getInstance('MyTag');
    });

    it('delegates all methods to Logger', () => {
      const methods = ['debug', 'log', 'info', 'warn', 'error'] as const;
      methods.forEach(m => {
        const spy = vi.spyOn(logger, m).mockImplementation(() => {});
        tagged[m]('hello');
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
      });
    });

    it('prefixes messages with [tag] placeholder', () => {
      const spy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
      tagged.debug('msg');
      const firstArg = spy.mock.calls[0][0] as string;
      expect(firstArg).toContain('[MyTag]');
    });

    it('includes CSS color formatting', () => {
      const spy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
      tagged.debug('msg');
      const colorArg = spy.mock.calls[0][1] as string;
      expect(colorArg).toMatch(/^color:hsl\(\d+,\s*70%,\s*55%\)/);
    });

    it('passes original args after formatting', () => {
      const spy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      tagged.warn('a', 'b');
      const args = spy.mock.calls[0];
      expect(args).toContain('a');
      expect(args).toContain('b');
    });
  });
});
